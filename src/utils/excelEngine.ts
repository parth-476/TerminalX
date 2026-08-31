import { AssetQuote, FreightLane, Port } from '../types';

export interface ExcelCell {
  raw: string;
  computed: string | number;
  type: 'string' | 'number' | 'error';
  isFormula: boolean;
}

export class BloombergExcelEngine {
  private assetsMap: Map<string, AssetQuote> = new Map();
  private freightMap: Map<string, FreightLane> = new Map();
  private portMap: Map<string, Port> = new Map();

  constructor(assets: AssetQuote[], lanes: FreightLane[], ports: Port[]) {
    this.updateData(assets, lanes, ports);
  }

  public updateData(assets: AssetQuote[], lanes: FreightLane[], ports: Port[]) {
    this.assetsMap.clear();
    assets.forEach(a => this.assetsMap.set(a.ticker.toUpperCase(), a));

    this.freightMap.clear();
    lanes.forEach(l => {
      this.freightMap.set(l.code.toUpperCase(), l);
      this.freightMap.set(l.id.toUpperCase(), l);
    });

    this.portMap.clear();
    ports.forEach(p => {
      this.portMap.set(p.code.toUpperCase(), p);
      this.portMap.set(p.id.toUpperCase(), p);
    });
  }

  // Evaluates a single formula or literal
  public evaluate(formula: string, grid?: Record<string, ExcelCell>): { value: string | number; type: 'string' | 'number' | 'error' } {
    if (!formula.startsWith('=')) {
      const num = Number(formula);
      if (!isNaN(num) && formula.trim() !== '') {
        return { value: num, type: 'number' };
      }
      return { value: formula, type: 'string' };
    }

    const expr = formula.substring(1).trim();

    // 1. Check for BDP function: =BDP("TICKER", "FIELD")
    const bdpMatch = expr.match(/^BDP\(\s*["']?([^,"']+)["']?\s*,\s*["']?([^,"']+)["']?\s*\)$/i);
    if (bdpMatch) {
      const ticker = bdpMatch[1].trim().toUpperCase();
      const field = bdpMatch[2].trim().toUpperCase();
      return this.evalBdp(ticker, field);
    }

    // 2. Check for SUM function: =SUM(A1:A5)
    const sumMatch = expr.match(/^SUM\(([A-Z][0-9]+):([A-Z][0-9]+)\)$/i);
    if (sumMatch && grid) {
      const val = this.evalRange(sumMatch[1], sumMatch[2], grid, (nums) => nums.reduce((a, b) => a + b, 0));
      return { value: val, type: 'number' };
    }

    // 3. Check for AVERAGE function: =AVERAGE(A1:A5)
    const avgMatch = expr.match(/^AVERAGE\(([A-Z][0-9]+):([A-Z][0-9]+)\)$/i);
    if (avgMatch && grid) {
      const val = this.evalRange(avgMatch[1], avgMatch[2], grid, (nums) => nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0);
      return { value: Number(val.toFixed(2)), type: 'number' };
    }

    // 4. Check for MAX function: =MAX(A1:A5)
    const maxMatch = expr.match(/^MAX\(([A-Z][0-9]+):([A-Z][0-9]+)\)$/i);
    if (maxMatch && grid) {
      const val = this.evalRange(maxMatch[1], maxMatch[2], grid, (nums) => nums.length ? Math.max(...nums) : 0);
      return { value: val, type: 'number' };
    }

    // 5. Basic cell arithmetic like =A1*B1 or =A1+A2
    if (grid) {
      try {
        let parsedExpr = expr;
        // replace cell references like A1, B2 with their computed values
        parsedExpr = parsedExpr.replace(/[A-Z][0-9]+/g, (match) => {
          const cell = grid[match.toUpperCase()];
          if (!cell) return '0';
          return typeof cell.computed === 'number' ? cell.computed.toString() : '0';
        });

        // safely evaluate arithmetic expression with numbers and standard operators
        if (/^[0-9+\-*/().\s]+$/.test(parsedExpr)) {
          // eslint-disable-next-line no-eval
          const result = Function(`'use strict'; return (${parsedExpr})`)();
          if (typeof result === 'number' && !isNaN(result)) {
            return { value: Number(result.toFixed(2)), type: 'number' };
          }
        }
      } catch {
        return { value: '#CALC!', type: 'error' };
      }
    }

    return { value: '#VALUE!', type: 'error' };
  }

  private evalBdp(ticker: string, field: string): { value: string | number; type: 'string' | 'number' | 'error' } {
    // Check Asset Quote
    const asset = this.assetsMap.get(ticker);
    if (asset) {
      switch (field) {
        case 'PX_LAST':
        case 'PRICE':
          return { value: asset.price, type: 'number' };
        case 'CHG_NET_1D':
        case 'CHANGE':
          return { value: asset.change, type: 'number' };
        case 'CHG_PCT_1D':
        case 'CHANGE_PCT':
          return { value: asset.changePct, type: 'number' };
        case 'BID':
          return { value: asset.bid, type: 'number' };
        case 'ASK':
          return { value: asset.ask, type: 'number' };
        case 'VOLUME':
          return { value: asset.volume, type: 'number' };
        case 'NAME':
          return { value: asset.name, type: 'string' };
        case 'HIGH':
          return { value: asset.high, type: 'number' };
        case 'LOW':
          return { value: asset.low, type: 'number' };
        default:
          return { value: '#N/A Field', type: 'error' };
      }
    }

    // Check Freight Lane
    const lane = this.freightMap.get(ticker);
    if (lane) {
      switch (field) {
        case 'PX_LAST':
        case 'RATE':
          return { value: lane.currentRateUsd, type: 'number' };
        case 'CHG_PCT_1D':
          return { value: lane.changePct, type: 'number' };
        case 'TRANSIT_DAYS':
          return { value: lane.transitDays, type: 'number' };
        case 'DISTANCE_NM':
          return { value: lane.distanceNm, type: 'number' };
        case 'CONGESTION_IDX':
          return { value: lane.congestionIndex, type: 'number' };
        case 'CARBON_EST_USD':
          return { value: lane.carbonEtsCostEst, type: 'number' };
        case 'NAME':
          return { value: lane.name, type: 'string' };
        default:
          return { value: '#N/A Field', type: 'error' };
      }
    }

    // Check Port
    const port = this.portMap.get(ticker);
    if (port) {
      switch (field) {
        case 'WAIT_DAYS':
          return { value: port.avgWaitDays, type: 'number' };
        case 'CONGESTION_SCORE':
          return { value: port.congestionScore, type: 'number' };
        case 'VESSELS_WAITING':
          return { value: port.vesselsWaiting, type: 'number' };
        case 'BUNKER_VLSFO':
          return { value: port.bunkerPriceVLSFO, type: 'number' };
        case 'NAME':
          return { value: port.name, type: 'string' };
        default:
          return { value: '#N/A Field', type: 'error' };
      }
    }

    return { value: '#N/A Security', type: 'error' };
  }

  private evalRange(start: string, end: string, grid: Record<string, ExcelCell>, aggregator: (nums: number[]) => number): number {
    const startCol = start.charCodeAt(0);
    const startRow = parseInt(start.substring(1));
    const endCol = end.charCodeAt(0);
    const endRow = parseInt(end.substring(1));

    const minCol = Math.min(startCol, endCol);
    const maxCol = Math.max(startCol, endCol);
    const minRow = Math.min(startRow, endRow);
    const maxRow = Math.max(startRow, endRow);

    const values: number[] = [];
    for (let c = minCol; c <= maxCol; c++) {
      for (let r = minRow; r <= maxRow; r++) {
        const key = String.fromCharCode(c) + r;
        const cell = grid[key];
        if (cell && typeof cell.computed === 'number') {
          values.push(cell.computed);
        }
      }
    }

    return aggregator(values);
  }

  // Export current grid to CSV format
  public exportToCsv(grid: Record<string, ExcelCell>, cols: string[], rowCount: number): string {
    let csv = '';
    // Header
    csv += 'Row,' + cols.join(',') + '\n';
    for (let r = 1; r <= rowCount; r++) {
      const rowVals = cols.map(c => {
        const cell = grid[c + r];
        if (!cell) return '""';
        const val = cell.computed;
        return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val;
      });
      csv += `${r},${rowVals.join(',')}\n`;
    }
    return csv;
  }
}

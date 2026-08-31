import React, { useState, useEffect, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  Play,
  RotateCcw,
  Plus,
  HelpCircle,
  CheckCircle2,
  Table,
  Cpu
} from 'lucide-react';
import { AssetQuote, FreightLane, Port } from '../../types';
import { BloombergExcelEngine, ExcelCell } from '../../utils/excelEngine';
import { terminalSound } from '../../utils/terminalSound';

interface ExcelIntegrationViewProps {
  assets: AssetQuote[];
  freightLanes: FreightLane[];
  ports: Port[];
}

export const ExcelIntegrationView: React.FC<ExcelIntegrationViewProps> = ({
  assets,
  freightLanes,
  ports
}) => {
  const engine = useMemo(() => new BloombergExcelEngine(assets, freightLanes, ports), [assets, freightLanes, ports]);

  const columns = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
  const rowCount = 14;

  const [selectedCell, setSelectedCell] = useState<string>('A1');
  const [formulaBarInput, setFormulaBarInput] = useState<string>('');

  // Initial Financial Hedging & Freight Model Spreadsheet Preset
  const getInitialGrid = (): Record<string, ExcelCell> => {
    const defaultGrid: Record<string, ExcelCell> = {
      A1: { raw: 'INSTRUMENT / TICKER', computed: 'INSTRUMENT / TICKER', type: 'string', isFormula: false },
      B1: { raw: 'LAST SPOT RATE', computed: 0, type: 'string', isFormula: false },
      C1: { raw: '24H CHANGE %', computed: 0, type: 'string', isFormula: false },
      D1: { raw: 'CONTRACT LOTS', computed: 'CONTRACT LOTS', type: 'string', isFormula: false },
      E1: { raw: 'TOTAL NOTIONAL ($)', computed: 'TOTAL NOTIONAL ($)', type: 'string', isFormula: false },

      // Row 2: FE-EUR-01 Freight
      A2: { raw: 'FE-EUR-01', computed: 'FE-EUR-01', type: 'string', isFormula: false },
      B2: { raw: '=BDP("FE-EUR-01", "RATE")', computed: 0, type: 'number', isFormula: true },
      C2: { raw: '=BDP("FE-EUR-01", "CHG_PCT_1D")', computed: 0, type: 'number', isFormula: true },
      D2: { raw: '50', computed: 50, type: 'number', isFormula: false },
      E2: { raw: '=B2*D2', computed: 0, type: 'number', isFormula: true },

      // Row 3: BRENT CRUDE HEDGE
      A3: { raw: 'CO1:COM', computed: 'CO1:COM', type: 'string', isFormula: false },
      B3: { raw: '=BDP("CO1:COM", "PRICE")', computed: 0, type: 'number', isFormula: true },
      C3: { raw: '=BDP("CO1:COM", "CHANGE_PCT")', computed: 0, type: 'number', isFormula: true },
      D3: { raw: '1000', computed: 1000, type: 'number', isFormula: false },
      E3: { raw: '=B3*D3', computed: 0, type: 'number', isFormula: true },

      // Row 4: BALTIC DRY INDEX
      A4: { raw: 'BDI.INDEX', computed: 'BDI.INDEX', type: 'string', isFormula: false },
      B4: { raw: '=BDP("BDI.INDEX", "PX_LAST")', computed: 0, type: 'number', isFormula: true },
      C4: { raw: '=BDP("BDI.INDEX", "CHANGE_PCT")', computed: 0, type: 'number', isFormula: true },
      D4: { raw: '20', computed: 20, type: 'number', isFormula: false },
      E4: { raw: '=B4*D4', computed: 0, type: 'number', isFormula: true },

      // Row 5: VLSFO ROTTERDAM BUNKER
      A5: { raw: 'VLSFO-RTM', computed: 'VLSFO-RTM', type: 'string', isFormula: false },
      B5: { raw: '=BDP("VLSFO-RTM", "PRICE")', computed: 0, type: 'number', isFormula: true },
      C5: { raw: '=BDP("VLSFO-RTM", "CHANGE_PCT")', computed: 0, type: 'number', isFormula: true },
      D5: { raw: '500', computed: 500, type: 'number', isFormula: false },
      E5: { raw: '=B5*D5', computed: 0, type: 'number', isFormula: true },

      // Row 6: TOTAL PORTFOLIO EXPOSURE
      A6: { raw: 'PORTFOLIO SUM NOTIONAL', computed: 'PORTFOLIO SUM NOTIONAL', type: 'string', isFormula: false },
      B6: { raw: '-', computed: '-', type: 'string', isFormula: false },
      C6: { raw: '-', computed: '-', type: 'string', isFormula: false },
      D6: { raw: '-', computed: '-', type: 'string', isFormula: false },
      E6: { raw: '=SUM(E2:E5)', computed: 0, type: 'number', isFormula: true },

      // Row 8: Port Congestion Formula Demo
      A8: { raw: 'PORT CONGESTION AUDIT', computed: 'PORT CONGESTION AUDIT', type: 'string', isFormula: false },
      B8: { raw: 'WAIT DAYS', computed: 'WAIT DAYS', type: 'string', isFormula: false },
      C8: { raw: 'SHIPS QUEUED', computed: 'SHIPS QUEUED', type: 'string', isFormula: false },

      A9: { raw: 'SINGAPORE (port-sin)', computed: 'SINGAPORE (port-sin)', type: 'string', isFormula: false },
      B9: { raw: '=BDP("port-sin", "WAIT_DAYS")', computed: 0, type: 'number', isFormula: true },
      C9: { raw: '=BDP("port-sin", "VESSELS_WAITING")', computed: 0, type: 'number', isFormula: true },

      A10: { raw: 'ROTTERDAM (port-rtm)', computed: 'ROTTERDAM (port-rtm)', type: 'string', isFormula: false },
      B10: { raw: '=BDP("port-rtm", "WAIT_DAYS")', computed: 0, type: 'number', isFormula: true },
      C10: { raw: '=BDP("port-rtm", "VESSELS_WAITING")', computed: 0, type: 'number', isFormula: true }
    };

    return defaultGrid;
  };

  const [grid, setGrid] = useState<Record<string, ExcelCell>>(getInitialGrid);

  // Recalculate all formulas when market data or inputs change
  useEffect(() => {
    engine.updateData(assets, freightLanes, ports);

    setGrid(prevGrid => {
      const nextGrid: Record<string, ExcelCell> = {};
      // first pass: copy non-formulas
      Object.keys(prevGrid).forEach(key => {
        const cell = prevGrid[key];
        if (!cell.isFormula) {
          const evalRes = engine.evaluate(cell.raw);
          nextGrid[key] = {
            ...cell,
            computed: evalRes.value,
            type: evalRes.type
          };
        }
      });

      // second pass: evaluate formulas with grid context
      Object.keys(prevGrid).forEach(key => {
        const cell = prevGrid[key];
        if (cell.isFormula) {
          const evalRes = engine.evaluate(cell.raw, nextGrid);
          nextGrid[key] = {
            ...cell,
            computed: evalRes.value,
            type: evalRes.type
          };
        }
      });

      return nextGrid;
    });
  }, [assets, freightLanes, ports, engine]);

  // Sync formula bar input with selected cell
  useEffect(() => {
    const current = grid[selectedCell];
    setFormulaBarInput(current ? current.raw : '');
  }, [selectedCell, grid]);

  const handleCellSelect = (cellKey: string) => {
    setSelectedCell(cellKey);
    const cell = grid[cellKey];
    setFormulaBarInput(cell ? cell.raw : '');
    terminalSound.playKeyClick();
  };

  const handleFormulaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rawVal = formulaBarInput;
    const isFormula = rawVal.startsWith('=');

    const evalRes = engine.evaluate(rawVal, grid);

    setGrid(prev => ({
      ...prev,
      [selectedCell]: {
        raw: rawVal,
        computed: evalRes.value,
        type: evalRes.type,
        isFormula
      }
    }));

    terminalSound.playCommandGo();
  };

  const handleExportCsv = () => {
    const csvContent = engine.exportToCsv(grid, columns, rowCount);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `BLOOMBERG_FREIGHT_MODEL_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    terminalSound.playTradeFill();
  };

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-115px)] bg-[#090b11] text-[#ff9f1c] font-mono border-t border-[#1e2338]">
      {/* Top Excel Integration Header */}
      <div className="bg-[#121524] px-3 py-2 border-b border-[#1e2338] flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center space-x-2">
          <FileSpreadsheet className="w-4 h-4 text-[#ff9f1c]" />
          <span className="font-bold text-white">BLOOMBERG XL REAL-TIME FINANCIAL & FREIGHT ENGINE</span>
          <span className="bg-[#1f263d] text-emerald-400 text-[10px] px-1.5 py-0.5 rounded font-bold">
            =BDP() LIVE CONNECTED
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setGrid(getInitialGrid());
              terminalSound.playKeyClick();
            }}
            className="bg-[#181d2f] hover:bg-[#222840] text-[#cbd5e1] px-2.5 py-1 rounded text-xs flex items-center space-x-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>RESET MODEL</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="bg-[#ff9f1c] hover:bg-[#ff8400] text-black font-extrabold px-3 py-1 rounded text-xs flex items-center space-x-1 shadow-md active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT CSV / EXCEL</span>
          </button>
        </div>
      </div>

      {/* Formula Bar */}
      <form onSubmit={handleFormulaSubmit} className="bg-[#0e101b] px-3 py-1.5 border-b border-[#1e2338] flex items-center space-x-2">
        <div className="bg-[#161a29] text-[#ff9f1c] font-extrabold px-2.5 py-1 rounded text-xs border border-[#2b334d] min-w-[50px] text-center">
          {selectedCell}
        </div>
        <span className="text-[#64748b] font-bold text-xs italic">fx</span>
        <input
          type="text"
          value={formulaBarInput}
          onChange={(e) => setFormulaBarInput(e.target.value)}
          placeholder="Enter formula e.g. =BDP(&quot;FE-EUR-01&quot;, &quot;RATE&quot;) or =SUM(E2:E5) or =B2*D2"
          className="flex-1 bg-[#07080e] text-white text-xs border border-[#232a40] rounded px-3 py-1 font-mono outline-none focus:border-[#ff9f1c]"
        />
        <button
          type="submit"
          className="bg-[#1a2136] hover:bg-[#ff9f1c] hover:text-black text-white px-3 py-1 rounded text-xs font-bold transition-colors"
        >
          CALC &lt;ENTER&gt;
        </button>
      </form>

      {/* Spreadsheet Grid Container */}
      <div className="flex-1 overflow-auto bg-[#07080e] p-3">
        <table className="w-full border-collapse text-xs font-mono select-none">
          <thead>
            <tr>
              <th className="w-12 bg-[#121626] border border-[#1e243a] text-[#64748b] p-1 text-center font-bold">
                #
              </th>
              {columns.map(col => (
                <th
                  key={col}
                  className="bg-[#121626] border border-[#1e243a] text-[#cbd5e1] p-1.5 text-center font-bold min-w-[140px]"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rowCount }, (_, r) => r + 1).map(rowNum => (
              <tr key={`row-${rowNum}`}>
                <td className="bg-[#0f121e] border border-[#1e243a] text-[#64748b] text-center font-bold p-1">
                  {rowNum}
                </td>
                {columns.map(col => {
                  const cellKey = col + rowNum;
                  const cell = grid[cellKey];
                  const isSelected = selectedCell === cellKey;
                  const isFormula = cell?.isFormula;

                  return (
                    <td
                      key={cellKey}
                      onClick={() => handleCellSelect(cellKey)}
                      className={`border border-[#1a1f33] p-1.5 cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-[#1e2842] ring-2 ring-[#ff9f1c] text-white font-bold'
                          : isFormula
                          ? 'bg-[#0d101a] text-white hover:bg-[#151928]'
                          : 'text-[#cbd5e1] hover:bg-[#121522]'
                      }`}
                    >
                      <div className="truncate flex items-center justify-between">
                        <span>
                          {cell
                            ? typeof cell.computed === 'number'
                              ? cell.computed.toLocaleString()
                              : cell.computed
                            : ''}
                        </span>
                        {isFormula && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-1 shrink-0" title="Live formula linked" />
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Spreadsheet Formula Reference Guide Footer */}
      <div className="bg-[#0f121e] p-2.5 border-t border-[#1e2338] text-[11px] text-[#94a3b8] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-3">
          <span className="font-bold text-white flex items-center">
            <HelpCircle className="w-3.5 h-3.5 mr-1 text-[#ff9f1c]" />
            SUPPORTED BLOOMBERG FORMULAS:
          </span>
          <code className="bg-[#080910] text-[#ff9f1c] px-1.5 py-0.5 rounded border border-[#1e2438]">
            =BDP("TICKER", "PX_LAST")
          </code>
          <code className="bg-[#080910] text-[#ff9f1c] px-1.5 py-0.5 rounded border border-[#1e2438]">
            =BDP("FE-EUR-01", "RATE")
          </code>
          <code className="bg-[#080910] text-[#ff9f1c] px-1.5 py-0.5 rounded border border-[#1e2438]">
            =SUM(E2:E5)
          </code>
          <code className="bg-[#080910] text-[#ff9f1c] px-1.5 py-0.5 rounded border border-[#1e2438]">
            =AVERAGE(B2:B5)
          </code>
        </div>
        <span className="text-[#64748b]">Bidirectional real-time WebSocket formula link</span>
      </div>
    </div>
  );
};

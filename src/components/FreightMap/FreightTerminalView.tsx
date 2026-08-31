import React, { useState, useEffect, useRef } from 'react';
import {
  Ship,
  Anchor,
  AlertTriangle,
  Flame,
  Layers,
  Compass,
  Maximize2,
  Minimize2,
  Info,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Navigation,
  Globe,
  Sliders,
  Wind,
  ShieldAlert,
  Skull,
  Radio,
  Sparkles,
  Search,
  Bot,
  ExternalLink,
  LifeBuoy,
  Waves,
  Eye,
  CheckSquare,
  Square,
  RefreshCw,
  X
} from 'lucide-react';
import { FreightLane, Port, Vessel, ChokePoint, IncidentHotspot } from '../../types';
import { RECENT_MARITIME_TRAGEDIES } from '../../data/incidentData';
import { terminalSound } from '../../utils/terminalSound';

interface FreightTerminalViewProps {
  freightLanes: FreightLane[];
  ports: Port[];
  vessels: Vessel[];
  chokePoints: ChokePoint[];
  onSelectLane?: (lane: FreightLane) => void;
  onAskAIAboutIncident?: (incident: IncidentHotspot) => void;
}

export type HeatmapMode = 'NONE' | 'DENSITY' | 'CONGESTION' | 'RISK' | 'CARBON' | 'CASUALTY';

export const FreightTerminalView: React.FC<FreightTerminalViewProps> = ({
  freightLanes,
  ports,
  vessels,
  chokePoints,
  onSelectLane,
  onAskAIAboutIncident
}) => {
  const [selectedVessel, setSelectedVessel] = useState<Vessel | null>(vessels[0] || null);
  const [selectedLane, setSelectedLane] = useState<FreightLane>(freightLanes[0]);
  const [selectedPort, setSelectedPort] = useState<Port | null>(null);
  const [selectedChoke, setSelectedChoke] = useState<ChokePoint | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<IncidentHotspot | null>(null);
  const [showTragediesModal, setShowTragediesModal] = useState<boolean>(false);
  const [incidentCategoryFilter, setIncidentCategoryFilter] = useState<string>('ALL');

  // Heatmap & Visibility Layers
  const [heatmapMode, setHeatmapMode] = useState<HeatmapMode>('DENSITY');
  const [filterVesselType, setFilterVesselType] = useState<string>('ALL');
  const [isPlayingAIS, setIsPlayingAIS] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Layer toggles
  const [showIncidentsLayer, setShowIncidentsLayer] = useState<boolean>(true);
  const [showPortsLayer, setShowPortsLayer] = useState<boolean>(true);
  const [showChokepointsLayer, setShowChokepointsLayer] = useState<boolean>(true);
  const [showLanesLayer, setShowLanesLayer] = useState<boolean>(true);
  const [showVesselsLayer, setShowVesselsLayer] = useState<boolean>(true);
  const [showRiskZonesLayer, setShowRiskZonesLayer] = useState<boolean>(true);
  const [showWeatherLayer, setShowWeatherLayer] = useState<boolean>(true);

  // Voyage Calculator States
  const [calcSpeedKnots, setCalcSpeedKnots] = useState<number>(16.5);
  const [calcBunkerPrice, setCalcBunkerPrice] = useState<number>(628.0);
  const [calcCargoTeu, setCalcCargoTeu] = useState<number>(14000);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Map coordinates projection helper (Equirectangular: Lon [-180, 180] -> [0, 1000], Lat [90, -90] -> [0, 500])
  const projectCoords = (lon: number, lat: number, width = 1000, height = 500) => {
    const x = ((lon + 180) / 360) * width;
    const y = ((90 - lat) / 180) * height;
    return { x, y };
  };

  // Convert SVG lane waypoints to SVG path string
  const getLanePath = (waypoints: [number, number][], width = 1000, height = 500) => {
    if (!waypoints || waypoints.length === 0) return '';
    return waypoints.reduce((acc, pt, idx) => {
      const { x, y } = projectCoords(pt[0], pt[1], width, height);
      return idx === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : `${acc} L ${x.toFixed(1)} ${y.toFixed(1)}`;
    }, '');
  };

  // Live Vessel Motion Simulation
  const [liveVessels, setLiveVessels] = useState<Vessel[]>(vessels);

  useEffect(() => {
    if (!isPlayingAIS) return;

    const interval = setInterval(() => {
      setLiveVessels(prev =>
        prev.map(v => {
          const rad = (v.heading * Math.PI) / 180;
          const deltaLat = Math.cos(rad) * 0.04 * (v.speedKnots / 15);
          const deltaLon = Math.sin(rad) * 0.06 * (v.speedKnots / 15);

          let newLat = v.lat + deltaLat;
          let newLon = v.lon + deltaLon;

          if (newLon > 180) newLon = -180;
          if (newLon < -180) newLon = 180;
          if (newLat > 80) newLat = 80;
          if (newLat < -80) newLat = -80;

          return {
            ...v,
            lat: Number(newLat.toFixed(3)),
            lon: Number(newLon.toFixed(3))
          };
        })
      );
    }, 2000);

    return () => clearInterval(interval);
  }, [isPlayingAIS]);

  // Keep selected vessel updated
  useEffect(() => {
    if (selectedVessel) {
      const updated = liveVessels.find(v => v.id === selectedVessel.id);
      if (updated) setSelectedVessel(updated);
    }
  }, [liveVessels]);

  // Draw Heatmap on Background Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    if (heatmapMode === 'NONE') return;

    if (heatmapMode === 'DENSITY') {
      // Draw vessel & lane density heatspots
      liveVessels.forEach(v => {
        const { x, y } = projectCoords(v.lon, v.lat, w, h);
        const radius = v.type === 'CONTAINER' || v.type === 'CRUDE_TANKER' ? 45 : 30;
        const grad = ctx.createRadialGradient(x, y, 2, x, y, radius);
        grad.addColorStop(0, 'rgba(255, 159, 28, 0.55)');
        grad.addColorStop(0.5, 'rgba(255, 61, 0, 0.25)');
        grad.addColorStop(1, 'rgba(255, 61, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Chokepoints intense heat
      chokePoints.forEach(cp => {
        const { x, y } = projectCoords(cp.lon, cp.lat, w, h);
        const grad = ctx.createRadialGradient(x, y, 4, x, y, 65);
        grad.addColorStop(0, 'rgba(255, 23, 68, 0.65)');
        grad.addColorStop(0.6, 'rgba(255, 109, 0, 0.3)');
        grad.addColorStop(1, 'rgba(255, 109, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, 65, 0, Math.PI * 2);
        ctx.fill();
      });
    } else if (heatmapMode === 'CONGESTION') {
      // Draw port congestion hotspots
      ports.forEach(p => {
        const { x, y } = projectCoords(p.lon, p.lat, w, h);
        const radius = (p.congestionScore / 100) * 55 + 22;
        const grad = ctx.createRadialGradient(x, y, 4, x, y, radius);
        const color =
          p.status === 'CRITICAL'
            ? '255, 23, 68'
            : p.status === 'CONGESTED'
            ? '255, 159, 28'
            : '0, 230, 118';
        grad.addColorStop(0, `rgba(${color}, 0.6)`);
        grad.addColorStop(0.6, `rgba(${color}, 0.25)`);
        grad.addColorStop(1, `rgba(${color}, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      });
    } else if (heatmapMode === 'RISK') {
      chokePoints.forEach(cp => {
        const { x, y } = projectCoords(cp.lon, cp.lat, w, h);
        const radius = cp.riskLevel === 'HIGH' ? 75 : 45;
        const grad = ctx.createRadialGradient(x, y, 5, x, y, radius);
        grad.addColorStop(0, 'rgba(255, 0, 85, 0.75)');
        grad.addColorStop(0.5, 'rgba(255, 80, 0, 0.35)');
        grad.addColorStop(1, 'rgba(255, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      });
    } else if (heatmapMode === 'CASUALTY') {
      // Draw intense danger halos around recent tragedies
      RECENT_MARITIME_TRAGEDIES.forEach(inc => {
        const { x, y } = projectCoords(inc.lon, inc.lat, w, h);
        const radius = inc.severity === 'CRITICAL' ? 85 : 55;
        const grad = ctx.createRadialGradient(x, y, 4, x, y, radius);
        grad.addColorStop(0, 'rgba(255, 0, 55, 0.85)');
        grad.addColorStop(0.4, 'rgba(255, 60, 0, 0.45)');
        grad.addColorStop(0.8, 'rgba(200, 0, 0, 0.15)');
        grad.addColorStop(1, 'rgba(200, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      });
    } else if (heatmapMode === 'CARBON') {
      freightLanes.forEach(lane => {
        lane.waypoints.forEach(wp => {
          const { x, y } = projectCoords(wp[0], wp[1], w, h);
          const grad = ctx.createRadialGradient(x, y, 2, x, y, 35);
          grad.addColorStop(0, 'rgba(0, 229, 255, 0.45)');
          grad.addColorStop(0.6, 'rgba(0, 150, 255, 0.18)');
          grad.addColorStop(1, 'rgba(0, 100, 255, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(x, y, 35, 0, Math.PI * 2);
          ctx.fill();
        });
      });
    }
  }, [heatmapMode, liveVessels, chokePoints, ports, freightLanes]);

  // Mouse pan handlers for map
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Filtered vessels
  const displayedVessels = liveVessels.filter(v => {
    if (filterVesselType === 'ALL') return true;
    return v.type === filterVesselType;
  });

  // Filtered incidents
  const displayedIncidents = RECENT_MARITIME_TRAGEDIES.filter(inc => {
    if (incidentCategoryFilter === 'ALL') return true;
    return inc.category === incidentCategoryFilter;
  });

  // Voyage Calculator Math
  const calculatedDays = (selectedLane.distanceNm / (calcSpeedKnots * 24)).toFixed(1);
  const bunkerConsumptionTons = Number(calculatedDays) * 48;
  const totalBunkerCost = bunkerConsumptionTons * calcBunkerPrice;
  const revenueEst = calcCargoTeu * (selectedLane.currentRateUsd / 2);
  const canalTollEst = selectedLane.chokePointsCrossed.includes('Suez Canal') ? 450000 : 0;
  const carbonEtsCost = selectedLane.carbonEtsCostEst;
  const estVoyageProfit = revenueEst - (totalBunkerCost + canalTollEst + carbonEtsCost + 120000);

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-[calc(100vh-115px)] bg-[#07080d] text-[#ff9f1c] font-mono border-t border-[#1e2338]">
      {/* LEFT / CENTER: Interactive World Maritime Map & Controls */}
      <div className="flex-1 flex flex-col border-r border-[#1e2338] relative min-w-0">
        {/* Top Control Bar */}
        <div className="bg-[#0e111a] px-3 py-2 border-b border-[#1e2338] flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <Globe className="w-4 h-4 text-[#ff9f1c]" />
            <span className="font-bold tracking-wider text-white">GLOBAL AIS MARITIME TRACKER</span>
            <span className="bg-[#1f263d] text-[#ff9f1c] text-[10px] px-1.5 py-0.5 rounded font-semibold">
              {displayedVessels.length} AIS ACTIVE
            </span>
            <span className="bg-rose-950/70 border border-rose-600/60 text-rose-300 text-[10px] px-2 py-0.5 rounded font-bold flex items-center animate-pulse">
              <Skull className="w-3 h-3 mr-1 text-rose-400" />
              {RECENT_MARITIME_TRAGEDIES.length} TRAGEDIES &amp; HAZARDS
            </span>
          </div>

          {/* Quick Tragedies Sitrep Modal Launcher */}
          <button
            onClick={() => {
              setShowTragediesModal(true);
              terminalSound.playAlertBeep();
            }}
            className="bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold px-3 py-1 rounded text-xs flex items-center space-x-1.5 shadow-lg shadow-red-900/30 transition-all border border-red-400"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>🚨 RECENT TRAGEDIES SITREP</span>
          </button>

          {/* Heatmap & Filter Controls */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Heatmap Mode Selector */}
            <div className="flex items-center space-x-1 bg-[#090a10] p-0.5 rounded border border-[#262c40]">
              <span className="text-[10px] text-[#94a3b8] px-1 font-semibold flex items-center">
                <Flame className="w-3 h-3 mr-1 text-[#ff9f1c]" />
                HEATMAP:
              </span>
              {(['NONE', 'DENSITY', 'CASUALTY', 'CONGESTION', 'RISK', 'CARBON'] as HeatmapMode[]).map(mode => (
                <button
                  key={mode}
                  onClick={() => {
                    setHeatmapMode(mode);
                    terminalSound.playKeyClick();
                  }}
                  className={`px-2 py-0.5 text-[10px] rounded transition-colors font-bold ${
                    heatmapMode === mode
                      ? mode === 'CASUALTY'
                        ? 'bg-red-600 text-white animate-pulse'
                        : 'bg-[#ff9f1c] text-black'
                      : 'text-[#94a3b8] hover:text-white hover:bg-[#161a29]'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            {/* Vessel Filter */}
            <select
              value={filterVesselType}
              onChange={(e) => {
                setFilterVesselType(e.target.value);
                terminalSound.playKeyClick();
              }}
              className="bg-[#141827] text-white border border-[#2b324a] rounded px-2 py-0.5 text-[11px] outline-none"
            >
              <option value="ALL">All Vessels ({liveVessels.length})</option>
              <option value="CONTAINER">Container Megaships</option>
              <option value="CRUDE_TANKER">Crude VLCCs / ULCC</option>
              <option value="DRY_BULK">Dry Bulk / Valemax</option>
              <option value="LNG_CARRIER">LNG Tankers (Q-Max)</option>
            </select>

            {/* Live Telemetry Play / Pause */}
            <button
              onClick={() => {
                setIsPlayingAIS(!isPlayingAIS);
                terminalSound.playKeyClick();
              }}
              className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-colors ${
                isPlayingAIS
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                  : 'bg-amber-500/20 text-amber-400 border-amber-500/50'
              }`}
            >
              {isPlayingAIS ? '● AIS LIVE' : '⏸ PAUSED'}
            </button>

            {/* Zoom Controls */}
            <div className="flex items-center space-x-1 border-l border-[#262c40] pl-2">
              <button
                onClick={() => setZoomLevel(prev => Math.min(prev + 0.25, 2.5))}
                className="bg-[#161a29] text-white px-2 py-0.5 rounded hover:bg-[#ff9f1c] hover:text-black font-bold text-xs"
              >
                +
              </button>
              <button
                onClick={() => {
                  setZoomLevel(1);
                  setPanOffset({ x: 0, y: 0 });
                }}
                className="bg-[#161a29] text-[#94a3b8] px-1.5 py-0.5 rounded hover:text-white text-[10px]"
              >
                RESET
              </button>
              <button
                onClick={() => setZoomLevel(prev => Math.max(prev - 0.25, 0.75))}
                className="bg-[#161a29] text-white px-2 py-0.5 rounded hover:bg-[#ff9f1c] hover:text-black font-bold text-xs"
              >
                -
              </button>
            </div>
          </div>
        </div>

        {/* Sub-toolbar for Layer Toggles */}
        <div className="bg-[#0a0c13] px-3 py-1 border-b border-[#181d2c] flex flex-wrap items-center justify-between gap-2 text-[10px] text-[#94a3b8]">
          <div className="flex items-center flex-wrap gap-2.5">
            <span className="text-white font-bold flex items-center">
              <Layers className="w-3 h-3 mr-1 text-[#ff9f1c]" /> LAYERS:
            </span>
            <label className="flex items-center space-x-1 cursor-pointer hover:text-white">
              <input
                type="checkbox"
                checked={showIncidentsLayer}
                onChange={e => setShowIncidentsLayer(e.target.checked)}
                className="rounded text-red-500 bg-[#121624] border-[#2c3550]"
              />
              <span className="text-red-400 font-bold">💥 Tragedies &amp; Hotspots ({RECENT_MARITIME_TRAGEDIES.length})</span>
            </label>
            <label className="flex items-center space-x-1 cursor-pointer hover:text-white">
              <input
                type="checkbox"
                checked={showChokepointsLayer}
                onChange={e => setShowChokepointsLayer(e.target.checked)}
                className="rounded text-amber-500 bg-[#121624] border-[#2c3550]"
              />
              <span className="text-amber-400 font-bold">⚠️ Chokepoints ({chokePoints.length})</span>
            </label>
            <label className="flex items-center space-x-1 cursor-pointer hover:text-white">
              <input
                type="checkbox"
                checked={showPortsLayer}
                onChange={e => setShowPortsLayer(e.target.checked)}
                className="rounded text-emerald-500 bg-[#121624] border-[#2c3550]"
              />
              <span className="text-emerald-400 font-bold">⚓ Global Ports ({ports.length})</span>
            </label>
            <label className="flex items-center space-x-1 cursor-pointer hover:text-white">
              <input
                type="checkbox"
                checked={showLanesLayer}
                onChange={e => setShowLanesLayer(e.target.checked)}
                className="rounded text-cyan-500 bg-[#121624] border-[#2c3550]"
              />
              <span className="text-cyan-400 font-bold">🌐 Corridors ({freightLanes.length})</span>
            </label>
            <label className="flex items-center space-x-1 cursor-pointer hover:text-white">
              <input
                type="checkbox"
                checked={showRiskZonesLayer}
                onChange={e => setShowRiskZonesLayer(e.target.checked)}
                className="rounded text-purple-500 bg-[#121624] border-[#2c3550]"
              />
              <span className="text-purple-400 font-bold">🛡️ War/Risk Zones</span>
            </label>
            <label className="flex items-center space-x-1 cursor-pointer hover:text-white">
              <input
                type="checkbox"
                checked={showWeatherLayer}
                onChange={e => setShowWeatherLayer(e.target.checked)}
                className="rounded text-sky-500 bg-[#121624] border-[#2c3550]"
              />
              <span className="text-sky-400 font-bold">🌀 Cyclones / Swells</span>
            </label>
          </div>

          <div className="text-[10px] text-gray-400 font-mono hidden sm:block">
            DRAG TO PAN • SCROLL / +/- TO ZOOM
          </div>
        </div>

        {/* Map Stage Container */}
        <div
          className="relative flex-1 bg-[#04060a] overflow-hidden cursor-grab active:cursor-grabbing min-h-[460px]"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          {/* Oceanic Depth Gradient & Deep Trench Bathymetry Background */}
          <div
            className="absolute inset-0 pointer-events-none opacity-40"
            style={{
              backgroundImage: 'radial-gradient(circle at 50% 50%, #0b1528 0%, #050811 70%, #020307 100%)',
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
              transformOrigin: 'center center'
            }}
          />

          {/* Heatmap Canvas Layer */}
          <canvas
            ref={canvasRef}
            width={1000}
            height={500}
            className="absolute top-0 left-0 w-full h-full pointer-events-none z-10 opacity-75"
            style={{
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
              transformOrigin: 'center center'
            }}
          />

          {/* SVG Map World Grid, Realistic High-Detail Continents, Corridors, Vessels & Hotspots */}
          <svg
            viewBox="0 0 1000 500"
            className="w-full h-full absolute top-0 left-0 z-20 select-none"
            style={{
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
              transformOrigin: 'center center'
            }}
          >
            <defs>
              {/* Gradients & Filters */}
              <radialGradient id="casualtyGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ff0037" stopOpacity="0.9" />
                <stop offset="60%" stopColor="#ff3c00" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#ff0000" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="corridorGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ff9f1c" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#00e5ff" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#00e676" stopOpacity="0.8" />
              </linearGradient>
            </defs>

            {/* Navigational Coordinate Grid & Graticule (Lat/Lon with Nautical Degree Labels) */}
            <g stroke="#141a2e" strokeWidth="0.5" strokeDasharray="3 3">
              {[83.3, 166.6, 250, 333.3, 416.6].map((y, idx) => {
                const latLabel = ['60°N', '30°N', '00° EQUATOR', '30°S', '60°S'][idx];
                return (
                  <g key={`lat-${y}`}>
                    <line x1="0" y1={y} x2="1000" y2={y} />
                    <text x="8" y={y - 3} fill="#4b5563" fontSize="6" fontFamily="monospace">
                      {latLabel}
                    </text>
                    <text x="965" y={y - 3} fill="#4b5563" fontSize="6" fontFamily="monospace">
                      {latLabel}
                    </text>
                  </g>
                );
              })}
              {[166.6, 333.3, 500, 666.6, 833.3].map((x, idx) => {
                const lonLabel = ['120°W', '60°W', '00° GMT (PRIME)', '60°E', '120°E'][idx];
                return (
                  <g key={`lon-${x}`}>
                    <line x1={x} y1="0" x2={x} y2="500" />
                    <text x={x + 3} y="12" fill="#4b5563" fontSize="6" fontFamily="monospace">
                      {lonLabel}
                    </text>
                    <text x={x + 3} y="492" fill="#4b5563" fontSize="6" fontFamily="monospace">
                      {lonLabel}
                    </text>
                  </g>
                );
              })}
            </g>

            {/* Bathymetric Depth Trench Outlines (Mariana, Puerto Rico, Java Trench, Mid-Atlantic Ridge) */}
            <g stroke="#0e172a" strokeWidth="1.2" fill="none" opacity="0.6">
              {/* Mid-Atlantic Ridge */}
              <path d="M 420 30 Q 400 120 440 220 T 460 380 T 450 480" strokeDasharray="4 4" />
              {/* Mariana Trench */}
              <path d="M 880 200 Q 900 230 890 270" stroke="#00e5ff" strokeWidth="1" opacity="0.4" />
              {/* Java Trench */}
              <path d="M 760 260 Q 790 280 840 290" stroke="#00e5ff" strokeWidth="1" opacity="0.4" />
            </g>

            {/* HIGH-FIDELITY REALISTIC WORLD CONTINENT & ISLAND SHAPES */}
            <g fill="#0e1322" stroke="#1d263b" strokeWidth="0.8">
              {/* NORTH AMERICA (Alaska, Canada, Great Lakes, US East/West Coasts, Gulf of Mexico, Florida, Baja, Mexico) */}
              <path d="M 30 75 L 80 50 L 130 40 L 180 50 L 210 65 L 250 55 L 290 85 L 295 110 L 270 125 L 285 140 L 265 170 L 245 195 L 225 210 L 215 235 L 200 220 L 210 200 L 185 205 L 160 200 L 140 185 L 125 150 L 95 130 L 60 115 L 35 110 Z" />
              {/* Florida Peninsula */}
              <path d="M 235 195 L 240 215 L 235 225 L 230 215 Z" fill="#111728" />
              {/* Baja California */}
              <path d="M 155 195 L 170 235 L 165 240 L 150 205 Z" fill="#111728" />
              {/* Greenland */}
              <path d="M 340 30 L 410 25 L 430 55 L 390 95 L 360 85 L 335 55 Z" fill="#0d1220" />
              {/* Caribbean Islands (Cuba, Hispaniola, Puerto Rico) */}
              <path d="M 235 235 Q 260 240 280 248 L 270 252 Q 245 245 235 238 Z" fill="#151b2e" />

              {/* CENTRAL AMERICA & PANAMA ISTHMUS */}
              <path d="M 200 220 L 220 240 L 235 255 L 230 262 L 210 248 L 195 230 Z" />

              {/* SOUTH AMERICA (Colombia, Venezuela, Brazil coast, Santos, Rio, Plate River, Patagonia, Strait of Magellan, Chile, Peru) */}
              <path d="M 225 255 L 255 250 L 310 265 L 348 290 L 355 330 L 335 375 L 305 435 L 285 475 L 265 485 L 260 455 L 275 420 L 260 360 L 240 310 L 220 275 Z" />

              {/* EURASIA & EUROPE (British Isles, Scandinavia, Baltic, North Sea, Iberia, France, Italy, Greece, Black Sea, Bosphorus, Russia, Middle East, India, China, Japan) */}
              {/* Western Europe, Nordics & Russia */}
              <path d="M 455 155 L 475 140 L 515 135 L 530 110 L 580 85 L 670 65 L 770 60 L 890 65 L 940 90 L 920 135 L 880 155 L 850 190 L 825 220 L 780 240 L 740 230 L 720 195 L 680 185 L 620 180 L 575 165 L 535 180 L 500 170 L 460 190 L 445 175 Z" />
              {/* British Isles (UK & Ireland) */}
              <path d="M 465 110 L 485 105 L 490 125 L 475 140 L 460 130 Z" fill="#121726" />
              <circle cx="455" cy="125" r="7" fill="#121726" />
              {/* Iberian Peninsula (Spain/Portugal & Gibraltar) */}
              <path d="M 445 175 L 480 175 L 475 205 L 450 205 Z" fill="#111728" />
              {/* Italian Peninsula & Sicily */}
              <path d="M 515 175 L 530 200 L 525 210 L 510 185 Z" fill="#121726" />
              {/* Scandinavian Peninsula */}
              <path d="M 515 75 L 550 65 L 580 85 L 550 135 L 525 130 Z" fill="#121726" />

              {/* ARABIAN PENINSULA & PERSIAN GULF */}
              <path d="M 590 190 L 640 195 L 655 230 L 630 255 L 600 240 L 585 205 Z" />

              {/* INDIAN SUBCONTINENT & SRI LANKA */}
              <path d="M 680 185 L 720 195 L 740 230 L 725 270 L 705 245 L 685 205 Z" />
              <circle cx="732" cy="278" r="5" fill="#141a2c" />

              {/* EAST ASIA & JAPANESE ARCHIPELAGO */}
              {/* Korean Peninsula */}
              <path d="M 830 180 L 845 185 L 840 205 L 828 198 Z" fill="#13192a" />
              {/* Japan (Honshu, Hokkaido, Kyushu) */}
              <path d="M 865 160 Q 885 185 870 215 L 860 210 Q 875 185 855 165 Z" fill="#151d30" />

              {/* SOUTHEAST ASIA & INDONESIAN ARCHIPELAGO */}
              {/* Indochina & Malay Peninsula */}
              <path d="M 760 210 L 795 215 L 800 255 L 785 275 L 775 250 L 760 220 Z" />
              {/* Sumatra */}
              <path d="M 765 270 L 800 295 L 785 305 L 755 280 Z" fill="#121828" />
              {/* Java */}
              <path d="M 795 305 L 845 315 L 840 322 L 790 312 Z" fill="#121828" />
              {/* Borneo */}
              <circle cx="825" cy="285" r="16" fill="#121828" />
              {/* Philippines (Luzon & Mindanao) */}
              <path d="M 845 235 L 860 240 L 855 275 L 840 265 Z" fill="#141a2c" />

              {/* AFRICA (Gibraltar, Suez, Horn of Africa, Gulf of Guinea, Cape of Good Hope, Madagascar) */}
              <path d="M 455 205 L 540 200 L 590 205 L 610 245 L 635 275 L 595 365 L 565 440 L 525 450 L 495 400 L 475 320 L 435 270 L 445 230 Z" />
              {/* Madagascar */}
              <path d="M 625 355 L 645 375 L 635 425 L 615 405 Z" fill="#121828" />

              {/* AUSTRALIA & NEW ZEALAND */}
              <path d="M 800 340 L 870 330 L 910 365 L 895 425 L 845 435 L 795 400 L 785 360 Z" />
              {/* New Zealand */}
              <path d="M 945 420 L 960 450 L 950 460 L 935 430 Z" fill="#121828" />
              {/* Papua New Guinea */}
              <path d="M 870 300 L 915 310 L 910 325 L 865 315 Z" fill="#121828" />
            </g>

            {/* NAVAL WAR-RISK / CRITICAL ESCORT ZONES */}
            {showRiskZonesLayer && (
              <g>
                {/* Red Sea / Gulf of Aden Risk Envelope */}
                <polygon
                  points="590,205 635,230 625,265 585,250"
                  fill="rgba(255, 0, 55, 0.12)"
                  stroke="#ff0037"
                  strokeWidth="0.75"
                  strokeDasharray="2 2"
                />
                <text x="592" y="245" fill="#ff4081" fontSize="5" fontFamily="monospace" fontWeight="bold">
                  🛡️ WAR-RISK: ASPIDES ESCORT
                </text>

                {/* Strait of Hormuz Escort Envelope */}
                <polygon
                  points="640,195 665,200 660,225 635,220"
                  fill="rgba(255, 100, 0, 0.12)"
                  stroke="#ff6d00"
                  strokeWidth="0.75"
                  strokeDasharray="2 2"
                />
                <text x="636" y="208" fill="#ffab40" fontSize="5" fontFamily="monospace" fontWeight="bold">
                  ⚠️ HORMUZ VLCC FAIRWAY
                </text>

                {/* Gulf of Guinea Piracy Danger Swath */}
                <circle
                  cx="490"
                  cy="295"
                  r="35"
                  fill="rgba(255, 171, 0, 0.08)"
                  stroke="#ffab00"
                  strokeWidth="0.75"
                  strokeDasharray="3 3"
                />
                <text x="465" y="300" fill="#ffd740" fontSize="5" fontFamily="monospace" fontWeight="bold">
                  🏴‍☠️ PIRACY RISK ZONE
                </text>

                {/* Kerch Strait / Black Sea Sea-Mine Danger Swath */}
                <circle
                  cx="595"
                  cy="165"
                  r="18"
                  fill="rgba(255, 23, 68, 0.15)"
                  stroke="#ff1744"
                  strokeWidth="0.8"
                  strokeDasharray="2 2"
                />
                <text x="578" y="160" fill="#ff5252" fontSize="4.5" fontFamily="monospace" fontWeight="bold">
                  💣 BLACK SEA MINE ZONE
                </text>
              </g>
            )}

            {/* SEVERE WEATHER / CYCLONE / ROGUE SWELL ZONES */}
            {showWeatherLayer && (
              <g>
                {/* Typhoon Gaemi Storm Zone in Philippine Sea */}
                <g transform="translate(850, 220)">
                  <circle r="30" fill="none" stroke="#00e5ff" strokeWidth="0.8" strokeDasharray="3 3" className="animate-spin" />
                  <circle r="15" fill="rgba(0, 229, 255, 0.15)" stroke="#00e5ff" strokeWidth="1" />
                  <text x="-25" y="-18" fill="#80d8ff" fontSize="5" fontFamily="monospace" fontWeight="bold">
                    🌀 TYPHOON SWELL 8M
                  </text>
                </g>
                {/* Cape of Good Hope Monster Swells */}
                <g transform="translate(555, 455)">
                  <path d="M -15 0 Q 0 -6 15 0" fill="none" stroke="#40c4ff" strokeWidth="1" />
                  <path d="M -15 4 Q 0 -2 15 4" fill="none" stroke="#40c4ff" strokeWidth="1" />
                  <text x="-28" y="12" fill="#80d8ff" fontSize="4.5" fontFamily="monospace">
                    🌊 ROARING FORTIES SWELLS
                  </text>
                </g>
              </g>
            )}

            {/* FREIGHT LANES (Glowing Corridors) */}
            {showLanesLayer &&
              freightLanes.map(lane => {
                const isSelected = selectedLane.id === lane.id;
                const pathD = getLanePath(lane.waypoints, 1000, 500);
                const laneColor =
                  lane.type === 'CONTAINER'
                    ? '#ff9f1c'
                    : lane.type === 'CRUDE'
                    ? '#ff3d00'
                    : lane.type === 'DRY_BULK'
                    ? '#00e676'
                    : '#00e5ff';

                return (
                  <g
                    key={lane.id}
                    className="cursor-pointer group"
                    onClick={() => {
                      setSelectedLane(lane);
                      if (onSelectLane) onSelectLane(lane);
                      terminalSound.playKeyClick();
                    }}
                  >
                    <path d={pathD} fill="none" stroke="transparent" strokeWidth="18" />
                    <path
                      d={pathD}
                      fill="none"
                      stroke={laneColor}
                      strokeWidth={isSelected ? '3.5' : '1.5'}
                      strokeDasharray={isSelected ? '6 3' : '4 4'}
                      className={isSelected ? 'animate-pulse' : 'opacity-60 group-hover:opacity-100'}
                    />
                  </g>
                );
              })}

            {/* STRATEGIC CHOKEPOINTS */}
            {showChokepointsLayer &&
              chokePoints.map(cp => {
                const { x, y } = projectCoords(cp.lon, cp.lat, 1000, 500);
                const isSelected = selectedChoke?.id === cp.id;
                const isHighRisk = cp.riskLevel === 'HIGH' || cp.riskLevel === 'ELEVATED';

                return (
                  <g
                    key={cp.id}
                    transform={`translate(${x}, ${y})`}
                    className="cursor-pointer group"
                    onClick={() => {
                      setSelectedChoke(cp);
                      setSelectedPort(null);
                      setSelectedIncident(null);
                      terminalSound.playKeyClick();
                    }}
                  >
                    <circle
                      r={isSelected ? '9' : '6'}
                      fill={isHighRisk ? '#ff1744' : '#ff9100'}
                      className="animate-ping opacity-60"
                    />
                    <circle
                      r={isSelected ? '7' : '4.5'}
                      fill={isHighRisk ? '#ff1744' : '#ff9100'}
                      stroke="#000"
                      strokeWidth="1.2"
                    />
                    <text
                      x="7"
                      y="3"
                      fill={isHighRisk ? '#ff80ab' : '#ffd180'}
                      fontSize="6.5"
                      fontWeight="bold"
                      fontFamily="monospace"
                      className="group-hover:fill-white drop-shadow"
                    >
                      {cp.name}
                    </text>
                  </g>
                );
              })}

            {/* MAJOR GLOBAL PORTS (24+ Key Hubs) */}
            {showPortsLayer &&
              ports.map(port => {
                const { x, y } = projectCoords(port.lon, port.lat, 1000, 500);
                const isSelected = selectedPort?.id === port.id;
                const portColor =
                  port.status === 'CRITICAL'
                    ? '#ff1744'
                    : port.status === 'CONGESTED'
                    ? '#ff9f1c'
                    : '#00e676';

                return (
                  <g
                    key={port.id}
                    transform={`translate(${x}, ${y})`}
                    className="cursor-pointer group"
                    onClick={() => {
                      setSelectedPort(port);
                      setSelectedChoke(null);
                      setSelectedIncident(null);
                      terminalSound.playKeyClick();
                    }}
                  >
                    <rect
                      x="-3.5"
                      y="-3.5"
                      width="7"
                      height="7"
                      fill={portColor}
                      stroke="#000"
                      strokeWidth="1"
                      transform="rotate(45)"
                      className={isSelected ? 'animate-bounce' : ''}
                    />
                    <text
                      x="6"
                      y="8"
                      fill="#94a3b8"
                      fontSize="6"
                      fontFamily="monospace"
                      className="group-hover:fill-white font-semibold"
                    >
                      {port.code} ({port.vesselsWaiting}w)
                    </text>
                  </g>
                );
              })}

            {/* LIVE AIS VESSELS */}
            {showVesselsLayer &&
              displayedVessels.map(vsl => {
                const { x, y } = projectCoords(vsl.lon, vsl.lat, 1000, 500);
                const isSelected = selectedVessel?.id === vsl.id;
                const color =
                  vsl.type === 'CONTAINER'
                    ? '#ff9f1c'
                    : vsl.type === 'CRUDE_TANKER'
                    ? '#ff3d00'
                    : vsl.type === 'DRY_BULK'
                    ? '#00e676'
                    : '#00e5ff';

                return (
                  <g
                    key={vsl.id}
                    transform={`translate(${x}, ${y}) rotate(${vsl.heading})`}
                    className="cursor-pointer group"
                    onClick={() => {
                      setSelectedVessel(vsl);
                      terminalSound.playKeyClick();
                    }}
                  >
                    {isSelected && (
                      <circle
                        r="12"
                        fill="none"
                        stroke="#ff9f1c"
                        strokeWidth="1.5"
                        strokeDasharray="2 2"
                        className="animate-spin"
                      />
                    )}
                    <path
                      d="M 0 -7 L 4 5 L 0 3 L -4 5 Z"
                      fill={color}
                      stroke="#000"
                      strokeWidth="0.8"
                      className="group-hover:scale-125 transition-transform"
                    />
                  </g>
                );
              })}

            {/* 💥 RECENT MARITIME TRAGEDIES & CASUALTY HOTSPOTS (High Visibility) */}
            {showIncidentsLayer &&
              displayedIncidents.map(inc => {
                const { x, y } = projectCoords(inc.lon, inc.lat, 1000, 500);
                const isSelected = selectedIncident?.id === inc.id;
                const isCritical = inc.severity === 'CRITICAL';

                return (
                  <g
                    key={inc.id}
                    transform={`translate(${x}, ${y})`}
                    className="cursor-pointer group"
                    onClick={() => {
                      setSelectedIncident(inc);
                      setSelectedPort(null);
                      setSelectedChoke(null);
                      terminalSound.playAlertBeep();
                    }}
                  >
                    {/* Pulsing Hazard Halo */}
                    <circle
                      r={isSelected ? '22' : '14'}
                      fill={isCritical ? 'rgba(255, 0, 55, 0.4)' : 'rgba(255, 100, 0, 0.35)'}
                      className="animate-ping"
                    />
                    <circle
                      r={isSelected ? '14' : '9'}
                      fill={isCritical ? '#ff0037' : '#ff6d00'}
                      stroke="#fff"
                      strokeWidth="1.5"
                    />

                    {/* Category Icon Badge */}
                    <text
                      x="0"
                      y="3.5"
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="7"
                      fontWeight="bold"
                      fontFamily="sans-serif"
                    >
                      {inc.category === 'SINKING'
                        ? '⚓'
                        : inc.category === 'MISSILE_ATTACK'
                        ? '💥'
                        : inc.category === 'COLLISION'
                        ? '🌉'
                        : inc.category === 'OIL_SPILL'
                        ? '🛢️'
                        : inc.category === 'SEA_MINE'
                        ? '💣'
                        : inc.category === 'PIRACY'
                        ? '🏴‍☠️'
                        : '⚠️'}
                    </text>

                    {/* Name Label with Warning Highlight */}
                    <g transform="translate(12, -4)">
                      <rect
                        x="-2"
                        y="-7"
                        width={inc.vesselName.length * 5.2 + 8}
                        height="11"
                        fill="rgba(0,0,0,0.85)"
                        stroke={isCritical ? '#ff0037' : '#ff6d00'}
                        strokeWidth="0.8"
                        rx="2"
                      />
                      <text
                        x="2"
                        y="1.5"
                        fill={isCritical ? '#ff80ab' : '#ffd180'}
                        fontSize="6.5"
                        fontWeight="bold"
                        fontFamily="monospace"
                        className="group-hover:fill-white"
                      >
                        {inc.vesselName} ({inc.category})
                      </text>
                    </g>
                  </g>
                );
              })}
          </svg>

          {/* Nautical Compass Rose Overlay in Top-Right */}
          <div className="absolute top-3 right-3 bg-[#0a0d16]/90 border border-[#232b42] p-2 rounded text-[10px] text-gray-400 z-30 pointer-events-none flex items-center space-x-2 backdrop-blur-xs">
            <Compass className="w-5 h-5 text-[#ff9f1c] animate-spin" style={{ animationDuration: '30s' }} />
            <div>
              <div className="text-white font-bold tracking-widest text-[9px]">NORTH COMPASS</div>
              <div className="text-[8px] text-[#ff9f1c]">EQUIRECTANGULAR WGS84</div>
            </div>
          </div>

          {/* Map Legend Overlay */}
          <div className="absolute bottom-2 left-2 bg-[#090b12]/95 border border-[#21273b] p-2 rounded text-[10px] space-y-1.5 z-30 backdrop-blur-xs max-w-sm">
            <div className="text-white font-bold flex items-center justify-between">
              <span className="flex items-center">
                <Layers className="w-3 h-3 mr-1 text-[#ff9f1c]" />
                TACTICAL SYMBOLOGY &amp; TRAGEDIES
              </span>
              <span className="text-emerald-400 text-[9px] font-mono">WGS-84 PROJECTION</span>
            </div>

            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[#cbd5e1] text-[9.5px]">
              <span className="flex items-center text-red-400 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 mr-1 animate-pulse border border-white"></span>
                Tragedy / Casualty Hotspot
              </span>
              <span className="flex items-center text-amber-400 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 mr-1 animate-ping"></span>
                Strategic Chokepoint
              </span>
              <span className="flex items-center">
                <span className="w-2.5 h-2.5 bg-[#ff9f1c] rounded-xs mr-1"></span>
                Container Megaship
              </span>
              <span className="flex items-center">
                <span className="w-2.5 h-2.5 bg-[#ff3d00] rounded-xs mr-1"></span>
                Crude VLCC Tanker
              </span>
              <span className="flex items-center">
                <span className="w-2.5 h-2.5 bg-[#00e676] rounded-xs mr-1"></span>
                Dry Bulk / Valemax
              </span>
              <span className="flex items-center">
                <span className="w-2.5 h-2.5 bg-[#00e5ff] rounded-xs mr-1"></span>
                LNG Tanker (Q-Max)
              </span>
              <span className="flex items-center">
                <span className="w-2.5 h-2.5 bg-[#00e676] transform rotate-45 mr-1"></span>
                Major Port (24+ Spots)
              </span>
              <span className="flex items-center text-purple-300">
                <span className="w-2.5 h-2.5 border border-purple-400 mr-1"></span>
                Naval Escort / War Risk
              </span>
            </div>
          </div>
        </div>

        {/* Global Freight Rates Tape / Sub-Panel */}
        <div className="bg-[#0b0d14] border-t border-[#1e2338] p-2.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-white flex items-center">
              <DollarSign className="w-3.5 h-3.5 mr-1 text-[#ff9f1c]" />
              GLOBAL FREIGHT LANE SPOT RATES &amp; DERIVATIVES (FFA)
            </span>
            <span className="text-[10px] text-[#64748b]">AUTO-REFRESHING 2s • 8 ACTIVE CORRIDORS</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {freightLanes.map(lane => {
              const isSelected = selectedLane.id === lane.id;
              return (
                <div
                  key={lane.id}
                  onClick={() => {
                    setSelectedLane(lane);
                    terminalSound.playKeyClick();
                  }}
                  className={`p-2 rounded border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#1a2033] border-[#ff9f1c] ring-1 ring-[#ff9f1c]/40'
                      : 'bg-[#101320] border-[#1e2438] hover:border-[#384163]'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[11px] font-bold text-white truncate max-w-[150px]">
                      {lane.name}
                    </span>
                    <span className="text-[10px] px-1 py-0.2 rounded bg-[#090b12] text-[#ff9f1c] font-semibold">
                      {lane.code}
                    </span>
                  </div>

                  <div className="flex justify-between items-baseline mt-1.5">
                    <div>
                      <span className="text-sm font-bold text-[#ff9f1c]">
                        ${lane.currentRateUsd.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-[#94a3b8] ml-1">{lane.rateUnit}</span>
                    </div>

                    <span
                      className={`text-xs font-bold flex items-center ${
                        lane.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {lane.change24h >= 0 ? (
                        <TrendingUp className="w-3 h-3 mr-0.5" />
                      ) : (
                        <TrendingDown className="w-3 h-3 mr-0.5" />
                      )}
                      {lane.change24h >= 0 ? '+' : ''}
                      {lane.changePct.toFixed(2)}%
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-[#94a3b8] mt-1 pt-1 border-t border-[#1e2438]">
                    <span>Transit: {lane.transitDays}d ({lane.distanceNm.toLocaleString()}nm)</span>
                    <span>Congestion: {lane.congestionIndex}/100</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* RIGHT SIDEBAR: Telemetry Inspector, Incident Hotspot Audit & Financial Models */}
      <div className="w-full lg:w-96 flex flex-col bg-[#0c0e17] divide-y divide-[#1e2338] overflow-y-auto">
        {/* Selected Incident / Tragedy Hotspot Card (If clicked on map) */}
        {selectedIncident ? (
          <div className="p-3 bg-red-950/40 border-b border-red-800/60">
            <div className="flex items-center justify-between text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1">
              <span className="flex items-center">
                <AlertTriangle className="w-3.5 h-3.5 mr-1 text-red-500 animate-pulse" />
                MARITIME CASUALTY AUDIT &lt;INCIDENT&gt;
              </span>
              <button
                onClick={() => setSelectedIncident(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <h3 className="text-sm font-extrabold text-white leading-snug">
              {selectedIncident.title}
            </h3>

            <div className="grid grid-cols-2 gap-2 mt-2 text-[10px]">
              <div className="bg-black/40 p-1.5 rounded border border-red-900/50">
                <span className="text-gray-400 block">Vessel / IMO:</span>
                <span className="text-white font-bold">{selectedIncident.vesselName}</span>
                <span className="text-gray-400 block text-[9px]">IMO: {selectedIncident.imo || 'N/A'}</span>
              </div>
              <div className="bg-black/40 p-1.5 rounded border border-red-900/50">
                <span className="text-gray-400 block">Status &amp; Severity:</span>
                <span className="text-rose-400 font-bold">{selectedIncident.severity}</span>
                <span className="text-amber-300 block text-[9px]">{selectedIncident.status}</span>
              </div>
            </div>

            {/* Casualties and Human Impact */}
            <div className="mt-2 p-2 bg-red-950/60 rounded border border-red-700/50 text-[10px]">
              <div className="font-bold text-rose-300 flex items-center mb-1">
                <Skull className="w-3.5 h-3.5 mr-1" />
                CASUALTIES &amp; CREW STATUS:
              </div>
              <div className="text-gray-200 leading-relaxed">
                Fatalities: <span className="font-bold text-red-400">{selectedIncident.casualties.fatalities}</span> |
                Injured: <span className="font-bold text-amber-400">{selectedIncident.casualties.injured}</span> |
                Missing: <span className="font-bold text-amber-400">{selectedIncident.casualties.missing}</span>
              </div>
              <p className="text-gray-300 mt-1 text-[9.5px]">
                {selectedIncident.casualties.crewStatus}
              </p>
            </div>

            {/* Environmental & Market Impact */}
            <div className="mt-2 text-[10px] space-y-1 text-gray-300">
              <div>
                <span className="text-amber-400 font-bold">Environmental Damage:</span> {selectedIncident.environmentalImpact}
              </div>
              <div>
                <span className="text-cyan-400 font-bold">Insurance &amp; P&amp;I Cost:</span> {selectedIncident.insuranceImpact}
              </div>
              <div>
                <span className="text-emerald-400 font-bold">Freight Market Shock:</span> {selectedIncident.freightImpact}
              </div>
            </div>

            {/* Ask AI Button for this tragedy */}
            <button
              onClick={() => {
                if (onAskAIAboutIncident) {
                  onAskAIAboutIncident(selectedIncident);
                }
                terminalSound.playTradeFill();
              }}
              className="w-full mt-3 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-black font-extrabold py-1.5 rounded text-xs flex items-center justify-center space-x-1.5 shadow"
            >
              <Bot className="w-4 h-4 text-black" />
              <span>🤖 ASK AI ANALYST ABOUT THIS TRAGEDY</span>
            </button>
          </div>
        ) : selectedVessel ? (
          /* Selected Vessel Telemetry */
          <div className="p-3 bg-[#111422]">
            <div className="text-[10px] text-[#94a3b8] font-bold uppercase tracking-wider mb-1">
              LIVE AIS VESSEL TELEMETRY
            </div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-white flex items-center">
                <Ship className="w-4 h-4 mr-1.5 text-[#ff9f1c]" />
                {selectedVessel.name}
              </h3>
              <span className="text-[10px] px-1.5 py-0.5 bg-[#1f263d] text-emerald-400 rounded font-bold">
                {selectedVessel.cargoStatus}
              </span>
            </div>
            <div className="text-[11px] text-[#94a3b8] mt-0.5">
              MMSI: {selectedVessel.mmsi} | IMO: {selectedVessel.imo} | Flag: {selectedVessel.flag}
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2.5 text-[10px]">
              <div className="bg-[#090b12] p-1.5 rounded border border-[#1e2438]">
                <span className="text-[#94a3b8] block">Speed &amp; Heading:</span>
                <span className="text-white font-bold">{selectedVessel.speedKnots} kts @ {selectedVessel.heading}°</span>
              </div>
              <div className="bg-[#090b12] p-1.5 rounded border border-[#1e2438]">
                <span className="text-[#94a3b8] block">Current Draft:</span>
                <span className="text-white font-bold">{selectedVessel.draftM}m / {selectedVessel.maxDraftM}m</span>
              </div>
              <div className="bg-[#090b12] p-1.5 rounded border border-[#1e2438]">
                <span className="text-[#94a3b8] block">Deadweight (DWT):</span>
                <span className="text-white font-bold">{selectedVessel.dwt.toLocaleString()} MT</span>
              </div>
              <div className="bg-[#090b12] p-1.5 rounded border border-[#1e2438]">
                <span className="text-[#94a3b8] block">Operator:</span>
                <span className="text-white font-bold truncate block">{selectedVessel.operator}</span>
              </div>
            </div>

            {selectedVessel.riskAlert && (
              <div className="mt-2 p-1.5 bg-amber-950/40 border border-amber-500/40 rounded text-[10px] text-amber-300 flex items-center">
                <AlertTriangle className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                <span>{selectedVessel.riskAlert}</span>
              </div>
            )}
          </div>
        ) : selectedPort ? (
          /* Selected Port Card */
          <div className="p-3 bg-[#111422]">
            <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mb-1">
              PORT TERMINAL AUDIT &lt;{selectedPort.code}&gt;
            </div>
            <h3 className="text-sm font-extrabold text-white">{selectedPort.name}</h3>
            <div className="text-[10px] text-gray-400">{selectedPort.country}</div>

            <div className="grid grid-cols-2 gap-2 mt-2 text-[10px]">
              <div className="bg-[#090b12] p-1.5 rounded border border-[#1e2438]">
                <span className="text-gray-400 block">Annual Throughput:</span>
                <span className="text-white font-bold">{selectedPort.throughputTeuM}M TEU</span>
              </div>
              <div className="bg-[#090b12] p-1.5 rounded border border-[#1e2438]">
                <span className="text-gray-400 block">VLSFO Bunker:</span>
                <span className="text-[#ff9f1c] font-bold">${selectedPort.bunkerPriceVLSFO.toFixed(2)}/MT</span>
              </div>
              <div className="bg-[#090b12] p-1.5 rounded border border-[#1e2438]">
                <span className="text-gray-400 block">Vessels Waiting:</span>
                <span className="text-rose-400 font-bold">{selectedPort.vesselsWaiting} ships</span>
              </div>
              <div className="bg-[#090b12] p-1.5 rounded border border-[#1e2438]">
                <span className="text-gray-400 block">Congestion Score:</span>
                <span className="text-amber-400 font-bold">{selectedPort.congestionScore}/100</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-[#111422] text-xs text-[#64748b]">
            Click any tragedy hotspot 💥, port ⚓, or vessel 🚢 on the map for live tactical telemetry.
          </div>
        )}

        {/* Strategic Corridor Financial & Voyage Simulator */}
        <div className="p-3 bg-[#0d0f19] space-y-2.5">
          <div className="flex items-center justify-between text-[10px] font-bold text-white uppercase tracking-wider">
            <span className="flex items-center text-[#ff9f1c]">
              <Sliders className="w-3.5 h-3.5 mr-1" />
              VOYAGE P&amp;L FINANCIAL MODEL
            </span>
            <span className="text-gray-400 font-mono">{selectedLane.code}</span>
          </div>

          <div className="text-[11px] font-bold text-gray-200">
            {selectedLane.name}
          </div>

          {/* Calculator Inputs */}
          <div className="space-y-2 text-[10px]">
            <div>
              <div className="flex justify-between text-gray-400 mb-0.5">
                <span>Speed: <strong className="text-white">{calcSpeedKnots} knots</strong></span>
                <span>Est Transit: <strong className="text-[#ff9f1c]">{calculatedDays} days</strong></span>
              </div>
              <input
                type="range"
                min="12"
                max="22"
                step="0.5"
                value={calcSpeedKnots}
                onChange={e => setCalcSpeedKnots(Number(e.target.value))}
                className="w-full accent-[#ff9f1c]"
              />
            </div>

            <div>
              <div className="flex justify-between text-gray-400 mb-0.5">
                <span>Bunker Fuel Price:</span>
                <strong className="text-white">${calcBunkerPrice}/MT (VLSFO)</strong>
              </div>
              <input
                type="range"
                min="500"
                max="850"
                step="10"
                value={calcBunkerPrice}
                onChange={e => setCalcBunkerPrice(Number(e.target.value))}
                className="w-full accent-[#ff9f1c]"
              />
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="p-2 bg-[#080910] rounded border border-[#1e2438] space-y-1 text-[10px]">
            <div className="flex justify-between text-gray-400">
              <span>Bunker Fuel Cost ({bunkerConsumptionTons.toFixed(0)} MT):</span>
              <span className="text-white font-mono">${totalBunkerCost.toLocaleString()}</span>
            </div>
            {canalTollEst > 0 && (
              <div className="flex justify-between text-gray-400">
                <span>Canal Toll Transit Fee:</span>
                <span className="text-white font-mono">${canalTollEst.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-400">
              <span>EU ETS Maritime Carbon Cost:</span>
              <span className="text-cyan-400 font-mono">${carbonEtsCost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-gray-300 font-bold pt-1 border-t border-[#1e2438]">
              <span>Est Net Voyage Margin:</span>
              <span className={estVoyageProfit >= 0 ? 'text-emerald-400 font-mono' : 'text-rose-400 font-mono'}>
                ${estVoyageProfit.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* RECENT MARITIME TRAGEDIES & CASUALTY SITREP FULL MODAL */}
      {showTragediesModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0e111a] border border-red-600/70 rounded-lg shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden text-xs font-mono">
            {/* Modal Header */}
            <div className="p-3 bg-gradient-to-r from-red-950 via-slate-900 to-red-950 border-b border-red-600/60 flex items-center justify-between text-white">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
                <span className="font-extrabold text-sm tracking-wide text-white">
                  RECENT MARITIME TRAGEDIES, CASUALTIES &amp; CASUALTY INTELLIGENCE
                </span>
              </div>
              <button
                onClick={() => setShowTragediesModal(false)}
                className="text-gray-400 hover:text-white p-1 rounded hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Category Filter Pills */}
            <div className="p-2.5 bg-[#090b12] border-b border-[#232a3f] flex flex-wrap items-center gap-1.5 text-[10px]">
              <span className="text-gray-400 font-bold mr-1">FILTER CATEGORY:</span>
              {['ALL', 'SINKING', 'MISSILE_ATTACK', 'COLLISION', 'OIL_SPILL', 'SEA_MINE', 'PIRACY', 'DROUGHT', 'SEVERE_WEATHER'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setIncidentCategoryFilter(cat)}
                  className={`px-2 py-0.5 rounded font-bold transition-all ${
                    incidentCategoryFilter === cat
                      ? 'bg-red-600 text-white shadow'
                      : 'bg-[#141828] text-gray-400 hover:text-white hover:bg-[#1f253d]'
                  }`}
                >
                  {cat.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* Incident Cards Scrollable List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-[#070910]">
              {displayedIncidents.map(inc => (
                <div
                  key={inc.id}
                  className="bg-[#101422] border border-red-900/60 hover:border-red-500 p-3 rounded transition-colors space-y-2"
                >
                  <div className="flex flex-wrap items-start justify-between gap-1">
                    <div>
                      <span className="text-[10px] bg-red-950 text-red-300 px-1.5 py-0.5 rounded border border-red-800 font-bold mr-2">
                        {inc.category}
                      </span>
                      <span className="text-xs font-bold text-white">
                        {inc.title}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-400 font-mono">
                      {inc.date} • {inc.locationName}
                    </span>
                  </div>

                  {/* Casualty Box */}
                  <div className="p-2 bg-red-950/40 rounded border border-red-900/40 text-[10px] text-gray-200">
                    <div className="font-bold text-rose-300 flex items-center mb-0.5">
                      <Skull className="w-3 h-3 mr-1 text-rose-400" />
                      CASUALTY &amp; CREW STATUS:
                    </div>
                    <p className="leading-relaxed">
                      Fatalities: <strong className="text-red-400">{inc.casualties.fatalities}</strong> |
                      Injured: <strong className="text-amber-400">{inc.casualties.injured}</strong> |
                      {inc.casualties.crewStatus}
                    </p>
                  </div>

                  {/* Sitrep text */}
                  <p className="text-[10.5px] text-gray-300 leading-relaxed">
                    {inc.detailedSitrep}
                  </p>

                  {/* Environmental, Insurance & Freight Impact */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[9.5px] pt-1 border-t border-[#1e243a]">
                    <div className="bg-black/30 p-1.5 rounded">
                      <span className="text-amber-400 font-bold block">Environmental:</span>
                      <span className="text-gray-300">{inc.environmentalImpact}</span>
                    </div>
                    <div className="bg-black/30 p-1.5 rounded">
                      <span className="text-cyan-400 font-bold block">Insurance / P&amp;I:</span>
                      <span className="text-gray-300">{inc.insuranceImpact}</span>
                    </div>
                    <div className="bg-black/30 p-1.5 rounded">
                      <span className="text-emerald-400 font-bold block">Freight Disruption:</span>
                      <span className="text-gray-300">{inc.freightImpact}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[9px] text-gray-500">
                      Co-ordinates: {inc.lat}°N, {inc.lon}°E | Flag: {inc.flag}
                    </span>
                    <button
                      onClick={() => {
                        setShowTragediesModal(false);
                        if (onAskAIAboutIncident) {
                          onAskAIAboutIncident(inc);
                        }
                        terminalSound.playTradeFill();
                      }}
                      className="bg-red-600 hover:bg-red-500 text-white font-bold px-3 py-1 rounded text-[10px] flex items-center space-x-1 transition-colors"
                    >
                      <Bot className="w-3.5 h-3.5 mr-1" />
                      <span>ASK AI AGENT SITREP</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="p-2.5 bg-[#090b12] border-t border-[#1e2338] flex items-center justify-between text-[10px] text-gray-400">
              <span>Source: IMO Global Integrated Shipping Information System (GISIS) &amp; Lloyd’s Intelligence</span>
              <button
                onClick={() => setShowTragediesModal(false)}
                className="bg-[#222] hover:bg-[#333] text-white px-3 py-1 rounded font-bold"
              >
                CLOSE [ESC]
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { CloudSun, Database, RefreshCw, ShieldCheck, Wifi, History, AlertTriangle } from 'lucide-react';
import { Port } from '../../types';
import { fetchIndiaMacro, fetchPortWeather, fetchHistoricalPortWeather, MacroSnapshot, WeatherSnapshot, HistoricalWeatherSnapshot } from '../../utils/externalDataClient';

interface Props { ports: Port[]; }

export const DataConnectivityView: React.FC<Props> = ({ ports }) => {
  const [macro, setMacro] = useState<MacroSnapshot | null>(null);
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [weatherHistory, setWeatherHistory] = useState<HistoricalWeatherSnapshot | null>(null);
  const [selectedPortId, setSelectedPortId] = useState(ports[0]?.id ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const selectedPort = ports.find(port => port.id === selectedPortId) ?? ports[0];

  const refresh = async () => {
    setLoading(true); setError('');
    try {
      const [macroData, weatherData, historyData] = await Promise.all([
        fetchIndiaMacro(),
        selectedPort ? fetchPortWeather(selectedPort.lat, selectedPort.lon) : Promise.resolve(null),
        selectedPort ? fetchHistoricalPortWeather(selectedPort.lat, selectedPort.lon, 90) : Promise.resolve(null)
      ]);
      setMacro(macroData);
      if (weatherData) setWeather(weatherData);
      if (historyData) setWeatherHistory(historyData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'External data unavailable');
    } finally { setLoading(false); }
  };

  useEffect(() => { refresh(); }, [selectedPortId]);

  return <div className="h-full overflow-auto bg-black text-[#d1d1d1] font-mono p-3">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#333] pb-2 mb-3">
      <div><div className="flex items-center gap-2 text-white font-bold text-sm"><Database className="w-4 h-4 text-[#F27D26]"/>LIVE DATA CONNECTIVITY</div><div className="text-[9px] text-gray-500 mt-1">MACRO + LIVE WEATHER + 90D HISTORICAL WEATHER • SERVER-SIDE ADAPTERS</div></div>
      <div className="flex items-center gap-2"><select value={selectedPortId} onChange={e=>setSelectedPortId(e.target.value)} className="bg-[#111] border border-[#444] text-white px-2 py-1 text-xs">{ports.map(port=><option key={port.id} value={port.id}>{port.code} — {port.name}</option>)}</select><button onClick={refresh} disabled={loading} className="border border-[#444] px-2 py-1 text-[#F27D26] disabled:opacity-50"><RefreshCw className={`inline w-3 h-3 mr-1 ${loading?'animate-spin':''}`}/>REFRESH</button></div>
    </div>

    <div className="grid lg:grid-cols-4 gap-2 mb-3">
      <SourceCard title="WORLD BANK" status={macro ? 'CONNECTED' : 'WAITING'} detail="India macro indicators" />
      <SourceCard title="OPEN-METEO" status={weather ? 'CONNECTED' : 'WAITING'} detail="Live port weather" />
      <SourceCard title="HISTORICAL WEATHER" status={weatherHistory ? 'CONNECTED' : 'WAITING'} detail="90-day port conditions" />
      <SourceCard title="TERMINAL CORE" status="CONNECTED" detail="Synthetic SIH freight / vessel / port data" />
    </div>

    {error && <div className="border border-red-900 bg-red-950/20 text-red-400 p-2 mb-3 text-xs">EXTERNAL FEED ERROR: {error}</div>}

    <div className="grid lg:grid-cols-2 gap-3">
      <section className="border border-[#333] bg-[#080808] p-3">
        <div className="flex items-center gap-2 text-[#F27D26] font-bold text-xs mb-3"><ShieldCheck className="w-3.5 h-3.5"/>INDIA MACRO</div>
        <div className="grid gap-2">{macro?.indicators.map(indicator => <div key={indicator.code} className="border border-[#222] bg-[#101010] p-2"><div className="flex justify-between"><span className="text-gray-400">{indicator.label}</span><span className="text-[9px] text-gray-600">{indicator.code}</span></div><div className="flex gap-3 mt-2">{indicator.observations.slice(0,5).map(obs=><div key={obs.year}><div className="text-[9px] text-gray-600">{obs.year}</div><div className="text-white font-bold">{obs.value.toFixed(2)}</div></div>)}</div></div>)}</div>
        {macro && <div className="text-[9px] text-gray-600 mt-3">SOURCE: {macro.source} • UPDATED {new Date(macro.fetchedAt).toLocaleTimeString()}</div>}
      </section>

      <section className="border border-[#333] bg-[#080808] p-3">
        <div className="flex items-center gap-2 text-[#00FF41] font-bold text-xs mb-3"><CloudSun className="w-3.5 h-3.5"/>PORT WEATHER / {selectedPort?.code ?? '—'}</div>
        {weather ? <><div className="grid grid-cols-3 gap-2 mb-3"><Metric label="MAX WIND" value={`${weather.summary.maxWindKmh.toFixed(0)} km/h`} /><Metric label="MAX GUST" value={`${weather.summary.maxGustKmh.toFixed(0)} km/h`} /><Metric label="MAX HOURLY RAIN" value={`${weather.summary.maxHourlyPrecipMm.toFixed(1)} mm`} /></div><div className="border border-[#222] bg-[#101010] p-2 text-[10px]"><div className="text-gray-500 mb-2">ROUTING USE</div><div className="text-gray-300 leading-relaxed">Live weather is exposed as an operational risk signal. Historical weather is now available below for feature alignment; it is not yet injected into freight predictions until it is joined to observed freight-rate dates.</div></div><div className="text-[9px] text-gray-600 mt-3">SOURCE: {weather.source} • UPDATED {new Date(weather.fetchedAt).toLocaleTimeString()}</div></> : <div className="text-gray-600 text-xs py-8 text-center"><Wifi className="inline w-4 h-4 mr-2"/>WAITING FOR WEATHER FEED</div>}
      </section>
    </div>

    <section className="border border-[#333] bg-[#080808] p-3 mt-3">
      <div className="flex items-center justify-between mb-3"><div className="flex items-center gap-2 text-[#F27D26] font-bold text-xs"><History className="w-3.5 h-3.5"/>HISTORICAL PORT WEATHER / {selectedPort?.code ?? '—'}</div><span className="text-[9px] text-gray-600">90-DAY ARCHIVE</span></div>
      {weatherHistory ? <>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-3"><Metric label="AVG RAIN / DAY" value={`${weatherHistory.summary.avgPrecipitationMm.toFixed(1)} mm`} /><Metric label="AVG MAX WIND" value={`${weatherHistory.summary.avgMaxWindKmh.toFixed(1)} km/h`} /><Metric label="MAX WIND" value={`${weatherHistory.summary.maxWindKmh.toFixed(0)} km/h`} /><Metric label="MAX GUST" value={`${weatherHistory.summary.maxGustKmh.toFixed(0)} km/h`} /><Metric label="HIGH-WIND DAYS" value={`${weatherHistory.summary.highWindDays}`} /><Metric label="HEAVY-RAIN DAYS" value={`${weatherHistory.summary.heavyRainDays}`} /></div>
        <div className="border border-[#222] bg-[#101010] p-2"><div className="flex items-center gap-2 text-yellow-500 text-[10px] font-bold mb-2"><AlertTriangle className="w-3 h-3"/>MODEL READINESS</div><div className="text-[10px] text-gray-400 leading-relaxed">The terminal now has a real historical weather series for the selected East Coast port. The next training step is to join these daily observations with dated freight, vessel, congestion and commodity observations so weather becomes a validated ML feature instead of an unaligned live signal.</div></div>
        <div className="text-[9px] text-gray-600 mt-3">{weatherHistory.startDate} → {weatherHistory.endDate} • {weatherHistory.days} DAILY OBSERVATIONS • SOURCE: {weatherHistory.source}</div>
      </> : <div className="text-gray-600 text-xs py-8 text-center">WAITING FOR HISTORICAL WEATHER ARCHIVE</div>}
    </section>
  </div>;
};

const SourceCard: React.FC<{title:string;status:string;detail:string}> = ({title,status,detail}) => <div className="border border-[#333] bg-[#080808] p-2"><div className="flex items-center justify-between"><span className="text-white font-bold">{title}</span><span className={status==='CONNECTED'?'text-[#00FF41]':'text-yellow-500'}>[{status}]</span></div><div className="text-[9px] text-gray-500 mt-1">{detail}</div></div>;
const Metric: React.FC<{label:string;value:string}> = ({label,value}) => <div className="bg-[#111] border border-[#222] p-2"><div className="text-[9px] text-gray-500">{label}</div><div className="text-white font-bold mt-1">{value}</div></div>;

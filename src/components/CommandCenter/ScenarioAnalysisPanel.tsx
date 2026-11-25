import React, { useMemo, useState } from 'react';
import { AlertTriangle, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { FreightLane, Port, Vessel } from '../../types';
import { buildIntegratedDecision } from '../../utils/integratedDecisionEngine';

interface Props { lane: FreightLane; ports: Port[]; vessels: Vessel[]; quantityMt: number; }

type Scenario = { freightPct: number; congestionDelta: number; vesselSupplyPct: number };

export const ScenarioAnalysisPanel: React.FC<Props> = ({ lane, ports, vessels, quantityMt }) => {
  const [scenario, setScenario] = useState<Scenario>({ freightPct: 0, congestionDelta: 0, vesselSupplyPct: 0 });
  const baseline = useMemo(() => buildIntegratedDecision(lane, ports, vessels, quantityMt, 14), [lane, ports, vessels, quantityMt]);
  const scenarioResult = useMemo(() => {
    const scenarioLane: FreightLane = {
      ...lane,
      currentRateUsd: Math.max(0.01, lane.currentRateUsd * (1 + scenario.freightPct / 100)),
      congestionIndex: Math.max(0, Math.min(100, lane.congestionIndex + scenario.congestionDelta)),
      activeVessels: Math.max(0, Math.round(lane.activeVessels * (1 + scenario.vesselSupplyPct / 100)))
    };
    const result = buildIntegratedDecision(scenarioLane, ports, vessels, quantityMt, 14);
    return { result, rateDelta: result.forecast.currentRate - baseline.forecast.currentRate, scoreDelta: result.score - baseline.score };
  }, [lane, ports, vessels, quantityMt, scenario, baseline]);
  const reset = () => setScenario({ freightPct: 0, congestionDelta: 0, vesselSupplyPct: 0 });
  const actionChanged = baseline.action !== scenarioResult.result.action;

  return <section className="border border-[#333] bg-[#080808] p-3 mb-3">
    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
      <div><div className="flex items-center gap-2 text-[#F27D26] text-xs font-bold"><SlidersHorizontal className="w-3.5 h-3.5"/> SCENARIO ANALYSIS</div><div className="text-[9px] text-gray-500 mt-1">STRESS-TEST FREIGHT, PORT CONGESTION AND VESSEL SUPPLY BEFORE COMMITTING</div></div>
      <button onClick={reset} className="border border-[#333] hover:border-[#F27D26] px-2 py-1 text-[9px] text-gray-400"><RotateCcw className="inline w-3 h-3 mr-1"/>RESET</button>
    </div>
    <div className="grid md:grid-cols-3 gap-3">
      <ScenarioControl label="FREIGHT SHOCK" value={scenario.freightPct} min={-20} max={20} step={1} suffix="%" onChange={value => setScenario(s => ({ ...s, freightPct: value }))}/>
      <ScenarioControl label="PORT CONGESTION" value={scenario.congestionDelta} min={-30} max={30} step={1} suffix=" pts" onChange={value => setScenario(s => ({ ...s, congestionDelta: value }))}/>
      <ScenarioControl label="VESSEL SUPPLY" value={scenario.vesselSupplyPct} min={-50} max={50} step={5} suffix="%" onChange={value => setScenario(s => ({ ...s, vesselSupplyPct: value }))}/>
    </div>
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 mt-3">
      <Stat label="BASE ACTION" value={baseline.action}/><Stat label="SCENARIO ACTION" value={scenarioResult.result.action} highlight={actionChanged}/><Stat label="BASE SCORE" value={`${baseline.score.toFixed(0)}/100`}/><Stat label="SCENARIO SCORE" value={`${scenarioResult.result.score.toFixed(0)}/100`}/><Stat label="SCORE Δ" value={`${scenarioResult.scoreDelta >= 0 ? '+' : ''}${scenarioResult.scoreDelta.toFixed(0)}`}/>
    </div>
    <div className="grid md:grid-cols-3 gap-2 mt-2 text-[9px]">
      <div className="bg-[#111] border border-[#222] p-2"><span className="text-gray-500">FREIGHT IMPACT</span><div className="text-white font-bold mt-1">${scenarioResult.result.forecast.currentRate.toFixed(2)}/MT</div><div className="text-gray-500">Scenario input {scenario.freightPct >= 0 ? '+' : ''}{scenario.freightPct}%</div></div>
      <div className="bg-[#111] border border-[#222] p-2"><span className="text-gray-500">PORT RISK</span><div className="text-white font-bold mt-1">{scenarioResult.result.congestion.forecast14d.toFixed(0)}/100</div><div className="text-gray-500">Congestion input {scenario.congestionDelta >= 0 ? '+' : ''}{scenario.congestionDelta} pts</div></div>
      <div className="bg-[#111] border border-[#222] p-2"><span className="text-gray-500">PROCUREMENT</span><div className="text-white font-bold mt-1">{scenarioResult.result.procurement.action}</div><div className="text-gray-500">{scenarioResult.result.procurement.buyNowQuantityMt.toLocaleString()} MT buy now</div></div>
    </div>
    {actionChanged && <div className="mt-2 border border-[#F27D26] bg-[#120d08] p-2 text-[9px] text-gray-300"><AlertTriangle className="inline w-3 h-3 text-[#F27D26] mr-1"/><b>DECISION FLIP:</b> the scenario changes the recommended action from {baseline.action} to {scenarioResult.result.action}. This is a sensitivity test, not a forecast of what will happen.</div>}
    <div className="text-[8px] text-gray-600 mt-2">Scenario engine perturbs the repository prototype inputs and recomputes the deterministic decision stack. It does not imply real market liquidity, AIS availability or guaranteed savings.</div>
  </section>;
};

const ScenarioControl: React.FC<{ label: string; value: number; min: number; max: number; step: number; suffix: string; onChange: (value: number) => void }> = ({ label, value, min, max, step, suffix, onChange }) => <label className="border border-[#222] bg-[#111] p-2 block"><div className="flex justify-between text-[9px] text-gray-500"><span>{label}</span><span className="text-white font-bold">{value >= 0 ? '+' : ''}{value}{suffix}</span></div><input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} className="w-full mt-2 accent-[#F27D26]"/><div className="flex justify-between text-[8px] text-gray-700"><span>{min}{suffix}</span><span>{max}{suffix}</span></div></label>;
const Stat: React.FC<{ label: string; value: string; highlight?: boolean }> = ({ label, value, highlight }) => <div className={`border p-2 ${highlight ? 'border-[#F27D26] bg-[#120d08]' : 'border-[#222] bg-[#111]'}`}><div className="text-[8px] text-gray-500">{label}</div><div className="text-white font-bold text-[10px] mt-1">{value}</div></div>;

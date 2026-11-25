import React, { useMemo } from 'react';
import type { FreightLane, Port, Vessel } from '../../types';
import type { IntegratedDecision } from '../../utils/integratedDecisionEngine';
import { buildDecisionAudit } from '../../utils/decisionAuditEngine';

interface Props {
  lane: FreightLane;
  ports: Port[];
  vessels: Vessel[];
  quantityMt: number;
  laycanDays: number;
  decision: IntegratedDecision;
}

const severityClass = {
  INFO: 'text-gray-300 border-[#292929]',
  WARN: 'text-amber-300 border-[#5b421c]',
  BLOCK: 'text-red-300 border-red-900'
} as const;

export const DecisionAuditPanel: React.FC<Props> = ({ lane, ports, vessels, quantityMt, laycanDays, decision }) => {
  const audit = useMemo(
    () => buildDecisionAudit(lane, ports, vessels, quantityMt, laycanDays, decision),
    [lane, ports, vessels, quantityMt, laycanDays, decision]
  );
  return <section className="border border-[#333] bg-[#080808] p-3 mt-3" aria-label="Decision audit">
    <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
      <div>
        <div className="text-[#F27D26] text-xs font-bold">DECISION AUDIT & DATA QUALITY</div>
        <div className="text-[9px] text-gray-500 mt-1">Pre-review checks • no booking or trade execution</div>
      </div>
      <div className={`border px-2 py-1 text-[9px] font-bold ${audit.blockingCount ? 'border-red-900 text-red-300' : 'border-[#5b421c] text-amber-300'}`}>
        {audit.status} • {audit.warningCount} WARN / {audit.blockingCount} BLOCK
      </div>
    </div>
    <div className="grid md:grid-cols-2 gap-2">
      {audit.checks.map(check => <div key={check.id} className={`border bg-[#0b0b0b] p-2 ${severityClass[check.severity]}`}>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold">{check.label}</span>
          <span className="text-[8px] opacity-80">{check.severity}</span>
        </div>
        <div className="text-[9px] text-gray-400 mt-1 leading-relaxed">{check.detail}</div>
      </div>)}
    </div>
  </section>;
};

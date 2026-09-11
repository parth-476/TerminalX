import React from 'react';
import { FreightLane, Port, Vessel } from '../../types';
import { SIHCommandCenterCockpit } from './SIHCommandCenterCockpit';

interface SIHCommandCenterViewProps {
  freightLanes: FreightLane[];
  ports: Port[];
  vessels: Vessel[];
  onNavigateView: (view: 'FCST' | 'PORT' | 'VSL' | 'PROC' | 'CHART') => void;
}

export const SIHCommandCenterView: React.FC<SIHCommandCenterViewProps> = props => <SIHCommandCenterCockpit {...props} />;

// Signal and Threat Types for MDAD Platform

export type Domain = 'physical' | 'cyber' | 'humint';
export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type ThreatTimeline = 'imminent' | 'near-term' | 'medium-term';
export type AttackVector = 'cyber-attack' | 'physical-assault' | 'reconnaissance' | 'supply-disruption' | 'infiltration' | 'sabotage';
export type TargetType = 'military-base' | 'infrastructure' | 'civilian-area' | 'communications' | 'supply-line' | 'command-center';

export interface Signal {
  id: string;
  timestamp: Date;
  latitude: number;
  longitude: number;
  domain: Domain;
  confidence: number; // 0-1
  severity: Severity;
  description: string;
  sourceType: string;
  processed: boolean;
}

export interface PredictedIntent {
  vector: AttackVector;
  target: TargetType;
  probability: number;
  timeline: ThreatTimeline;
}

export interface ThreatCluster {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  centerLat: number;
  centerLon: number;
  confidenceScore: number; // 0-100
  signalCount: number;
  domainMix: Record<Domain, number>;
  signals: Signal[];
  predictedIntents: PredictedIntent[];
  status: 'active' | 'monitoring' | 'resolved';
  radiusKm: number;
  crossDomainBonus: boolean;
}

export interface AlertConfig {
  minConfidenceThreshold: number;
  spatialRadiusKm: number;
  temporalWindowHours: number;
  enableAutoRefresh: boolean;
  refreshIntervalSeconds: number;
}

export interface DashboardMetrics {
  totalActiveThreats: number;
  highestConfidenceThreat: number;
  signalsLast24h: number;
  crossDomainCorrelations: number;
  threatsByDomain: Record<Domain, number>;
  confidenceDistribution: { range: string; count: number }[];
  threatTimeline: { date: string; level: number }[];
}

export const DOMAIN_COLORS: Record<Domain, string> = {
  physical: '#3b82f6',
  cyber: '#ef4444',
  humint: '#22c55e',
};

export const SEVERITY_CONFIG: Record<Severity, { color: string; label: string }> = {
  low: { color: '#22c55e', label: 'LOW' },
  medium: { color: '#eab308', label: 'MEDIUM' },
  high: { color: '#f97316', label: 'HIGH' },
  critical: { color: '#ef4444', label: 'CRITICAL' },
};

export const ATTACK_VECTOR_LABELS: Record<AttackVector, string> = {
  'cyber-attack': 'Cyber Attack',
  'physical-assault': 'Physical Assault',
  'reconnaissance': 'Reconnaissance',
  'supply-disruption': 'Supply Disruption',
  'infiltration': 'Infiltration',
  'sabotage': 'Sabotage',
};

export const TARGET_LABELS: Record<TargetType, string> = {
  'military-base': 'Military Base',
  'infrastructure': 'Critical Infrastructure',
  'civilian-area': 'Civilian Area',
  'communications': 'Communications Hub',
  'supply-line': 'Supply Line',
  'command-center': 'Command Center',
};

export const TIMELINE_CONFIG: Record<ThreatTimeline, { label: string; hours: string }> = {
  'imminent': { label: 'IMMINENT', hours: '<24h' },
  'near-term': { label: 'NEAR-TERM', hours: '24-72h' },
  'medium-term': { label: 'MEDIUM-TERM', hours: '>72h' },
};

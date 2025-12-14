import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Signal, ThreatCluster, AlertConfig, DashboardMetrics, Domain } from '@/types/mdad';
import { generateClusteredSignals, generateSignal } from '@/lib/signalGenerator';
import { clusterSignals, DEFAULT_CONFIG } from '@/lib/bayesianFusion';

interface MDADContextType {
  signals: Signal[];
  threats: ThreatCluster[];
  metrics: DashboardMetrics;
  config: AlertConfig;
  isLiveMode: boolean;
  selectedThreat: ThreatCluster | null;
  setSelectedThreat: (threat: ThreatCluster | null) => void;
  updateConfig: (config: Partial<AlertConfig>) => void;
  addSignal: (signal: Signal) => void;
  toggleLiveMode: () => void;
  recalculateThreats: () => void;
  exportReport: () => void;
}

const MDADContext = createContext<MDADContextType | undefined>(undefined);

export function MDADProvider({ children }: { children: ReactNode }) {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [threats, setThreats] = useState<ThreatCluster[]>([]);
  const [config, setConfig] = useState<AlertConfig>(DEFAULT_CONFIG);
  const [isLiveMode, setIsLiveMode] = useState(true);
  const [selectedThreat, setSelectedThreat] = useState<ThreatCluster | null>(null);

  // Calculate metrics from current data
  const calculateMetrics = useCallback((): DashboardMetrics => {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const signalsLast24h = signals.filter(s => s.timestamp >= last24h).length;
    const crossDomainCount = threats.filter(t => t.crossDomainBonus).length;
    
    const threatsByDomain: Record<Domain, number> = { physical: 0, cyber: 0, humint: 0 };
    signals.forEach(s => threatsByDomain[s.domain]++);
    
    // Confidence distribution
    const confidenceRanges = [
      { range: '0-20%', count: 0 },
      { range: '21-40%', count: 0 },
      { range: '41-60%', count: 0 },
      { range: '61-80%', count: 0 },
      { range: '81-100%', count: 0 },
    ];
    
    threats.forEach(t => {
      if (t.confidenceScore <= 20) confidenceRanges[0].count++;
      else if (t.confidenceScore <= 40) confidenceRanges[1].count++;
      else if (t.confidenceScore <= 60) confidenceRanges[2].count++;
      else if (t.confidenceScore <= 80) confidenceRanges[3].count++;
      else confidenceRanges[4].count++;
    });
    
    // Threat timeline (last 7 days)
    const threatTimeline: { date: string; level: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const daySignals = signals.filter(s => {
        const signalDate = new Date(s.timestamp);
        return signalDate.toDateString() === date.toDateString();
      });
      
      const avgConfidence = daySignals.length > 0
        ? daySignals.reduce((sum, s) => sum + s.confidence, 0) / daySignals.length * 100
        : 0;
      
      threatTimeline.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        level: Math.round(avgConfidence),
      });
    }
    
    return {
      totalActiveThreats: threats.filter(t => t.status === 'active').length,
      highestConfidenceThreat: threats.length > 0 ? Math.max(...threats.map(t => t.confidenceScore)) : 0,
      signalsLast24h,
      crossDomainCorrelations: crossDomainCount,
      threatsByDomain,
      confidenceDistribution: confidenceRanges,
      threatTimeline,
    };
  }, [signals, threats]);

  const [metrics, setMetrics] = useState<DashboardMetrics>(calculateMetrics());

  // Initialize with historical data
  useEffect(() => {
    const initialSignals = generateClusteredSignals();
    setSignals(initialSignals);
    const initialThreats = clusterSignals(initialSignals, config);
    setThreats(initialThreats);
  }, []);

  // Update metrics when signals/threats change
  useEffect(() => {
    setMetrics(calculateMetrics());
  }, [signals, threats, calculateMetrics]);

  // Live mode signal generation
  useEffect(() => {
    if (!isLiveMode || !config.enableAutoRefresh) return;
    
    const interval = setInterval(() => {
      const newSignal = generateSignal(undefined, Math.random() * 2); // Recent signals
      setSignals(prev => [newSignal, ...prev].slice(0, 200)); // Keep max 200 signals
    }, config.refreshIntervalSeconds * 1000);
    
    return () => clearInterval(interval);
  }, [isLiveMode, config.enableAutoRefresh, config.refreshIntervalSeconds]);

  // Recalculate threats when signals change (debounced)
  useEffect(() => {
    const timeout = setTimeout(() => {
      const newThreats = clusterSignals(signals, config);
      setThreats(newThreats);
    }, 500);
    
    return () => clearTimeout(timeout);
  }, [signals, config]);

  const updateConfig = useCallback((updates: Partial<AlertConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  const addSignal = useCallback((signal: Signal) => {
    setSignals(prev => [signal, ...prev]);
  }, []);

  const toggleLiveMode = useCallback(() => {
    setIsLiveMode(prev => !prev);
  }, []);

  const recalculateThreats = useCallback(() => {
    const newThreats = clusterSignals(signals, config);
    setThreats(newThreats);
  }, [signals, config]);

  const exportReport = useCallback(() => {
    const report = {
      exportedAt: new Date().toISOString(),
      metrics,
      threats: threats.map(t => ({
        id: t.id,
        confidence: t.confidenceScore,
        location: { lat: t.centerLat, lon: t.centerLon },
        signalCount: t.signalCount,
        domainMix: t.domainMix,
        predictedIntents: t.predictedIntents,
        status: t.status,
      })),
      signals: signals.slice(0, 50).map(s => ({
        id: s.id,
        timestamp: s.timestamp.toISOString(),
        domain: s.domain,
        confidence: s.confidence,
        severity: s.severity,
        description: s.description,
      })),
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mdad-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [metrics, threats, signals]);

  return (
    <MDADContext.Provider value={{
      signals,
      threats,
      metrics,
      config,
      isLiveMode,
      selectedThreat,
      setSelectedThreat,
      updateConfig,
      addSignal,
      toggleLiveMode,
      recalculateThreats,
      exportReport,
    }}>
      {children}
    </MDADContext.Provider>
  );
}

export function useMDAD() {
  const context = useContext(MDADContext);
  if (context === undefined) {
    throw new Error('useMDAD must be used within a MDADProvider');
  }
  return context;
}

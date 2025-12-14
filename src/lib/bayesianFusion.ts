import { 
  Signal, 
  ThreatCluster, 
  Domain, 
  PredictedIntent, 
  AttackVector, 
  TargetType, 
  ThreatTimeline,
  AlertConfig 
} from '@/types/mdad';

const DEFAULT_CONFIG: AlertConfig = {
  minConfidenceThreshold: 40,
  spatialRadiusKm: 50,
  temporalWindowHours: 72,
  enableAutoRefresh: true,
  refreshIntervalSeconds: 30,
};

// Haversine formula for distance calculation
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Check if two signals are within temporal window
function isWithinTemporalWindow(signal1: Signal, signal2: Signal, windowHours: number): boolean {
  const timeDiff = Math.abs(signal1.timestamp.getTime() - signal2.timestamp.getTime());
  return timeDiff <= windowHours * 60 * 60 * 1000;
}

// Calculate cluster center
function calculateClusterCenter(signals: Signal[]): { lat: number; lon: number } {
  const sumLat = signals.reduce((sum, s) => sum + s.latitude, 0);
  const sumLon = signals.reduce((sum, s) => sum + s.longitude, 0);
  return {
    lat: sumLat / signals.length,
    lon: sumLon / signals.length,
  };
}

// Bayesian fusion of signal confidences
function calculateBayesianConfidence(signals: Signal[], crossDomainBonus: boolean): number {
  if (signals.length === 0) return 0;
  
  // Prior probability of threat
  const priorThreat = 0.1;
  
  // Calculate likelihood based on signals
  let combinedLikelihood = 1;
  
  signals.forEach(signal => {
    // P(Signal | Threat) - higher confidence signals are more indicative
    const signalLikelihood = signal.confidence * 0.9 + 0.1;
    combinedLikelihood *= signalLikelihood;
  });
  
  // Severity weighting
  const severityWeights = { low: 0.6, medium: 0.8, high: 0.95, critical: 1.0 };
  const avgSeverityWeight = signals.reduce((sum, s) => sum + severityWeights[s.severity], 0) / signals.length;
  
  // Signal count bonus (more signals = more confidence)
  const countBonus = Math.min(signals.length / 5, 1) * 0.15;
  
  // Cross-domain correlation bonus (key innovation)
  const domainBonus = crossDomainBonus ? 0.20 : 0;
  
  // Bayes' theorem approximation
  const evidence = combinedLikelihood * priorThreat + (1 - combinedLikelihood) * (1 - priorThreat);
  let posterior = (combinedLikelihood * priorThreat) / evidence;
  
  // Apply bonuses and weights
  posterior = posterior * avgSeverityWeight + countBonus + domainBonus;
  
  // Normalize to 0-100 scale
  return Math.min(Math.round(posterior * 100), 99);
}

// Count unique domains in signal set
function countDomains(signals: Signal[]): Record<Domain, number> {
  const counts: Record<Domain, number> = { physical: 0, cyber: 0, humint: 0 };
  signals.forEach(s => counts[s.domain]++);
  return counts;
}

// Determine if cluster has cross-domain signals
function hasCrossDomainSignals(signals: Signal[]): boolean {
  const domains = new Set(signals.map(s => s.domain));
  return domains.size >= 2;
}

// Predict adversary intent based on signal patterns
function predictIntent(signals: Signal[]): PredictedIntent[] {
  const intents: PredictedIntent[] = [];
  const domainMix = countDomains(signals);
  
  // Analyze patterns to predict attack vectors
  const hasCyber = domainMix.cyber > 0;
  const hasPhysical = domainMix.physical > 0;
  const hasHumint = domainMix.humint > 0;
  
  // Cyber-heavy patterns suggest cyber attack
  if (hasCyber && domainMix.cyber >= domainMix.physical) {
    intents.push({
      vector: 'cyber-attack',
      target: 'communications',
      probability: 0.3 + (domainMix.cyber / signals.length) * 0.4,
      timeline: signals.some(s => s.severity === 'critical') ? 'imminent' : 'near-term',
    });
  }
  
  // Physical-heavy patterns suggest physical assault or reconnaissance
  if (hasPhysical) {
    const isRecon = signals.some(s => 
      s.description.toLowerCase().includes('reconnaissance') ||
      s.description.toLowerCase().includes('surveillance') ||
      s.description.toLowerCase().includes('photographing')
    );
    
    intents.push({
      vector: isRecon ? 'reconnaissance' : 'physical-assault',
      target: 'military-base',
      probability: 0.25 + (domainMix.physical / signals.length) * 0.35,
      timeline: isRecon ? 'medium-term' : 'near-term',
    });
  }
  
  // HUMINT intelligence suggests infiltration or sabotage
  if (hasHumint && domainMix.humint >= 2) {
    intents.push({
      vector: 'infiltration',
      target: 'command-center',
      probability: 0.2 + (domainMix.humint / signals.length) * 0.3,
      timeline: 'near-term',
    });
  }
  
  // Mixed signals suggest coordinated supply disruption
  if (hasCyber && hasPhysical) {
    intents.push({
      vector: 'supply-disruption',
      target: 'supply-line',
      probability: 0.15 + Math.min(domainMix.cyber, domainMix.physical) * 0.1,
      timeline: 'near-term',
    });
  }
  
  // Sort by probability and return top 3
  return intents
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 3)
    .map(intent => ({
      ...intent,
      probability: Math.round(intent.probability * 100) / 100,
    }));
}

// Calculate cluster radius based on signal distribution
function calculateClusterRadius(signals: Signal[], center: { lat: number; lon: number }): number {
  if (signals.length <= 1) return 25; // Default radius
  
  const distances = signals.map(s => 
    calculateDistance(center.lat, center.lon, s.latitude, s.longitude)
  );
  
  // Use 90th percentile distance as radius
  distances.sort((a, b) => a - b);
  const idx = Math.floor(distances.length * 0.9);
  return Math.max(distances[idx] * 1.2, 15); // Min 15km radius
}

// Main clustering algorithm using DBSCAN-like approach
export function clusterSignals(
  signals: Signal[], 
  config: AlertConfig = DEFAULT_CONFIG
): ThreatCluster[] {
  const clusters: ThreatCluster[] = [];
  const processedIds = new Set<string>();
  
  signals.forEach(signal => {
    if (processedIds.has(signal.id)) return;
    
    // Find all signals within spatial and temporal proximity
    const neighborSignals = signals.filter(s => {
      if (processedIds.has(s.id)) return false;
      
      const distance = calculateDistance(
        signal.latitude, signal.longitude,
        s.latitude, s.longitude
      );
      
      const withinSpace = distance <= config.spatialRadiusKm;
      const withinTime = isWithinTemporalWindow(signal, s, config.temporalWindowHours);
      
      return withinSpace && withinTime;
    });
    
    // Only create cluster if we have enough signals
    if (neighborSignals.length >= 2) {
      // Mark all signals as processed
      neighborSignals.forEach(s => processedIds.add(s.id));
      
      const center = calculateClusterCenter(neighborSignals);
      const crossDomain = hasCrossDomainSignals(neighborSignals);
      const confidence = calculateBayesianConfidence(neighborSignals, crossDomain);
      
      const cluster: ThreatCluster = {
        id: `THR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        centerLat: center.lat,
        centerLon: center.lon,
        confidenceScore: confidence,
        signalCount: neighborSignals.length,
        domainMix: countDomains(neighborSignals),
        signals: neighborSignals,
        predictedIntents: predictIntent(neighborSignals),
        status: confidence >= 70 ? 'active' : 'monitoring',
        radiusKm: calculateClusterRadius(neighborSignals, center),
        crossDomainBonus: crossDomain,
      };
      
      clusters.push(cluster);
    }
  });
  
  // Sort by confidence score (highest first)
  return clusters.sort((a, b) => b.confidenceScore - a.confidenceScore);
}

// Get recommended action based on threat level
export function getRecommendedAction(confidence: number): {
  action: string;
  priority: string;
  color: string;
} {
  if (confidence < 40) {
    return {
      action: 'Monitor Only - Continue passive surveillance',
      priority: 'LOW',
      color: 'text-threat-low',
    };
  } else if (confidence < 70) {
    return {
      action: 'Prepare Assets - Increase surveillance, brief response units',
      priority: 'MEDIUM',
      color: 'text-threat-medium',
    };
  } else if (confidence < 90) {
    return {
      action: 'Deploy Reconnaissance - Alert units, position assets',
      priority: 'HIGH',
      color: 'text-threat-high',
    };
  } else {
    return {
      action: 'Immediate Response - Activate protocols, engage command',
      priority: 'CRITICAL',
      color: 'text-threat-critical',
    };
  }
}

// Export configuration
export { DEFAULT_CONFIG };

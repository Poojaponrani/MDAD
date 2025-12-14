import React from 'react';
import { useMDAD } from '@/context/MDADContext';
import { ThreatCluster, DOMAIN_COLORS, ATTACK_VECTOR_LABELS, TARGET_LABELS, TIMELINE_CONFIG } from '@/types/mdad';
import { getRecommendedAction } from '@/lib/bayesianFusion';
import { 
  X, 
  MapPin, 
  Clock, 
  Target, 
  AlertTriangle,
  Activity,
  Layers,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

function getThreatLevelColor(confidence: number): string {
  if (confidence <= 40) return 'threat-low';
  if (confidence <= 70) return 'threat-medium';
  if (confidence <= 85) return 'threat-high';
  return 'threat-critical';
}

function ThreatCard({ threat, isSelected, onClick }: { 
  threat: ThreatCluster; 
  isSelected: boolean;
  onClick: () => void;
}) {
  const levelColor = getThreatLevelColor(threat.confidenceScore);
  const recommendation = getRecommendedAction(threat.confidenceScore);
  
  return (
    <button
      onClick={onClick}
      className={`w-full text-left tactical-panel p-3 transition-all hover:border-primary/50 ${
        isSelected ? 'border-primary glow-border' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-mono text-muted-foreground">{threat.id}</span>
        <span className={`px-2 py-0.5 text-xs font-bold rounded bg-${levelColor}/20 text-${levelColor} border border-${levelColor}/50`}>
          {threat.confidenceScore}%
        </span>
      </div>
      
      <div className="flex items-center gap-2 mb-2">
        <MapPin className="w-3 h-3 text-muted-foreground" />
        <span className="text-xs">
          {threat.centerLat.toFixed(2)}°N, {threat.centerLon.toFixed(2)}°E
        </span>
      </div>
      
      <div className="flex gap-1 mb-2">
        {threat.domainMix.physical > 0 && (
          <span className="px-1.5 py-0.5 text-[10px] rounded" style={{ background: `${DOMAIN_COLORS.physical}22`, color: DOMAIN_COLORS.physical }}>
            PHY:{threat.domainMix.physical}
          </span>
        )}
        {threat.domainMix.cyber > 0 && (
          <span className="px-1.5 py-0.5 text-[10px] rounded" style={{ background: `${DOMAIN_COLORS.cyber}22`, color: DOMAIN_COLORS.cyber }}>
            CYB:{threat.domainMix.cyber}
          </span>
        )}
        {threat.domainMix.humint > 0 && (
          <span className="px-1.5 py-0.5 text-[10px] rounded" style={{ background: `${DOMAIN_COLORS.humint}22`, color: DOMAIN_COLORS.humint }}>
            HUM:{threat.domainMix.humint}
          </span>
        )}
        {threat.crossDomainBonus && (
          <span className="px-1.5 py-0.5 text-[10px] rounded bg-primary/20 text-primary">
            +FUSED
          </span>
        )}
      </div>
      
      <div className={`text-[10px] ${recommendation.color} font-medium`}>
        {recommendation.priority}: {recommendation.action.split(' - ')[0]}
      </div>
    </button>
  );
}

function ThreatDetails({ threat }: { threat: ThreatCluster }) {
  const recommendation = getRecommendedAction(threat.confidenceScore);
  const levelColor = getThreatLevelColor(threat.confidenceScore);
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className={`w-5 h-5 text-${levelColor}`} />
          <span className={`px-3 py-1 text-sm font-bold rounded bg-${levelColor}/20 text-${levelColor} border border-${levelColor}/50`}>
            {threat.confidenceScore}% CONFIDENCE
          </span>
          {threat.crossDomainBonus && (
            <span className="px-2 py-1 text-xs rounded bg-primary/20 text-primary border border-primary/50">
              CROSS-DOMAIN FUSION
            </span>
          )}
        </div>
        <p className="text-xs font-mono text-muted-foreground">{threat.id}</p>
      </div>
      
      {/* Location & Time */}
      <div className="grid grid-cols-2 gap-3">
        <div className="tactical-panel p-3">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium">LOCATION</span>
          </div>
          <p className="text-sm font-mono">{threat.centerLat.toFixed(4)}°N</p>
          <p className="text-sm font-mono">{threat.centerLon.toFixed(4)}°E</p>
          <p className="text-xs text-muted-foreground mt-1">Radius: {threat.radiusKm.toFixed(1)} km</p>
        </div>
        
        <div className="tactical-panel p-3">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium">DETECTED</span>
          </div>
          <p className="text-sm font-mono">{threat.createdAt.toLocaleDateString()}</p>
          <p className="text-sm font-mono">{threat.createdAt.toLocaleTimeString()}</p>
          <p className="text-xs text-muted-foreground mt-1">Status: {threat.status.toUpperCase()}</p>
        </div>
      </div>
      
      {/* Signal Breakdown */}
      <div className="tactical-panel p-3">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="w-4 h-4 text-primary" />
          <span className="text-xs font-medium">SIGNAL BREAKDOWN</span>
          <span className="text-xs text-muted-foreground ml-auto">{threat.signalCount} total</span>
        </div>
        
        <div className="space-y-2">
          {Object.entries(threat.domainMix).map(([domain, count]) => {
            if (count === 0) return null;
            const percentage = Math.round((count / threat.signalCount) * 100);
            return (
              <div key={domain}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="capitalize">{domain}</span>
                  <span className="font-mono">{count} ({percentage}%)</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all"
                    style={{ 
                      width: `${percentage}%`,
                      background: DOMAIN_COLORS[domain as keyof typeof DOMAIN_COLORS]
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Predicted Intent */}
      {threat.predictedIntents.length > 0 && (
        <div className="tactical-panel p-3">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium">PREDICTED INTENT</span>
          </div>
          
          <div className="space-y-2">
            {threat.predictedIntents.map((intent, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded bg-secondary/50">
                <div>
                  <p className="text-sm font-medium">{ATTACK_VECTOR_LABELS[intent.vector]}</p>
                  <p className="text-xs text-muted-foreground">Target: {TARGET_LABELS[intent.target]}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-mono font-bold text-primary">{Math.round(intent.probability * 100)}%</p>
                  <p className={`text-[10px] font-mono ${
                    intent.timeline === 'imminent' ? 'text-threat-critical' :
                    intent.timeline === 'near-term' ? 'text-threat-high' :
                    'text-threat-medium'
                  }`}>
                    {TIMELINE_CONFIG[intent.timeline].hours}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Recommendation */}
      <div className={`tactical-panel p-3 border-l-4 border-l-${levelColor}`}>
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-4 h-4" />
          <span className={`text-xs font-bold ${recommendation.color}`}>{recommendation.priority} PRIORITY</span>
        </div>
        <p className="text-sm">{recommendation.action}</p>
      </div>
      
      {/* Contributing Signals */}
      <div className="tactical-panel p-3">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-medium">CONTRIBUTING SIGNALS</span>
        </div>
        <div className="space-y-2 max-h-[200px] overflow-auto scrollbar-tactical">
          {threat.signals.slice(0, 10).map(signal => (
            <div key={signal.id} className="flex items-start gap-2 p-2 rounded bg-secondary/30 text-xs">
              <div 
                className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                style={{ background: DOMAIN_COLORS[signal.domain] }}
              />
              <div className="flex-1 min-w-0">
                <p className="truncate">{signal.description}</p>
                <p className="text-muted-foreground">
                  {signal.sourceType} • {Math.round(signal.confidence * 100)}% • {signal.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          {threat.signals.length > 10 && (
            <p className="text-xs text-muted-foreground text-center py-2">
              +{threat.signals.length - 10} more signals
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function ThreatPanel() {
  const { threats, selectedThreat, setSelectedThreat } = useMDAD();
  
  const highPriorityThreats = threats.filter(t => t.confidenceScore >= 70);
  const monitoringThreats = threats.filter(t => t.confidenceScore < 70);
  
  return (
    <div className="h-full flex flex-col bg-card border-l border-border">
      {/* Panel Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold">THREAT CLUSTERS</h2>
          <span className="text-xs font-mono text-muted-foreground">{threats.length} ACTIVE</span>
        </div>
      </div>
      
      {selectedThreat ? (
        /* Threat Details View */
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="p-2 border-b border-border flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedThreat(null)}
              className="gap-1"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              Back
            </Button>
            <span className="text-xs text-muted-foreground">Threat Details</span>
          </div>
          <ScrollArea className="flex-1 p-4">
            <ThreatDetails threat={selectedThreat} />
          </ScrollArea>
        </div>
      ) : (
        /* Threat List View */
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-4">
            {/* High Priority Section */}
            {highPriorityThreats.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="status-dot critical" />
                  <span className="text-xs font-medium text-threat-high">HIGH PRIORITY</span>
                  <span className="text-xs text-muted-foreground">({highPriorityThreats.length})</span>
                </div>
                <div className="space-y-2">
                  {highPriorityThreats.map(threat => (
                    <ThreatCard
                      key={threat.id}
                      threat={threat}
                      isSelected={selectedThreat?.id === threat.id}
                      onClick={() => setSelectedThreat(threat)}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* Monitoring Section */}
            {monitoringThreats.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="status-dot active" />
                  <span className="text-xs font-medium">MONITORING</span>
                  <span className="text-xs text-muted-foreground">({monitoringThreats.length})</span>
                </div>
                <div className="space-y-2">
                  {monitoringThreats.map(threat => (
                    <ThreatCard
                      key={threat.id}
                      threat={threat}
                      isSelected={selectedThreat?.id === threat.id}
                      onClick={() => setSelectedThreat(threat)}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {threats.length === 0 && (
              <div className="text-center py-8">
                <AlertTriangle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No threat clusters detected</p>
                <p className="text-xs text-muted-foreground">Signals are being analyzed...</p>
              </div>
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

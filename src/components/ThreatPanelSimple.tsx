import React from 'react';
import { useMDAD } from '@/context/MDADContext';
import { ThreatCluster, DOMAIN_COLORS } from '@/types/mdad';
import { getRecommendedAction } from '@/lib/bayesianFusion';
import { 
  MapPin, 
  Clock, 
  Target, 
  AlertTriangle,
  Activity,
  Layers
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

function getThreatLevelColor(confidence: number): string {
  if (confidence <= 40) return 'text-threat-low';
  if (confidence <= 70) return 'text-threat-medium';
  if (confidence <= 85) return 'text-threat-high';
  return 'text-threat-critical';
}

function getThreatBgColor(confidence: number): string {
  if (confidence <= 40) return 'bg-threat-low/20 border-threat-low/50';
  if (confidence <= 70) return 'bg-threat-medium/20 border-threat-medium/50';
  if (confidence <= 85) return 'bg-threat-high/20 border-threat-high/50';
  return 'bg-threat-critical/20 border-threat-critical/50';
}

function ThreatCard({ threat, isSelected, onClick }: { 
  threat: ThreatCluster; 
  isSelected: boolean;
  onClick: () => void;
}) {
  const levelColor = getThreatLevelColor(threat.confidenceScore);
  const bgColor = getThreatBgColor(threat.confidenceScore);
  const recommendation = getRecommendedAction(threat.confidenceScore);
  
  return (
    <div
      onClick={onClick}
      className={`w-full text-left tactical-panel p-3 transition-all hover:border-primary/50 cursor-pointer ${
        isSelected ? 'border-primary glow-border' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-mono text-muted-foreground">{threat.id}</span>
        <span className={`px-2 py-0.5 text-xs font-bold rounded border ${bgColor} ${levelColor}`}>
          {threat.confidenceScore}%
        </span>
      </div>
      
      <div className="flex items-center gap-2 mb-2">
        <MapPin className="w-3 h-3 text-muted-foreground" />
        <span className="text-xs">
          {threat.centerLat.toFixed(2)}°N, {threat.centerLon.toFixed(2)}°E
        </span>
      </div>
      
      <div className="flex gap-1 mb-2 flex-wrap">
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
    </div>
  );
}

function ThreatDetails({ threat }: { threat: ThreatCluster }) {
  const recommendation = getRecommendedAction(threat.confidenceScore);
  const levelColor = getThreatLevelColor(threat.confidenceScore);
  const bgColor = getThreatBgColor(threat.confidenceScore);
  
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className={`w-5 h-5 ${levelColor}`} />
          <span className={`px-3 py-1 text-sm font-bold rounded border ${bgColor} ${levelColor}`}>
            {threat.confidenceScore}% CONFIDENCE
          </span>
          {threat.crossDomainBonus && (
            <span className="px-2 py-1 text-xs rounded bg-primary/20 text-primary border border-primary/50">
              CROSS-DOMAIN
            </span>
          )}
        </div>
        <p className="text-xs font-mono text-muted-foreground">{threat.id}</p>
      </div>
      
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
        </div>
      </div>
      
      <div className="tactical-panel p-3">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="w-4 h-4 text-primary" />
          <span className="text-xs font-medium">SIGNALS ({threat.signalCount})</span>
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
                    className="h-full rounded-full"
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
                  <p className="text-sm font-medium capitalize">{intent.vector.replace('-', ' ')}</p>
                  <p className="text-xs text-muted-foreground capitalize">{intent.target.replace('-', ' ')}</p>
                </div>
                <p className="text-lg font-mono font-bold text-primary">{Math.round(intent.probability * 100)}%</p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className={`tactical-panel p-3 border-l-4 ${
        threat.confidenceScore > 70 ? 'border-l-threat-critical' : 
        threat.confidenceScore > 40 ? 'border-l-threat-medium' : 'border-l-threat-low'
      }`}>
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-4 h-4" />
          <span className={`text-xs font-bold ${recommendation.color}`}>{recommendation.priority}</span>
        </div>
        <p className="text-sm">{recommendation.action}</p>
      </div>
    </div>
  );
}

export function ThreatPanelSimple() {
  const { threats, selectedThreat, setSelectedThreat } = useMDAD();
  
  const highPriorityThreats = threats.filter(t => t.confidenceScore >= 70);
  const monitoringThreats = threats.filter(t => t.confidenceScore < 70);
  
  return (
    <div className="h-full flex flex-col bg-card border-l border-border">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold">THREAT CLUSTERS</h2>
          <span className="text-xs font-mono text-muted-foreground">{threats.length} ACTIVE</span>
        </div>
      </div>
      
      {selectedThreat ? (
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="p-2 border-b border-border">
            <button
              onClick={() => setSelectedThreat(null)}
              className="text-xs text-primary hover:underline"
            >
              ← Back to list
            </button>
          </div>
          <ScrollArea className="flex-1 p-4">
            <ThreatDetails threat={selectedThreat} />
          </ScrollArea>
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-4">
            {highPriorityThreats.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-threat-critical animate-pulse" />
                  <span className="text-xs font-medium text-threat-high">HIGH PRIORITY ({highPriorityThreats.length})</span>
                </div>
                <div className="space-y-2">
                  {highPriorityThreats.map(threat => (
                    <ThreatCard
                      key={threat.id}
                      threat={threat}
                      isSelected={false}
                      onClick={() => setSelectedThreat(threat)}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {monitoringThreats.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-threat-low" />
                  <span className="text-xs font-medium">MONITORING ({monitoringThreats.length})</span>
                </div>
                <div className="space-y-2">
                  {monitoringThreats.map(threat => (
                    <ThreatCard
                      key={threat.id}
                      threat={threat}
                      isSelected={false}
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
              </div>
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

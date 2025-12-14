import React from 'react';
import { useMDAD } from '@/context/MDADContext';
import { ThreatCluster, SEVERITY_CONFIG, DOMAIN_COLORS } from '@/types/mdad';
import { getRecommendedAction } from '@/lib/bayesianFusion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, Bell, X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

function getThreatLevelColor(confidence: number): string {
  if (confidence <= 40) return 'threat-low';
  if (confidence <= 70) return 'threat-medium';
  if (confidence <= 85) return 'threat-high';
  return 'threat-critical';
}

function AlertItem({ threat, onView, onDismiss }: { 
  threat: ThreatCluster; 
  onView: () => void;
  onDismiss: () => void;
}) {
  const levelColor = getThreatLevelColor(threat.confidenceScore);
  const recommendation = getRecommendedAction(threat.confidenceScore);
  const timeSince = Math.round((Date.now() - threat.createdAt.getTime()) / (1000 * 60));
  const timeLabel = timeSince < 60 
    ? `${timeSince}m ago` 
    : `${Math.round(timeSince / 60)}h ago`;
  
  return (
    <div className={`tactical-panel p-3 border-l-4 border-l-${levelColor} animate-fade-in-up`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className={`w-4 h-4 text-${levelColor}`} />
          <span className={`px-2 py-0.5 text-xs font-bold rounded bg-${levelColor}/20 text-${levelColor}`}>
            {threat.confidenceScore}%
          </span>
          {threat.crossDomainBonus && (
            <span className="px-1.5 py-0.5 text-[10px] rounded bg-primary/20 text-primary">
              X-DOMAIN
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          {timeLabel}
        </div>
      </div>
      
      <p className="text-sm mb-2">
        {threat.signalCount} signals detected in {threat.radiusKm.toFixed(0)}km radius
      </p>
      
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
      </div>
      
      {threat.predictedIntents[0] && (
        <p className="text-xs text-muted-foreground mb-2">
          <span className="font-medium">Predicted:</span> {threat.predictedIntents[0].vector.replace('-', ' ')} ({Math.round(threat.predictedIntents[0].probability * 100)}%)
        </p>
      )}
      
      <div className={`text-xs ${recommendation.color} font-medium mb-3`}>
        → {recommendation.action}
      </div>
      
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" onClick={onView} className="flex-1 text-xs">
          View Details
        </Button>
        <Button size="sm" variant="ghost" onClick={onDismiss} className="text-xs">
          Dismiss
        </Button>
      </div>
    </div>
  );
}

export function AlertFeed() {
  const { threats, config, setSelectedThreat } = useMDAD();
  const [dismissed, setDismissed] = React.useState<Set<string>>(new Set());
  
  // Filter alerts based on threshold and dismissed state
  const activeAlerts = threats
    .filter(t => t.confidenceScore >= config.minConfidenceThreshold)
    .filter(t => !dismissed.has(t.id))
    .slice(0, 10);
  
  const handleDismiss = (id: string) => {
    setDismissed(prev => new Set([...prev, id]));
  };
  
  const handleView = (threat: ThreatCluster) => {
    setSelectedThreat(threat);
  };
  
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          <h2 className="text-sm font-bold">ALERT FEED</h2>
        </div>
        <span className="text-xs font-mono text-muted-foreground">
          {activeAlerts.length} ACTIVE
        </span>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {activeAlerts.length > 0 ? (
            activeAlerts.map(threat => (
              <AlertItem
                key={threat.id}
                threat={threat}
                onView={() => handleView(threat)}
                onDismiss={() => handleDismiss(threat.id)}
              />
            ))
          ) : (
            <div className="text-center py-12">
              <Bell className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No active alerts</p>
              <p className="text-xs text-muted-foreground">
                Threshold: {config.minConfidenceThreshold}%
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
      
      {dismissed.size > 0 && (
        <div className="p-3 border-t border-border">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setDismissed(new Set())}
            className="w-full text-xs"
          >
            Restore {dismissed.size} dismissed alert{dismissed.size > 1 ? 's' : ''}
          </Button>
        </div>
      )}
    </div>
  );
}

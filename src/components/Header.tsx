import React from 'react';
import { useMDAD } from '@/context/MDADContext';
import { 
  Shield, 
  Activity, 
  Radio, 
  AlertTriangle, 
  Crosshair,
  Wifi,
  WifiOff,
  Download,
  RefreshCw,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  onOpenSettings: () => void;
}

export function Header({ onOpenSettings }: HeaderProps) {
  const { metrics, isLiveMode, toggleLiveMode, exportReport, recalculateThreats } = useMDAD();
  
  const getSystemStatus = () => {
    if (metrics.totalActiveThreats > 5 || metrics.highestConfidenceThreat > 85) {
      return { label: 'ELEVATED', color: 'status-dot critical' };
    } else if (metrics.totalActiveThreats > 2 || metrics.highestConfidenceThreat > 60) {
      return { label: 'GUARDED', color: 'status-dot warning' };
    }
    return { label: 'NOMINAL', color: 'status-dot active' };
  };
  
  const status = getSystemStatus();

  return (
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="h-full px-4 flex items-center justify-between">
        {/* Logo and Title */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Shield className="w-8 h-8 text-primary" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight gradient-text">MDAD PLATFORM</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Multi-Domain Anomaly Detection</p>
            </div>
          </div>
          
          {/* System Status */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary border border-border">
            <div className={status.color} />
            <span className="text-xs font-mono font-medium">{status.label}</span>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="hidden lg:flex items-center gap-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-threat-high" />
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Active Threats</p>
              <p className="text-sm font-mono font-bold">{metrics.totalActiveThreats}</p>
            </div>
          </div>
          
          <div className="w-px h-8 bg-border" />
          
          <div className="flex items-center gap-2">
            <Crosshair className="w-4 h-4 text-primary" />
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Peak Confidence</p>
              <p className="text-sm font-mono font-bold">{metrics.highestConfidenceThreat}%</p>
            </div>
          </div>
          
          <div className="w-px h-8 bg-border" />
          
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-domain-cyber" />
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Signals/24h</p>
              <p className="text-sm font-mono font-bold">{metrics.signalsLast24h}</p>
            </div>
          </div>
          
          <div className="w-px h-8 bg-border" />
          
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-domain-humint" />
            <div className="text-right">
              <p className="text-xs text-muted-foreground">X-Domain</p>
              <p className="text-sm font-mono font-bold">{metrics.crossDomainCorrelations}</p>
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLiveMode}
            className={`gap-2 ${isLiveMode ? 'text-threat-low' : 'text-muted-foreground'}`}
          >
            {isLiveMode ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            <span className="hidden sm:inline font-mono text-xs">
              {isLiveMode ? 'LIVE' : 'PAUSED'}
            </span>
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={recalculateThreats}
            title="Recalculate threats"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={exportReport}
            title="Export report"
          >
            <Download className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenSettings}
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}

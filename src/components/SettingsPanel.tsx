import React from 'react';
import { useMDAD } from '@/context/MDADContext';
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Settings2, MapPin, Clock, Radio, Bell } from 'lucide-react';

interface SettingsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsPanel({ open, onOpenChange }: SettingsPanelProps) {
  const { config, updateConfig } = useMDAD();
  
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-card border-l border-border">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-primary" />
            System Configuration
          </SheetTitle>
          <SheetDescription>
            Adjust Bayesian fusion parameters and alert thresholds
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          {/* Alert Threshold */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              <Label className="text-sm font-medium">Alert Threshold</Label>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Minimum confidence for alerts</span>
                <span className="font-mono">{config.minConfidenceThreshold}%</span>
              </div>
              <Slider
                value={[config.minConfidenceThreshold]}
                onValueChange={([value]) => updateConfig({ minConfidenceThreshold: value })}
                min={10}
                max={90}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>More alerts</span>
                <span>Fewer alerts</span>
              </div>
            </div>
          </div>
          
          <Separator />
          
          {/* Spatial Radius */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <Label className="text-sm font-medium">Spatial Clustering Radius</Label>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Maximum distance for signal grouping</span>
                <span className="font-mono">{config.spatialRadiusKm} km</span>
              </div>
              <Slider
                value={[config.spatialRadiusKm]}
                onValueChange={([value]) => updateConfig({ spatialRadiusKm: value })}
                min={10}
                max={200}
                step={10}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Tight clusters</span>
                <span>Wide clusters</span>
              </div>
            </div>
          </div>
          
          <Separator />
          
          {/* Temporal Window */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <Label className="text-sm font-medium">Temporal Window</Label>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Time range for signal correlation</span>
                <span className="font-mono">{config.temporalWindowHours}h</span>
              </div>
              <Slider
                value={[config.temporalWindowHours]}
                onValueChange={([value]) => updateConfig({ temporalWindowHours: value })}
                min={12}
                max={168}
                step={12}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>12 hours</span>
                <span>7 days</span>
              </div>
            </div>
          </div>
          
          <Separator />
          
          {/* Auto Refresh */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-primary" />
              <Label className="text-sm font-medium">Live Data Feed</Label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">Auto-refresh</p>
                <p className="text-xs text-muted-foreground">Generate new signals periodically</p>
              </div>
              <Switch
                checked={config.enableAutoRefresh}
                onCheckedChange={(checked) => updateConfig({ enableAutoRefresh: checked })}
              />
            </div>
            
            {config.enableAutoRefresh && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Refresh interval</span>
                  <span className="font-mono">{config.refreshIntervalSeconds}s</span>
                </div>
                <Slider
                  value={[config.refreshIntervalSeconds]}
                  onValueChange={([value]) => updateConfig({ refreshIntervalSeconds: value })}
                  min={10}
                  max={120}
                  step={10}
                  className="w-full"
                />
              </div>
            )}
          </div>
          
          <Separator />
          
          {/* Info */}
          <div className="tactical-panel p-3 text-xs text-muted-foreground">
            <p className="font-medium mb-2">About Bayesian Fusion</p>
            <p>
              The MDAD platform uses Bayesian inference to combine weak signals 
              from multiple intelligence domains. Cross-domain correlations 
              (signals from 2+ domains in the same space-time cluster) receive 
              a 20% confidence bonus due to increased reliability.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

import React, { useState, useEffect } from 'react';
import { MDADProvider, useMDAD } from '@/context/MDADContext';
import { Header } from '@/components/Header';
import { CommandDashboard } from '@/components/CommandDashboard';
import { SignalHistory } from '@/components/SignalHistory';
import { AlertFeed } from '@/components/AlertFeed';
import { SettingsPanel } from '@/components/SettingsPanel';
import { ThreatPanelSimple } from '@/components/ThreatPanelSimple';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Map, LayoutDashboard, Radio, Bell, AlertTriangle } from 'lucide-react';

function MapPlaceholder() {
  const { signals, threats } = useMDAD();
  
  return (
    <div className="h-full flex items-center justify-center bg-card">
      <div className="text-center p-8">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
          <Map className="w-12 h-12 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Geospatial View</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          Monitoring {signals.length} signals across {threats.length} threat clusters
        </p>
        <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
          <div className="tactical-panel p-4">
            <p className="text-2xl font-mono font-bold text-domain-physical">{signals.filter(s => s.domain === 'physical').length}</p>
            <p className="text-xs text-muted-foreground">Physical</p>
          </div>
          <div className="tactical-panel p-4">
            <p className="text-2xl font-mono font-bold text-domain-cyber">{signals.filter(s => s.domain === 'cyber').length}</p>
            <p className="text-xs text-muted-foreground">Cyber</p>
          </div>
          <div className="tactical-panel p-4">
            <p className="text-2xl font-mono font-bold text-domain-humint">{signals.filter(s => s.domain === 'humint').length}</p>
            <p className="text-xs text-muted-foreground">HUMINT</p>
          </div>
        </div>
        
        <div className="mt-6 space-y-2">
          {threats.slice(0, 3).map(threat => (
            <div key={threat.id} className="tactical-panel p-3 text-left flex items-center gap-3">
              <AlertTriangle className={`w-5 h-5 ${
                threat.confidenceScore > 70 ? 'text-threat-critical' : 
                threat.confidenceScore > 40 ? 'text-threat-medium' : 'text-threat-low'
              }`} />
              <div className="flex-1">
                <p className="text-sm font-mono">{threat.id}</p>
                <p className="text-xs text-muted-foreground">
                  {threat.signalCount} signals • {threat.radiusKm.toFixed(0)}km radius
                </p>
              </div>
              <span className={`px-2 py-1 text-xs font-bold rounded ${
                threat.confidenceScore > 70 ? 'bg-threat-critical/20 text-threat-critical' : 
                threat.confidenceScore > 40 ? 'bg-threat-medium/20 text-threat-medium' : 'bg-threat-low/20 text-threat-low'
              }`}>
                {threat.confidenceScore}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MDADPlatform() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('map');
  
  return (
    <div className="h-screen flex flex-col bg-background">
      <Header onOpenSettings={() => setSettingsOpen(true)} />
      
      <div className="flex-1 flex min-h-0">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <div className="border-b border-border bg-card/50 px-4">
              <TabsList className="h-12 bg-transparent gap-1">
                <TabsTrigger 
                  value="map" 
                  className="gap-2 data-[state=active]:bg-secondary data-[state=active]:text-primary"
                >
                  <Map className="w-4 h-4" />
                  <span className="hidden sm:inline">Live Map</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="dashboard" 
                  className="gap-2 data-[state=active]:bg-secondary data-[state=active]:text-primary"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="signals" 
                  className="gap-2 data-[state=active]:bg-secondary data-[state=active]:text-primary"
                >
                  <Radio className="w-4 h-4" />
                  <span className="hidden sm:inline">Signals</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="alerts" 
                  className="gap-2 data-[state=active]:bg-secondary data-[state=active]:text-primary md:hidden"
                >
                  <Bell className="w-4 h-4" />
                  <span className="hidden sm:inline">Alerts</span>
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="map" className="flex-1 m-0 min-h-0 overflow-auto">
              <div className="h-full flex">
                <div className="flex-1 overflow-auto">
                  <MapPlaceholder />
                </div>
                <div className="hidden lg:block w-[360px] overflow-auto">
                  <ThreatPanelSimple />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="dashboard" className="flex-1 m-0 min-h-0 overflow-auto">
              <CommandDashboard />
            </TabsContent>
            
            <TabsContent value="signals" className="flex-1 m-0 min-h-0 overflow-auto">
              <SignalHistory />
            </TabsContent>
            
            <TabsContent value="alerts" className="flex-1 m-0 min-h-0 overflow-auto md:hidden">
              <AlertFeed />
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Right Sidebar - Alerts (desktop only) */}
        <div className="hidden md:block w-[320px] border-l border-border bg-card/50">
          <AlertFeed />
        </div>
      </div>
      
      <SettingsPanel open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}

const Index = () => {
  return (
    <MDADProvider>
      <MDADPlatform />
    </MDADProvider>
  );
};

export default Index;

import React, { useState } from 'react';
import { MDADProvider } from '@/context/MDADContext';
import { Header } from '@/components/Header';
import { ThreatMap } from '@/components/ThreatMap';
import { ThreatPanel } from '@/components/ThreatPanel';
import { CommandDashboard } from '@/components/CommandDashboard';
import { SignalHistory } from '@/components/SignalHistory';
import { AlertFeed } from '@/components/AlertFeed';
import { SettingsPanel } from '@/components/SettingsPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Map, LayoutDashboard, Radio, Bell } from 'lucide-react';

function MDADPlatform() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('map');
  
  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <Header onOpenSettings={() => setSettingsOpen(true)} />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
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
            
            <TabsContent value="map" className="flex-1 m-0 overflow-hidden">
              <div className="h-full flex">
                <div className="flex-1">
                  <ThreatMap />
                </div>
                <div className="hidden lg:block w-[360px]">
                  <ThreatPanel />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="dashboard" className="flex-1 m-0 overflow-hidden">
              <CommandDashboard />
            </TabsContent>
            
            <TabsContent value="signals" className="flex-1 m-0 overflow-hidden">
              <SignalHistory />
            </TabsContent>
            
            <TabsContent value="alerts" className="flex-1 m-0 overflow-hidden md:hidden">
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

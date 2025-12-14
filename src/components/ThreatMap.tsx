import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Circle, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useMDAD } from '@/context/MDADContext';
import { DOMAIN_COLORS, SEVERITY_CONFIG } from '@/types/mdad';
import { getRecommendedAction } from '@/lib/bayesianFusion';

// Fix for default marker icons in Leaflet with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function getThreatColor(confidence: number): string {
  if (confidence <= 40) return '#22c55e';
  if (confidence <= 70) return '#eab308';
  if (confidence <= 85) return '#f97316';
  return '#ef4444';
}

// Create signal icon
function createSignalIcon(domain: string, confidence: number) {
  const color = DOMAIN_COLORS[domain as keyof typeof DOMAIN_COLORS] || '#888';
  const size = 8 + confidence * 8;
  
  return L.divIcon({
    className: 'custom-signal-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border: 2px solid rgba(255,255,255,0.3);
        border-radius: 50%;
        box-shadow: 0 0 ${confidence * 10}px ${color};
        opacity: ${0.5 + confidence * 0.5};
      "></div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// Create threat icon
function createThreatIcon(confidence: number) {
  const color = getThreatColor(confidence);
  
  return L.divIcon({
    className: 'custom-threat-marker',
    html: `
      <div style="
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: ${color}33;
        border: 2px solid ${color};
        border-radius: 50%;
        box-shadow: 0 0 20px ${color}88;
      ">
        <div style="
          width: 8px;
          height: 8px;
          background: ${color};
          border-radius: 50%;
        "></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

export function ThreatMap() {
  const { signals, threats, setSelectedThreat } = useMDAD();
  
  // Calculate map center
  const mapCenter = useMemo(() => {
    if (signals.length === 0) return [49.0, 32.0] as [number, number];
    const avgLat = signals.reduce((sum, s) => sum + s.latitude, 0) / signals.length;
    const avgLon = signals.reduce((sum, s) => sum + s.longitude, 0) / signals.length;
    return [avgLat, avgLon] as [number, number];
  }, [signals]);

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={mapCenter}
        zoom={6}
        className="w-full h-full"
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        {/* Signal Markers */}
        {signals.map(signal => (
          <Marker
            key={signal.id}
            position={[signal.latitude, signal.longitude]}
            icon={createSignalIcon(signal.domain, signal.confidence)}
          >
            <Popup>
              <div className="p-2 min-w-[200px]">
                <div className="flex items-center gap-2 mb-2">
                  <span 
                    className="px-2 py-0.5 text-xs font-mono rounded uppercase"
                    style={{ 
                      background: `${DOMAIN_COLORS[signal.domain]}22`,
                      color: DOMAIN_COLORS[signal.domain],
                      border: `1px solid ${DOMAIN_COLORS[signal.domain]}44`
                    }}
                  >
                    {signal.domain}
                  </span>
                  <span 
                    className="px-2 py-0.5 text-xs font-mono rounded uppercase"
                    style={{ 
                      background: `${SEVERITY_CONFIG[signal.severity].color}22`,
                      color: SEVERITY_CONFIG[signal.severity].color,
                    }}
                  >
                    {signal.severity}
                  </span>
                </div>
                <p className="text-sm mb-2">{signal.description}</p>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p><span className="font-medium">Source:</span> {signal.sourceType}</p>
                  <p><span className="font-medium">Confidence:</span> {Math.round(signal.confidence * 100)}%</p>
                  <p><span className="font-medium">Time:</span> {signal.timestamp.toLocaleString()}</p>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
        
        {/* Threat Clusters */}
        {threats.map(threat => {
          const color = getThreatColor(threat.confidenceScore);
          const recommendation = getRecommendedAction(threat.confidenceScore);
          
          return (
            <React.Fragment key={threat.id}>
              <Circle
                center={[threat.centerLat, threat.centerLon]}
                radius={threat.radiusKm * 1000}
                pathOptions={{
                  color: color,
                  fillColor: color,
                  fillOpacity: 0.15,
                  weight: 2,
                  dashArray: threat.confidenceScore > 70 ? undefined : '5, 10',
                }}
              />
              <Marker
                position={[threat.centerLat, threat.centerLon]}
                icon={createThreatIcon(threat.confidenceScore)}
                eventHandlers={{
                  click: () => setSelectedThreat(threat),
                }}
              >
                <Popup>
                  <div className="p-3 min-w-[280px]">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-mono text-muted-foreground">{threat.id}</span>
                      <span 
                        className="px-2 py-1 text-xs font-bold rounded"
                        style={{ 
                          background: `${color}22`,
                          color: color,
                          border: `1px solid ${color}44`
                        }}
                      >
                        {threat.confidenceScore}% CONFIDENCE
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Signals:</span>
                        <span className="font-mono">{threat.signalCount}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Cross-Domain:</span>
                        <span className={threat.crossDomainBonus ? 'text-green-500' : 'text-muted-foreground'}>
                          {threat.crossDomainBonus ? 'YES (+20%)' : 'NO'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mb-3">
                      {threat.domainMix.physical > 0 && (
                        <span className="px-2 py-0.5 text-xs rounded" style={{ background: `${DOMAIN_COLORS.physical}22`, color: DOMAIN_COLORS.physical }}>
                          PHY: {threat.domainMix.physical}
                        </span>
                      )}
                      {threat.domainMix.cyber > 0 && (
                        <span className="px-2 py-0.5 text-xs rounded" style={{ background: `${DOMAIN_COLORS.cyber}22`, color: DOMAIN_COLORS.cyber }}>
                          CYB: {threat.domainMix.cyber}
                        </span>
                      )}
                      {threat.domainMix.humint > 0 && (
                        <span className="px-2 py-0.5 text-xs rounded" style={{ background: `${DOMAIN_COLORS.humint}22`, color: DOMAIN_COLORS.humint }}>
                          HUM: {threat.domainMix.humint}
                        </span>
                      )}
                    </div>
                    
                    <div className="text-xs p-2 rounded bg-gray-800 border border-gray-700">
                      <span className="font-bold">{recommendation.priority}:</span> {recommendation.action}
                    </div>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          );
        })}
      </MapContainer>
      
      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 tactical-panel p-3 z-[1000]">
        <p className="text-xs font-medium mb-2">SIGNAL DOMAINS</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: DOMAIN_COLORS.physical }} />
            <span className="text-xs">Physical</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: DOMAIN_COLORS.cyber }} />
            <span className="text-xs">Cyber</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: DOMAIN_COLORS.humint }} />
            <span className="text-xs">HUMINT</span>
          </div>
        </div>
        
        <div className="border-t border-border mt-2 pt-2">
          <p className="text-xs font-medium mb-2">THREAT LEVEL</p>
          <div className="flex gap-1">
            <div className="w-6 h-2 rounded" style={{ background: '#22c55e' }} />
            <div className="w-6 h-2 rounded" style={{ background: '#eab308' }} />
            <div className="w-6 h-2 rounded" style={{ background: '#f97316' }} />
            <div className="w-6 h-2 rounded" style={{ background: '#ef4444' }} />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>LOW</span>
            <span>CRITICAL</span>
          </div>
        </div>
      </div>
      
      {/* Threat count overlay */}
      <div className="absolute top-4 left-4 tactical-panel px-3 py-2 z-[1000]">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-[10px] text-muted-foreground">ACTIVE CLUSTERS</p>
            <p className="text-xl font-mono font-bold text-primary">{threats.length}</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div>
            <p className="text-[10px] text-muted-foreground">TOTAL SIGNALS</p>
            <p className="text-xl font-mono font-bold">{signals.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

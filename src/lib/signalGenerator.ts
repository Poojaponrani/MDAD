import { Signal, Domain, Severity } from '@/types/mdad';

// Geographic regions for realistic signal distribution
const REGIONS = [
  { name: 'Eastern Front', lat: 48.5, lon: 37.5, spread: 2 },
  { name: 'Northern Sector', lat: 51.0, lon: 31.0, spread: 1.5 },
  { name: 'Southern Zone', lat: 46.5, lon: 33.5, spread: 1.8 },
  { name: 'Western Border', lat: 50.0, lon: 24.0, spread: 1.2 },
  { name: 'Central Command', lat: 50.4, lon: 30.5, spread: 0.8 },
];

const PHYSICAL_SOURCES = [
  'SATINT-GEOSYNC-7',
  'RADAR-STATION-ALPHA',
  'DRONE-RECON-12',
  'GROUND-SENSOR-NET',
  'AWACS-PATROL',
  'SIGINT-POST-3',
];

const CYBER_SOURCES = [
  'NOC-MONITOR',
  'FIREWALL-CLUSTER',
  'DARKWEB-CRAWLER',
  'HONEYPOT-ALPHA',
  'IDS-NETWORK',
  'THREAT-INTEL-FEED',
];

const HUMINT_SOURCES = [
  'FIELD-ASSET-BRAVO',
  'LOCAL-CONTACT',
  'EMBASSY-REPORT',
  'OSINT-ANALYSIS',
  'SOCIAL-MONITOR',
  'CONFIDENTIAL-SOURCE',
];

const PHYSICAL_DESCRIPTIONS = [
  'Unusual vehicle convoy detected moving toward sector boundary',
  'Satellite imagery shows new defensive positions being constructed',
  'Radar contact: Unidentified aircraft entering restricted airspace',
  'Seismic sensors detect underground construction activity',
  'Thermal signatures indicate increased personnel at forward base',
  'Supply trucks observed on previously inactive route',
  'Mobile radar systems deployed in forward position',
  'Troop movements detected near critical infrastructure',
  'Artillery pieces repositioned to elevated terrain',
  'Camouflage netting activity at suspected staging area',
];

const CYBER_DESCRIPTIONS = [
  'Spear phishing campaign targeting military personnel detected',
  'DDoS attack pattern emerging against communications infrastructure',
  'Malware signature matches known APT group tactics',
  'Unauthorized access attempt on classified network segment',
  'Dark web chatter indicates planned infrastructure attack',
  'Network scan activity from hostile IP range increased 300%',
  'Credential stuffing attack detected on admin portals',
  'Command and control beacon identified in network traffic',
  'Zero-day exploit attempt against VPN concentrators',
  'Data exfiltration pattern detected on border routers',
];

const HUMINT_DESCRIPTIONS = [
  'Asset reports unusual activity at known adversary facility',
  'Local contact observes foreign nationals photographing installations',
  'Informant indicates planning meeting for operations',
  'Social media analysis shows coordinated disinformation campaign',
  'Embassy source reports unusual diplomatic movements',
  'Field operative confirms weapons cache at reported location',
  'Intercepted communication suggests imminent action',
  'Reliable source reports hostile force morale assessment',
  'Community contact reports suspicious vehicle surveillance',
  'Defector provides intelligence on operational planning',
];

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function generateSignalId(): string {
  return `SIG-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

export function generateSignal(domain?: Domain, hoursAgo?: number): Signal {
  const selectedDomain = domain || randomChoice<Domain>(['physical', 'cyber', 'humint']);
  const region = randomChoice(REGIONS);
  
  let sourceType: string;
  let description: string;
  
  switch (selectedDomain) {
    case 'physical':
      sourceType = randomChoice(PHYSICAL_SOURCES);
      description = randomChoice(PHYSICAL_DESCRIPTIONS);
      break;
    case 'cyber':
      sourceType = randomChoice(CYBER_SOURCES);
      description = randomChoice(CYBER_DESCRIPTIONS);
      break;
    case 'humint':
      sourceType = randomChoice(HUMINT_SOURCES);
      description = randomChoice(HUMINT_DESCRIPTIONS);
      break;
  }

  const timeOffset = hoursAgo !== undefined 
    ? hoursAgo * 60 * 60 * 1000
    : randomInRange(0, 168) * 60 * 60 * 1000; // Up to 7 days ago

  const severity = randomChoice<Severity>(['low', 'medium', 'high', 'critical']);
  
  // Confidence varies by source type and severity
  let baseConfidence = randomInRange(0.2, 0.85);
  if (severity === 'critical') baseConfidence = Math.min(baseConfidence + 0.1, 0.95);
  if (severity === 'low') baseConfidence = Math.max(baseConfidence - 0.1, 0.15);

  return {
    id: generateSignalId(),
    timestamp: new Date(Date.now() - timeOffset),
    latitude: region.lat + randomInRange(-region.spread, region.spread),
    longitude: region.lon + randomInRange(-region.spread, region.spread),
    domain: selectedDomain,
    confidence: Number(baseConfidence.toFixed(2)),
    severity,
    description,
    sourceType,
    processed: false,
  };
}

export function generateHistoricalSignals(count: number = 50): Signal[] {
  const signals: Signal[] = [];
  
  // Ensure good distribution across domains
  const domainsPerType = Math.floor(count / 3);
  
  for (let i = 0; i < domainsPerType; i++) {
    signals.push(generateSignal('physical', randomInRange(0, 168)));
    signals.push(generateSignal('cyber', randomInRange(0, 168)));
    signals.push(generateSignal('humint', randomInRange(0, 168)));
  }
  
  // Fill remaining with random
  while (signals.length < count) {
    signals.push(generateSignal(undefined, randomInRange(0, 168)));
  }
  
  // Sort by timestamp (newest first)
  return signals.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

export function generateClusteredSignals(): Signal[] {
  const signals: Signal[] = [];
  
  // Create intentional clusters for demonstration
  const clusterCenters = [
    { lat: 48.8, lon: 37.2, domain: 'physical' as Domain },
    { lat: 50.2, lon: 30.8, domain: 'cyber' as Domain },
    { lat: 47.0, lon: 33.0, domain: 'mixed' as const },
  ];
  
  clusterCenters.forEach((center, idx) => {
    const clusterSize = 4 + Math.floor(Math.random() * 4);
    const baseTime = Date.now() - (idx * 12 * 60 * 60 * 1000); // Offset clusters in time
    
    for (let i = 0; i < clusterSize; i++) {
      const domain = center.domain === 'mixed' 
        ? randomChoice<Domain>(['physical', 'cyber', 'humint'])
        : center.domain;
      
      const signal = generateSignal(domain, (Date.now() - baseTime) / (60 * 60 * 1000) + randomInRange(-6, 6));
      signal.latitude = center.lat + randomInRange(-0.3, 0.3);
      signal.longitude = center.lon + randomInRange(-0.3, 0.3);
      signals.push(signal);
    }
  });
  
  // Add some scattered signals
  for (let i = 0; i < 15; i++) {
    signals.push(generateSignal());
  }
  
  return signals.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

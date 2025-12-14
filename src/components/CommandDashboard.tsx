import React from 'react';
import { useMDAD } from '@/context/MDADContext';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { 
  AlertTriangle, 
  Target, 
  Radio, 
  GitMerge,
  TrendingUp,
  Activity
} from 'lucide-react';
import { DOMAIN_COLORS } from '@/types/mdad';

function MetricCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend,
}: { 
  title: string; 
  value: string | number; 
  subtitle?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down';
}) {
  return (
    <div className="metric-card group">
      <div className="flex items-start justify-between mb-2">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        {trend && (
          <TrendingUp className={`w-4 h-4 ${trend === 'up' ? 'text-threat-high rotate-0' : 'text-threat-low rotate-180'}`} />
        )}
      </div>
      <p className="text-3xl font-mono font-bold mb-1">{value}</p>
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{title}</p>
      {subtitle && (
        <p className="text-[10px] text-muted-foreground mt-1">{subtitle}</p>
      )}
    </div>
  );
}

function ThreatTimeline() {
  const { metrics } = useMDAD();
  
  return (
    <div className="tactical-panel p-4 h-full">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-medium">THREAT LEVEL TIMELINE</h3>
      </div>
      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={metrics.threatTimeline}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
            <XAxis 
              dataKey="date" 
              tick={{ fill: 'hsl(215 20% 55%)', fontSize: 10 }}
              axisLine={{ stroke: 'hsl(222 30% 18%)' }}
            />
            <YAxis 
              tick={{ fill: 'hsl(215 20% 55%)', fontSize: 10 }}
              axisLine={{ stroke: 'hsl(222 30% 18%)' }}
              domain={[0, 100]}
            />
            <Tooltip 
              contentStyle={{ 
                background: 'hsl(222 47% 10%)', 
                border: '1px solid hsl(222 30% 18%)',
                borderRadius: '8px',
                fontSize: '12px'
              }}
              labelStyle={{ color: 'hsl(210 40% 96%)' }}
            />
            <Line 
              type="monotone" 
              dataKey="level" 
              stroke="hsl(190 100% 50%)"
              strokeWidth={2}
              dot={{ fill: 'hsl(190 100% 50%)', strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6, fill: 'hsl(190 100% 60%)' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function DomainDistribution() {
  const { metrics } = useMDAD();
  
  const data = [
    { name: 'Physical', value: metrics.threatsByDomain.physical, color: DOMAIN_COLORS.physical },
    { name: 'Cyber', value: metrics.threatsByDomain.cyber, color: DOMAIN_COLORS.cyber },
    { name: 'HUMINT', value: metrics.threatsByDomain.humint, color: DOMAIN_COLORS.humint },
  ];
  
  const total = data.reduce((sum, d) => sum + d.value, 0);
  
  return (
    <div className="tactical-panel p-4 h-full">
      <div className="flex items-center gap-2 mb-4">
        <Radio className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-medium">SIGNAL DISTRIBUTION</h3>
      </div>
      <div className="h-[180px] flex items-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={70}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                background: 'hsl(222 47% 10%)', 
                border: '1px solid hsl(222 30% 18%)',
                borderRadius: '8px',
                fontSize: '12px'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="space-y-2 ml-4">
          {data.map((d, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ background: d.color }} />
              <span className="text-xs">{d.name}</span>
              <span className="text-xs font-mono text-muted-foreground">
                {total > 0 ? Math.round((d.value / total) * 100) : 0}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ConfidenceHistogram() {
  const { metrics } = useMDAD();
  
  const colors = ['#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444'];
  
  return (
    <div className="tactical-panel p-4 h-full">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-medium">CONFIDENCE DISTRIBUTION</h3>
      </div>
      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={metrics.confidenceDistribution}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
            <XAxis 
              dataKey="range" 
              tick={{ fill: 'hsl(215 20% 55%)', fontSize: 9 }}
              axisLine={{ stroke: 'hsl(222 30% 18%)' }}
            />
            <YAxis 
              tick={{ fill: 'hsl(215 20% 55%)', fontSize: 10 }}
              axisLine={{ stroke: 'hsl(222 30% 18%)' }}
            />
            <Tooltip 
              contentStyle={{ 
                background: 'hsl(222 47% 10%)', 
                border: '1px solid hsl(222 30% 18%)',
                borderRadius: '8px',
                fontSize: '12px'
              }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {metrics.confidenceDistribution.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function CommandDashboard() {
  const { metrics } = useMDAD();
  
  return (
    <div className="h-full overflow-auto scrollbar-tactical p-4">
      <div className="mb-4">
        <h2 className="text-lg font-bold mb-1">COMMAND DASHBOARD</h2>
        <p className="text-xs text-muted-foreground">Real-time threat intelligence overview</p>
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <MetricCard
          title="Active Threats"
          value={metrics.totalActiveThreats}
          icon={AlertTriangle}
          trend="up"
        />
        <MetricCard
          title="Peak Confidence"
          value={`${metrics.highestConfidenceThreat}%`}
          icon={Target}
        />
        <MetricCard
          title="Signals (24h)"
          value={metrics.signalsLast24h}
          icon={Radio}
        />
        <MetricCard
          title="X-Domain Correlations"
          value={metrics.crossDomainCorrelations}
          subtitle="Multi-domain fusion bonus"
          icon={GitMerge}
        />
      </div>
      
      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        <div className="lg:col-span-2 xl:col-span-1">
          <ThreatTimeline />
        </div>
        <DomainDistribution />
        <ConfidenceHistogram />
      </div>
    </div>
  );
}

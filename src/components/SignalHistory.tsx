import React, { useState, useMemo } from 'react';
import { useMDAD } from '@/context/MDADContext';
import { Signal, DOMAIN_COLORS, SEVERITY_CONFIG } from '@/types/mdad';
import { 
  Search, 
  Filter, 
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Radio
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type SortField = 'timestamp' | 'confidence' | 'severity' | 'domain';
type SortOrder = 'asc' | 'desc';

export function SignalHistory() {
  const { signals } = useMDAD();
  const [search, setSearch] = useState('');
  const [domainFilter, setDomainFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [page, setPage] = useState(1);
  const pageSize = 20;
  
  const filteredSignals = useMemo(() => {
    let result = [...signals];
    
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(s => 
        s.description.toLowerCase().includes(searchLower) ||
        s.sourceType.toLowerCase().includes(searchLower) ||
        s.id.toLowerCase().includes(searchLower)
      );
    }
    
    // Domain filter
    if (domainFilter !== 'all') {
      result = result.filter(s => s.domain === domainFilter);
    }
    
    // Severity filter
    if (severityFilter !== 'all') {
      result = result.filter(s => s.severity === severityFilter);
    }
    
    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'timestamp':
          comparison = a.timestamp.getTime() - b.timestamp.getTime();
          break;
        case 'confidence':
          comparison = a.confidence - b.confidence;
          break;
        case 'severity':
          const severityOrder = { low: 1, medium: 2, high: 3, critical: 4 };
          comparison = severityOrder[a.severity] - severityOrder[b.severity];
          break;
        case 'domain':
          comparison = a.domain.localeCompare(b.domain);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return result;
  }, [signals, search, domainFilter, severityFilter, sortField, sortOrder]);
  
  const paginatedSignals = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredSignals.slice(start, start + pageSize);
  }, [filteredSignals, page]);
  
  const totalPages = Math.ceil(filteredSignals.length / pageSize);
  
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };
  
  return (
    <div className="h-full flex flex-col p-4">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Radio className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold">SIGNAL HISTORY</h2>
        </div>
        <p className="text-xs text-muted-foreground">All intercepted signals across domains</p>
      </div>
      
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search signals..."
            className="pl-9 bg-secondary border-border"
          />
        </div>
        
        <Select value={domainFilter} onValueChange={(v) => { setDomainFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[140px] bg-secondary border-border">
            <SelectValue placeholder="Domain" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Domains</SelectItem>
            <SelectItem value="physical">Physical</SelectItem>
            <SelectItem value="cyber">Cyber</SelectItem>
            <SelectItem value="humint">HUMINT</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={severityFilter} onValueChange={(v) => { setSeverityFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[140px] bg-secondary border-border">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Table */}
      <div className="flex-1 overflow-auto scrollbar-tactical tactical-panel">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-card border-b border-border">
            <tr>
              <th className="text-left p-3 font-medium">
                <button 
                  onClick={() => handleSort('timestamp')}
                  className="flex items-center gap-1 hover:text-primary transition-colors"
                >
                  Timestamp
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="text-left p-3 font-medium">
                <button 
                  onClick={() => handleSort('domain')}
                  className="flex items-center gap-1 hover:text-primary transition-colors"
                >
                  Domain
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="text-left p-3 font-medium">
                <button 
                  onClick={() => handleSort('severity')}
                  className="flex items-center gap-1 hover:text-primary transition-colors"
                >
                  Severity
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="text-left p-3 font-medium">
                <button 
                  onClick={() => handleSort('confidence')}
                  className="flex items-center gap-1 hover:text-primary transition-colors"
                >
                  Confidence
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="text-left p-3 font-medium">Source</th>
              <th className="text-left p-3 font-medium">Description</th>
            </tr>
          </thead>
          <tbody>
            {paginatedSignals.map((signal, i) => (
              <tr 
                key={signal.id} 
                className={`border-b border-border/50 hover:bg-secondary/50 transition-colors ${
                  i % 2 === 0 ? 'bg-card' : 'bg-card/50'
                }`}
              >
                <td className="p-3 font-mono text-xs">
                  <div>{signal.timestamp.toLocaleDateString()}</div>
                  <div className="text-muted-foreground">{signal.timestamp.toLocaleTimeString()}</div>
                </td>
                <td className="p-3">
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
                </td>
                <td className="p-3">
                  <span 
                    className="px-2 py-0.5 text-xs font-mono rounded uppercase"
                    style={{ 
                      background: `${SEVERITY_CONFIG[signal.severity].color}22`,
                      color: SEVERITY_CONFIG[signal.severity].color,
                    }}
                  >
                    {signal.severity}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${signal.confidence * 100}%` }}
                      />
                    </div>
                    <span className="font-mono text-xs">{Math.round(signal.confidence * 100)}%</span>
                  </div>
                </td>
                <td className="p-3 text-xs text-muted-foreground font-mono">
                  {signal.sourceType}
                </td>
                <td className="p-3 text-xs max-w-[300px] truncate">
                  {signal.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {paginatedSignals.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No signals match your filters</p>
          </div>
        )}
      </div>
      
      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Showing {((page - 1) * pageSize) + 1} - {Math.min(page * pageSize, filteredSignals.length)} of {filteredSignals.length} signals
        </p>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <span className="text-sm font-mono px-3">
            {page} / {totalPages || 1}
          </span>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

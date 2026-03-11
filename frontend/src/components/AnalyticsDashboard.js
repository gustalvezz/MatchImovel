import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, Building2, Heart, TrendingUp, TrendingDown, 
  CheckCircle, XCircle, Clock, MessageSquare, MapPin, 
  DollarSign, Home, BarChart3, PieChart, Activity
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
    
    // Auto-refresh a cada 30 segundos
    const interval = setInterval(() => {
      fetchAnalytics();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${API}/admin/analytics`);
      setAnalytics(response.data);
    } catch (error) {
      toast.error('Erro ao carregar analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-lg text-muted-foreground">Carregando analytics...</div>
      </div>
    );
  }

  if (!analytics) return null;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="space-y-6" data-testid="analytics-dashboard">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-0" data-testid="analytics-buyers">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 opacity-80" />
            <span className="text-xs opacity-70">Total</span>
          </div>
          <p className="text-3xl font-bold">{analytics.overview.total_buyers}</p>
          <p className="text-sm opacity-80">Compradores</p>
        </Card>

        <Card className="p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0" data-testid="analytics-agents">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 opacity-80" />
            <span className="text-xs opacity-70">Total</span>
          </div>
          <p className="text-3xl font-bold">{analytics.overview.total_agents}</p>
          <p className="text-sm opacity-80">Corretores</p>
        </Card>

        <Card className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0" data-testid="analytics-curators">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 opacity-80" />
            <span className="text-xs opacity-70">Equipe</span>
          </div>
          <p className="text-3xl font-bold">{analytics.overview.total_curators}</p>
          <p className="text-sm opacity-80">Curadores</p>
        </Card>

        <Card className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0" data-testid="analytics-interests">
          <div className="flex items-center justify-between mb-2">
            <Building2 className="w-5 h-5 opacity-80" />
            <span className="text-xs opacity-70">{analytics.overview.active_interests} ativos</span>
          </div>
          <p className="text-3xl font-bold">{analytics.overview.total_interests}</p>
          <p className="text-sm opacity-80">Interesses</p>
        </Card>

        <Card className="p-4 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 text-white border-0" data-testid="analytics-conversion">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 opacity-80" />
            <span className="text-xs opacity-70">Taxa</span>
          </div>
          <p className="text-3xl font-bold">{analytics.matches.conversion_rate}%</p>
          <p className="text-sm opacity-80">Conversao</p>
        </Card>
      </div>

      {/* Matches Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 rounded-3xl" data-testid="analytics-matches-card">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-5 h-5 text-rose-600" />
            <h3 className="text-lg font-semibold">Estatisticas de Matches</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-slate-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-slate-800">{analytics.matches.total}</p>
              <p className="text-sm text-muted-foreground">Total de Matches</p>
            </div>
            <div className="bg-orange-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-orange-600">{analytics.matches.pending}</p>
              <p className="text-sm text-muted-foreground">Pendentes</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{analytics.matches.approved}</p>
              <p className="text-sm text-muted-foreground">Aprovados</p>
            </div>
            <div className="bg-red-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-red-600">{analytics.matches.rejected}</p>
              <p className="text-sm text-muted-foreground">Rejeitados</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Taxa de Aprovacao</span>
              <span className="font-medium">{analytics.matches.conversion_rate}%</span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${analytics.matches.conversion_rate}%` }}
              />
            </div>
          </div>
        </Card>

        <Card className="p-6 rounded-3xl" data-testid="analytics-followups-card">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-semibold">Follow-ups (CRM)</h3>
          </div>
          
          <div className="space-y-4">
            <div className="bg-indigo-50 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-indigo-600">{analytics.followups.total}</p>
                <p className="text-sm text-muted-foreground">Total de Follow-ups</p>
              </div>
              <Activity className="w-10 h-10 text-indigo-300" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-purple-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-purple-600">{analytics.followups.with_broker}</p>
                <p className="text-xs text-muted-foreground">Com Corretores</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{analytics.followups.with_buyer}</p>
                <p className="text-xs text-muted-foreground">Com Compradores</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Distributions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 rounded-3xl" data-testid="analytics-property-types">
          <div className="flex items-center gap-2 mb-4">
            <Home className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Tipos de Imoveis</h3>
          </div>
          
          <div className="space-y-3">
            {Object.entries(analytics.distributions.property_types).length > 0 ? (
              Object.entries(analytics.distributions.property_types)
                .sort((a, b) => b[1] - a[1])
                .map(([type, count]) => {
                  const total = Object.values(analytics.distributions.property_types).reduce((a, b) => a + b, 0);
                  const percentage = ((count / total) * 100).toFixed(0);
                  return (
                    <div key={type} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm capitalize font-medium">{type}</span>
                        <span className="text-sm text-muted-foreground">{count} ({percentage}%)</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum dado disponivel</p>
            )}
          </div>
        </Card>

        <Card className="p-6 rounded-3xl" data-testid="analytics-locations">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-semibold">Localizacoes</h3>
          </div>
          
          <div className="space-y-3 max-h-[200px] overflow-y-auto">
            {Object.entries(analytics.distributions.locations).length > 0 ? (
              Object.entries(analytics.distributions.locations)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8)
                .map(([location, count]) => {
                  const total = Object.values(analytics.distributions.locations).reduce((a, b) => a + b, 0);
                  const percentage = ((count / total) * 100).toFixed(0);
                  return (
                    <div key={location} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                      <span className="text-sm font-medium truncate flex-1">{location}</span>
                      <Badge variant="secondary" className="ml-2">{count}</Badge>
                    </div>
                  );
                })
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum dado disponivel</p>
            )}
          </div>
        </Card>
      </div>

      {/* Price Range */}
      <Card className="p-6 rounded-3xl" data-testid="analytics-price-range">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold">Faixa de Preco Media</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-green-50 rounded-xl p-6 text-center">
            <p className="text-sm text-muted-foreground mb-1">Preco Minimo Medio</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(analytics.price_range.average_min)}</p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-6 text-center">
            <p className="text-sm text-muted-foreground mb-1">Preco Maximo Medio</p>
            <p className="text-2xl font-bold text-emerald-600">{formatCurrency(analytics.price_range.average_max)}</p>
          </div>
        </div>
      </Card>

      {/* Curator Performance */}
      {analytics.curator_performance.length > 0 && (
        <Card className="p-6 rounded-3xl" data-testid="analytics-curator-performance">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold">Performance dos Curadores</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-muted-foreground border-b">
                  <th className="pb-3 font-medium">Curador</th>
                  <th className="pb-3 font-medium text-center">Matches</th>
                  <th className="pb-3 font-medium text-center">Aprovados</th>
                  <th className="pb-3 font-medium text-center">Follow-ups</th>
                  <th className="pb-3 font-medium text-center">Taxa</th>
                </tr>
              </thead>
              <tbody>
                {analytics.curator_performance.map((curator) => (
                  <tr key={curator.id} className="border-b last:border-0">
                    <td className="py-3">
                      <div>
                        <p className="font-medium">{curator.name}</p>
                        <p className="text-xs text-muted-foreground">{curator.email}</p>
                      </div>
                    </td>
                    <td className="py-3 text-center">
                      <Badge variant="outline">{curator.matches_curated}</Badge>
                    </td>
                    <td className="py-3 text-center">
                      <Badge className="bg-green-100 text-green-700">{curator.matches_approved}</Badge>
                    </td>
                    <td className="py-3 text-center">
                      <Badge className="bg-indigo-100 text-indigo-700">{curator.followups_count}</Badge>
                    </td>
                    <td className="py-3 text-center">
                      <span className={`font-semibold ${curator.approval_rate >= 50 ? 'text-green-600' : 'text-orange-600'}`}>
                        {curator.approval_rate.toFixed(0)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Agent Performance */}
      {analytics.agent_performance.length > 0 && (
        <Card className="p-6 rounded-3xl" data-testid="analytics-agent-performance">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-semibold">Top 10 Corretores</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-muted-foreground border-b">
                  <th className="pb-3 font-medium">#</th>
                  <th className="pb-3 font-medium">Corretor</th>
                  <th className="pb-3 font-medium text-center">Matches</th>
                  <th className="pb-3 font-medium text-center">Aprovados</th>
                  <th className="pb-3 font-medium text-center">Sucesso</th>
                </tr>
              </thead>
              <tbody>
                {analytics.agent_performance.map((agent, index) => (
                  <tr key={agent.id} className="border-b last:border-0">
                    <td className="py-3">
                      <span className={`font-bold ${index < 3 ? 'text-indigo-600' : 'text-muted-foreground'}`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="py-3">
                      <div>
                        <p className="font-medium">{agent.name || 'Sem nome'}</p>
                        {agent.company && <p className="text-xs text-muted-foreground">{agent.company}</p>}
                      </div>
                    </td>
                    <td className="py-3 text-center">
                      <Badge variant="outline">{agent.matches_created}</Badge>
                    </td>
                    <td className="py-3 text-center">
                      <Badge className="bg-green-100 text-green-700">{agent.matches_approved}</Badge>
                    </td>
                    <td className="py-3 text-center">
                      <span className={`font-semibold ${agent.success_rate >= 50 ? 'text-green-600' : 'text-orange-600'}`}>
                        {agent.success_rate.toFixed(0)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Deletion Reasons */}
      {Object.keys(analytics.deletion_reasons).length > 0 && (
        <Card className="p-6 rounded-3xl" data-testid="analytics-deletion-reasons">
          <div className="flex items-center gap-2 mb-4">
            <XCircle className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-semibold">Motivos de Exclusao de Interesses</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(analytics.deletion_reasons).map(([reason, count]) => {
              const reasonLabels = {
                'ja_comprei': 'Ja Comprei',
                'imovel_vendido': 'Imovel Vendido',
                'mudei_planos': 'Mudei de Planos',
                'outro': 'Outro'
              };
              return (
                <div key={reason} className="bg-red-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-red-600">{count}</p>
                  <p className="text-xs text-muted-foreground">{reasonLabels[reason] || reason}</p>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
};

export default AnalyticsDashboard;

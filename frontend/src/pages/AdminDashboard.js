import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { Home, LogOut, Users, Heart, Building2, TrendingUp, CheckCircle, XCircle, Clock, UserPlus, MessageSquare, BarChart3, Shield, AlertTriangle, MapPin, DollarSign, Sparkles, UserCog, FileCheck } from 'lucide-react';
import { toast } from 'sonner';
import CreateCuratorModal from '@/components/CreateCuratorModal';
import MatchFollowUp from '@/components/MatchFollowUp';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import DashboardLoading from '@/components/DashboardLoading';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [buyers, setBuyers] = useState([]);
  const [agents, setAgents] = useState([]);
  const [curators, setCurators] = useState([]);
  const [interests, setInterests] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [curatingMatch, setCuratingMatch] = useState(null);
  const [curationNotes, setCurationNotes] = useState('');
  const [showCreateCurator, setShowCreateCurator] = useState(false);
  const [expandedMatch, setExpandedMatch] = useState(null);

  useEffect(() => {
    if (user?.role !== 'admin' && user?.role !== 'curator') {
      navigate('/');
      return;
    }
    fetchData();
    
    // Auto-refresh a cada 30 segundos
    const interval = setInterval(() => {
      fetchData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      const [statsRes, buyersRes, agentsRes, curatorsRes, interestsRes, matchesRes] = await Promise.all([
        axios.get(`${API}/admin/stats`),
        axios.get(`${API}/admin/buyers`),
        axios.get(`${API}/admin/agents`),
        axios.get(`${API}/admin/curators`).catch(() => ({ data: [] })),
        axios.get(`${API}/admin/interests`),
        axios.get(`${API}/admin/matches`)
      ]);
      setStats(statsRes.data);
      setBuyers(buyersRes.data);
      setAgents(agentsRes.data);
      setCurators(curatorsRes.data);
      setInterests(interestsRes.data);
      setMatches(matchesRes.data);
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleCurate = async (matchId, approved) => {
    try {
      const response = await axios.post(`${API}/curator/matches/${matchId}/decision`, {
        approved,
        notes: curationNotes
      });
      console.log('Curate response:', response.data);
      toast.success(approved ? 'Match aprovado com sucesso!' : 'Match rejeitado');
      setCuratingMatch(null);
      setCurationNotes('');
      await fetchData();
    } catch (error) {
      console.error('Curate error:', error.response?.data || error.message);
      toast.error(error.response?.data?.detail || 'Erro ao processar curadoria');
    }
  };

  const handleCreciStatusUpdate = async (agentId, creci_verified, creci_blocked) => {
    try {
      await axios.put(`${API}/admin/agents/${agentId}/creci-status`, {
        creci_verified,
        creci_blocked
      });
      toast.success(creci_verified ? 'CRECI verificado com sucesso!' : creci_blocked ? 'Corretor bloqueado' : 'Status atualizado');
      fetchData();
    } catch (error) {
      toast.error('Erro ao atualizar status do CRECI');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) {
    return <DashboardLoading message="Carregando painel administrativo..." />;
  }

  const pendingMatches = matches.filter(m => m.status === 'pending_approval');

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-white">
      <header className="bg-white/70 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Home className="w-8 h-8 text-slate-900" />
            <div>
              <h1 className="text-xl font-bold flex items-center gap-0.5" data-testid="admin-dashboard-title">
                <span className="text-slate-900">Match</span>
                <span className="text-indigo-600">Imovel</span>
                <span className="text-slate-900"> - Admin</span>
              </h1>
              <p className="text-sm text-muted-foreground">Olá, {user?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              data-testid="admin-logout-button"
              onClick={handleLogout} 
              variant="outline" 
              className="rounded-full"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
            {user?.role === 'admin' && (
              <Button 
                data-testid="create-curator-button"
                onClick={() => setShowCreateCurator(true)} 
                className="rounded-full bg-gradient-to-r from-indigo-600 to-purple-600"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Cadastrar Curador
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card className="p-4 rounded-2xl" data-testid="admin-stat-buyers">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-indigo-600">{stats.total_buyers}</p>
            <p className="text-xs text-muted-foreground">Compradores</p>
          </Card>

          <Card className="p-4 rounded-2xl" data-testid="admin-stat-agents">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-5 h-5 text-purple-600" />
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-purple-600">{stats.total_agents}</p>
            <p className="text-xs text-muted-foreground">Corretores</p>
          </Card>

          <Card className="p-4 rounded-2xl" data-testid="admin-stat-interests">
            <div className="flex items-center justify-between mb-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-blue-600">{stats.total_interests}</p>
            <p className="text-xs text-muted-foreground">Interesses</p>
          </Card>

          <Card className="p-4 rounded-2xl" data-testid="admin-stat-matches">
            <div className="flex items-center justify-between mb-2">
              <Heart className="w-5 h-5 text-red-600" />
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-red-600">{stats.total_matches}</p>
            <p className="text-xs text-muted-foreground">Total Matches</p>
          </Card>

          <Card className="p-4 rounded-2xl" data-testid="admin-stat-pending">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-orange-600">{stats.pending_matches}</p>
            <p className="text-xs text-muted-foreground">Pendentes</p>
          </Card>

          <Card className="p-4 rounded-2xl" data-testid="admin-stat-approved">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-600">{stats.approved_matches}</p>
            <p className="text-xs text-muted-foreground">Aprovados</p>
          </Card>
        </div>

        {pendingMatches.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="p-6 rounded-3xl bg-gradient-to-r from-orange-500 to-red-500 text-white border-0" data-testid="pending-matches-alert">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8" />
                <div>
                  <h3 className="text-xl font-semibold">
                    {pendingMatches.length} {pendingMatches.length === 1 ? 'Match Pendente' : 'Matches Pendentes'}
                  </h3>
                  <p className="text-orange-50">Aguardando sua aprovação para serem liberados aos compradores</p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        <Tabs defaultValue="pending-matches" className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-6 rounded-xl" data-testid="admin-tabs">
            <TabsTrigger value="pending-matches" className="rounded-lg" data-testid="admin-tab-pending">
              Aprovar {pendingMatches.length > 0 && <Badge className="ml-1 rounded-full">{pendingMatches.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="all-matches" className="rounded-lg" data-testid="admin-tab-matches">Matches</TabsTrigger>
            <TabsTrigger value="buyers" className="rounded-lg" data-testid="admin-tab-buyers">Compradores</TabsTrigger>
            <TabsTrigger value="agents" className="rounded-lg" data-testid="admin-tab-agents">Corretores</TabsTrigger>
            <TabsTrigger value="curators" className="rounded-lg" data-testid="admin-tab-curators">
              <UserCog className="w-4 h-4 mr-1" />
              Curadores
            </TabsTrigger>
            <TabsTrigger value="interests" className="rounded-lg" data-testid="admin-tab-interests">Interesses</TabsTrigger>
            {user?.role === 'admin' && (
              <TabsTrigger value="analytics" className="rounded-lg" data-testid="admin-tab-analytics">
                <BarChart3 className="w-4 h-4 mr-1" />
                Analytics
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="pending-matches" className="space-y-4">
            {pendingMatches.length === 0 ? (
              <Card className="p-12 rounded-3xl text-center" data-testid="no-pending-matches">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Nenhum match pendente</h3>
                <p className="text-muted-foreground">Todos os matches foram processados!</p>
              </Card>
            ) : (
              pendingMatches.map((match) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="p-6 rounded-2xl" data-testid={`pending-match-${match.id}`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                      <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Users className="w-5 h-5 text-indigo-600" />
                          Comprador
                        </h4>
                        <p className="text-lg font-semibold">{match.buyer?.name}</p>
                        <p className="text-sm text-muted-foreground">{match.buyer?.email}</p>
                        {match.interest && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-sm font-medium mb-1">Interesse:</p>
                            <p className="text-sm">{match.interest.property_type} em {match.interest.location}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              R$ {match.interest.min_price?.toLocaleString()} - R$ {match.interest.max_price?.toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Building2 className="w-5 h-5 text-purple-600" />
                          Corretor
                        </h4>
                        <p className="text-lg font-semibold">{match.agent?.name}</p>
                        <p className="text-sm text-muted-foreground">{match.agent?.email}</p>
                        {match.agent?.company && (
                          <p className="text-sm mt-1">{match.agent.company}</p>
                        )}
                      </div>
                    </div>

                    {/* AI Compatibility */}
                    {match.ai_compatibility && (
                      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-4 rounded-xl mb-4 border border-indigo-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="w-5 h-5 text-indigo-600" />
                          <span className="font-semibold text-indigo-700">Análise da IA</span>
                          <Badge className={`ml-auto rounded-full ${match.ai_compatibility.score >= 80 ? 'bg-green-500' : match.ai_compatibility.score >= 60 ? 'bg-yellow-500' : 'bg-orange-500'} text-white`}>
                            {match.ai_compatibility.score}% compatível
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-700 dark:text-slate-300">{match.ai_compatibility.justificativa}</p>
                        {match.ai_compatibility.property_description && (
                          <div className="mt-3 pt-3 border-t border-indigo-200">
                            <p className="text-xs text-muted-foreground mb-1">Descrição do imóvel pelo corretor:</p>
                            <p className="text-sm italic text-slate-600 dark:text-slate-400">"{match.ai_compatibility.property_description}"</p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl mb-4">
                      <p className="text-sm text-muted-foreground mb-2">Criado em</p>
                      <p className="font-medium">{new Date(match.created_at).toLocaleString('pt-BR')}</p>
                    </div>

                    {curatingMatch === match.id ? (
                      <div className="space-y-4 border-t pt-4">
                        <div>
                          <Label className="text-base">Observações da Curadoria (opcional)</Label>
                          <Textarea
                            data-testid={`curation-notes-${match.id}`}
                            value={curationNotes}
                            onChange={(e) => setCurationNotes(e.target.value)}
                            className="mt-2 rounded-xl"
                            placeholder="Adicione observações sobre este match..."
                          />
                        </div>
                        <div className="flex gap-3">
                          <Button
                            data-testid={`approve-match-${match.id}`}
                            onClick={() => handleCurate(match.id, true)}
                            className="flex-1 rounded-full bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Aprovar Match
                          </Button>
                          <Button
                            data-testid={`reject-match-${match.id}`}
                            onClick={() => handleCurate(match.id, false)}
                            variant="outline"
                            className="flex-1 rounded-full border-red-600 text-red-600 hover:bg-red-50"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Rejeitar
                          </Button>
                          <Button
                            onClick={() => {
                              setCuratingMatch(null);
                              setCurationNotes('');
                            }}
                            variant="ghost"
                            className="rounded-full"
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        data-testid={`curate-match-${match.id}`}
                        onClick={() => setCuratingMatch(match.id)}
                        className="w-full rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500"
                      >
                        Analisar Match
                      </Button>
                    )}
                  </Card>
                </motion.div>
              ))
            )}
          </TabsContent>

          <TabsContent value="all-matches" className="space-y-4">
            {matches.map((match) => (
              <Card key={match.id} className="p-6 rounded-2xl" data-testid={`match-${match.id}`}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-semibold">{match.buyer?.name} - {match.agent?.name}</h3>
                    <p className="text-sm text-muted-foreground">{new Date(match.created_at).toLocaleDateString('pt-BR')}</p>
                    {match.curator_name && (
                      <p className="text-xs text-muted-foreground mt-1">Curado por: {match.curator_name}</p>
                    )}
                  </div>
                  <Badge className="rounded-full">
                    {match.status === 'pending_approval' ? 'Pendente' :
                     match.status === 'approved' ? 'Aprovado' :
                     match.status === 'rejected' ? 'Rejeitado' : match.status}
                  </Badge>
                </div>
                {match.interest && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {match.interest.property_type} em {match.interest.location}
                  </p>
                )}
                
                {/* AI Compatibility */}
                {match.ai_compatibility && (
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-3 rounded-xl mb-4 border border-indigo-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      <span className="text-sm font-semibold text-indigo-700">Análise da IA</span>
                      <Badge className={`ml-auto rounded-full text-xs ${match.ai_compatibility.score >= 80 ? 'bg-green-500' : match.ai_compatibility.score >= 60 ? 'bg-yellow-500' : 'bg-orange-500'} text-white`}>
                        {match.ai_compatibility.score}%
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600">{match.ai_compatibility.justificativa}</p>
                  </div>
                )}
                
                {match.status === 'approved' && (
                  <div className="mt-4 pt-4 border-t">
                    <Button
                      data-testid={`toggle-followup-${match.id}`}
                      onClick={() => setExpandedMatch(expandedMatch === match.id ? null : match.id)}
                      variant="outline"
                      className="rounded-full w-full"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      {expandedMatch === match.id ? 'Ocultar CRM' : 'Ver CRM / Follow-ups'}
                    </Button>
                    
                    {expandedMatch === match.id && (
                      <div className="mt-4">
                        <MatchFollowUp match={match} />
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="buyers" className="space-y-4">
            {buyers.map((buyer) => (
              <Card key={buyer.id} className="p-6 rounded-2xl" data-testid={`buyer-${buyer.id}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">{buyer.name}</h3>
                    <p className="text-sm text-muted-foreground">{buyer.email}</p>
                    {buyer.phone && <p className="text-sm text-muted-foreground">{buyer.phone}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{buyer.interest_count} interesses</p>
                    <p className="text-sm text-muted-foreground">{buyer.match_count} matches</p>
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="agents" className="space-y-4">
            {agents.map((agent) => (
              <Card key={agent.id} className={`p-6 rounded-2xl ${agent.creci_blocked ? 'border-2 border-red-300 bg-red-50' : ''}`} data-testid={`agent-${agent.id}`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      {agent.name}
                      {agent.creci_verified && !agent.creci_blocked && (
                        <Badge className="bg-green-100 text-green-700 rounded-full text-xs">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          CRECI Verificado
                        </Badge>
                      )}
                      {agent.creci_blocked && (
                        <Badge className="bg-red-100 text-red-700 rounded-full text-xs">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Bloqueado
                        </Badge>
                      )}
                    </h3>
                    <p className="text-sm text-muted-foreground">{agent.email}</p>
                    {agent.phone && <p className="text-sm text-muted-foreground">{agent.phone}</p>}
                    {agent.company && <p className="text-sm font-medium mt-1">{agent.company}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{agent.match_count} matches</p>
                  </div>
                </div>

                {/* CRECI Info */}
                <div className="bg-slate-50 p-4 rounded-xl mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-indigo-600" />
                    <span className="font-medium text-sm">CRECI</span>
                  </div>
                  <p className="text-lg font-semibold text-indigo-700">
                    {agent.creci_uf || ''}{agent.creci || 'Não informado'}
                  </p>
                </div>

                {/* Compliance - Termos de Parceria */}
                {agent.terms_accepted && (
                  <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FileCheck className="w-4 h-4 text-emerald-600" />
                      <p className="text-xs font-semibold text-emerald-700">Termo de Parceria Aceito</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Data/Hora: </span>
                        <span className="font-medium">
                          {agent.terms_accepted_at 
                            ? new Date(agent.terms_accepted_at).toLocaleString('pt-BR', { 
                                day: '2-digit', month: '2-digit', year: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                              })
                            : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">IP: </span>
                        <span className="font-mono font-medium">{agent.terms_accepted_ip || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* CRECI Verification Checkboxes */}
                <div className="border-t pt-4 space-y-3">
                  <p className="text-sm font-medium text-slate-600">Verificação do CRECI:</p>
                  
                  <div className="flex flex-col gap-3">
                    {/* Checkbox: CRECI Verificado */}
                    <label 
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                        agent.creci_verified && !agent.creci_blocked
                          ? 'bg-green-50 border-2 border-green-300'
                          : 'bg-slate-50 border-2 border-slate-200 hover:border-green-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={agent.creci_verified && !agent.creci_blocked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleCreciStatusUpdate(agent.user_id, true, false);
                          } else {
                            handleCreciStatusUpdate(agent.user_id, false, false);
                          }
                        }}
                        className="w-5 h-5 rounded border-2 border-green-500 text-green-600 focus:ring-green-500"
                        data-testid={`creci-verified-${agent.user_id}`}
                      />
                      <div>
                        <span className="font-medium text-green-700">CRECI Verificado, OK e Ativo</span>
                        <p className="text-xs text-green-600">Marque após verificar que o CRECI está ativo e válido</p>
                      </div>
                    </label>

                    {/* Checkbox: CRECI Inativo/Inválido */}
                    <label 
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                        agent.creci_blocked
                          ? 'bg-red-50 border-2 border-red-300'
                          : 'bg-slate-50 border-2 border-slate-200 hover:border-red-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={agent.creci_blocked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleCreciStatusUpdate(agent.user_id, false, true);
                          } else {
                            handleCreciStatusUpdate(agent.user_id, false, false);
                          }
                        }}
                        className="w-5 h-5 rounded border-2 border-red-500 text-red-600 focus:ring-red-500"
                        data-testid={`creci-blocked-${agent.user_id}`}
                      />
                      <div>
                        <span className="font-medium text-red-700">CRECI Inativo ou Inválido</span>
                        <p className="text-xs text-red-600">Bloqueia o acesso do corretor até regularização</p>
                      </div>
                    </label>
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>

          {/* Curators Tab */}
          <TabsContent value="curators" className="space-y-4">
            {curators.length === 0 ? (
              <Card className="p-12 rounded-3xl text-center">
                <UserCog className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Nenhum curador cadastrado</h3>
                <p className="text-muted-foreground mb-4">Crie o primeiro curador para começar a avaliar matches</p>
                <Button onClick={() => setShowCreateCurator(true)} className="rounded-full">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Criar Curador
                </Button>
              </Card>
            ) : (
              curators.map((curator) => {
                const curatorMatches = matches.filter(m => m.curator_id === curator.id);
                const pendingCount = curatorMatches.filter(m => m.status === 'pending_approval').length;
                const approvedCount = curatorMatches.filter(m => ['approved', 'visit_scheduled', 'completed'].includes(m.status)).length;
                const rejectedCount = curatorMatches.filter(m => m.status === 'rejected').length;
                
                return (
                  <Card key={curator.id} className="p-6 rounded-2xl" data-testid={`curator-${curator.id}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <UserCog className="w-5 h-5 text-indigo-600" />
                          {curator.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">{curator.email}</p>
                        {curator.phone && <p className="text-sm text-muted-foreground">{curator.phone}</p>}
                      </div>
                      <Badge className="rounded-full bg-indigo-100 text-indigo-700">
                        {curator.curated_matches || 0} matches curados
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="bg-orange-50 p-3 rounded-xl text-center">
                        <p className="text-2xl font-bold text-orange-600">{pendingCount}</p>
                        <p className="text-xs text-muted-foreground">Pendentes</p>
                      </div>
                      <div className="bg-green-50 p-3 rounded-xl text-center">
                        <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
                        <p className="text-xs text-muted-foreground">Aprovados</p>
                      </div>
                      <div className="bg-red-50 p-3 rounded-xl text-center">
                        <p className="text-2xl font-bold text-red-600">{rejectedCount}</p>
                        <p className="text-xs text-muted-foreground">Rejeitados</p>
                      </div>
                    </div>
                    
                    {curatorMatches.length > 0 && (
                      <div className="border-t pt-4">
                        <p className="text-sm font-semibold mb-2">Últimos matches avaliados:</p>
                        <div className="space-y-2">
                          {curatorMatches.slice(0, 3).map(match => (
                            <div key={match.id} className="flex items-center justify-between bg-slate-50 p-2 rounded-lg text-sm">
                              <span>{match.buyer?.name} ↔ {match.agent?.name}</span>
                              <Badge className={`rounded-full text-xs ${
                                match.status === 'approved' ? 'bg-green-100 text-green-700' :
                                match.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                'bg-orange-100 text-orange-700'
                              }`}>
                                {match.status === 'pending_approval' ? 'Pendente' :
                                 match.status === 'approved' ? 'Aprovado' :
                                 match.status === 'rejected' ? 'Rejeitado' : match.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="interests" className="space-y-4">
            {interests.map((interest) => {
              const budgetLabels = {
                'ate_400k': 'Até R$ 400 mil',
                '400k_550k': 'R$ 400 a 550 mil',
                '550k_700k': 'R$ 550 a 700 mil',
                '700k_800k': 'R$ 700 a 800 mil',
                '800k_1500k': 'R$ 800 mil a 1,5 mi',
                'acima_1500k': 'Acima de R$ 1,5 mi'
              };
              const ambianceLabels = {
                'aconchegante': 'Aconchegante com plantas e madeira',
                'amplo_moderno': 'Amplo e moderno com luz natural',
                'minimalista': 'Minimalista e funcional',
                'casa_campo': 'Tranquilidade de casa de campo',
                'alto_padrao': 'Sofisticação e alto padrão'
              };
              const profileLabels = {
                'primeiro_imovel': 'Primeiro Imóvel',
                'sair_aluguel': 'Sair do Aluguel',
                'melhor_localizacao': 'Mudança por Localização',
                'familia_cresceu': 'Família Cresceu',
                'investidor': 'Investidor'
              };
              
              return (
                <Card key={interest.id} className="p-6 rounded-2xl" data-testid={`interest-${interest.id}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Building2 className="w-5 h-5 text-indigo-600" />
                        <h3 className="text-lg font-semibold">{interest.property_type}</h3>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        {interest.location}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={`rounded-full ${interest.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100'}`}>
                        {interest.status === 'active' ? 'Ativo' : interest.status}
                      </Badge>
                      {interest.ai_profile && (
                        <Badge className="rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs mt-1 block">
                          {interest.ai_profile}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <div className="bg-slate-50 p-3 rounded-xl">
                      <p className="text-xs text-muted-foreground">Comprador</p>
                      <p className="font-semibold text-sm">{interest.buyer?.name || 'N/A'}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl">
                      <p className="text-xs text-muted-foreground">Orçamento</p>
                      <p className="font-semibold text-sm flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        {budgetLabels[interest.budget_range] || `${interest.min_price?.toLocaleString()} - ${interest.max_price?.toLocaleString()}`}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl">
                      <p className="text-xs text-muted-foreground">Perfil</p>
                      <p className="font-semibold text-sm">{profileLabels[interest.profile_type] || interest.profile_type || 'N/A'}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl">
                      <p className="text-xs text-muted-foreground">Quartos</p>
                      <p className="font-semibold text-sm">{interest.bedrooms || 'Não especificado'}</p>
                    </div>
                  </div>
                  
                  {interest.ambiance && (
                    <div className="bg-indigo-50 p-3 rounded-xl mb-3">
                      <p className="text-xs text-muted-foreground mb-1">Ambiente Ideal</p>
                      <p className="text-sm">{ambianceLabels[interest.ambiance] || interest.ambiance}</p>
                    </div>
                  )}
                  
                  {interest.deal_breakers && interest.deal_breakers.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-muted-foreground mb-2">Não aceita:</p>
                      <div className="flex flex-wrap gap-1">
                        {interest.deal_breakers.map((item, idx) => (
                          <Badge key={idx} variant="outline" className="rounded-full text-xs bg-red-50 text-red-700 border-red-200">
                            {item.split('—')[0].trim()}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {interest.features && interest.features.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-muted-foreground mb-2">Características desejadas:</p>
                      <div className="flex flex-wrap gap-1">
                        {interest.features.map((feature, idx) => (
                          <Badge key={idx} variant="secondary" className="rounded-full text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {interest.proximity_needs && interest.proximity_needs.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-muted-foreground mb-2">Precisa proximidade de:</p>
                      <div className="flex flex-wrap gap-1">
                        {interest.proximity_needs.map((item, idx) => (
                          <Badge key={idx} variant="outline" className="rounded-full text-xs bg-green-50 text-green-700 border-green-200">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Compliance - Termos de Uso */}
                  {interest.terms_accepted && (
                    <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <FileCheck className="w-4 h-4 text-emerald-600" />
                        <p className="text-xs font-semibold text-emerald-700">Termos de Uso Aceitos</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Data/Hora: </span>
                          <span className="font-medium">
                            {interest.terms_accepted_at 
                              ? new Date(interest.terms_accepted_at).toLocaleString('pt-BR', { 
                                  day: '2-digit', month: '2-digit', year: 'numeric',
                                  hour: '2-digit', minute: '2-digit'
                                })
                              : 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">IP: </span>
                          <span className="font-mono font-medium">{interest.terms_accepted_ip || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="text-xs text-muted-foreground pt-3 border-t">
                    Cadastrado em {new Date(interest.created_at).toLocaleDateString('pt-BR')}
                  </div>
                </Card>
              );
            })}
          </TabsContent>

          {user?.role === 'admin' && (
            <TabsContent value="analytics">
              <AnalyticsDashboard />
            </TabsContent>
          )}
        </Tabs>
      </div>

      {showCreateCurator && (
        <CreateCuratorModal
          onClose={() => setShowCreateCurator(false)}
          onSuccess={() => {
            setShowCreateCurator(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
};

export default AdminDashboard;

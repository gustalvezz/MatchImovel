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
import { Home, LogOut, Users, Heart, Building2, TrendingUp, CheckCircle, XCircle, Clock, UserPlus, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import CreateCuratorModal from '@/components/CreateCuratorModal';
import MatchFollowUp from '@/components/MatchFollowUp';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [buyers, setBuyers] = useState([]);
  const [agents, setAgents] = useState([]);
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
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      const [statsRes, buyersRes, agentsRes, interestsRes, matchesRes] = await Promise.all([
        axios.get(`${API}/admin/stats`),
        axios.get(`${API}/admin/buyers`),
        axios.get(`${API}/admin/agents`),
        axios.get(`${API}/admin/interests`),
        axios.get(`${API}/admin/matches`)
      ]);
      setStats(statsRes.data);
      setBuyers(buyersRes.data);
      setAgents(agentsRes.data);
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
      await axios.post(`${API}/curator/curate/${matchId}`, {
        approved,
        notes: curationNotes
      });
      toast.success(approved ? 'Match aprovado com sucesso!' : 'Match rejeitado');
      setCuratingMatch(null);
      setCurationNotes('');
      fetchData();
    } catch (error) {
      toast.error('Erro ao processar curadoria');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-muted-foreground">Carregando...</div>
      </div>
    );
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
          <TabsList className="grid w-full grid-cols-5 mb-6 rounded-xl" data-testid="admin-tabs">
            <TabsTrigger value="pending-matches" className="rounded-lg" data-testid="admin-tab-pending">
              Aprovar Matches {pendingMatches.length > 0 && <Badge className="ml-2 rounded-full">{pendingMatches.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="all-matches" className="rounded-lg" data-testid="admin-tab-matches">Todos Matches</TabsTrigger>
            <TabsTrigger value="buyers" className="rounded-lg" data-testid="admin-tab-buyers">Compradores</TabsTrigger>
            <TabsTrigger value="agents" className="rounded-lg" data-testid="admin-tab-agents">Corretores</TabsTrigger>
            <TabsTrigger value="interests" className="rounded-lg" data-testid="admin-tab-interests">Interesses</TabsTrigger>
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
              <Card key={agent.id} className="p-6 rounded-2xl" data-testid={`agent-${agent.id}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">{agent.name}</h3>
                    <p className="text-sm text-muted-foreground">{agent.email}</p>
                    {agent.phone && <p className="text-sm text-muted-foreground">{agent.phone}</p>}
                    {agent.company && <p className="text-sm font-medium mt-1">{agent.company}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{agent.match_count} matches</p>
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="interests" className="space-y-4">
            {interests.map((interest) => (
              <Card key={interest.id} className="p-6 rounded-2xl" data-testid={`interest-${interest.id}`}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-semibold">{interest.property_type}</h3>
                    <p className="text-sm text-muted-foreground">{interest.location}</p>
                    <p className="text-xs text-muted-foreground mt-1">Por: {interest.buyer_name}</p>
                  </div>
                  <Badge className="rounded-full">{interest.status}</Badge>
                </div>
                <p className="text-sm">
                  R$ {interest.min_price?.toLocaleString()} - R$ {interest.max_price?.toLocaleString()}
                </p>
              </Card>
            ))}
          </TabsContent>
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

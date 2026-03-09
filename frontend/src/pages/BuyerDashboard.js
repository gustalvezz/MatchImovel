import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/AuthContext';
import { Home, Plus, Heart, Calendar, LogOut, Building2, MapPin, DollarSign, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import CreateInterestModal from '@/components/CreateInterestModal';
import EditInterestModal from '@/components/EditInterestModal';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const BuyerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [interests, setInterests] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedInterest, setSelectedInterest] = useState(null);

  useEffect(() => {
    fetchData();
    
    // Auto-refresh a cada 30 segundos
    const interval = setInterval(() => {
      fetchData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [interestsRes, matchesRes] = await Promise.all([
        axios.get(`${API}/buyers/my-interests`),
        axios.get(`${API}/buyers/my-matches`)
      ]);
      setInterests(interestsRes.data);
      setMatches(matchesRes.data);
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'pending_info': { label: 'Aguardando Informações', variant: 'default' },
      'pending_approval': { label: 'Em Análise', variant: 'secondary' },
      'approved': { label: 'Aprovado', variant: 'default' },
      'rejected': { label: 'Não Aprovado', variant: 'destructive' },
      'visit_scheduled': { label: 'Visita Agendada', variant: 'default' },
      'completed': { label: 'Concluído', variant: 'default' }
    };
    
    const config = statusMap[status] || { label: status, variant: 'default' };
    return <Badge variant={config.variant} className="rounded-full">{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-white">
      {/* Header */}
      <header className="bg-white/70 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Home className="w-8 h-8 text-slate-900" />
            <div>
              <h1 className="text-xl font-bold flex items-center gap-0.5" data-testid="dashboard-title">
                <span className="text-slate-900">Match</span>
                <span className="text-indigo-600">Imovel</span>
              </h1>
              <p className="text-sm text-muted-foreground">Olá, {user?.name}</p>
            </div>
          </div>
          <Button 
            data-testid="logout-button"
            onClick={handleLogout} 
            variant="outline" 
            className="rounded-full"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="p-8 rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white border-0" data-testid="welcome-card">
            <h2 className="text-3xl font-semibold mb-2">Bem-vindo ao seu Dashboard</h2>
            <p className="text-indigo-100 mb-6">Gerencie seus interesses e acompanhe matches com corretores</p>
            <Button 
              data-testid="create-interest-button"
              onClick={() => setShowCreateModal(true)}
              className="rounded-full h-12 px-8 bg-white text-indigo-600 hover:bg-slate-50 font-medium"
            >
              <Plus className="w-5 h-5 mr-2" />
              Cadastrar Novo Interesse
            </Button>
          </Card>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 rounded-2xl" data-testid="stat-interests">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Interesses Ativos</p>
                <p className="text-3xl font-bold text-primary">{interests.filter(i => i.status === 'active').length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6 rounded-2xl" data-testid="stat-matches">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Matches Recebidos</p>
                <p className="text-3xl font-bold text-secondary">{matches.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <Heart className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6 rounded-2xl" data-testid="stat-visits">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Visitas Agendadas</p>
                <p className="text-3xl font-bold text-accent">{matches.filter(m => m.status === 'visit_scheduled').length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="interests" className="w-full">
          <TabsList className="grid w-full md:w-auto grid-cols-2 mb-6 rounded-xl" data-testid="dashboard-tabs">
            <TabsTrigger value="interests" className="rounded-lg" data-testid="tab-interests">Meus Interesses</TabsTrigger>
            <TabsTrigger value="matches" className="rounded-lg" data-testid="tab-matches">Matches Recebidos</TabsTrigger>
          </TabsList>

          <TabsContent value="interests" className="space-y-4">
            {interests.length === 0 ? (
              <Card className="p-12 rounded-3xl text-center" data-testid="no-interests-message">
                <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Nenhum interesse cadastrado</h3>
                <p className="text-muted-foreground mb-6">Cadastre seu primeiro interesse e comece a receber matches!</p>
                <Button 
                  data-testid="create-first-interest-button"
                  onClick={() => setShowCreateModal(true)}
                  className="rounded-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Cadastrar Interesse
                </Button>
              </Card>
            ) : (
              interests.map((interest) => (
                <motion.div
                  key={interest.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="p-6 rounded-2xl hover:shadow-lg transition-all" data-testid={`interest-card-${interest.id}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-2">{interest.property_type}</h3>
                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                          <MapPin className="w-4 h-4" />
                          <span>{interest.location}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="rounded-full" variant={interest.status === 'active' ? 'default' : 'secondary'}>
                          {interest.status === 'active' ? 'Ativo' : 'Inativo'}
                        </Badge>
                        <Button
                          data-testid={`edit-interest-${interest.id}`}
                          onClick={() => {
                            setSelectedInterest(interest);
                            setShowEditModal(true);
                          }}
                          variant="ghost"
                          size="icon"
                          className="rounded-full"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          data-testid={`delete-interest-${interest.id}`}
                          onClick={() => {
                            setSelectedInterest(interest);
                            setShowDeleteModal(true);
                          }}
                          variant="ghost"
                          size="icon"
                          className="rounded-full text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Orçamento</p>
                        <p className="font-semibold flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          R$ {interest.min_price?.toLocaleString()} - R$ {interest.max_price?.toLocaleString()}
                        </p>
                      </div>
                      {interest.bedrooms && (
                        <div>
                          <p className="text-sm text-muted-foreground">Quartos</p>
                          <p className="font-semibold">{interest.bedrooms}</p>
                        </div>
                      )}
                    </div>

                    {interest.neighborhoods && interest.neighborhoods.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm text-muted-foreground mb-2">Bairros de Interesse</p>
                        <div className="flex flex-wrap gap-2">
                          {interest.neighborhoods.map((neighborhood, idx) => (
                            <Badge key={idx} variant="outline" className="rounded-full">{neighborhood}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {interest.features && interest.features.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Características Desejadas</p>
                        <div className="flex flex-wrap gap-2">
                          {interest.features.map((feature, idx) => (
                            <Badge key={idx} variant="secondary" className="rounded-full">{feature}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                </motion.div>
              ))
            )}
          </TabsContent>

          <TabsContent value="matches" className="space-y-4">
            {matches.length === 0 ? (
              <Card className="p-12 rounded-3xl text-center" data-testid="no-matches-message">
                <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Nenhum match ainda</h3>
                <p className="text-muted-foreground">Quando um corretor encontrar um imóvel perfeito para você, aparecerá aqui!</p>
              </Card>
            ) : (
              matches.map((match) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="p-6 rounded-2xl hover:shadow-lg transition-all" data-testid={`match-card-${match.id}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold mb-2">Novo Match!</h3>
                        <p className="text-muted-foreground">Corretor: {match.agent?.name || 'Não disponível'}</p>
                      </div>
                      {getStatusBadge(match.status)}
                    </div>

                    {match.interest && (
                      <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl mb-4">
                        <p className="text-sm text-muted-foreground mb-1">Interesse relacionado</p>
                        <p className="font-semibold">{match.interest.property_type} em {match.interest.location}</p>
                      </div>
                    )}

                    <p className="text-sm text-muted-foreground">
                      Criado em: {new Date(match.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </Card>
                </motion.div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {showCreateModal && (
        <CreateInterestModal 
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchData();
          }}
        />
      )}

      {showEditModal && selectedInterest && (
        <EditInterestModal
          interest={selectedInterest}
          onClose={() => {
            setShowEditModal(false);
            setSelectedInterest(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedInterest(null);
            fetchData();
          }}
        />
      )}

      {showDeleteModal && selectedInterest && (
        <DeleteConfirmModal
          type="interest"
          item={selectedInterest}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedInterest(null);
          }}
          onSuccess={() => {
            setShowDeleteModal(false);
            setSelectedInterest(null);
            fetchData();
          }}
        />
      )}
    </div>
  );
};

export default BuyerDashboard;

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/AuthContext';
import { Home, LogOut, Users, Heart, Search, DollarSign, MapPin, Building2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AgentDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [buyers, setBuyers] = useState([]);
  const [myMatches, setMyMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);

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
      const [buyersRes, matchesRes] = await Promise.all([
        axios.get(`${API}/agents/buyers`),
        axios.get(`${API}/agents/my-matches`)
      ]);
      setBuyers(buyersRes.data);
      setMyMatches(matchesRes.data);
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleMatch = async (buyerId, interestId) => {
    try {
      await axios.post(`${API}/agents/match`, {
        buyer_id: buyerId,
        interest_id: interestId
      });
      toast.success('Seu Match foi enviado com sucesso e está em análise, aguarde o nosso contato para enviar mais informações sobre o imóvel.');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao criar match');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const filteredBuyers = buyers.filter(buyer => {
    // Filter out buyers that already have a match with this agent
    const hasMatchWithThisAgent = myMatches.some(
      match => match.interest_id === buyer.id
    );
    
    if (hasMatchWithThisAgent) {
      return false;
    }
    
    // Apply search filter
    return (
      buyer.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      buyer.property_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      buyer.buyer_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

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
              <h1 className="text-xl font-bold flex items-center gap-0.5" data-testid="agent-dashboard-title">
                <span className="text-slate-900">Match</span>
                <span className="text-indigo-600">Imovel</span>
                <span className="text-slate-900"> - Corretor</span>
              </h1>
              <p className="text-sm text-muted-foreground">Olá, {user?.name}</p>
            </div>
          </div>
          <Button 
            data-testid="agent-logout-button"
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
          <Card className="p-8 rounded-3xl bg-gradient-to-br from-secondary to-green-500 text-white border-0" data-testid="agent-welcome-card">
            <h2 className="text-3xl font-semibold mb-2">Comissão 60/40 a seu Favor</h2>
            <p className="text-green-50 mb-4">Encontre compradores qualificados e aumente seus ganhos</p>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span>{buyers.length} compradores ativos</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5" />
                <span>{myMatches.length} meus matches</span>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 rounded-2xl" data-testid="agent-stat-buyers">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Compradores Disponíveis</p>
                <p className="text-3xl font-bold text-primary">{buyers.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6 rounded-2xl" data-testid="agent-stat-matches">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Meus Matches</p>
                <p className="text-3xl font-bold text-secondary">{myMatches.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <Heart className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6 rounded-2xl" data-testid="agent-stat-commission">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Sua Comissão</p>
                <p className="text-3xl font-bold text-accent">60%</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="buyers" className="w-full">
          <TabsList className="grid w-full md:w-auto grid-cols-2 mb-6 rounded-xl" data-testid="agent-dashboard-tabs">
            <TabsTrigger value="buyers" className="rounded-lg" data-testid="agent-tab-buyers">Buscar Compradores</TabsTrigger>
            <TabsTrigger value="my-matches" className="rounded-lg" data-testid="agent-tab-matches">Meus Matches</TabsTrigger>
          </TabsList>

          <TabsContent value="buyers" className="space-y-4">
            {/* Search */}
            <Card className="p-4 rounded-2xl mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  data-testid="agent-search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 rounded-xl"
                  placeholder="Buscar por localização, tipo de imóvel..."
                />
              </div>
            </Card>

            {filteredBuyers.length === 0 ? (
              <Card className="p-12 rounded-3xl text-center" data-testid="no-buyers-message">
                <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Nenhum comprador encontrado</h3>
                <p className="text-muted-foreground">Tente ajustar sua busca</p>
              </Card>
            ) : (
              filteredBuyers.map((interest) => (
                <motion.div
                  key={interest.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="p-6 rounded-2xl hover:shadow-lg transition-all" data-testid={`buyer-card-${interest.id}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold">{interest.property_type}</h3>
                          <Badge className="rounded-full" variant="secondary">
                            {interest.buyer_name || 'Comprador'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground mb-3">
                          <MapPin className="w-4 h-4" />
                          <span>{interest.location}</span>
                        </div>
                      </div>
                      <Button
                        data-testid={`match-button-${interest.id}`}
                        onClick={() => handleMatch(interest.buyer_id, interest.id)}
                        className="rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500"
                      >
                        <Heart className="w-4 h-4 mr-2" />
                        Dar Match
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Orçamento</p>
                        <p className="font-semibold text-sm flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          R$ {interest.min_price?.toLocaleString()} - {interest.max_price?.toLocaleString()}
                        </p>
                      </div>
                      {interest.bedrooms && (
                        <div>
                          <p className="text-sm text-muted-foreground">Quartos</p>
                          <p className="font-semibold">{interest.bedrooms}</p>
                        </div>
                      )}
                      {interest.bathrooms && (
                        <div>
                          <p className="text-sm text-muted-foreground">Banheiros</p>
                          <p className="font-semibold">{interest.bathrooms}</p>
                        </div>
                      )}
                      {interest.parking_spaces && (
                        <div>
                          <p className="text-sm text-muted-foreground">Vagas</p>
                          <p className="font-semibold">{interest.parking_spaces}</p>
                        </div>
                      )}
                    </div>

                    {interest.neighborhoods && interest.neighborhoods.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm text-muted-foreground mb-2">Bairros</p>
                        <div className="flex flex-wrap gap-2">
                          {interest.neighborhoods.map((n, idx) => (
                            <Badge key={idx} variant="outline" className="rounded-full text-xs">{n}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {interest.features && interest.features.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Características</p>
                        <div className="flex flex-wrap gap-2">
                          {interest.features.map((f, idx) => (
                            <Badge key={idx} variant="secondary" className="rounded-full text-xs">{f}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                </motion.div>
              ))
            )}
          </TabsContent>

          <TabsContent value="my-matches" className="space-y-4">
            {myMatches.length === 0 ? (
              <Card className="p-12 rounded-3xl text-center" data-testid="no-agent-matches-message">
                <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Nenhum match ainda</h3>
                <p className="text-muted-foreground">Comece dando match nos compradores!</p>
              </Card>
            ) : (
              myMatches.map((match) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="p-6 rounded-2xl hover:shadow-lg transition-all" data-testid={`agent-match-card-${match.id}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-2">Match com {match.buyer?.name}</h3>
                        <Badge className="rounded-full">
                          {match.status === 'pending_info' ? 'Aguardando Informações' :
                           match.status === 'pending_approval' ? 'Em Análise' :
                           match.status === 'approved' ? 'Aprovado' :
                           match.status === 'rejected' ? 'Não Aprovado' : match.status}
                        </Badge>
                      </div>
                      <Button
                        data-testid={`delete-match-${match.id}`}
                        onClick={() => {
                          setSelectedMatch(match);
                          setShowDeleteModal(true);
                        }}
                        variant="ghost"
                        size="icon"
                        className="rounded-full text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    {match.interest && (
                      <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          <p className="font-semibold">{match.interest.property_type}</p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          <span>{match.interest.location}</span>
                        </div>
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

      {showDeleteModal && selectedMatch && (
        <DeleteConfirmModal
          type="match"
          item={selectedMatch}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedMatch(null);
          }}
          onSuccess={() => {
            setShowDeleteModal(false);
            setSelectedMatch(null);
            fetchData();
          }}
        />
      )}
    </div>
  );
};

export default AgentDashboard;

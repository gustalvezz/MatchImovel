import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/AuthContext';
import { Home, LogOut, Users, Heart, DollarSign, MapPin, Building2, Trash2, Sparkles, Loader2, Filter } from 'lucide-react';
import { toast } from 'sonner';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import PropertyInfoModal from '@/components/PropertyInfoModal';
import { Input } from '@/components/ui/input';
import DashboardLoading from '@/components/DashboardLoading';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AgentDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [buyers, setBuyers] = useState([]);
  const [myMatches, setMyMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [selectedInterest, setSelectedInterest] = useState(null);
  
  // AI Discovery state
  const [propertyDescription, setPropertyDescription] = useState('');
  const [propertyPrice, setPropertyPrice] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [aiResults, setAiResults] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [totalEvaluated, setTotalEvaluated] = useState(0);
  const [prefilterStats, setPrefilterStats] = useState(null);

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
    // Open modal to collect property info
    const interest = buyers.find(b => b.id === interestId);
    setSelectedInterest({
      ...interest,
      buyer_id: buyerId,
      interest_id: interestId
    });
    setShowPropertyModal(true);
  };

  const handlePropertySubmit = async (propertyInfo) => {
    try {
      await axios.post(`${API}/agents/match`, {
        buyer_id: selectedInterest.buyer_id,
        interest_id: selectedInterest.interest_id,
        property_info: propertyInfo,
        ai_compatibility: selectedInterest.ai_compatibility || null
      });
      toast.success('Seu Match foi enviado com sucesso e está em análise, aguarde o nosso contato.');
      setShowPropertyModal(false);
      setSelectedInterest(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao criar match');
      throw error;
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // AI Discovery function
  const handleAIDiscovery = async () => {
    // Validate required fields
    if (!propertyPrice || parseFloat(propertyPrice) <= 0) {
      toast.error('Por favor, informe o valor do imóvel');
      return;
    }
    
    if (!propertyType) {
      toast.error('Por favor, selecione o tipo do imóvel');
      return;
    }
    
    if (!propertyDescription || propertyDescription.trim().length < 20) {
      toast.error('Por favor, descreva o imóvel com mais detalhes (mínimo 20 caracteres)');
      return;
    }
    
    setAiLoading(true);
    setHasSearched(true);
    
    try {
      // Build request payload with required pre-filter fields
      const payload = {
        property_description: propertyDescription,
        property_price: parseFloat(propertyPrice),
        property_type: propertyType
      };
      
      const response = await axios.post(`${API}/agents/ai-discovery`, payload);
      
      setAiResults(response.data.matches);
      setTotalEvaluated(response.data.total_evaluated);
      
      // Store pre-filter stats
      setPrefilterStats({
        total_before_prefilter: response.data.total_before_prefilter,
        filtered_by_budget: response.data.filtered_by_budget,
        filtered_by_type: response.data.filtered_by_type,
        sent_to_ai: response.data.sent_to_ai
      });
      
      if (response.data.matches.length > 0) {
        toast.success(`Encontramos ${response.data.matches.length} compradores compatíveis!`);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao buscar compradores. Tente novamente.');
      setAiResults([]);
      setPrefilterStats(null);
    } finally {
      setAiLoading(false);
    }
  };

  // Handle match from AI results
  const handleMatchFromAI = (result) => {
    setSelectedInterest({
      id: result.comprador_id,
      buyer_id: result.buyer_id,
      interest_id: result.comprador_id,
      buyer_name: result.buyer_name,
      property_type: result.property_type,
      location: result.location,
      ai_compatibility: {
        score: result.score,
        justificativa: result.justificativa,
        property_description: propertyDescription
      }
    });
    setShowPropertyModal(true);
  };

  // Get score badge color
  const getScoreBadgeClass = (score) => {
    if (score >= 80) return 'bg-green-500 text-white';
    if (score >= 60) return 'bg-yellow-500 text-white';
    return 'bg-orange-500 text-white';
  };

  // Check if there's an existing match for this interest
  const getMatchStatus = (interestId) => {
    const match = myMatches.find(m => m.interest_id === interestId);
    if (!match) return null;
    return match.status;
  };

  // Get button config based on match status
  const getMatchButtonConfig = (interestId) => {
    const status = getMatchStatus(interestId);
    
    if (!status) {
      return {
        disabled: false,
        className: "rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500",
        icon: <Heart className="w-4 h-4 mr-2" />,
        text: "Dar Match"
      };
    }
    
    if (status === 'approved' || status === 'visit_scheduled' || status === 'completed') {
      return {
        disabled: true,
        className: "rounded-full bg-green-500 text-white cursor-not-allowed",
        icon: <Heart className="w-4 h-4 mr-2 fill-white" />,
        text: "Match Aprovado"
      };
    }
    
    // pending_approval or pending_info
    return {
      disabled: true,
      className: "rounded-full bg-red-500 text-white cursor-not-allowed",
      icon: <Heart className="w-4 h-4 mr-2 fill-white" />,
      text: "Match em Análise"
    };
  };

  if (loading) {
    return <DashboardLoading message="Carregando seu painel..." />;
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
        <Tabs defaultValue="discover" className="w-full">
          <TabsList className="grid w-full md:w-auto grid-cols-2 mb-6 rounded-xl" data-testid="agent-dashboard-tabs">
            <TabsTrigger value="discover" className="rounded-lg" data-testid="agent-tab-discover">
              <Sparkles className="w-4 h-4 mr-2" />
              Descobrir Compradores
            </TabsTrigger>
            <TabsTrigger value="my-matches" className="rounded-lg" data-testid="agent-tab-matches">Meus Matches</TabsTrigger>
          </TabsList>

          <TabsContent value="discover" className="space-y-6">
            {/* AI Discovery Input */}
            <Card className="p-6 rounded-2xl" data-testid="ai-discovery-card">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Descoberta Inteligente</h3>
                  <p className="text-sm text-muted-foreground">
                    Nossa IA irá cruzar o perfil do imóvel descrito com os perfis dos compradores já cadastrados para encontrar possíveis matches para seu imóvel.
                  </p>
                </div>
              </div>
              
              {/* Required Filters - Above description */}
              <div className="mb-4 p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <Filter className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm font-semibold text-slate-700">Filtros obrigatórios</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">
                      Valor do Imóvel (R$) *
                    </label>
                    <Input
                      type="number"
                      value={propertyPrice}
                      onChange={(e) => setPropertyPrice(e.target.value)}
                      placeholder="Ex: 500000"
                      className="rounded-lg"
                      data-testid="property-price-input"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">
                      Tipo do Imóvel *
                    </label>
                    <select
                      value={propertyType}
                      onChange={(e) => setPropertyType(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 focus:border-indigo-500 focus:outline-none bg-white text-sm"
                      data-testid="property-type-select"
                      required
                    >
                      <option value="">Selecione o tipo</option>
                      <option value="apartamento">Apartamento</option>
                      <option value="casa">Casa</option>
                      <option value="casa_condominio">Casa de Condomínio</option>
                      <option value="terreno">Terreno</option>
                      <option value="terreno_condominio">Terreno de Condomínio</option>
                      <option value="sala_comercial">Sala Comercial</option>
                      <option value="studio_loft">Studio/Loft</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <Textarea
                data-testid="property-description-input"
                value={propertyDescription}
                onChange={(e) => setPropertyDescription(e.target.value)}
                className="min-h-[150px] rounded-xl mb-4 resize-none"
                placeholder="Descreva o imóvel que você quer ofertar: localização, características, diferenciais, estado de conservação, o que torna esse imóvel especial...

Dica: quanto mais você descrever — localização, entorno, luz, silêncio, estado de conservação, diferenciais, limitações — mais preciso será o matching. Não se preocupe com formato."
              />
              
              <Button
                data-testid="ai-discovery-button"
                onClick={handleAIDiscovery}
                disabled={aiLoading || !propertyPrice || !propertyType || propertyDescription.trim().length < 20}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500"
              >
                {aiLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Analisando perfis...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Encontrar compradores compatíveis
                  </>
                )}
              </Button>
            </Card>

            {/* AI Results */}
            {hasSearched && !aiLoading && (
              <>
                {aiResults.length === 0 ? (
                  <Card className="p-12 rounded-3xl text-center" data-testid="no-ai-results">
                    <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Nenhum comprador compatível no momento</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Tente descrever outros aspectos do imóvel ou aguarde novos cadastros de compradores.
                    </p>
                    {prefilterStats && (
                      <div className="mt-4 p-3 bg-slate-50 rounded-lg text-xs text-muted-foreground">
                        <p>{prefilterStats.total_before_prefilter} compradores disponíveis</p>
                        {prefilterStats.filtered_by_budget > 0 && (
                          <p>• {prefilterStats.filtered_by_budget} filtrados por orçamento</p>
                        )}
                        {prefilterStats.filtered_by_type > 0 && (
                          <p>• {prefilterStats.filtered_by_type} filtrados por tipo</p>
                        )}
                        <p>• {prefilterStats.sent_to_ai} enviados para análise da IA</p>
                      </div>
                    )}
                  </Card>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {aiResults.length} compradores compatíveis encontrados
                      </h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="rounded-full">
                          {totalEvaluated} perfis avaliados
                        </Badge>
                        {prefilterStats && prefilterStats.total_before_prefilter > prefilterStats.sent_to_ai && (
                          <Badge variant="secondary" className="rounded-full text-xs">
                            {prefilterStats.total_before_prefilter - prefilterStats.sent_to_ai} pré-filtrados
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {aiResults.map((result, index) => (
                      <motion.div
                        key={result.comprador_id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className="p-6 rounded-2xl hover:shadow-lg transition-all border-l-4 border-l-indigo-500" data-testid={`ai-result-${result.comprador_id}`}>
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <Badge className={`rounded-full text-sm px-3 py-1 ${getScoreBadgeClass(result.score)}`}>
                                  {result.score}% compatível
                                </Badge>
                                <h3 className="text-lg font-semibold">{result.buyer_name}</h3>
                              </div>
                              
                              {result.ai_profile && (
                                <Badge className="rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs px-3 py-1 mb-2">
                                  {result.ai_profile}
                                </Badge>
                              )}
                              
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                                <span className="flex items-center gap-1">
                                  <Building2 className="w-4 h-4" />
                                  {result.property_type}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  {result.location}
                                </span>
                              </div>
                            </div>
                            
                            {(() => {
                              const config = getMatchButtonConfig(result.comprador_id);
                              return (
                                <Button
                                  data-testid={`match-button-ai-${result.comprador_id}`}
                                  onClick={() => !config.disabled && handleMatchFromAI(result)}
                                  disabled={config.disabled}
                                  className={config.className}
                                >
                                  {config.icon}
                                  {config.text}
                                </Button>
                              );
                            })()}
                          </div>
                          
                          {/* AI Justification */}
                          <div className="bg-slate-50 rounded-xl p-4">
                            <p className="text-sm text-slate-700 flex items-start gap-2">
                              <Sparkles className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                              <span>{result.justificativa}</span>
                            </p>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </>
            )}
            
            {/* Initial state - no search yet */}
            {!hasSearched && !aiLoading && (
              <Card className="p-12 rounded-3xl text-center bg-gradient-to-br from-indigo-50 to-purple-50" data-testid="ai-discovery-initial">
                <Sparkles className="w-16 h-16 text-indigo-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Descreva seu imóvel acima</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Nossa IA irá analisar os perfis dos compradores cadastrados e encontrar os mais compatíveis com o imóvel que você está oferecendo.
                </p>
              </Card>
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
                  <Card className="p-6 rounded-2xl hover:shadow-lg transition-all border-l-4 border-l-red-500" data-testid={`agent-match-card-${match.id}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                          <h3 className="text-xl font-semibold">Match com {match.buyer?.name}</h3>
                        </div>
                        <Badge className={`rounded-full ${
                          match.status === 'approved' ? 'bg-green-100 text-green-700' :
                          match.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          match.status === 'visit_scheduled' ? 'bg-blue-100 text-blue-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {match.status === 'pending_info' ? 'Aguardando Informações' :
                           match.status === 'pending_approval' ? 'Em Análise' :
                           match.status === 'approved' ? 'Aprovado' :
                           match.status === 'visit_scheduled' ? 'Visita Agendada' :
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

                    {/* AI Compatibility */}
                    {match.ai_compatibility && (
                      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-xl mb-4 border border-indigo-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="w-4 h-4 text-indigo-600" />
                          <span className="text-sm font-semibold text-indigo-700">Compatibilidade da IA</span>
                          <Badge className={`ml-auto rounded-full text-xs ${
                            match.ai_compatibility.score >= 80 ? 'bg-green-500' : 
                            match.ai_compatibility.score >= 60 ? 'bg-yellow-500' : 'bg-orange-500'
                          } text-white`}>
                            {match.ai_compatibility.score}%
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600">{match.ai_compatibility.justificativa}</p>
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

      {showPropertyModal && selectedInterest && (
        <PropertyInfoModal
          isOpen={showPropertyModal}
          onClose={() => {
            setShowPropertyModal(false);
            setSelectedInterest(null);
          }}
          onSubmit={handlePropertySubmit}
          buyerName={selectedInterest.buyer_name || 'Comprador'}
          interestLocation={selectedInterest.location}
        />
      )}
    </div>
  );
};

export default AgentDashboard;

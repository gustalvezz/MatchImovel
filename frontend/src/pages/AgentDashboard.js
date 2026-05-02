import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { Home, LogOut, Users, Heart, DollarSign, MapPin, Building2, Trash2, Sparkles, Loader2, Filter, Search, X, Clock, AlertTriangle, ChevronDown, ChevronUp, BedDouble, ArrowLeft, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import PropertyInfoModal from '@/components/PropertyInfoModal';
import DashboardLoading from '@/components/DashboardLoading';
import {
  FIELDS_BY_TYPE,
  FIELD_META,
  PropertyFormFields,
  validatePropertyForm,
  normalizeExtracted,
  formatCurrencyDisplay,
} from '@/utils/propertyFields';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Deactivation Modal Component
const DeactivationModal = ({ isOpen, onClose, onConfirm, searchDescription }) => {
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  const reasons = [
    { value: 'Imóvel vendido por outro canal', label: 'Imóvel vendido por outro canal' },
    { value: 'Imóvel retirado da venda', label: 'Imóvel retirado da venda' },
    { value: 'outro', label: 'Outro' }
  ];

  const handleConfirm = () => {
    const finalReason = reason === 'outro' ? customReason : reason;
    if (!finalReason.trim()) {
      toast.error('Por favor, informe o motivo');
      return;
    }
    onConfirm(finalReason);
    setReason('');
    setCustomReason('');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900">Desativar Busca</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-sm text-slate-600 mb-4">
            Você está desativando a busca automática para:
          </p>
          <p className="text-sm text-slate-800 bg-slate-50 p-3 rounded-lg mb-4 line-clamp-2">
            "{searchDescription}"
          </p>

          <p className="text-sm font-medium text-slate-700 mb-2">Qual o motivo?</p>

          <div className="space-y-2 mb-4">
            {reasons.map(r => (
              <label
                key={r.value}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                  reason === r.value ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="reason"
                  value={r.value}
                  checked={reason === r.value}
                  onChange={() => setReason(r.value)}
                  className="w-4 h-4 text-indigo-600"
                />
                <span className="text-sm text-slate-700">{r.label}</span>
              </label>
            ))}
          </div>

          {reason === 'outro' && (
            <Input
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Descreva o motivo..."
              className="mb-4"
            />
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!reason || (reason === 'outro' && !customReason.trim())}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              Desativar
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const AgentDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [buyers, setBuyers] = useState([]);
  const [myMatches, setMyMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);

  // PropertyInfoModal state (for saved search matches only)
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [selectedInterest, setSelectedInterest] = useState(null);
  const [propertyModalType, setPropertyModalType] = useState('casa');
  const [propertyModalInitialExtracted, setPropertyModalInitialExtracted] = useState(null);

  // Saved searches state
  const [savedSearches, setSavedSearches] = useState([]);
  const [showDeactivationModal, setShowDeactivationModal] = useState(false);
  const [searchToDeactivate, setSearchToDeactivate] = useState(null);

  // ---- Step 1: pre-filter fields ----
  const [propertyDescription, setPropertyDescription] = useState('');
  const [propertyPrice, setPropertyPrice] = useState('');
  const [propertyPriceDisplay, setPropertyPriceDisplay] = useState('');
  const [propertyType, setPropertyType] = useState('');

  // ---- Discovery flow step (1 = describe, 2 = form, 3 = results) ----
  const [discoveryStep, setDiscoveryStep] = useState(1);
  const [analyzeLoading, setAnalyzeLoading] = useState(false);

  // ---- Step 2: property form ----
  const [propertyFormData, setPropertyFormData] = useState({});
  const [propertyFormErrors, setPropertyFormErrors] = useState({});
  const [aiBadgeKeys, setAiBadgeKeys] = useState([]);

  // ---- Step 3: results ----
  const [aiResults, setAiResults] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [totalEvaluated, setTotalEvaluated] = useState(0);
  const [prefilterStats, setPrefilterStats] = useState(null);
  const [expandedResults, setExpandedResults] = useState({});

  const formatCurrency = (value) => {
    if (!value) return '';
    const numericValue = String(value).replace(/\D/g, '');
    if (!numericValue) return '';
    return parseInt(numericValue, 10).toLocaleString('pt-BR');
  };

  const handlePriceChange = (e) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    setPropertyPrice(rawValue);
    setPropertyPriceDisplay(formatCurrency(rawValue));
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => { fetchData(); }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [buyersRes, matchesRes, searchesRes] = await Promise.all([
        axios.get(`${API}/agents/buyers`),
        axios.get(`${API}/agents/my-matches`),
        axios.get(`${API}/agents/searches`)
      ]);
      setBuyers(buyersRes.data);
      setMyMatches(matchesRes.data);
      setSavedSearches(searchesRes.data.filter(s => s.status === 'active'));
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateSearch = async (reason) => {
    if (!searchToDeactivate) return;
    try {
      await axios.patch(`${API}/agents/searches/${searchToDeactivate.id}`, {
        deactivation_reason: reason
      });
      toast.success('Busca desativada com sucesso');
      setShowDeactivationModal(false);
      setSearchToDeactivate(null);
      fetchData();
    } catch (error) {
      toast.error('Erro ao desativar busca');
    }
  };

  // ---- Step 1 → 2: analyze description ----
  const handleAnalyzeProperty = async () => {
    const priceValue = parseInt(propertyPrice, 10);
    if (!propertyPrice || priceValue <= 0) {
      toast.error('Por favor, informe o valor do imóvel');
      return;
    }
    if (!propertyType) {
      toast.error('Por favor, selecione o tipo do imóvel');
      return;
    }
    if (!propertyDescription || propertyDescription.trim().length < 20) {
      toast.error('Descreva o imóvel com mais detalhes (mínimo 20 caracteres)');
      return;
    }

    setAnalyzeLoading(true);
    try {
      const res = await axios.post(`${API}/agents/analyze-property`, {
        property_type: propertyType,
        property_price: priceValue,
        description: propertyDescription.trim(),
      });
      const raw = res.data.extracted || {};
      const extracted = normalizeExtracted(raw);
      const { ai_summary, ...formFields } = extracted;
      const filled = { ...formFields, ai_summary: ai_summary || null };
      setPropertyFormData(filled);
      setPropertyFormErrors({});
      setAiBadgeKeys(
        Object.keys(formFields).filter(k => {
          const v = formFields[k];
          return v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0);
        })
      );
      setDiscoveryStep(2);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erro ao analisar descrição. Tente novamente.');
    } finally {
      setAnalyzeLoading(false);
    }
  };

  const handlePropertyFormChange = (key, val) => {
    setPropertyFormData(prev => ({ ...prev, [key]: val }));
    if (propertyFormErrors[key]) setPropertyFormErrors(prev => ({ ...prev, [key]: null }));
  };

  // ---- Step 2 → 3: search with complete structured data ----
  const handleSearchWithPropertyData = async () => {
    const fields = FIELDS_BY_TYPE[propertyType] || FIELDS_BY_TYPE['casa'];
    const errors = validatePropertyForm(propertyFormData, fields);
    if (Object.keys(errors).length > 0) {
      setPropertyFormErrors(errors);
      toast.error('Preencha todos os campos obrigatórios antes de buscar');
      return;
    }

    setAiLoading(true);
    try {
      const payload = {
        property_description: propertyDescription,
        property_price: parseInt(propertyPrice, 10),
        property_type: propertyType,
        property_data: {
          ...propertyFormData,
          property_type: propertyType,
          price: parseInt(propertyPrice, 10),
        },
      };
      const response = await axios.post(`${API}/agents/ai-discovery`, payload);
      setAiResults(response.data.matches);
      setTotalEvaluated(response.data.total_evaluated);
      setPrefilterStats({
        total_before_prefilter: response.data.total_before_prefilter,
        filtered_by_budget: response.data.filtered_by_budget,
        filtered_by_type: response.data.filtered_by_type,
        sent_to_ai: response.data.sent_to_ai,
      });
      setDiscoveryStep(3);
      if (response.data.matches.length > 0) {
        toast.success(`${response.data.matches.length} compradores compatíveis encontrados!`);
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erro ao buscar compradores. Tente novamente.');
    } finally {
      setAiLoading(false);
    }
  };

  // ---- Step 3: create match directly without modal ----
  const handleMatchDirectly = async (result) => {
    try {
      await axios.post(`${API}/agents/match`, {
        buyer_id: result.buyer_id,
        interest_id: result.comprador_id,
        property_info: {
          property_type: propertyType,
          original_description: propertyDescription,
          ...propertyFormData,
        },
        ai_compatibility: {
          score: result.score,
          justificativa: result.justificativa,
          property_description: propertyDescription,
        },
      });
      toast.success('Seu Match foi enviado com sucesso e está em análise, aguarde o nosso contato.');
      setAiResults(prev => prev.filter(r => r.comprador_id !== result.comprador_id));
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erro ao criar match');
    }
  };

  // ---- Saved search "Dar Match" — opens PropertyInfoModal ----
  const handleMatchFromSavedSearch = (result, search) => {
    setSelectedInterest({
      buyer_id: result.buyer_id,
      interest_id: result.comprador_id,
      buyer_name: result.buyer_name,
      location: result.location,
      _searchId: search.id,
      ai_compatibility: {
        score: result.score,
        justificativa: result.justificativa,
      },
    });
    setPropertyModalType(search.property_type || 'casa');
    setPropertyModalInitialExtracted(search.property_data || null);
    setShowPropertyModal(true);
  };

  const handlePropertySubmit = async (propertyInfo) => {
    try {
      await axios.post(`${API}/agents/match`, {
        buyer_id: selectedInterest.buyer_id,
        interest_id: selectedInterest.interest_id,
        property_info: propertyInfo,
        ai_compatibility: selectedInterest.ai_compatibility || null,
      });

      if (selectedInterest._searchId) {
        try {
          await axios.patch(`${API}/agents/searches/${selectedInterest._searchId}/remove-result/${selectedInterest.interest_id}`);
        } catch (err) {
          console.warn('Failed to remove result from search:', err);
        }
      }

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

  const getScoreBadgeClass = (score) => {
    if (score >= 80) return 'bg-green-500 text-white';
    if (score >= 60) return 'bg-yellow-500 text-white';
    return 'bg-orange-500 text-white';
  };

  const getMatchStatus = (interestId) => {
    const match = myMatches.find(m => m.interest_id === interestId);
    return match ? match.status : null;
  };

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
    return {
      disabled: true,
      className: "rounded-full bg-red-500 text-white cursor-not-allowed",
      icon: <Heart className="w-4 h-4 mr-2 fill-white" />,
      text: "Match em Análise"
    };
  };

  // Derived: field list for current property type
  const currentFields = FIELDS_BY_TYPE[propertyType] || [];
  const filledCount = currentFields.filter(k => {
    const v = propertyFormData[k];
    if (v === null || v === undefined || v === '') return false;
    if (Array.isArray(v)) return v.length > 0;
    return true;
  }).length;
  const totalRequired = currentFields.filter(k => FIELD_META[k]?.required).length;

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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
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

            {/* Saved Searches Section */}
            {savedSearches.length > 0 && (
              <Card className="p-6 rounded-2xl border-2 border-indigo-100" data-testid="saved-searches-card">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                    <Search className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Minhas Buscas Ativas</h3>
                    <p className="text-sm text-muted-foreground">Estas buscas rodam automaticamente a cada 7 dias</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {savedSearches.map((search) => (
                    <div
                      key={search.id}
                      className={`p-4 rounded-xl border ${
                        search.has_new_results && search.pending_results?.length > 0
                          ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          {search.has_new_results && search.pending_results?.length > 0 && (
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className="bg-green-500 text-white animate-pulse">
                                <Sparkles className="w-3 h-3 mr-1" />
                                {search.results_source === 'automatic_cron'
                                  ? 'Novos matches encontrados automaticamente!'
                                  : `${search.pending_results.length} resultado(s) encontrado(s)`}
                              </Badge>
                            </div>
                          )}
                          <p className="text-sm text-slate-800 font-medium line-clamp-2 mb-2">
                            {search.property_description}
                          </p>
                          <div className="flex flex-wrap gap-2 text-xs">
                            <Badge variant="outline" className="bg-white">
                              <Building2 className="w-3 h-3 mr-1" />
                              {search.property_type}
                            </Badge>
                            <Badge variant="outline" className="bg-white">
                              <DollarSign className="w-3 h-3 mr-1" />
                              R$ {search.property_price?.toLocaleString('pt-BR')}
                            </Badge>
                            <Badge variant="outline" className="bg-white">
                              <Clock className="w-3 h-3 mr-1" />
                              Verificado: {search.last_checked_at
                                ? new Date(search.last_checked_at).toLocaleDateString('pt-BR')
                                : 'Nunca'}
                            </Badge>
                            {search.days_until_auto_deactivation <= 7 && (
                              <Badge variant="destructive" className="bg-amber-100 text-amber-700 border-amber-200">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                {search.days_until_auto_deactivation} dias restantes
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSearchToDeactivate(search);
                            setShowDeactivationModal(true);
                          }}
                          className="text-red-600 border-red-200 hover:bg-red-50 flex-shrink-0"
                        >
                          Desativar
                        </Button>
                      </div>

                      {search.pending_results?.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
                          <p className="text-xs font-medium text-slate-600 flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            Compradores compatíveis encontrados:
                          </p>
                          {search.pending_results.map((result) => {
                            const expandKey = `${search.id}-${result.comprador_id}`;
                            const isExpanded = expandedResults[expandKey];
                            return (
                              <div key={result.comprador_id} className="p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Badge className={`rounded-full text-xs px-2 py-0.5 ${
                                        result.score >= 80 ? 'bg-green-500 text-white' :
                                        result.score >= 60 ? 'bg-yellow-500 text-white' :
                                        'bg-orange-500 text-white'
                                      }`}>
                                        {result.score}%
                                      </Badge>
                                      <span className="font-medium text-sm">{result.buyer_name}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-1 mb-1">
                                      {result.property_type} • {result.location}
                                    </p>
                                    <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                                      {result.bedrooms > 0 && (
                                        <span className="flex items-center gap-1">
                                          <BedDouble className="w-3 h-3 text-indigo-400" />
                                          {result.bedrooms}+ quartos
                                        </span>
                                      )}
                                      {(result.min_price > 0 || result.max_price > 0) && (
                                        <span className="flex items-center gap-1">
                                          <DollarSign className="w-3 h-3 text-indigo-400" />
                                          {result.min_price > 0 && result.max_price > 0
                                            ? `R$ ${result.min_price.toLocaleString('pt-BR')} – ${result.max_price.toLocaleString('pt-BR')}`
                                            : result.max_price > 0
                                              ? `até R$ ${result.max_price.toLocaleString('pt-BR')}`
                                              : `a partir de R$ ${result.min_price.toLocaleString('pt-BR')}`
                                          }
                                        </span>
                                      )}
                                      {result.payment_method?.length > 0 && (
                                        <span className="flex items-center gap-1">
                                          <DollarSign className="w-3 h-3 text-green-500" />
                                          {result.payment_method.join(' + ')}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex flex-col gap-2 items-end flex-shrink-0">
                                    {(() => {
                                      const config = getMatchButtonConfig(result.comprador_id);
                                      return (
                                        <Button
                                          size="sm"
                                          onClick={() => { if (!config.disabled) handleMatchFromSavedSearch(result, search); }}
                                          disabled={config.disabled}
                                          className={`${config.className} text-xs px-3`}
                                        >
                                          {config.icon}
                                          {config.text}
                                        </Button>
                                      );
                                    })()}
                                    {result.justificativa && (
                                      <button
                                        onClick={() => setExpandedResults(prev => ({ ...prev, [expandKey]: !isExpanded }))}
                                        className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                                      >
                                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                        {isExpanded ? 'Ocultar' : 'Ver resumo'}
                                      </button>
                                    )}
                                  </div>
                                </div>
                                {isExpanded && result.justificativa && (
                                  <div className="mt-3 pt-3 border-t border-slate-100 bg-slate-50 rounded-lg p-3">
                                    <p className="text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
                                      <Sparkles className="w-3 h-3 text-indigo-500" />
                                      Análise de compatibilidade
                                    </p>
                                    <p className="text-xs text-slate-600 leading-relaxed">{result.justificativa}</p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* ======= STEP 1: Describe property ======= */}
            {discoveryStep === 1 && (
              <Card className="p-6 rounded-2xl" data-testid="ai-discovery-card">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Descoberta Inteligente</h3>
                    <p className="text-sm text-muted-foreground">
                      Preencha os dados básicos e descreva o imóvel — a IA irá completar a ficha e cruzar com os compradores cadastrados.
                    </p>
                  </div>
                </div>

                {/* Price + Type */}
                <div className="mb-4 p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <Filter className="w-4 h-4 text-indigo-600" />
                    <span className="text-sm font-semibold text-slate-700">Filtros obrigatórios</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-slate-700 mb-1 block">Valor do Imóvel (R$) *</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">R$</span>
                        <Input
                          type="text"
                          value={propertyPriceDisplay}
                          onChange={handlePriceChange}
                          placeholder="Ex: 500.000"
                          className="rounded-lg pl-10"
                          data-testid="property-price-input"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-slate-700 mb-1 block">Tipo do Imóvel *</Label>
                      <select
                        value={propertyType}
                        onChange={(e) => setPropertyType(e.target.value)}
                        className="w-full h-10 px-3 rounded-lg border border-slate-200 focus:border-indigo-500 focus:outline-none bg-white text-sm"
                        data-testid="property-type-select"
                      >
                        <option value="">Selecione o tipo</option>
                        <option value="apartamento">Apartamento</option>
                        <option value="casa">Casa</option>
                        <option value="casa_condominio">Casa de Condomínio</option>
                        <option value="terreno">Terreno</option>
                        <option value="studio_loft">Studio/Loft</option>
                        <option value="sala_comercial">Sala Comercial</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <Textarea
                  data-testid="property-description-input"
                  value={propertyDescription}
                  onChange={(e) => setPropertyDescription(e.target.value)}
                  className="min-h-[150px] rounded-xl mb-4 resize-none"
                  placeholder="Descreva o imóvel que você quer ofertar: localização, características, diferenciais, estado de conservação, o que torna esse imóvel especial...

Dica: quanto mais você descrever — localização, entorno, luz, silêncio, estado de conservação, diferenciais, limitações — mais preciso será o matching."
                />

                <Button
                  data-testid="ai-discovery-button"
                  onClick={handleAnalyzeProperty}
                  disabled={analyzeLoading || !propertyPrice || !propertyType || propertyDescription.trim().length < 20}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500"
                >
                  {analyzeLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Analisando descrição...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Analisar descrição
                    </>
                  )}
                </Button>
              </Card>
            )}

            {/* ======= STEP 2: Complete property form ======= */}
            {discoveryStep === 2 && (
              <Card className="p-6 rounded-2xl" data-testid="property-form-card">
                {/* Header */}
                <div className="flex items-center gap-3 mb-5">
                  <button
                    onClick={() => setDiscoveryStep(1)}
                    className="text-slate-400 hover:text-slate-600 flex-shrink-0"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900">Ficha do Imóvel</h3>
                    <p className="text-sm text-muted-foreground">
                      Confira os campos preenchidos pela IA e complete os que ficaram em branco.
                    </p>
                  </div>
                </div>

                {/* AI notice */}
                <div className="flex items-start gap-3 p-4 bg-indigo-50 rounded-xl border border-indigo-200 mb-5">
                  <Sparkles className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-indigo-800 font-medium">Ficha preenchida pela IA</p>
                    <p className="text-xs text-indigo-600 mt-0.5">
                      {filledCount}/{totalRequired} campos obrigatórios preenchidos. Complete os restantes antes de buscar.
                    </p>
                  </div>
                </div>

                {/* AI Summary */}
                {typeof propertyFormData.ai_summary === 'string' && propertyFormData.ai_summary && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 mb-5">
                    <p className="text-xs font-medium text-slate-500 mb-1">Resumo gerado pela IA</p>
                    <p className="text-sm text-slate-700">{propertyFormData.ai_summary}</p>
                  </div>
                )}

                {/* Dynamic form */}
                <PropertyFormFields
                  formData={propertyFormData}
                  onChange={handlePropertyFormChange}
                  errors={propertyFormErrors}
                  fields={currentFields}
                  aiBadgeKeys={aiBadgeKeys}
                />

                {Object.keys(propertyFormErrors).length > 0 && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-200 mt-4">
                    <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <p className="text-sm text-red-700">
                      {Object.keys(propertyFormErrors).length} campo(s) obrigatório(s) não preenchido(s).
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-5">
                  <Button
                    variant="outline"
                    onClick={() => setDiscoveryStep(1)}
                    className="flex-1 rounded-xl"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar
                  </Button>
                  <Button
                    onClick={handleSearchWithPropertyData}
                    disabled={aiLoading}
                    className="flex-1 h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500"
                    data-testid="search-buyers-button"
                  >
                    {aiLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Buscando compradores...
                      </>
                    ) : (
                      <>
                        <Search className="w-5 h-5 mr-2" />
                        Buscar compradores compatíveis
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            )}

            {/* ======= STEP 3: Results ======= */}
            {discoveryStep === 3 && !aiLoading && (
              <>
                {/* Back to form */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setDiscoveryStep(2)}
                    className="text-slate-500 hover:text-slate-700 flex items-center gap-1 text-sm"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Editar ficha do imóvel
                  </button>
                </div>

                {aiResults.length === 0 ? (
                  <Card className="p-8 md:p-12 rounded-3xl text-center" data-testid="no-ai-results">
                    {prefilterStats && prefilterStats.sent_to_ai === 0 ? (
                      <>
                        <div className="w-20 h-20 bg-amber-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                          <AlertTriangle className="w-10 h-10 text-amber-600" />
                        </div>
                        <h3 className="text-xl font-semibold mb-3 text-amber-800">
                          Nenhum interesse compatível encontrado
                        </h3>
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 max-w-lg mx-auto mb-4">
                          <p className="text-amber-800 text-sm leading-relaxed">
                            Não há compradores com interesse no <strong>tipo de imóvel</strong> e/ou <strong>faixa de valor</strong> que você informou.
                          </p>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>{prefilterStats.total_before_prefilter} compradores disponíveis na base</p>
                          {prefilterStats.filtered_by_type > 0 && (
                            <p className="text-amber-600">• {prefilterStats.filtered_by_type} não buscam este tipo de imóvel</p>
                          )}
                          {prefilterStats.filtered_by_budget > 0 && (
                            <p className="text-amber-600">• {prefilterStats.filtered_by_budget} têm orçamento abaixo do valor informado</p>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-4">
                          Sua busca foi salva — quando novos compradores se cadastrarem, você será notificado automaticamente.
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="w-20 h-20 bg-indigo-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                          <Sparkles className="w-10 h-10 text-indigo-600" />
                        </div>
                        <h3 className="text-xl font-semibold mb-3 text-slate-800">
                          A IA não encontrou compatibilidade alta
                        </h3>
                        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 max-w-lg mx-auto mb-4">
                          <p className="text-indigo-800 text-sm leading-relaxed mb-3">
                            Analisamos <strong>{prefilterStats?.sent_to_ai || totalEvaluated}</strong> perfis de compradores, mas nenhum atingiu o score mínimo de compatibilidade (50%).
                          </p>
                          <p className="text-indigo-700 text-sm">
                            A IA avalia tipo, preço, localização, características, estilo de vida e critérios inegociáveis de cada comprador.
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-4">
                          Sua busca foi salva — novos compradores que se cadastrarem serão avaliados automaticamente.
                        </p>
                      </>
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

                              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-3">
                                <span className="flex items-center gap-1">
                                  <Building2 className="w-4 h-4" />
                                  {result.property_type}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  {result.location}
                                </span>
                                {result.bedrooms > 0 && (
                                  <span className="flex items-center gap-1">
                                    <BedDouble className="w-4 h-4 text-indigo-400" />
                                    {result.bedrooms}+ quartos
                                  </span>
                                )}
                                {(result.min_price > 0 || result.max_price > 0) && (
                                  <span className="flex items-center gap-1">
                                    <DollarSign className="w-4 h-4 text-indigo-400" />
                                    {result.min_price > 0 && result.max_price > 0
                                      ? `R$ ${result.min_price.toLocaleString('pt-BR')} – ${result.max_price.toLocaleString('pt-BR')}`
                                      : result.max_price > 0
                                        ? `até R$ ${result.max_price.toLocaleString('pt-BR')}`
                                        : `a partir de R$ ${result.min_price.toLocaleString('pt-BR')}`
                                    }
                                  </span>
                                )}
                                {result.payment_method?.length > 0 && (
                                  <span className="flex items-center gap-1">
                                    <DollarSign className="w-4 h-4 text-green-500" />
                                    {result.payment_method.join(' + ')}
                                  </span>
                                )}
                              </div>
                            </div>

                            {(() => {
                              const config = getMatchButtonConfig(result.comprador_id);
                              return (
                                <Button
                                  data-testid={`match-button-ai-${result.comprador_id}`}
                                  onClick={() => !config.disabled && handleMatchDirectly(result)}
                                  disabled={config.disabled}
                                  className={config.className}
                                >
                                  {config.icon}
                                  {config.text}
                                </Button>
                              );
                            })()}
                          </div>

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

            {/* Initial placeholder (step 1 only) */}
            {discoveryStep === 1 && (
              <Card className="p-12 rounded-3xl text-center bg-gradient-to-br from-indigo-50 to-purple-50" data-testid="ai-discovery-initial">
                <Sparkles className="w-16 h-16 text-indigo-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Descreva seu imóvel acima</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  A IA irá extrair os dados estruturados da descrição, você completa os campos faltantes e então buscamos os compradores mais compatíveis.
                </p>
                <div className="flex justify-center gap-6 mt-6 text-sm text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">1</span>
                    Descreva
                  </div>
                  <div className="w-8 h-px bg-slate-200 self-center" />
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">2</span>
                    Complete a ficha
                  </div>
                  <div className="w-8 h-px bg-slate-200 self-center" />
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">3</span>
                    Receba matches
                  </div>
                </div>
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
                <motion.div key={match.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
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
                        onClick={() => { setSelectedMatch(match); setShowDeleteModal(true); }}
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
          onClose={() => { setShowDeleteModal(false); setSelectedMatch(null); }}
          onSuccess={() => { setShowDeleteModal(false); setSelectedMatch(null); fetchData(); }}
        />
      )}

      {showPropertyModal && selectedInterest && (
        <PropertyInfoModal
          isOpen={showPropertyModal}
          onClose={() => { setShowPropertyModal(false); setSelectedInterest(null); setPropertyModalInitialExtracted(null); }}
          onSubmit={handlePropertySubmit}
          buyerName={selectedInterest.buyer_name || 'Comprador'}
          interestLocation={selectedInterest.location}
          initialDescription={propertyDescription}
          propertyType={propertyModalType}
          propertyPrice={parseInt(propertyPrice, 10) || null}
          initialExtracted={propertyModalInitialExtracted}
        />
      )}

      <DeactivationModal
        isOpen={showDeactivationModal}
        onClose={() => { setShowDeactivationModal(false); setSearchToDeactivate(null); }}
        onConfirm={handleDeactivateSearch}
        searchDescription={searchToDeactivate?.property_description || ''}
      />
    </div>
  );
};

export default AgentDashboard;

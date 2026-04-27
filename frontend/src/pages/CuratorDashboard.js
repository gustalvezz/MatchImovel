import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/context/AuthContext';
import { 
  Home, LogOut, Users, Heart, Building2, CheckCircle, XCircle, 
  Clock, MessageSquare, Phone, MapPin, DollarSign, BedDouble, 
  Car, Bath, ChevronDown, ChevronUp, Calendar, Link as LinkIcon, Ruler, ExternalLink, Sparkles, BadgeCheck
} from 'lucide-react';
import { toast } from 'sonner';
import MatchFollowUp from '@/components/MatchFollowUp';
import DashboardLoading from '@/components/DashboardLoading';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CuratorDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [pendingMatches, setPendingMatches] = useState([]);
  const [myMatches, setMyMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [curatingMatch, setCuratingMatch] = useState(null);
  const [curationNotes, setCurationNotes] = useState('');
  const [expandedMatch, setExpandedMatch] = useState(null);
  const [schedulingVisit, setSchedulingVisit] = useState(null);
  const [visitDate, setVisitDate] = useState('');
  const [visitTime, setVisitTime] = useState('');
  const [visitNotes, setVisitNotes] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [pendingRes, matchesRes] = await Promise.all([
        axios.get(`${API}/curator/pending-matches`),
        axios.get(`${API}/admin/matches`)
      ]);
      setPendingMatches(pendingRes.data);
      setMyMatches(matchesRes.data.filter(m => m.status !== 'pending_approval'));
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role !== 'curator') {
      navigate('/');
      return;
    }
    fetchData();
    
    // Auto-refresh a cada 30 segundos
    const interval = setInterval(() => {
      fetchData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [user, navigate, fetchData]);

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

  const handleScheduleVisit = async (matchId) => {
    if (!visitDate || !visitTime) {
      toast.error('Por favor, preencha data e horário da visita');
      return;
    }
    
    try {
      const response = await axios.post(`${API}/curator/schedule-visit/${matchId}`, {
        visit_date: visitDate,
        visit_time: visitTime,
        notes: visitNotes
      });
      
      const { notifications_sent } = response.data;
      let message = 'Visita agendada com sucesso!';
      
      if (notifications_sent.buyer && notifications_sent.agent) {
        message += ' Notificações enviadas para comprador e corretor.';
      } else if (notifications_sent.buyer || notifications_sent.agent) {
        message += ' Notificação enviada parcialmente.';
      }
      
      toast.success(message);
      setSchedulingVisit(null);
      setVisitDate('');
      setVisitTime('');
      setVisitNotes('');
      fetchData();
    } catch (error) {
      toast.error('Erro ao agendar visita');
    }
  };

  const handleToggleSold = async (matchId, currentValue) => {
    try {
      await axios.patch(`${API}/curator/matches/${matchId}/sold`, {
        sold_through_platform: !currentValue
      });
      toast.success(!currentValue ? 'Venda registrada!' : 'Marcação removida');
      fetchData();
    } catch (error) {
      toast.error('Erro ao atualizar status de venda');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const formatWhatsAppLink = (phone) => {
    if (!phone) return null;
    const cleanPhone = phone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    return `https://wa.me/${phoneWithCountry}`;
  };

  const formatPrice = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0
    }).format(value);
  };

  if (loading) {
    return <DashboardLoading message="Carregando curadoria..." />;
  }

  const MatchCard = ({ match, showActions = false }) => (
    <Card className="p-6 rounded-2xl" data-testid={`match-${match.id}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
        {/* Comprador */}
        <div className="bg-indigo-50 p-4 rounded-xl">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Comprador
          </h4>
          <p className="text-lg font-semibold">{match.buyer?.name}</p>
          <p className="text-sm text-muted-foreground">{match.buyer?.email}</p>
          {match.buyer?.phone && (
            <a 
              href={formatWhatsAppLink(match.buyer.phone)} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-2 text-sm text-green-600 hover:text-green-700 font-medium"
            >
              <Phone className="w-4 h-4" />
              {match.buyer.phone}
              <span className="text-xs bg-green-100 px-2 py-0.5 rounded-full">WhatsApp</span>
            </a>
          )}
          {match.interest && (
            <div className="mt-3 pt-3 border-t border-indigo-200">
              <p className="text-sm font-medium mb-2">Interesse:</p>
              <div className="space-y-1 text-sm">
                <p className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-500" />
                  {match.interest.property_type}
                </p>
                <p className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-indigo-500" />
                  {match.interest.location}
                </p>
                <p className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-indigo-500" />
                  {formatPrice(match.interest.min_price)} - {formatPrice(match.interest.max_price)}
                </p>
                {match.interest.bedrooms && (
                  <p className="flex items-center gap-2">
                    <BedDouble className="w-4 h-4 text-indigo-500" />
                    {match.interest.bedrooms} quartos
                  </p>
                )}
                {match.interest.bathrooms && (
                  <p className="flex items-center gap-2">
                    <Bath className="w-4 h-4 text-indigo-500" />
                    {match.interest.bathrooms} banheiros
                  </p>
                )}
                {match.interest.parking_spaces && (
                  <p className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-indigo-500" />
                    {match.interest.parking_spaces} vagas
                  </p>
                )}
              </div>
              
              {/* AI Interpretation */}
              {match.interest.interpretacaoIA && (
                <div className="mt-3 pt-3 border-t border-indigo-200">
                  <p className="text-xs font-semibold text-purple-700 mb-2 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Análise IA
                  </p>
                  {match.interest.interpretacaoIA.perfil_narrativo && (
                    <p className="text-xs text-slate-600 leading-relaxed mb-2">
                      {match.interest.interpretacaoIA.perfil_narrativo}
                    </p>
                  )}
                    {match.interest.interpretacaoIA.perfil_do_imovel_ideal && (
                    <div className="bg-green-50 p-2 rounded-lg mb-2">
                      <p className="text-xs text-green-700">
                        <strong>Imóvel ideal:</strong>{' '}
                        {typeof match.interest.interpretacaoIA.perfil_do_imovel_ideal === 'string'
                          ? match.interest.interpretacaoIA.perfil_do_imovel_ideal
                          : [
                              match.interest.interpretacaoIA.perfil_do_imovel_ideal?.tipo,
                              match.interest.interpretacaoIA.perfil_do_imovel_ideal?.localizacao,
                              match.interest.interpretacaoIA.perfil_do_imovel_ideal?.orcamento,
                              match.interest.interpretacaoIA.perfil_do_imovel_ideal?.condicao,
                              match.interest.interpretacaoIA.perfil_do_imovel_ideal?.tamanho,
                            ].filter(Boolean).join(', ')
                        }
                      </p>
                    </div>
                  )}
                  {match.interest.interpretacaoIA.criterios_inegociaveis?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {match.interest.interpretacaoIA.criterios_inegociaveis.slice(0,4).map((c, i) => (
                        <span key={i} className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{c}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Additional info */}
              {(match.interest.who_will_live?.length > 0 || match.interest.has_pets) && (
                <div className="mt-2 pt-2 border-t border-indigo-100 flex flex-wrap gap-1">
                  {match.interest.who_will_live?.slice(0,2).map((w, i) => (
                    <span key={i} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{w}</span>
                  ))}
                  {match.interest.has_pets && match.interest.has_pets !== 'nao' && (
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                      {match.interest.has_pets === 'pequeno' ? 'Pet pequeno' : match.interest.has_pets === 'grande' ? 'Pet grande' : 'Pets'}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Corretor */}
        <div className="bg-purple-50 p-4 rounded-xl">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-purple-600" />
            Corretor
          </h4>
          <p className="text-lg font-semibold">{match.agent?.name}</p>
          <p className="text-sm text-muted-foreground">{match.agent?.email}</p>
          {match.agent?.phone && (
            <a 
              href={formatWhatsAppLink(match.agent.phone)} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-2 text-sm text-green-600 hover:text-green-700 font-medium"
            >
              <Phone className="w-4 h-4" />
              {match.agent.phone}
              <span className="text-xs bg-green-100 px-2 py-0.5 rounded-full">WhatsApp</span>
            </a>
          )}
          {(match.agent?.creci || match.agent?.creci_uf) && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm font-medium text-purple-700">
                CRECI: {match.agent?.creci_uf || ''}{match.agent?.creci || ''}
              </span>
              {match.agent?.creci_verified && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Verificado</span>
              )}
            </div>
          )}
          {match.agent?.company && (
            <p className="text-sm mt-2 text-purple-700">{match.agent.company}</p>
          )}
        </div>
      </div>

      {/* Property Info from Agent - NEW SECTION */}
      {match.property_info && (
        <div className="bg-green-50 border border-green-200 p-4 rounded-xl mb-4">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Home className="w-5 h-5 text-green-600" />
            Imóvel Oferecido pelo Corretor
          </h4>
          
          {/* Description */}
          <p className="text-sm text-slate-700 mb-3 whitespace-pre-wrap">{match.property_info.description}</p>
          
          {/* Property details grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            {match.property_info.bedrooms && (
              <div className="flex items-center gap-1 text-slate-600">
                <BedDouble className="w-4 h-4 text-green-500" />
                <span>{match.property_info.bedrooms} quartos</span>
              </div>
            )}
            {match.property_info.bathrooms && (
              <div className="flex items-center gap-1 text-slate-600">
                <Bath className="w-4 h-4 text-green-500" />
                <span>{match.property_info.bathrooms} banheiros</span>
              </div>
            )}
            {match.property_info.area_m2 && (
              <div className="flex items-center gap-1 text-slate-600">
                <Ruler className="w-4 h-4 text-green-500" />
                <span>{match.property_info.area_m2} m²</span>
              </div>
            )}
            {match.property_info.price && (
              <div className="flex items-center gap-1 text-slate-600">
                <DollarSign className="w-4 h-4 text-green-500" />
                <span>{formatPrice(match.property_info.price)}</span>
              </div>
            )}
          </div>
          
          {match.property_info.address && (
            <p className="flex items-center gap-2 mt-3 text-sm text-slate-600">
              <MapPin className="w-4 h-4 text-green-500" />
              {match.property_info.address}
            </p>
          )}
          
          {match.property_info.link && (
            <a 
              href={match.property_info.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              <LinkIcon className="w-4 h-4" />
              Ver anúncio
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}

      {/* AI Compatibility */}
      {match.ai_compatibility && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 p-4 rounded-xl mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <span className="font-semibold text-indigo-700">Análise da IA</span>
            <Badge className={`ml-auto rounded-full ${match.ai_compatibility.score >= 80 ? 'bg-green-500' : match.ai_compatibility.score >= 60 ? 'bg-yellow-500' : 'bg-orange-500'} text-white`}>
              {match.ai_compatibility.score}% compatível
            </Badge>
          </div>
          <p className="text-sm text-slate-700">{match.ai_compatibility.justificativa}</p>
          {match.ai_compatibility.property_description && (
            <div className="mt-3 pt-3 border-t border-indigo-200">
              <p className="text-xs text-muted-foreground mb-1">Descrição do imóvel que originou o match:</p>
              <p className="text-sm italic text-slate-600">"{match.ai_compatibility.property_description}"</p>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
        <span>Criado em: {new Date(match.created_at).toLocaleDateString('pt-BR')}</span>
        <Badge className={`rounded-full ${
          match.status === 'approved' ? 'bg-green-100 text-green-700' :
          match.status === 'rejected' ? 'bg-red-100 text-red-700' :
          match.status === 'visit_scheduled' ? 'bg-blue-100 text-blue-700' :
          'bg-orange-100 text-orange-700'
        }`}>
          {match.status === 'approved' ? 'Aprovado' :
           match.status === 'rejected' ? 'Rejeitado' : 
           match.status === 'visit_scheduled' ? 'Visita Agendada' : 'Pendente'}
        </Badge>
      </div>

      {showActions && (
        <div className="border-t pt-4">
          {curatingMatch === match.id ? (
            <div className="space-y-4">
              <div>
                <Label className="text-base">Observações da curadoria</Label>
                <Textarea
                  value={curationNotes}
                  onChange={(e) => setCurationNotes(e.target.value)}
                  placeholder="Adicione observações sobre esta curadoria..."
                  className="mt-2"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => handleCurate(match.id, true)}
                  className="flex-1 bg-green-600 hover:bg-green-700 rounded-full"
                  data-testid={`approve-match-${match.id}`}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Aprovar Match
                </Button>
                <Button
                  onClick={() => handleCurate(match.id, false)}
                  variant="destructive"
                  className="flex-1 rounded-full"
                  data-testid={`reject-match-${match.id}`}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Rejeitar
                </Button>
                <Button
                  onClick={() => setCuratingMatch(null)}
                  variant="outline"
                  className="rounded-full"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => setCuratingMatch(match.id)}
              className="w-full rounded-full bg-gradient-to-r from-indigo-600 to-purple-600"
              data-testid={`curate-match-${match.id}`}
            >
              Avaliar Match
            </Button>
          )}
        </div>
      )}

      {!showActions && match.status === 'approved' && (
        <div className="border-t pt-4 space-y-4">
          {/* Sold Through Platform Checkbox */}
          <div className={`flex items-center gap-3 p-3 rounded-xl ${match.sold_through_platform ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-50'}`}>
            <Checkbox
              id={`sold-${match.id}`}
              checked={match.sold_through_platform || false}
              onCheckedChange={() => handleToggleSold(match.id, match.sold_through_platform)}
              className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
            />
            <label htmlFor={`sold-${match.id}`} className="flex items-center gap-2 cursor-pointer">
              <BadgeCheck className={`w-5 h-5 ${match.sold_through_platform ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span className={`text-sm font-medium ${match.sold_through_platform ? 'text-emerald-700' : 'text-slate-600'}`}>
                Vendido pela plataforma
              </span>
              {match.sold_through_platform && match.sold_at && (
                <span className="text-xs text-emerald-600">
                  ({new Date(match.sold_at).toLocaleDateString('pt-BR')})
                </span>
              )}
            </label>
          </div>

          {/* Visit Scheduling Section */}
          {schedulingVisit === match.id ? (
            <div className="bg-blue-50 p-4 rounded-xl space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Agendar Visita
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Data</Label>
                  <Input
                    type="date"
                    value={visitDate}
                    onChange={(e) => setVisitDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="mt-1 rounded-xl"
                    data-testid="visit-date-input"
                  />
                </div>
                <div>
                  <Label className="text-sm">Horário</Label>
                  <Input
                    type="time"
                    value={visitTime}
                    onChange={(e) => setVisitTime(e.target.value)}
                    className="mt-1 rounded-xl"
                    data-testid="visit-time-input"
                  />
                </div>
              </div>
              <div>
                <Label className="text-sm">Observações (opcional)</Label>
                <Textarea
                  value={visitNotes}
                  onChange={(e) => setVisitNotes(e.target.value)}
                  placeholder="Ex: Levar documentos, portaria avisada..."
                  className="mt-1 rounded-xl"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => handleScheduleVisit(match.id)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 rounded-full"
                  data-testid="confirm-schedule-visit"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Confirmar Agendamento
                </Button>
                <Button
                  onClick={() => {
                    setSchedulingVisit(null);
                    setVisitDate('');
                    setVisitTime('');
                    setVisitNotes('');
                  }}
                  variant="outline"
                  className="rounded-full"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => setSchedulingVisit(match.id)}
              className="w-full rounded-full bg-blue-600 hover:bg-blue-700"
              data-testid={`schedule-visit-${match.id}`}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Agendar Visita
            </Button>
          )}

          {/* Follow-ups Section */}
          <Button
            onClick={() => setExpandedMatch(expandedMatch === match.id ? null : match.id)}
            variant="outline"
            className="w-full rounded-full"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Follow-ups (CRM)
            {expandedMatch === match.id ? (
              <ChevronUp className="w-4 h-4 ml-2" />
            ) : (
              <ChevronDown className="w-4 h-4 ml-2" />
            )}
          </Button>
          {expandedMatch === match.id && (
            <div className="mt-4">
              <MatchFollowUp match={match} />
            </div>
          )}
        </div>
      )}
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-white">
      <header className="bg-white/70 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Home className="w-8 h-8 text-slate-900" />
            <div>
              <h1 className="text-xl font-bold flex items-center gap-0.5" data-testid="curator-dashboard-title">
                <span className="text-slate-900">Match</span>
                <span className="text-indigo-600">Imovel</span>
                <span className="text-slate-900"> - Curador</span>
              </h1>
              <p className="text-sm text-muted-foreground">Olá, {user?.name}</p>
            </div>
          </div>
          <Button 
            data-testid="curator-logout-button"
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
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-4 rounded-2xl" data-testid="curator-stat-pending">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-orange-600">{pendingMatches.length}</p>
            <p className="text-xs text-muted-foreground">Matches Pendentes</p>
          </Card>

          <Card className="p-4 rounded-2xl" data-testid="curator-stat-approved">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-600">
              {myMatches.filter(m => m.status === 'approved').length}
            </p>
            <p className="text-xs text-muted-foreground">Meus Aprovados</p>
          </Card>

          <Card className="p-4 rounded-2xl" data-testid="curator-stat-total">
            <div className="flex items-center justify-between mb-2">
              <Heart className="w-5 h-5 text-indigo-600" />
            </div>
            <p className="text-2xl font-bold text-indigo-600">{myMatches.length}</p>
            <p className="text-xs text-muted-foreground">Total Curados</p>
          </Card>
        </div>

        {/* Pending Alert */}
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
                  <p className="text-orange-50">Aguardando sua avaliação</p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 rounded-xl" data-testid="curator-tabs">
            <TabsTrigger value="pending" className="rounded-lg" data-testid="curator-tab-pending">
              Pendentes {pendingMatches.length > 0 && <Badge className="ml-2 rounded-full">{pendingMatches.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="my-matches" className="rounded-lg" data-testid="curator-tab-my-matches">
              Meus Matches
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingMatches.length === 0 ? (
              <Card className="p-12 rounded-3xl text-center" data-testid="no-pending-matches">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Nenhum match pendente</h3>
                <p className="text-muted-foreground">Todos os matches foram avaliados!</p>
              </Card>
            ) : (
              pendingMatches.map((match) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <MatchCard match={match} showActions={true} />
                </motion.div>
              ))
            )}
          </TabsContent>

          <TabsContent value="my-matches" className="space-y-4">
            {myMatches.length === 0 ? (
              <Card className="p-12 rounded-3xl text-center">
                <Heart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Nenhum match curado</h3>
                <p className="text-muted-foreground">Avalie matches pendentes para vê-los aqui.</p>
              </Card>
            ) : (
              myMatches.map((match) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <MatchCard match={match} showActions={false} />
                </motion.div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CuratorDashboard;

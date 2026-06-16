import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { getAllUTMs, getUTMParam } from '@/utils/utm';
import { trackLead } from '@/utils/tracking';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { Mail, Lock, User, Phone, Shield, Eye, EyeOff, ExternalLink, Star, CheckCircle2 } from 'lucide-react';
import AppLogo from '@/components/AppLogo';
import AgentTermsModal from '@/components/AgentTermsModal';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ESTADOS_BRASIL = [
  { sigla: 'AC', nome: 'Acre' }, { sigla: 'AL', nome: 'Alagoas' }, { sigla: 'AP', nome: 'Amapá' },
  { sigla: 'AM', nome: 'Amazonas' }, { sigla: 'BA', nome: 'Bahia' }, { sigla: 'CE', nome: 'Ceará' },
  { sigla: 'DF', nome: 'Distrito Federal' }, { sigla: 'ES', nome: 'Espírito Santo' }, { sigla: 'GO', nome: 'Goiás' },
  { sigla: 'MA', nome: 'Maranhão' }, { sigla: 'MT', nome: 'Mato Grosso' }, { sigla: 'MS', nome: 'Mato Grosso do Sul' },
  { sigla: 'MG', nome: 'Minas Gerais' }, { sigla: 'PA', nome: 'Pará' }, { sigla: 'PB', nome: 'Paraíba' },
  { sigla: 'PR', nome: 'Paraná' }, { sigla: 'PE', nome: 'Pernambuco' }, { sigla: 'PI', nome: 'Piauí' },
  { sigla: 'RJ', nome: 'Rio de Janeiro' }, { sigla: 'RN', nome: 'Rio Grande do Norte' }, { sigla: 'RS', nome: 'Rio Grande do Sul' },
  { sigla: 'RO', nome: 'Rondônia' }, { sigla: 'RR', nome: 'Roraima' }, { sigla: 'SC', nome: 'Santa Catarina' },
  { sigla: 'SP', nome: 'São Paulo' }, { sigla: 'SE', nome: 'Sergipe' }, { sigla: 'TO', nome: 'Tocantins' }
];

const CampaignRegisterPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  const promoCode = (searchParams.get('promo') || 'CAMP80').toUpperCase();
  const commissionRate = 80;

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    creci: '',
    creci_uf: 'SP'
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [registered, setRegistered] = useState(false);

  const formatPhone = (value) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d)/, '$1 $2').replace(/(\d{4})(\d)/, '$1-$2').substring(0, 12);
    }
    return numbers.replace(/(\d{2})(\d)/, '$1 $2').replace(/(\d{5})(\d)/, '$1-$2').substring(0, 13);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const phoneNumbers = formData.phone.replace(/\D/g, '');
    if (phoneNumbers.length < 10) {
      toast.error('Por favor, informe um telefone válido');
      return;
    }
    if (!formData.creci.trim()) {
      toast.error('Por favor, informe o número do CRECI');
      return;
    }
    if (!termsAccepted) {
      toast.error('Você precisa aceitar o Termo de Parceria para continuar');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        role: 'agent',
        promo_code: promoCode,
        terms_accepted: true,
        terms_accepted_at: new Date().toISOString(),
        utm: getAllUTMs(),
      };

      const response = await axios.post(`${API}/auth/register`, payload);
      const { token, user_id, role, name } = response.data;

      trackLead(getUTMParam('utm_source') || 'campanha_80', 'agent');

      login(token, { id: user_id, role, name, email: formData.email });
      setRegistered(true);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao cadastrar');
    } finally {
      setLoading(false);
    }
  };

  if (registered) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-white flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center"
        >
          <div className="mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Você é um Parceiro Selecionado!</h1>
            <p className="text-slate-600 text-lg">
              Bem-vindo ao programa exclusivo de corretores parceiros MatchImóvel.
            </p>
          </div>

          <Card className="p-6 rounded-3xl shadow-xl border-2 border-amber-200 bg-amber-50 mb-6">
            <div className="space-y-3 text-left">
              <div className="flex items-center gap-3">
                <Star className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <span className="text-slate-700"><strong>{commissionRate}% de comissão</strong> garantidos em contrato</span>
              </div>
              <div className="flex items-center gap-3">
                <Star className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <span className="text-slate-700">Leads qualificados entregues na plataforma</span>
              </div>
              <div className="flex items-center gap-3">
                <Star className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <span className="text-slate-700">MatchImóvel cuida de toda a parte jurídica e de contrato</span>
              </div>
            </div>
          </Card>

          <p className="text-slate-500 text-sm mb-6">
            Nossa equipe ativará seu acesso completo em até 24h. Você receberá uma confirmação por email.
          </p>

          <Button
            onClick={() => navigate('/dashboard/agent')}
            className="w-full h-12 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-medium text-base"
          >
            Acessar meu painel
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-white flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-1 text-2xl font-bold mb-2">
            <AppLogo />
            <span><span className="text-slate-900">Match</span><span className="text-indigo-600">Imovel</span></span>
          </Link>

          <div className="mt-4 inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-1.5 rounded-full text-sm font-bold mb-3">
            <Star className="w-4 h-4" />
            CORRETOR PARCEIRO SELECIONADO
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-1">Cadastro Exclusivo — {commissionRate}%</h1>
          <p className="text-slate-600 text-sm">
            Você foi selecionado para receber <strong>{commissionRate}% de comissão</strong> em todos os negócios fechados pela plataforma.
          </p>
        </div>

        <Card className="p-8 rounded-3xl shadow-xl border-2 border-amber-100">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="name" className="text-base">Nome Completo *</Label>
              <div className="relative mt-2">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="pl-10 h-12 rounded-xl"
                  placeholder="Seu nome completo"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email" className="text-base">Email *</Label>
              <div className="relative mt-2">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10 h-12 rounded-xl"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="phone" className="text-base">WhatsApp *</Label>
              <div className="relative mt-2">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                  className="pl-10 h-12 rounded-xl"
                  placeholder="99 99999-9999"
                  maxLength={13}
                />
              </div>
            </div>

            <div className="space-y-4 p-4 bg-indigo-50 rounded-xl border-2 border-indigo-100">
              <div className="flex items-center gap-2 text-indigo-700">
                <Shield className="w-5 h-5" />
                <span className="font-medium">Dados do CRECI</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <Label htmlFor="creci_uf" className="text-sm">Estado *</Label>
                  <select
                    id="creci_uf"
                    value={formData.creci_uf}
                    onChange={(e) => setFormData(prev => ({ ...prev, creci_uf: e.target.value }))}
                    className="w-full h-12 mt-1 px-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:outline-none bg-white"
                    required
                  >
                    {ESTADOS_BRASIL.map(estado => (
                      <option key={estado.sigla} value={estado.sigla}>{estado.sigla} - {estado.nome}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <Label htmlFor="creci" className="text-sm">Número do CRECI *</Label>
                  <Input
                    id="creci"
                    type="text"
                    value={formData.creci}
                    onChange={(e) => setFormData(prev => ({ ...prev, creci: e.target.value }))}
                    className="h-12 mt-1 rounded-xl"
                    placeholder="Ex: 123456-F"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="text-base">Senha *</Label>
              <div className="relative mt-2">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-10 pr-10 h-12 rounded-xl"
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-slate-700"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-3 p-4 bg-amber-50 rounded-xl border-2 border-amber-300">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="terms-checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                />
                <label htmlFor="terms-checkbox" className="text-sm text-slate-700 leading-relaxed cursor-pointer">
                  Li e aceito o{' '}
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); setShowTermsModal(true); }}
                    className="text-amber-600 font-semibold hover:underline inline-flex items-center gap-1"
                  >
                    Termo de Parceria Especial — {commissionRate}%
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </label>
              </div>
              {!termsAccepted && (
                <p className="text-xs text-amber-700 flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Obrigatório para garantir sua comissão de {commissionRate}%
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold text-base"
            >
              {loading ? 'Cadastrando...' : `Garantir minha vaga — ${commissionRate}%`}
            </Button>
          </form>

          <div className="mt-5 text-center text-sm">
            <span className="text-muted-foreground">Já tem uma conta? </span>
            <Link to="/login" className="text-primary font-medium hover:underline">
              Fazer login
            </Link>
          </div>
        </Card>
      </motion.div>

      <AgentTermsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        creci={formData.creci ? `${formData.creci_uf}-${formData.creci}` : null}
        commissionRate={commissionRate}
      />
    </div>
  );
};

export default CampaignRegisterPage;

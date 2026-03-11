import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { 
  Home, ArrowRight, ArrowLeft, Check, 
  ShoppingBag, MapPin, Users, TrendingUp,
  Clock, Building2, Sofa, Heart, AlertCircle,
  TreePine, User, Mail, Phone
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const InterestForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    // Step 1 - Identification
    profile_type: '',
    // Step 2 - Urgency
    urgency: '',
    // Step 3 - Location
    location: '',
    // Step 4 - Budget
    budget_range: '',
    // Step 5 - Indispensable
    indispensable: [],
    indispensable_other: '',
    // Step 6 - Ambiance
    ambiance: '',
    // Step 7 - Deal breakers
    deal_breakers: [],
    // Step 8 - Proximity
    proximity_needs: [],
    // Step 9 - Style
    personal_style: '',
    // Step 10 - Experience/Fears
    experience_fears: '',
    // Step 11 - Contact
    name: '',
    phone: '',
    email: ''
  });

  const totalSteps = 12;

  // Phone mask function
  const formatPhone = (value) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      // Format: 99 9999-9999
      return numbers
        .replace(/(\d{2})(\d)/, '$1 $2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .substring(0, 12);
    } else {
      // Format: 99 99999-9999
      return numbers
        .replace(/(\d{2})(\d)/, '$1 $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .substring(0, 13);
    }
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhone(e.target.value);
    setFormData(prev => ({ ...prev, phone: formatted }));
  };

  const handleSingleSelect = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMultiSelect = (field, value, maxSelections = null) => {
    setFormData(prev => {
      const current = prev[field] || [];
      if (current.includes(value)) {
        return { ...prev, [field]: current.filter(v => v !== value) };
      } else {
        if (maxSelections && current.length >= maxSelections) {
          toast.error(`Selecione no máximo ${maxSelections} opções`);
          return prev;
        }
        return { ...prev, [field]: [...current, value] };
      }
    });
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return true; // Intro
      case 1: return formData.profile_type !== '';
      case 2: return formData.urgency !== '';
      case 3: return formData.location.trim() !== '';
      case 4: return formData.budget_range !== '';
      case 5: return formData.indispensable.length > 0;
      case 6: return formData.ambiance !== '';
      case 7: return formData.deal_breakers.length >= 1 && formData.deal_breakers.length <= 3;
      case 8: return formData.proximity_needs.length >= 1 && formData.proximity_needs.length <= 3;
      case 9: return formData.personal_style !== '';
      case 10: return true; // Optional
      case 11: return formData.name.trim() !== '' && formData.phone.trim() !== '';
      default: return true;
    }
  };

  const nextStep = () => {
    if (canProceed() && currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await axios.post(`${API}/interests/create-full`, formData);
      toast.success('Cadastro recebido com sucesso!');
      setCurrentStep(totalSteps - 1); // Go to confirmation
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao cadastrar interesse');
    } finally {
      setIsSubmitting(false);
    }
  };

  const OptionCard = ({ selected, onClick, icon: Icon, letter, title, subtitle, color = 'indigo' }) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
        selected 
          ? `border-${color}-600 bg-${color}-50` 
          : 'border-slate-200 hover:border-slate-300 bg-white'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          selected ? `bg-${color}-600 text-white` : 'bg-slate-100 text-slate-600'
        }`}>
          {letter}
        </div>
        <div className="flex-1">
          <p className={`font-medium ${selected ? `text-${color}-900` : 'text-slate-900'}`}>
            {title}
          </p>
          {subtitle && (
            <p className={`text-sm ${selected ? `text-${color}-600` : 'text-slate-500'}`}>
              {subtitle}
            </p>
          )}
        </div>
        {selected && (
          <Check className={`w-5 h-5 text-${color}-600`} />
        )}
      </div>
    </motion.div>
  );

  const CheckboxCard = ({ selected, onClick, text, disabled }) => (
    <motion.div
      whileHover={!disabled ? { scale: 1.01 } : {}}
      whileTap={!disabled ? { scale: 0.99 } : {}}
      onClick={!disabled ? onClick : undefined}
      className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
        selected 
          ? 'border-indigo-600 bg-indigo-50' 
          : disabled 
            ? 'border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed'
            : 'border-slate-200 hover:border-slate-300 bg-white'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
          selected ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'
        }`}>
          {selected && <Check className="w-3 h-3 text-white" />}
        </div>
        <p className={`text-sm ${selected ? 'text-indigo-900 font-medium' : 'text-slate-700'}`}>
          {text}
        </p>
      </div>
    </motion.div>
  );

  const renderStep = () => {
    switch (currentStep) {
      // Step 0 - Introduction
      case 0:
        return (
          <div className="text-center max-w-xl mx-auto">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl mx-auto mb-8 flex items-center justify-center"
            >
              <Home className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Vamos encontrar o seu imóvel ideal.
            </h1>
            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
              Não é mais um formulário técnico. Queremos entender o que você realmente busca — inclusive o que é difícil de explicar.
            </p>
            <p className="text-sm text-slate-500 mb-8">
              Leva menos de 4 minutos.
            </p>
            <Button
              onClick={nextStep}
              size="lg"
              className="rounded-full h-14 px-10 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500"
            >
              Começar <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        );

      // Step 1 - Profile Type
      case 1:
        return (
          <div className="max-w-xl mx-auto">
            <h2 className="text-2xl font-bold mb-2">Como você se identifica nesse momento?</h2>
            <p className="text-slate-500 mb-6">Selecione uma opção</p>
            <div className="space-y-3">
              <OptionCard
                selected={formData.profile_type === 'primeiro_imovel'}
                onClick={() => handleSingleSelect('profile_type', 'primeiro_imovel')}
                letter="A"
                title="Comprando meu primeiro imóvel"
              />
              <OptionCard
                selected={formData.profile_type === 'melhor_localizacao'}
                onClick={() => handleSingleSelect('profile_type', 'melhor_localizacao')}
                letter="B"
                title="Quero melhor localização"
                subtitle="Mais perto do trabalho, escola, etc."
              />
              <OptionCard
                selected={formData.profile_type === 'familia_cresceu'}
                onClick={() => handleSingleSelect('profile_type', 'familia_cresceu')}
                letter="C"
                title="Minha família cresceu e precisamos de mais espaço"
              />
              <OptionCard
                selected={formData.profile_type === 'investidor'}
                onClick={() => handleSingleSelect('profile_type', 'investidor')}
                letter="D"
                title="Estou buscando um imóvel para investir"
              />
            </div>
          </div>
        );

      // Step 2 - Urgency
      case 2:
        return (
          <div className="max-w-xl mx-auto">
            <h2 className="text-2xl font-bold mb-2">Qual o seu estado de urgência?</h2>
            <p className="text-slate-500 mb-6">Selecione uma opção</p>
            <div className="space-y-3">
              <OptionCard
                selected={formData.urgency === '3_meses'}
                onClick={() => handleSingleSelect('urgency', '3_meses')}
                letter="A"
                title="Preciso me mudar nos próximos 3 meses"
              />
              <OptionCard
                selected={formData.urgency === '6_meses'}
                onClick={() => handleSingleSelect('urgency', '6_meses')}
                letter="B"
                title="Estou planejando para os próximos 6 meses"
              />
              <OptionCard
                selected={formData.urgency === 'sem_prazo'}
                onClick={() => handleSingleSelect('urgency', 'sem_prazo')}
                letter="C"
                title="Ainda estou pesquisando, sem prazo definido"
              />
            </div>
          </div>
        );

      // Step 3 - Location
      case 3:
        return (
          <div className="max-w-xl mx-auto">
            <h2 className="text-2xl font-bold mb-2">Onde você quer morar ou investir?</h2>
            <p className="text-slate-500 mb-6">
              Digite a cidade e bairros de interesse (ex: "Jundiaí, Centro e Vila Arens")
            </p>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Digite cidade e bairros..."
                className="pl-12 h-14 text-lg rounded-xl border-2"
              />
            </div>
          </div>
        );

      // Step 4 - Budget
      case 4:
        return (
          <div className="max-w-xl mx-auto">
            <h2 className="text-2xl font-bold mb-2">Qual sua faixa de investimento?</h2>
            <p className="text-slate-500 mb-6">Selecione uma opção</p>
            <div className="space-y-3">
              <OptionCard
                selected={formData.budget_range === 'ate_400k'}
                onClick={() => handleSingleSelect('budget_range', 'ate_400k')}
                letter="A"
                title="Até R$ 400 mil"
              />
              <OptionCard
                selected={formData.budget_range === '400k_550k'}
                onClick={() => handleSingleSelect('budget_range', '400k_550k')}
                letter="B"
                title="R$ 400 mil a R$ 550 mil"
              />
              <OptionCard
                selected={formData.budget_range === '550k_700k'}
                onClick={() => handleSingleSelect('budget_range', '550k_700k')}
                letter="C"
                title="R$ 550 mil a R$ 700 mil"
              />
              <OptionCard
                selected={formData.budget_range === '700k_800k'}
                onClick={() => handleSingleSelect('budget_range', '700k_800k')}
                letter="D"
                title="R$ 700 mil a R$ 800 mil"
              />
              <OptionCard
                selected={formData.budget_range === 'acima_800k'}
                onClick={() => handleSingleSelect('budget_range', 'acima_800k')}
                letter="E"
                title="Acima de R$ 800 mil"
              />
            </div>
          </div>
        );

      // Step 5 - Indispensable
      case 5:
        return (
          <div className="max-w-xl mx-auto">
            <h2 className="text-2xl font-bold mb-2">O que é indispensável?</h2>
            <p className="text-slate-500 mb-6">Pode selecionar quantas opções quiser</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                'Pelo menos 2 quartos',
                'Pelo menos 3 quartos',
                'Suíte',
                'Pelo menos 2 vagas de garagem',
                'Área de lazer no condomínio',
                'Espaço para home office',
                'Área gourmet / varanda',
                'Aceito apartamento',
                'Prefiro casa em condomínio',
                'Quero casa em bairro aberto',
                'Piscina',
                'Térrea ou quarto no térreo'
              ].map((item) => (
                <CheckboxCard
                  key={item}
                  selected={formData.indispensable.includes(item)}
                  onClick={() => handleMultiSelect('indispensable', item)}
                  text={item}
                />
              ))}
            </div>
            <div className="mt-4">
              <Label className="text-sm text-slate-600">Outro(s)</Label>
              <Input
                value={formData.indispensable_other}
                onChange={(e) => setFormData(prev => ({ ...prev, indispensable_other: e.target.value }))}
                placeholder="Escreva aqui..."
                className="mt-1 rounded-xl"
              />
            </div>
          </div>
        );

      // Step 6 - Ambiance
      case 6:
        return (
          <div className="max-w-xl mx-auto">
            <h2 className="text-2xl font-bold mb-2">
              Quando você imagina chegar em casa depois de um dia longo, qual desses ambientes te dá mais sensação de alívio?
            </h2>
            <p className="text-slate-500 mb-6">Selecione uma opção</p>
            <div className="space-y-3">
              <OptionCard
                selected={formData.ambiance === 'aconchegante'}
                onClick={() => handleSingleSelect('ambiance', 'aconchegante')}
                letter="A"
                title="Um espaço aconchegante"
                subtitle="Com plantas, madeira e pouca tecnologia aparente"
              />
              <OptionCard
                selected={formData.ambiance === 'amplo_moderno'}
                onClick={() => handleSingleSelect('ambiance', 'amplo_moderno')}
                letter="B"
                title="Um ambiente amplo, moderno"
                subtitle="Cheio de luz natural, janelas grandes"
              />
              <OptionCard
                selected={formData.ambiance === 'apartamento_clean'}
                onClick={() => handleSingleSelect('ambiance', 'apartamento_clean')}
                letter="C"
                title="Um apartamento moderno, clean"
                subtitle="Com vista para a cidade"
              />
              <OptionCard
                selected={formData.ambiance === 'casa_quintal'}
                onClick={() => handleSingleSelect('ambiance', 'casa_quintal')}
                letter="D"
                title="Uma casa com quintal gramado"
                subtitle="Silêncio e distância do centro"
              />
              <OptionCard
                selected={formData.ambiance === 'casa_padrao'}
                onClick={() => handleSingleSelect('ambiance', 'casa_padrao')}
                letter="E"
                title="Uma casa padrão"
                subtitle="Com privacidade e bem localizada"
              />
            </div>
          </div>
        );

      // Step 7 - Deal Breakers
      case 7:
        return (
          <div className="max-w-xl mx-auto">
            <h2 className="text-2xl font-bold mb-2">O que mais te incomoda em um imóvel?</h2>
            <p className="text-slate-500 mb-6">Selecione de 1 a 3 opções</p>
            <div className="space-y-2">
              {[
                'Pouca luz natural — parece uma caverna',
                'Vizinhança barulhenta ou trânsito intenso',
                'Espaços pequenos, sem possibilidade de respirar',
                'Acabamento genérico, sem nenhuma personalidade',
                'Planta fechada, sem integração entre os ambientes',
                'Localização ruim, longe de tudo que uso no dia a dia',
                'Falta de privacidade, janela de frente para vizinhos',
                'Garagem ruim, apertada, só um carro'
              ].map((item) => (
                <CheckboxCard
                  key={item}
                  selected={formData.deal_breakers.includes(item)}
                  onClick={() => handleMultiSelect('deal_breakers', item, 3)}
                  text={item}
                  disabled={formData.deal_breakers.length >= 3 && !formData.deal_breakers.includes(item)}
                />
              ))}
            </div>
            <p className="text-sm text-slate-500 mt-4">
              {formData.deal_breakers.length}/3 selecionados
            </p>
          </div>
        );

      // Step 8 - Proximity
      case 8:
        return (
          <div className="max-w-xl mx-auto">
            <h2 className="text-2xl font-bold mb-2">O que precisa estar perto da sua casa?</h2>
            <p className="text-slate-500 mb-6">Selecione de 1 a 3 opções</p>
            <div className="space-y-2">
              {[
                'Escola ou creche',
                'Mercado / comércio do dia a dia',
                'Academia ou espaço para exercício',
                'Parque ou área verde',
                'Trabalho / centro comercial',
                'Restaurantes e vida noturna',
                'Transporte público'
              ].map((item) => (
                <CheckboxCard
                  key={item}
                  selected={formData.proximity_needs.includes(item)}
                  onClick={() => handleMultiSelect('proximity_needs', item, 3)}
                  text={item}
                  disabled={formData.proximity_needs.length >= 3 && !formData.proximity_needs.includes(item)}
                />
              ))}
            </div>
            <p className="text-sm text-slate-500 mt-4">
              {formData.proximity_needs.length}/3 selecionados
            </p>
          </div>
        );

      // Step 9 - Style
      case 9:
        return (
          <div className="max-w-xl mx-auto">
            <h2 className="text-2xl font-bold mb-2">Como você descreveria seu estilo pessoal?</h2>
            <p className="text-slate-500 mb-6">Selecione uma opção</p>
            <div className="space-y-3">
              <OptionCard
                selected={formData.personal_style === 'minimalista'}
                onClick={() => handleSingleSelect('personal_style', 'minimalista')}
                letter="A"
                title="Minimalista"
                subtitle="Menos é mais, sem excessos"
              />
              <OptionCard
                selected={formData.personal_style === 'aconchegante'}
                onClick={() => handleSingleSelect('personal_style', 'aconchegante')}
                letter="B"
                title="Aconchegante"
                subtitle="Quero que pareça um lar, não uma revista"
              />
              <OptionCard
                selected={formData.personal_style === 'moderno'}
                onClick={() => handleSingleSelect('personal_style', 'moderno')}
                letter="C"
                title="Moderno"
                subtitle="Gosto de materiais contemporâneos e design"
              />
              <OptionCard
                selected={formData.personal_style === 'classico'}
                onClick={() => handleSingleSelect('personal_style', 'classico')}
                letter="D"
                title="Clássico"
                subtitle="Prefiro o que não sai de moda e bem acabado"
              />
              <OptionCard
                selected={formData.personal_style === 'descobrindo'}
                onClick={() => handleSingleSelect('personal_style', 'descobrindo')}
                letter="E"
                title="Ainda estou descobrindo meu estilo"
              />
            </div>
          </div>
        );

      // Step 10 - Experience/Fears
      case 10:
        return (
          <div className="max-w-xl mx-auto">
            <h2 className="text-2xl font-bold mb-2">
              Você já visitou imóveis que tecnicamente atendiam o que você busca, mas algo faltava?
            </h2>
            <p className="text-slate-500 mb-6">
              Se sim, o que faltava? Se não visitou ainda, o que você teme não encontrar?
            </p>
            <Textarea
              value={formData.experience_fears}
              onChange={(e) => setFormData(prev => ({ ...prev, experience_fears: e.target.value }))}
              placeholder="Conte sua experiência ou preocupações..."
              className="min-h-[150px] rounded-xl border-2"
            />
            <p className="text-sm text-slate-500 mt-2">Este campo é opcional</p>
          </div>
        );

      // Step 11 - Contact
      case 11:
        return (
          <div className="max-w-xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Seus dados de contato</h2>
            
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Qual o seu nome? *</Label>
                <div className="relative mt-1">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Seu nome completo"
                    className="pl-12 h-12 rounded-xl border-2"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Qual seu WhatsApp ou telefone? *</Label>
                <div className="relative mt-1">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    placeholder="99 99999-9999"
                    className="pl-12 h-12 rounded-xl border-2"
                    maxLength={13}
                  />
                </div>
              </div>

              <Card className="p-4 rounded-xl bg-indigo-50 border-indigo-200">
                <p className="text-sm text-indigo-800">
                  <strong>Seu contato nunca será compartilhado com corretores.</strong> Todo contato é feito pela nossa equipe.
                </p>
              </Card>

              <div>
                <Label className="text-sm font-medium">Seu e-mail (opcional)</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="seu@email.com"
                    type="email"
                    className="pl-12 h-12 rounded-xl border-2"
                  />
                </div>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!canProceed() || isSubmitting}
              className="w-full mt-8 h-14 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-lg"
            >
              {isSubmitting ? 'Enviando...' : 'Enviar cadastro'}
            </Button>
          </div>
        );

      // Step 12 - Confirmation
      case 12:
        return (
          <div className="text-center max-w-xl mx-auto">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mx-auto mb-8 flex items-center justify-center"
            >
              <Check className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold mb-4">Cadastro recebido.</h1>
            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
              Nossa equipe de curadoria já está analisando o seu perfil. Em breve você receberá sugestões selecionadas especialmente para você — não uma lista genérica, mas imóveis que fazem sentido de verdade para o que você descreveu.
            </p>
            <p className="text-slate-500 mb-8">
              Enquanto isso, siga a MatchImovel no Instagram para dicas do mercado.
            </p>
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="rounded-full"
            >
              Voltar para a página inicial
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-white">
      {/* Header */}
      {currentStep > 0 && currentStep < 12 && (
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
          <div className="max-w-3xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={() => navigate('/')}
                className="text-2xl font-bold flex items-center gap-1"
              >
                <Home className="w-7 h-7 text-slate-900" />
                <span className="text-slate-900">Match</span>
                <span className="text-indigo-600">Imovel</span>
              </button>
              <span className="text-sm text-slate-500">
                {currentStep} de {totalSteps - 2}
              </span>
            </div>
            {/* Progress bar */}
            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${((currentStep) / (totalSteps - 2)) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        {currentStep > 0 && currentStep < 11 && (
          <div className="flex justify-between mt-12 max-w-xl mx-auto">
            <Button
              onClick={prevStep}
              variant="ghost"
              className="rounded-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <Button
              onClick={nextStep}
              disabled={!canProceed()}
              className="rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500"
            >
              Próximo
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterestForm;

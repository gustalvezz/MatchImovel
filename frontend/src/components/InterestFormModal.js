import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Home, ArrowRight, ArrowLeft, Check, X,
  MapPin, User, Mail, Phone
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const InterestFormModal = ({ isOpen, onClose, onSuccess, userInfo }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    profile_type: '',
    urgency: '',
    location: '',
    budget_range: '',
    indispensable: [],
    indispensable_other: '',
    ambiance: '',
    deal_breakers: [],
    proximity_needs: [],
    personal_style: '',
    experience_fears: '',
    name: userInfo?.name || '',
    phone: userInfo?.phone || '',
    email: userInfo?.email || ''
  });

  const totalSteps = 11; // Without intro and contact (user is already logged in)

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
      case 0: return formData.profile_type !== '';
      case 1: return formData.urgency !== '';
      case 2: return formData.location.trim() !== '';
      case 3: return formData.budget_range !== '';
      case 4: return formData.indispensable.length > 0;
      case 5: return formData.ambiance !== '';
      case 6: return formData.deal_breakers.length >= 1 && formData.deal_breakers.length <= 3;
      case 7: return formData.proximity_needs.length >= 1 && formData.proximity_needs.length <= 3;
      case 8: return formData.personal_style !== '';
      case 9: return true; // Optional
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
      await axios.post(`${API}/interests/create-full`, {
        ...formData,
        name: userInfo?.name || formData.name,
        phone: userInfo?.phone || formData.phone,
        email: userInfo?.email || formData.email
      });
      toast.success('Interesse cadastrado com sucesso!');
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao cadastrar interesse');
    } finally {
      setIsSubmitting(false);
    }
  };

  const OptionCard = ({ selected, onClick, letter, title, subtitle }) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
        selected 
          ? 'border-indigo-600 bg-indigo-50' 
          : 'border-slate-200 hover:border-slate-300 bg-white'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          selected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
        }`}>
          {letter}
        </div>
        <div className="flex-1">
          <p className={`font-medium ${selected ? 'text-indigo-900' : 'text-slate-900'}`}>
            {title}
          </p>
          {subtitle && (
            <p className={`text-sm ${selected ? 'text-indigo-600' : 'text-slate-500'}`}>
              {subtitle}
            </p>
          )}
        </div>
        {selected && <Check className="w-5 h-5 text-indigo-600" />}
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
      case 0:
        return (
          <div>
            <h2 className="text-xl font-bold mb-2">Como você se identifica nesse momento?</h2>
            <p className="text-slate-500 mb-4 text-sm">Selecione uma opção</p>
            <div className="space-y-2">
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
              />
              <OptionCard
                selected={formData.profile_type === 'familia_cresceu'}
                onClick={() => handleSingleSelect('profile_type', 'familia_cresceu')}
                letter="C"
                title="Minha família cresceu"
              />
              <OptionCard
                selected={formData.profile_type === 'investidor'}
                onClick={() => handleSingleSelect('profile_type', 'investidor')}
                letter="D"
                title="Buscando para investir"
              />
            </div>
          </div>
        );

      case 1:
        return (
          <div>
            <h2 className="text-xl font-bold mb-2">Qual o seu estado de urgência?</h2>
            <p className="text-slate-500 mb-4 text-sm">Selecione uma opção</p>
            <div className="space-y-2">
              <OptionCard
                selected={formData.urgency === '3_meses'}
                onClick={() => handleSingleSelect('urgency', '3_meses')}
                letter="A"
                title="Próximos 3 meses"
              />
              <OptionCard
                selected={formData.urgency === '6_meses'}
                onClick={() => handleSingleSelect('urgency', '6_meses')}
                letter="B"
                title="Próximos 6 meses"
              />
              <OptionCard
                selected={formData.urgency === 'sem_prazo'}
                onClick={() => handleSingleSelect('urgency', 'sem_prazo')}
                letter="C"
                title="Sem prazo definido"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div>
            <h2 className="text-xl font-bold mb-2">Onde você quer morar ou investir?</h2>
            <p className="text-slate-500 mb-4 text-sm">Digite cidade e bairros de interesse</p>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Ex: Jundiaí, Centro e Vila Arens"
                className="pl-12 h-12 text-base rounded-xl border-2"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div>
            <h2 className="text-xl font-bold mb-2">Qual sua faixa de investimento?</h2>
            <p className="text-slate-500 mb-4 text-sm">Selecione uma opção</p>
            <div className="space-y-2">
              <OptionCard selected={formData.budget_range === 'ate_400k'} onClick={() => handleSingleSelect('budget_range', 'ate_400k')} letter="A" title="Até R$ 400 mil" />
              <OptionCard selected={formData.budget_range === '400k_550k'} onClick={() => handleSingleSelect('budget_range', '400k_550k')} letter="B" title="R$ 400 mil a R$ 550 mil" />
              <OptionCard selected={formData.budget_range === '550k_700k'} onClick={() => handleSingleSelect('budget_range', '550k_700k')} letter="C" title="R$ 550 mil a R$ 700 mil" />
              <OptionCard selected={formData.budget_range === '700k_800k'} onClick={() => handleSingleSelect('budget_range', '700k_800k')} letter="D" title="R$ 700 mil a R$ 800 mil" />
              <OptionCard selected={formData.budget_range === 'acima_800k'} onClick={() => handleSingleSelect('budget_range', 'acima_800k')} letter="E" title="Acima de R$ 800 mil" />
            </div>
          </div>
        );

      case 4:
        return (
          <div>
            <h2 className="text-xl font-bold mb-2">O que é indispensável?</h2>
            <p className="text-slate-500 mb-4 text-sm">Selecione quantas opções quiser</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
              {[
                'Pelo menos 2 quartos', 'Pelo menos 3 quartos', 'Suíte',
                'Pelo menos 2 vagas', 'Área de lazer', 'Home office',
                'Área gourmet / varanda', 'Aceito apartamento',
                'Prefiro casa em condomínio', 'Quero casa em bairro aberto',
                'Piscina', 'Térrea ou quarto no térreo'
              ].map((item) => (
                <CheckboxCard
                  key={item}
                  selected={formData.indispensable.includes(item)}
                  onClick={() => handleMultiSelect('indispensable', item)}
                  text={item}
                />
              ))}
            </div>
            <Input
              value={formData.indispensable_other}
              onChange={(e) => setFormData(prev => ({ ...prev, indispensable_other: e.target.value }))}
              placeholder="Outro..."
              className="mt-3 rounded-xl"
            />
          </div>
        );

      case 5:
        return (
          <div>
            <h2 className="text-xl font-bold mb-2">Qual ambiente te dá mais sensação de alívio?</h2>
            <p className="text-slate-500 mb-4 text-sm">Selecione uma opção</p>
            <div className="space-y-2">
              <OptionCard selected={formData.ambiance === 'aconchegante'} onClick={() => handleSingleSelect('ambiance', 'aconchegante')} letter="A" title="Espaço aconchegante" subtitle="Plantas, madeira, pouca tecnologia" />
              <OptionCard selected={formData.ambiance === 'amplo_moderno'} onClick={() => handleSingleSelect('ambiance', 'amplo_moderno')} letter="B" title="Ambiente amplo, moderno" subtitle="Luz natural, janelas grandes" />
              <OptionCard selected={formData.ambiance === 'apartamento_clean'} onClick={() => handleSingleSelect('ambiance', 'apartamento_clean')} letter="C" title="Apartamento clean" subtitle="Vista para a cidade" />
              <OptionCard selected={formData.ambiance === 'casa_quintal'} onClick={() => handleSingleSelect('ambiance', 'casa_quintal')} letter="D" title="Casa com quintal" subtitle="Silêncio e distância do centro" />
              <OptionCard selected={formData.ambiance === 'casa_padrao'} onClick={() => handleSingleSelect('ambiance', 'casa_padrao')} letter="E" title="Casa padrão" subtitle="Privacidade e boa localização" />
            </div>
          </div>
        );

      case 6:
        return (
          <div>
            <h2 className="text-xl font-bold mb-2">O que mais te incomoda em um imóvel?</h2>
            <p className="text-slate-500 mb-4 text-sm">Selecione de 1 a 3 opções</p>
            <div className="space-y-2 max-h-[280px] overflow-y-auto">
              {[
                'Pouca luz natural', 'Vizinhança barulhenta', 'Espaços pequenos',
                'Acabamento genérico', 'Planta fechada', 'Localização ruim',
                'Falta de privacidade', 'Garagem apertada'
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
            <p className="text-sm text-slate-500 mt-2">{formData.deal_breakers.length}/3</p>
          </div>
        );

      case 7:
        return (
          <div>
            <h2 className="text-xl font-bold mb-2">O que precisa estar perto?</h2>
            <p className="text-slate-500 mb-4 text-sm">Selecione de 1 a 3 opções</p>
            <div className="space-y-2">
              {[
                'Escola ou creche', 'Mercado / comércio', 'Academia',
                'Parque ou área verde', 'Trabalho / centro comercial',
                'Restaurantes e vida noturna', 'Transporte público'
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
            <p className="text-sm text-slate-500 mt-2">{formData.proximity_needs.length}/3</p>
          </div>
        );

      case 8:
        return (
          <div>
            <h2 className="text-xl font-bold mb-2">Seu estilo pessoal</h2>
            <p className="text-slate-500 mb-4 text-sm">Selecione uma opção</p>
            <div className="space-y-2">
              <OptionCard selected={formData.personal_style === 'minimalista'} onClick={() => handleSingleSelect('personal_style', 'minimalista')} letter="A" title="Minimalista" subtitle="Menos é mais" />
              <OptionCard selected={formData.personal_style === 'aconchegante'} onClick={() => handleSingleSelect('personal_style', 'aconchegante')} letter="B" title="Aconchegante" subtitle="Pareça um lar" />
              <OptionCard selected={formData.personal_style === 'moderno'} onClick={() => handleSingleSelect('personal_style', 'moderno')} letter="C" title="Moderno" subtitle="Design contemporâneo" />
              <OptionCard selected={formData.personal_style === 'classico'} onClick={() => handleSingleSelect('personal_style', 'classico')} letter="D" title="Clássico" subtitle="Não sai de moda" />
              <OptionCard selected={formData.personal_style === 'descobrindo'} onClick={() => handleSingleSelect('personal_style', 'descobrindo')} letter="E" title="Ainda descobrindo" />
            </div>
          </div>
        );

      case 9:
        return (
          <div>
            <h2 className="text-xl font-bold mb-2">Algo faltou nos imóveis que visitou?</h2>
            <p className="text-slate-500 mb-4 text-sm">Opcional - conte sua experiência</p>
            <Textarea
              value={formData.experience_fears}
              onChange={(e) => setFormData(prev => ({ ...prev, experience_fears: e.target.value }))}
              placeholder="O que você teme não encontrar?"
              className="min-h-[120px] rounded-xl border-2"
            />
          </div>
        );

      case 10:
        return (
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mx-auto mb-6 flex items-center justify-center"
            >
              <Check className="w-8 h-8 text-white" />
            </motion.div>
            <h2 className="text-2xl font-bold mb-3">Tudo pronto!</h2>
            <p className="text-slate-600 mb-6">
              Clique em "Finalizar" para cadastrar seu interesse. Nossa equipe analisará seu perfil e enviará sugestões personalizadas.
            </p>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full h-12 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600"
            >
              {isSubmitting ? 'Cadastrando...' : 'Finalizar Cadastro'}
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-lg max-h-[90vh] overflow-hidden bg-white rounded-3xl shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white border-b px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Home className="w-6 h-6 text-indigo-600" />
                <span className="font-bold text-lg">Cadastrar Interesse</span>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Progress bar */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
                />
              </div>
              <span className="text-xs text-slate-500">{currentStep + 1}/{totalSteps}</span>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          {currentStep < 10 && (
            <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-between">
              <Button
                onClick={prevStep}
                variant="ghost"
                disabled={currentStep === 0}
                className="rounded-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <Button
                onClick={nextStep}
                disabled={!canProceed()}
                className="rounded-full bg-gradient-to-r from-indigo-600 to-purple-600"
              >
                Próximo
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default InterestFormModal;

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Home, ArrowRight, ArrowLeft, Check, X, MapPin
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
    property_type: '', // Nova tela 5
    indispensable: [],
    indispensable_other: '',
    ambiance: '',
    deal_breakers: [],
    proximity_needs: [],
    experience_fears: '',
    name: userInfo?.name || '',
    phone: userInfo?.phone || '',
    email: userInfo?.email || ''
  });

  const totalSteps = 10; // Agora são 10 telas (removeu a tela de estilo)

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
          toast.error(`Máximo ${maxSelections} opções`);
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
      case 4: return formData.property_type !== ''; // Nova tela - tipo de imóvel
      case 5: return formData.indispensable.length > 0;
      case 6: return formData.ambiance !== '';
      case 7: return formData.deal_breakers.length >= 1 && formData.deal_breakers.length <= 3;
      case 8: return formData.proximity_needs.length >= 1 && formData.proximity_needs.length <= 3;
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

  // Compact option card
  const OptionCard = ({ selected, onClick, letter, title, subtitle }) => (
    <div
      onClick={onClick}
      className={`p-2.5 md:p-3 rounded-xl border-2 cursor-pointer transition-all ${
        selected 
          ? 'border-indigo-600 bg-indigo-50' 
          : 'border-slate-200 hover:border-slate-300 bg-white'
      }`}
    >
      <div className="flex items-center gap-2">
        <div className={`w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs md:text-sm font-medium ${
          selected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
        }`}>
          {letter}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium leading-tight ${selected ? 'text-indigo-900' : 'text-slate-900'}`}>
            {title}
          </p>
          {subtitle && (
            <p className={`text-xs leading-tight ${selected ? 'text-indigo-600' : 'text-slate-500'}`}>
              {subtitle}
            </p>
          )}
        </div>
        {selected && <Check className="w-4 h-4 text-indigo-600 flex-shrink-0" />}
      </div>
    </div>
  );

  // Compact checkbox card
  const CheckboxCard = ({ selected, onClick, text, disabled }) => (
    <div
      onClick={!disabled ? onClick : undefined}
      className={`p-2 md:p-2.5 rounded-lg border-2 cursor-pointer transition-all ${
        selected 
          ? 'border-indigo-600 bg-indigo-50' 
          : disabled 
            ? 'border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed'
            : 'border-slate-200 hover:border-slate-300 bg-white'
      }`}
    >
      <div className="flex items-center gap-2">
        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
          selected ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'
        }`}>
          {selected && <Check className="w-2.5 h-2.5 text-white" />}
        </div>
        <p className={`text-xs md:text-sm leading-tight ${selected ? 'text-indigo-900 font-medium' : 'text-slate-700'}`}>
          {text}
        </p>
      </div>
    </div>
  );

  const renderStep = () => {
    switch (currentStep) {
      // TELA 1: Perfil - Adicionado "Quero sair do aluguel"
      case 0:
        return (
          <div>
            <h2 className="text-base md:text-lg font-bold mb-1">Como você se identifica?</h2>
            <p className="text-slate-500 mb-3 text-xs">Selecione uma opção</p>
            <div className="space-y-2">
              <OptionCard selected={formData.profile_type === 'primeiro_imovel'} onClick={() => handleSingleSelect('profile_type', 'primeiro_imovel')} letter="A" title="Comprando meu primeiro imóvel" />
              <OptionCard selected={formData.profile_type === 'sair_aluguel'} onClick={() => handleSingleSelect('profile_type', 'sair_aluguel')} letter="B" title="Quero sair do aluguel" />
              <OptionCard selected={formData.profile_type === 'melhor_localizacao'} onClick={() => handleSingleSelect('profile_type', 'melhor_localizacao')} letter="C" title="Quero melhor localização" />
              <OptionCard selected={formData.profile_type === 'familia_cresceu'} onClick={() => handleSingleSelect('profile_type', 'familia_cresceu')} letter="D" title="Minha família cresceu" />
              <OptionCard selected={formData.profile_type === 'investidor'} onClick={() => handleSingleSelect('profile_type', 'investidor')} letter="E" title="Buscando para investir" />
            </div>
          </div>
        );

      // TELA 2: Urgência - Mudado 6 meses para 12 meses
      case 1:
        return (
          <div>
            <h2 className="text-base md:text-lg font-bold mb-1">Qual seu estado de urgência?</h2>
            <p className="text-slate-500 mb-3 text-xs">Selecione uma opção</p>
            <div className="space-y-2">
              <OptionCard selected={formData.urgency === '3_meses'} onClick={() => handleSingleSelect('urgency', '3_meses')} letter="A" title="Próximos 3 meses" subtitle="Urgente" />
              <OptionCard selected={formData.urgency === '12_meses'} onClick={() => handleSingleSelect('urgency', '12_meses')} letter="B" title="Próximos 12 meses" subtitle="Planejando" />
              <OptionCard selected={formData.urgency === 'sem_prazo'} onClick={() => handleSingleSelect('urgency', 'sem_prazo')} letter="C" title="Sem prazo definido" subtitle="Pesquisando" />
            </div>
          </div>
        );

      // TELA 3: Localização - Mantido
      case 2:
        return (
          <div>
            <h2 className="text-base md:text-lg font-bold mb-1">Onde você quer morar ou investir?</h2>
            <p className="text-slate-500 mb-3 text-xs">Digite cidade e bairros de interesse</p>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Ex: Jundiaí, Centro e Vila Arens"
                className="pl-10 h-10 text-sm rounded-lg border-2"
              />
            </div>
          </div>
        );

      // TELA 4: Budget - Mudado E e adicionado F
      case 3:
        return (
          <div>
            <h2 className="text-base md:text-lg font-bold mb-1">Qual sua faixa de investimento?</h2>
            <p className="text-slate-500 mb-3 text-xs">Selecione uma opção</p>
            <div className="space-y-2">
              <OptionCard selected={formData.budget_range === 'ate_400k'} onClick={() => handleSingleSelect('budget_range', 'ate_400k')} letter="A" title="Até R$ 400 mil" />
              <OptionCard selected={formData.budget_range === '400k_550k'} onClick={() => handleSingleSelect('budget_range', '400k_550k')} letter="B" title="R$ 400 a 550 mil" />
              <OptionCard selected={formData.budget_range === '550k_700k'} onClick={() => handleSingleSelect('budget_range', '550k_700k')} letter="C" title="R$ 550 a 700 mil" />
              <OptionCard selected={formData.budget_range === '700k_800k'} onClick={() => handleSingleSelect('budget_range', '700k_800k')} letter="D" title="R$ 700 a 800 mil" />
              <OptionCard selected={formData.budget_range === '800k_1500k'} onClick={() => handleSingleSelect('budget_range', '800k_1500k')} letter="E" title="R$ 800 mil a 1,5 milhão" />
              <OptionCard selected={formData.budget_range === 'acima_1500k'} onClick={() => handleSingleSelect('budget_range', 'acima_1500k')} letter="F" title="Acima de R$ 1,5 milhão" />
            </div>
          </div>
        );

      // TELA 5: NOVA - O que está procurando?
      case 4:
        return (
          <div>
            <h2 className="text-base md:text-lg font-bold mb-1">O que está procurando?</h2>
            <p className="text-slate-500 mb-3 text-xs">Selecione o tipo de imóvel</p>
            <div className="space-y-2">
              <OptionCard selected={formData.property_type === 'apartamento'} onClick={() => handleSingleSelect('property_type', 'apartamento')} letter="A" title="Apartamento" />
              <OptionCard selected={formData.property_type === 'casa'} onClick={() => handleSingleSelect('property_type', 'casa')} letter="B" title="Casa" />
              <OptionCard selected={formData.property_type === 'casa_condominio'} onClick={() => handleSingleSelect('property_type', 'casa_condominio')} letter="C" title="Casa de condomínio" />
              <OptionCard selected={formData.property_type === 'terreno'} onClick={() => handleSingleSelect('property_type', 'terreno')} letter="D" title="Terreno" />
              <OptionCard selected={formData.property_type === 'terreno_condominio'} onClick={() => handleSingleSelect('property_type', 'terreno_condominio')} letter="E" title="Terreno de condomínio" />
              <OptionCard selected={formData.property_type === 'sala_comercial'} onClick={() => handleSingleSelect('property_type', 'sala_comercial')} letter="F" title="Sala comercial" />
              <OptionCard selected={formData.property_type === 'predio_comercial'} onClick={() => handleSingleSelect('property_type', 'predio_comercial')} letter="G" title="Prédio comercial" />
              <OptionCard selected={formData.property_type === 'studio_loft'} onClick={() => handleSingleSelect('property_type', 'studio_loft')} letter="H" title="Studio/Loft" />
            </div>
          </div>
        );

      // TELA 6: O que é indispensável - Atualizado
      case 5:
        return (
          <div>
            <h2 className="text-base md:text-lg font-bold mb-1">O que é indispensável?</h2>
            <p className="text-slate-500 mb-3 text-xs">Selecione quantas opções quiser</p>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                '2+ quartos', '3+ quartos', 'Suíte', '2+ vagas',
                'Home office', 'Área gourmet', 'Varanda Gourmet', 'Piscina',
                'Térrea', 'Terreno grande', 'Porteira fechada', 'Elevador',
                'Área de lazer completa'
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
              className="mt-2 h-9 text-sm rounded-lg"
            />
          </div>
        );

      // TELA 7: Qual ambiente te traz alívio - Atualizado opções C, D, E
      case 6:
        return (
          <div>
            <h2 className="text-base md:text-lg font-bold mb-1">Qual ambiente te traz mais alívio?</h2>
            <p className="text-slate-500 mb-3 text-xs">Selecione uma opção</p>
            <div className="space-y-2">
              <OptionCard selected={formData.ambiance === 'aconchegante'} onClick={() => handleSingleSelect('ambiance', 'aconchegante')} letter="A" title="Aconchegante" subtitle="Plantas, madeira, natureza" />
              <OptionCard selected={formData.ambiance === 'amplo_moderno'} onClick={() => handleSingleSelect('ambiance', 'amplo_moderno')} letter="B" title="Amplo e moderno" subtitle="Luz natural, janelas grandes" />
              <OptionCard selected={formData.ambiance === 'minimalista'} onClick={() => handleSingleSelect('ambiance', 'minimalista')} letter="C" title="Arquitetura minimalista" subtitle="Simples e funcional" />
              <OptionCard selected={formData.ambiance === 'casa_campo'} onClick={() => handleSingleSelect('ambiance', 'casa_campo')} letter="D" title="Casa de campo" subtitle="Tranquilidade e natureza" />
              <OptionCard selected={formData.ambiance === 'alto_padrao'} onClick={() => handleSingleSelect('ambiance', 'alto_padrao')} letter="E" title="Alto Padrão" subtitle="Moderno e sofisticado" />
            </div>
          </div>
        );

      // TELA 8: O que mais te incomoda - Mantido
      case 7:
        return (
          <div>
            <h2 className="text-base md:text-lg font-bold mb-1">O que mais te incomoda?</h2>
            <p className="text-slate-500 mb-3 text-xs">Selecione de 1 a 3 opções</p>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                'Pouca luz', 'Barulho', 'Espaços pequenos', 'Acabamento ruim',
                'Planta fechada', 'Localização ruim', 'Sem privacidade', 'Garagem ruim'
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
            <p className="text-xs text-slate-500 mt-2 text-center">{formData.deal_breakers.length}/3 selecionados</p>
          </div>
        );

      // TELA 9: O que precisa estar perto - Adicionado "Tanto faz"
      case 8:
        return (
          <div>
            <h2 className="text-base md:text-lg font-bold mb-1">O que precisa estar perto?</h2>
            <p className="text-slate-500 mb-3 text-xs">Selecione de 1 a 3 opções</p>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                'Escola/creche', 'Mercado', 'Academia', 'Parque/área verde',
                'Trabalho', 'Restaurantes', 'Transporte público', 'Tanto faz'
              ].map((item) => (
                <CheckboxCard
                  key={item}
                  selected={formData.proximity_needs.includes(item)}
                  onClick={() => {
                    // Se clicar em "Tanto faz", limpa os outros e seleciona só ele
                    if (item === 'Tanto faz') {
                      if (formData.proximity_needs.includes('Tanto faz')) {
                        setFormData(prev => ({ ...prev, proximity_needs: [] }));
                      } else {
                        setFormData(prev => ({ ...prev, proximity_needs: ['Tanto faz'] }));
                      }
                    } else {
                      // Se já tem "Tanto faz" selecionado, remove ao selecionar outro
                      if (formData.proximity_needs.includes('Tanto faz')) {
                        setFormData(prev => ({ ...prev, proximity_needs: [item] }));
                      } else {
                        handleMultiSelect('proximity_needs', item, 3);
                      }
                    }
                  }}
                  text={item}
                  disabled={
                    item !== 'Tanto faz' && 
                    !formData.proximity_needs.includes('Tanto faz') &&
                    formData.proximity_needs.length >= 3 && 
                    !formData.proximity_needs.includes(item)
                  }
                />
              ))}
            </div>
            {!formData.proximity_needs.includes('Tanto faz') && (
              <p className="text-xs text-slate-500 mt-2 text-center">{formData.proximity_needs.length}/3 selecionados</p>
            )}
          </div>
        );

      // TELA 10: Campo aberto - Última tela
      case 9:
        return (
          <div className="text-center py-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full mx-auto mb-3 flex items-center justify-center"
            >
              <Home className="w-6 h-6 text-white" />
            </motion.div>
            <h2 className="text-base md:text-lg font-bold mb-1">Quase lá!</h2>
            <p className="text-slate-500 mb-3 text-xs">Informação extra para nos ajudar na busca (opcional)</p>
            <Textarea
              value={formData.experience_fears}
              onChange={(e) => setFormData(prev => ({ ...prev, experience_fears: e.target.value }))}
              placeholder="Ex: Preciso de espaço para pets, tenho home office, prefiro andar alto, aceito permuta..."
              className="min-h-[80px] text-sm rounded-lg border-2 resize-none mb-4"
            />
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full h-10 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-sm"
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
        className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-black/50 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-md md:max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col"
          style={{ maxHeight: 'calc(100vh - 24px)' }}
        >
          {/* Header */}
          <div className="flex-shrink-0 bg-white border-b px-4 py-3 rounded-t-2xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Home className="w-5 h-5 text-indigo-600" />
                <span className="font-bold text-sm md:text-base">Cadastrar Interesse</span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Progress bar */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
                />
              </div>
              <span className="text-xs text-slate-500 font-medium">{currentStep + 1}/{totalSteps}</span>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-4 md:p-5 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.2 }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          {currentStep < 9 && (
            <div className="flex-shrink-0 bg-white border-t px-4 py-3 flex justify-between rounded-b-2xl">
              <Button
                onClick={prevStep}
                variant="ghost"
                disabled={currentStep === 0}
                className="rounded-full h-9 text-sm"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Voltar
              </Button>
              <Button
                onClick={nextStep}
                disabled={!canProceed()}
                className="rounded-full h-9 text-sm bg-gradient-to-r from-indigo-600 to-purple-600"
              >
                Próximo
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default InterestFormModal;

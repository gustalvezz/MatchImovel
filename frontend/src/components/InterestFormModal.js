import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Home, ArrowRight, ArrowLeft, Check, X, MapPin, FileText, ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Terms of Use Modal Component
const TermsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  
  const currentDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-2xl">
          <div className="flex items-center gap-2 text-white">
            <FileText className="w-5 h-5" />
            <h2 className="font-bold">Termo de Uso — Comprador MatchImóvel</h2>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 text-sm text-slate-700 space-y-4">
          <p className="text-center font-bold text-base text-slate-900">
            TERMO DE USO E COMPROMISSO DE INTERMEDIAÇÃO<br/>
            MatchImóvel — Plataforma de Conexão Imobiliária<br/>
            <span className="font-normal text-slate-500">Versão 1.0 — {currentDate}</span>
          </p>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-slate-900">1. DAS PARTES</h3>
              <p>O presente termo é celebrado entre:</p>
              <p><strong>MatchImóvel</strong>, nome fantasia de G. A. SILVA NEGOCIOS IMOBILIARIOS - ME, inscrita no CNPJ sob o nº 31.957.586/0001-00, doravante denominada PLATAFORMA; e</p>
              <p>O usuário que realizou o cadastro e aceitou eletronicamente este instrumento, doravante denominado COMPRADOR.</p>
            </div>
            
            <div>
              <h3 className="font-bold text-slate-900">2. DO OBJETO</h3>
              <p>A MatchImóvel é uma plataforma de intermediação imobiliária especializada no lado do comprador. Sua função é receber o perfil de busca do COMPRADOR, conectá-lo a corretores parceiros credenciados e realizar a curadoria das oportunidades antes de qualquer apresentação.</p>
            </div>
            
            <div>
              <h3 className="font-bold text-slate-900">3. DAS OBRIGAÇÕES DA PLATAFORMA</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Manter o sigilo absoluto dos dados de contato do COMPRADOR;</li>
                <li>Realizar curadoria prévia de todas as oportunidades;</li>
                <li>Não cobrar qualquer valor do COMPRADOR pelo serviço.</li>
              </ul>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h3 className="font-bold text-slate-900">5. DA PROTEÇÃO DA INTERMEDIAÇÃO</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>O COMPRADOR reconhece que qualquer imóvel apresentado pela MatchImóvel foi originado através da rede de intermediação da PLATAFORMA;</li>
                <li>A comissão de intermediação é de <strong>6% sobre o valor do negócio</strong>;</li>
                <li>A obrigação persiste pelo prazo de <strong>18 meses</strong>.</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-slate-900">8. DO ACEITE ELETRÔNICO</h3>
              <p>O aceite deste termo se dá pelo clique no botão "Li e aceito os Termos de Uso" no momento do cadastro. O sistema registrará automaticamente a data, hora e endereço IP do aceite.</p>
            </div>
            
            <p className="text-center font-medium text-slate-600 pt-4 border-t">
              Ao clicar em "Li e aceito os Termos de Uso", o COMPRADOR declara ter lido, compreendido e concordado com todas as cláusulas deste instrumento.
            </p>
          </div>
        </div>
        
        <div className="p-4 border-t bg-slate-50 rounded-b-2xl">
          <Button onClick={onClose} className="w-full rounded-full bg-gradient-to-r from-indigo-600 to-purple-600">
            Fechar e Voltar
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const InterestFormModal = ({ isOpen, onClose, onSuccess, userInfo }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  
  const [formData, setFormData] = useState({
    // BLOCO 1 - QUEM É VOCÊ
    age_range: '',
    profile_type: '',
    profile_type_other: '',
    who_will_live: [],
    children_count: '',
    children_ages: [],
    urgency: '',
    
    // BLOCO 2 - O QUE VOCÊ BUSCA
    property_type: '',
    floor_preference: '',
    land_priorities: [],
    location: '',
    budget_range: '',
    payment_method: [],
    current_property_status: '',
    
    // BLOCO 3 - COMO DEVE SER
    indispensable: [],
    indispensable_other: '',
    space_size: '',
    property_condition: [],
    ambiance: '',
    
    // BLOCO 4 - COMO VOCÊ VIVE
    has_pets: '',
    daily_routine: [],
    transportation: [],
    
    // BLOCO 5 - O QUE VOCÊ REJEITA
    deal_breakers: [],
    
    // BLOCO 6 - ENTORNO
    proximity_needs: [],
    
    // BLOCO 7 - FINALIZAÇÃO
    additional_notes: '',
    
    // User info
    name: userInfo?.name || '',
    phone: userInfo?.phone || '',
    email: userInfo?.email || ''
  });

  // Define all screens including conditionals
  const allScreens = useMemo(() => {
    const screens = [
      { id: 'age_range', block: 1 },
      { id: 'profile_type', block: 1 },
      { id: 'who_will_live', block: 1 },
    ];
    
    // CONDICIONAL 1: Se selecionou "Filho(s)"
    if (formData.who_will_live.includes('Filho(s)')) {
      screens.push({ id: 'children_count', block: 1, conditional: true });
      screens.push({ id: 'children_ages', block: 1, conditional: true });
    }
    
    screens.push({ id: 'urgency', block: 1 });
    screens.push({ id: 'property_type', block: 2 });
    
    // CONDICIONAL 2: Se selecionou "Apartamento" ou "Studio / Loft"
    if (['apartamento', 'studio_loft'].includes(formData.property_type)) {
      screens.push({ id: 'floor_preference', block: 2, conditional: true });
    }
    
    // CONDICIONAL 3: Se selecionou "Terreno" ou "Terreno de condomínio"
    if (['terreno', 'terreno_condominio'].includes(formData.property_type)) {
      screens.push({ id: 'land_priorities', block: 2, conditional: true });
    }
    
    screens.push({ id: 'location', block: 2 });
    screens.push({ id: 'budget_range', block: 2 });
    screens.push({ id: 'payment_method', block: 2 });
    
    // CONDICIONAL 4: Se selecionou "Tenho imóvel para dar como parte do pagamento"
    if (formData.payment_method.includes('Tenho imóvel para dar como parte do pagamento')) {
      screens.push({ id: 'current_property_status', block: 2, conditional: true });
    }
    
    screens.push({ id: 'indispensable', block: 3 });
    screens.push({ id: 'space_size', block: 3 });
    screens.push({ id: 'property_condition', block: 3 });
    screens.push({ id: 'ambiance', block: 3 });
    screens.push({ id: 'has_pets', block: 4 });
    screens.push({ id: 'daily_routine', block: 4 });
    screens.push({ id: 'transportation', block: 4 });
    screens.push({ id: 'deal_breakers', block: 5 });
    screens.push({ id: 'proximity_needs', block: 6 });
    screens.push({ id: 'finalization', block: 7 });
    
    return screens;
  }, [formData.who_will_live, formData.property_type, formData.payment_method]);

  const totalSteps = allScreens.length;
  const currentScreenId = allScreens[currentStep]?.id;

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
    switch (currentScreenId) {
      case 'age_range': return formData.age_range !== '';
      case 'profile_type': return formData.profile_type !== '';
      case 'who_will_live': return formData.who_will_live.length > 0;
      case 'children_count': return formData.children_count !== '';
      case 'children_ages': return formData.children_ages.length > 0;
      case 'urgency': return formData.urgency !== '';
      case 'property_type': return formData.property_type !== '';
      case 'floor_preference': return formData.floor_preference !== '';
      case 'land_priorities': return formData.land_priorities.length > 0;
      case 'location': return formData.location.trim() !== '';
      case 'budget_range': return formData.budget_range !== '';
      case 'payment_method': return formData.payment_method.length > 0;
      case 'current_property_status': return formData.current_property_status !== '';
      case 'indispensable': return formData.indispensable.length > 0 || (formData.indispensable.includes('Outro') && formData.indispensable_other.trim() !== '');
      case 'space_size': return formData.space_size !== '';
      case 'property_condition': return formData.property_condition.length > 0;
      case 'ambiance': return formData.ambiance !== '';
      case 'has_pets': return formData.has_pets !== '';
      case 'daily_routine': return formData.daily_routine.length > 0 && formData.daily_routine.length <= 3;
      case 'transportation': return formData.transportation.length > 0;
      case 'deal_breakers': return formData.deal_breakers.length > 0 && formData.deal_breakers.length <= 3;
      case 'proximity_needs': return formData.proximity_needs.length > 0 && formData.proximity_needs.length <= 3;
      case 'finalization': return formData.additional_notes.trim().length >= 20 && termsAccepted;
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
    if (!termsAccepted) {
      toast.error('Você precisa aceitar os Termos de Uso para continuar');
      return;
    }
    
    if (formData.additional_notes.trim().length < 20) {
      toast.error('O campo de observações deve ter no mínimo 20 caracteres');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await axios.post(`${API}/interests/create-full-v2`, {
        ...formData,
        name: userInfo?.name || formData.name,
        phone: userInfo?.phone || formData.phone,
        email: userInfo?.email || formData.email,
        terms_accepted: true,
        terms_accepted_at: new Date().toISOString()
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

  // Option Card Component
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

  // Checkbox Card Component
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
    switch (currentScreenId) {
      // TELA 1: Faixa etária
      case 'age_range':
        return (
          <div>
            <h2 className="text-base md:text-lg font-bold mb-1">Qual sua faixa etária?</h2>
            <p className="text-slate-500 mb-3 text-xs">Selecione uma opção</p>
            <div className="space-y-2">
              <OptionCard selected={formData.age_range === 'ate_30'} onClick={() => handleSingleSelect('age_range', 'ate_30')} letter="A" title="Até 30 anos" />
              <OptionCard selected={formData.age_range === '30_45'} onClick={() => handleSingleSelect('age_range', '30_45')} letter="B" title="30 a 45 anos" />
              <OptionCard selected={formData.age_range === '45_60'} onClick={() => handleSingleSelect('age_range', '45_60')} letter="C" title="45 a 60 anos" />
              <OptionCard selected={formData.age_range === 'acima_60'} onClick={() => handleSingleSelect('age_range', 'acima_60')} letter="D" title="Acima de 60 anos" />
            </div>
          </div>
        );

      // TELA 2: Por que está buscando
      case 'profile_type':
        return (
          <div>
            <h2 className="text-base md:text-lg font-bold mb-1">Por que está buscando um imóvel?</h2>
            <p className="text-slate-500 mb-3 text-xs">Selecione uma opção</p>
            <div className="space-y-2">
              <OptionCard selected={formData.profile_type === 'primeiro_imovel'} onClick={() => handleSingleSelect('profile_type', 'primeiro_imovel')} letter="A" title="Comprando meu primeiro imóvel" />
              <OptionCard selected={formData.profile_type === 'sair_aluguel'} onClick={() => handleSingleSelect('profile_type', 'sair_aluguel')} letter="B" title="Quero sair do aluguel" />
              <OptionCard selected={formData.profile_type === 'familia_cresceu'} onClick={() => handleSingleSelect('profile_type', 'familia_cresceu')} letter="C" title="Minha família cresceu" />
              <OptionCard selected={formData.profile_type === 'melhor_localizacao'} onClick={() => handleSingleSelect('profile_type', 'melhor_localizacao')} letter="D" title="Quero melhorar de localização" />
              <OptionCard selected={formData.profile_type === 'investidor'} onClick={() => handleSingleSelect('profile_type', 'investidor')} letter="E" title="Buscando para investir" />
              <OptionCard selected={formData.profile_type === 'simplificar'} onClick={() => handleSingleSelect('profile_type', 'simplificar')} letter="F" title="Quero reduzir / simplificar a vida" />
              <OptionCard selected={formData.profile_type === 'outro'} onClick={() => handleSingleSelect('profile_type', 'outro')} letter="G" title="Outro" />
            </div>
            {formData.profile_type === 'outro' && (
              <Input
                value={formData.profile_type_other}
                onChange={(e) => setFormData(prev => ({ ...prev, profile_type_other: e.target.value }))}
                placeholder="Descreva..."
                className="mt-2 h-9 text-sm rounded-lg"
              />
            )}
          </div>
        );

      // TELA 3: Quem vai morar
      case 'who_will_live':
        return (
          <div>
            <h2 className="text-base md:text-lg font-bold mb-1">Quem vai morar no imóvel?</h2>
            <p className="text-slate-500 mb-3 text-xs">Selecione todas que se aplicam</p>
            <div className="space-y-2">
              {[
                'Só eu',
                'Meu parceiro / cônjuge',
                'Filho(s)',
                'Pai, mãe ou sogro(s)',
                'Pessoa com mobilidade reduzida',
                'Vou dividir com amigos ou colegas',
                'Preciso de quarto de visitas permanente'
              ].map((item) => (
                <CheckboxCard
                  key={item}
                  selected={formData.who_will_live.includes(item)}
                  onClick={() => handleMultiSelect('who_will_live', item)}
                  text={item}
                />
              ))}
            </div>
          </div>
        );

      // TELA 3A: Quantos filhos (condicional)
      case 'children_count':
        return (
          <div>
            <h2 className="text-base md:text-lg font-bold mb-1">Quantos filhos vão morar com você?</h2>
            <p className="text-slate-500 mb-3 text-xs">Selecione uma opção</p>
            <div className="space-y-2">
              <OptionCard selected={formData.children_count === '1'} onClick={() => handleSingleSelect('children_count', '1')} letter="A" title="1 filho" />
              <OptionCard selected={formData.children_count === '2'} onClick={() => handleSingleSelect('children_count', '2')} letter="B" title="2 filhos" />
              <OptionCard selected={formData.children_count === '3_mais'} onClick={() => handleSingleSelect('children_count', '3_mais')} letter="C" title="3 ou mais" />
            </div>
          </div>
        );

      // TELA 3B: Faixa etária dos filhos (condicional)
      case 'children_ages':
        return (
          <div>
            <h2 className="text-base md:text-lg font-bold mb-1">Qual a faixa etária dos filhos?</h2>
            <p className="text-slate-500 mb-3 text-xs">Pode marcar mais de uma</p>
            <div className="space-y-2">
              {[
                'Bebê ou criança pequena (até 6 anos)',
                'Criança em idade escolar (7 a 12 anos)',
                'Adolescente (13 a 17 anos)',
                'Filho adulto que ainda mora junto'
              ].map((item) => (
                <CheckboxCard
                  key={item}
                  selected={formData.children_ages.includes(item)}
                  onClick={() => handleMultiSelect('children_ages', item)}
                  text={item}
                />
              ))}
            </div>
          </div>
        );

      // TELA 4: Urgência
      case 'urgency':
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

      // TELA 5: Tipo de imóvel
      case 'property_type':
        return (
          <div>
            <h2 className="text-base md:text-lg font-bold mb-1">O que está procurando?</h2>
            <p className="text-slate-500 mb-3 text-xs">Selecione o tipo de imóvel</p>
            <div className="space-y-2">
              <OptionCard selected={formData.property_type === 'apartamento'} onClick={() => handleSingleSelect('property_type', 'apartamento')} letter="A" title="Apartamento" />
              <OptionCard selected={formData.property_type === 'casa'} onClick={() => handleSingleSelect('property_type', 'casa')} letter="B" title="Casa" />
              <OptionCard selected={formData.property_type === 'casa_condominio'} onClick={() => handleSingleSelect('property_type', 'casa_condominio')} letter="C" title="Casa de condomínio" />
              <OptionCard selected={formData.property_type === 'studio_loft'} onClick={() => handleSingleSelect('property_type', 'studio_loft')} letter="D" title="Studio / Loft" />
              <OptionCard selected={formData.property_type === 'terreno'} onClick={() => handleSingleSelect('property_type', 'terreno')} letter="E" title="Terreno" />
              <OptionCard selected={formData.property_type === 'terreno_condominio'} onClick={() => handleSingleSelect('property_type', 'terreno_condominio')} letter="F" title="Terreno de condomínio" />
              <OptionCard selected={formData.property_type === 'sala_comercial'} onClick={() => handleSingleSelect('property_type', 'sala_comercial')} letter="G" title="Sala comercial" />
              <OptionCard selected={formData.property_type === 'predio_comercial'} onClick={() => handleSingleSelect('property_type', 'predio_comercial')} letter="H" title="Prédio comercial" />
            </div>
          </div>
        );

      // TELA 5A: Preferência de andar (condicional - apartamento/studio)
      case 'floor_preference':
        return (
          <div>
            <h2 className="text-base md:text-lg font-bold mb-1">Prefere em qual andar?</h2>
            <p className="text-slate-500 mb-3 text-xs">Selecione uma opção</p>
            <div className="space-y-2">
              <OptionCard selected={formData.floor_preference === 'terreo'} onClick={() => handleSingleSelect('floor_preference', 'terreo')} letter="A" title="Térreo ou baixo" subtitle="Facilidade de acesso" />
              <OptionCard selected={formData.floor_preference === 'meio'} onClick={() => handleSingleSelect('floor_preference', 'meio')} letter="B" title="Meio" subtitle="Equilíbrio entre acesso e vista" />
              <OptionCard selected={formData.floor_preference === 'alto'} onClick={() => handleSingleSelect('floor_preference', 'alto')} letter="C" title="Alto" subtitle="Vista, silêncio e privacidade" />
              <OptionCard selected={formData.floor_preference === 'tanto_faz'} onClick={() => handleSingleSelect('floor_preference', 'tanto_faz')} letter="D" title="Tanto faz" />
            </div>
          </div>
        );

      // TELA 5B: Prioridades do terreno (condicional - terreno)
      case 'land_priorities':
        return (
          <div>
            <h2 className="text-base md:text-lg font-bold mb-1">O que importa no terreno?</h2>
            <p className="text-slate-500 mb-3 text-xs">Selecione todas que se aplicam</p>
            <div className="space-y-2">
              {[
                'Topografia plana',
                'Já tem projeto aprovado',
                'Potencial para construção imediata',
                'Localização acima de tudo',
                'Condomínio fechado'
              ].map((item) => (
                <CheckboxCard
                  key={item}
                  selected={formData.land_priorities.includes(item)}
                  onClick={() => handleMultiSelect('land_priorities', item)}
                  text={item}
                />
              ))}
            </div>
          </div>
        );

      // TELA 6: Localização
      case 'location':
        return (
          <div>
            <h2 className="text-base md:text-lg font-bold mb-1">Onde quer morar ou investir?</h2>
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

      // TELA 7: Orçamento
      case 'budget_range':
        return (
          <div>
            <h2 className="text-base md:text-lg font-bold mb-1">Qual seu orçamento máximo?</h2>
            <p className="text-slate-500 mb-3 text-xs">Selecione uma opção</p>
            <div className="space-y-2">
              <OptionCard selected={formData.budget_range === 'ate_400k'} onClick={() => handleSingleSelect('budget_range', 'ate_400k')} letter="A" title="Até R$ 400 mil" />
              <OptionCard selected={formData.budget_range === 'ate_550k'} onClick={() => handleSingleSelect('budget_range', 'ate_550k')} letter="B" title="Até R$ 550 mil" />
              <OptionCard selected={formData.budget_range === 'ate_700k'} onClick={() => handleSingleSelect('budget_range', 'ate_700k')} letter="C" title="Até R$ 700 mil" />
              <OptionCard selected={formData.budget_range === 'ate_800k'} onClick={() => handleSingleSelect('budget_range', 'ate_800k')} letter="D" title="Até R$ 800 mil" />
              <OptionCard selected={formData.budget_range === 'ate_1500k'} onClick={() => handleSingleSelect('budget_range', 'ate_1500k')} letter="E" title="Até R$ 1,5 milhão" />
              <OptionCard selected={formData.budget_range === 'ate_2500k'} onClick={() => handleSingleSelect('budget_range', 'ate_2500k')} letter="F" title="Até R$ 2,5 milhões" />
              <OptionCard selected={formData.budget_range === 'ate_5000k'} onClick={() => handleSingleSelect('budget_range', 'ate_5000k')} letter="G" title="Até R$ 5 milhões" />
              <OptionCard selected={formData.budget_range === 'acima_5000k'} onClick={() => handleSingleSelect('budget_range', 'acima_5000k')} letter="H" title="Acima de R$ 5 milhões" />
            </div>
          </div>
        );

      // TELA 8: Forma de pagamento
      case 'payment_method':
        return (
          <div>
            <h2 className="text-base md:text-lg font-bold mb-1">Como pretende pagar?</h2>
            <p className="text-slate-500 mb-3 text-xs">Selecione todas que se aplicam</p>
            <div className="space-y-2">
              {[
                'À vista',
                'Financiamento bancário',
                'FGTS + financiamento',
                'Tenho imóvel para dar como parte do pagamento',
                'Ainda não sei'
              ].map((item) => (
                <CheckboxCard
                  key={item}
                  selected={formData.payment_method.includes(item)}
                  onClick={() => handleMultiSelect('payment_method', item)}
                  text={item}
                />
              ))}
            </div>
          </div>
        );

      // TELA 8A: Situação do imóvel atual (condicional)
      case 'current_property_status':
        return (
          <div>
            <h2 className="text-base md:text-lg font-bold mb-1">Qual a situação do seu imóvel atual?</h2>
            <p className="text-slate-500 mb-3 text-xs">Selecione uma opção</p>
            <div className="space-y-2">
              <OptionCard selected={formData.current_property_status === 'a_venda'} onClick={() => handleSingleSelect('current_property_status', 'a_venda')} letter="A" title="Já está à venda" />
              <OptionCard selected={formData.current_property_status === 'nao_a_venda'} onClick={() => handleSingleSelect('current_property_status', 'nao_a_venda')} letter="B" title="Ainda não coloquei à venda" />
              <OptionCard selected={formData.current_property_status === 'precisa_vender'} onClick={() => handleSingleSelect('current_property_status', 'precisa_vender')} letter="C" title="Preciso vender para conseguir comprar" />
              <OptionCard selected={formData.current_property_status === 'opcional'} onClick={() => handleSingleSelect('current_property_status', 'opcional')} letter="D" title="É opcional — consigo comprar sem vender" />
            </div>
          </div>
        );

      // TELA 9: O que é indispensável
      case 'indispensable':
        return (
          <div>
            <h2 className="text-base md:text-lg font-bold mb-1">O que é indispensável?</h2>
            <p className="text-slate-500 mb-3 text-xs">Selecione quantas opções quiser</p>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                '2+ quartos', '3+ quartos', 'Suíte', '2+ banheiros', '2+ vagas',
                'Home office', 'Varanda / Varanda gourmet', 'Área gourmet', 'Piscina',
                'Porteira fechada / Condomínio fechado', 'Elevador', 'Térrea',
                'Área de lazer completa', 'Terreno grande'
              ].map((item) => (
                <CheckboxCard
                  key={item}
                  selected={formData.indispensable.includes(item)}
                  onClick={() => handleMultiSelect('indispensable', item)}
                  text={item}
                />
              ))}
            </div>
            {/* Checkbox "Outro" com campo de texto */}
            <div className="mt-2">
              <div
                onClick={() => handleMultiSelect('indispensable', 'Outro')}
                className={`p-2 md:p-2.5 rounded-lg border-2 cursor-pointer transition-all ${
                  formData.indispensable.includes('Outro')
                    ? 'border-indigo-600 bg-indigo-50' 
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                    formData.indispensable.includes('Outro') ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'
                  }`}>
                    {formData.indispensable.includes('Outro') && <Check className="w-2.5 h-2.5 text-white" />}
                  </div>
                  <p className={`text-xs md:text-sm leading-tight ${formData.indispensable.includes('Outro') ? 'text-indigo-900 font-medium' : 'text-slate-700'}`}>
                    Outro
                  </p>
                </div>
              </div>
              {formData.indispensable.includes('Outro') && (
                <Input
                  value={formData.indispensable_other}
                  onChange={(e) => setFormData(prev => ({ ...prev, indispensable_other: e.target.value }))}
                  placeholder="Descreva o que é indispensável..."
                  className="mt-2 h-9 text-sm rounded-lg border-2 border-indigo-200 focus:border-indigo-400"
                  autoFocus
                />
              )}
            </div>
          </div>
        );

      // TELA 10: Tamanho do espaço
      case 'space_size':
        return (
          <div>
            <h2 className="text-base md:text-lg font-bold mb-1">Como você imagina o espaço ideal?</h2>
            <p className="text-slate-500 mb-3 text-xs">Selecione uma opção</p>
            <div className="space-y-2">
              <OptionCard selected={formData.space_size === 'compacto'} onClick={() => handleSingleSelect('space_size', 'compacto')} letter="A" title="Compacto e funcional" subtitle="Só o essencial bem aproveitado" />
              <OptionCard selected={formData.space_size === 'equilibrado'} onClick={() => handleSingleSelect('space_size', 'equilibrado')} letter="B" title="Equilibrado" subtitle="Confortável sem exageros" />
              <OptionCard selected={formData.space_size === 'espacoso'} onClick={() => handleSingleSelect('space_size', 'espacoso')} letter="C" title="Espaçoso" subtitle="Cômodos generosos, área de sobra" />
              <OptionCard selected={formData.space_size === 'grande'} onClick={() => handleSingleSelect('space_size', 'grande')} letter="D" title="Grande" subtitle="Espaço é prioridade, quanto mais melhor" />
            </div>
          </div>
        );

      // TELA 11: Condição do imóvel
      case 'property_condition':
        return (
          <div>
            <h2 className="text-base md:text-lg font-bold mb-1">Como prefere o imóvel?</h2>
            <p className="text-slate-500 mb-3 text-xs">Selecione todas que se aplicam</p>
            <div className="space-y-2">
              {[
                'Novo ou em construção',
                'Usado em bom estado',
                'Aceito reformar se a localização valer',
                'Tanto faz'
              ].map((item) => (
                <CheckboxCard
                  key={item}
                  selected={formData.property_condition.includes(item)}
                  onClick={() => handleMultiSelect('property_condition', item)}
                  text={item}
                />
              ))}
            </div>
          </div>
        );

      // TELA 12: Ambiente ideal
      case 'ambiance':
        return (
          <div>
            <h2 className="text-base md:text-lg font-bold mb-1">Qual ambiente te traz mais alívio?</h2>
            <p className="text-slate-500 mb-3 text-xs">Selecione uma opção</p>
            <div className="space-y-2">
              <OptionCard selected={formData.ambiance === 'aconchegante'} onClick={() => handleSingleSelect('ambiance', 'aconchegante')} letter="A" title="Aconchegante" subtitle="Plantas, madeira, natureza" />
              <OptionCard selected={formData.ambiance === 'amplo_moderno'} onClick={() => handleSingleSelect('ambiance', 'amplo_moderno')} letter="B" title="Amplo e moderno" subtitle="Luz natural, janelas grandes" />
              <OptionCard selected={formData.ambiance === 'minimalista'} onClick={() => handleSingleSelect('ambiance', 'minimalista')} letter="C" title="Arquitetura minimalista" subtitle="Simples e funcional" />
              <OptionCard selected={formData.ambiance === 'casa_campo'} onClick={() => handleSingleSelect('ambiance', 'casa_campo')} letter="D" title="Casa de campo" subtitle="Tranquilidade e natureza" />
              <OptionCard selected={formData.ambiance === 'alto_padrao'} onClick={() => handleSingleSelect('ambiance', 'alto_padrao')} letter="E" title="Alto padrão" subtitle="Moderno e sofisticado" />
            </div>
          </div>
        );

      // TELA 13: Pets
      case 'has_pets':
        return (
          <div>
            <h2 className="text-base md:text-lg font-bold mb-1">Tem pets?</h2>
            <p className="text-slate-500 mb-3 text-xs">Selecione uma opção</p>
            <div className="space-y-2">
              <OptionCard selected={formData.has_pets === 'nao'} onClick={() => handleSingleSelect('has_pets', 'nao')} letter="A" title="Não" />
              <OptionCard selected={formData.has_pets === 'pequeno'} onClick={() => handleSingleSelect('has_pets', 'pequeno')} letter="B" title="Sim, pet de pequeno porte" />
              <OptionCard selected={formData.has_pets === 'grande'} onClick={() => handleSingleSelect('has_pets', 'grande')} letter="C" title="Sim, pet de grande porte" />
              <OptionCard selected={formData.has_pets === 'varios'} onClick={() => handleSingleSelect('has_pets', 'varios')} letter="D" title="Sim, mais de um pet" />
            </div>
          </div>
        );

      // TELA 14: Rotina
      case 'daily_routine':
        return (
          <div>
            <h2 className="text-base md:text-lg font-bold mb-1">Como é sua rotina em casa?</h2>
            <p className="text-slate-500 mb-3 text-xs">Selecione até 3 opções</p>
            <div className="space-y-2">
              {[
                'Trabalho em casa (home office frequente ou integral)',
                'Recebo visitas e amigos com frequência',
                'Preciso de silêncio — durmo cedo ou acordo muito cedo',
                'Tenho rotina ativa — passo pouco tempo em casa',
                'Cozinho muito — cozinha é espaço importante',
                'Gosto de áreas externas — varanda, jardim, quintal'
              ].map((item) => (
                <CheckboxCard
                  key={item}
                  selected={formData.daily_routine.includes(item)}
                  onClick={() => handleMultiSelect('daily_routine', item, 3)}
                  text={item}
                  disabled={formData.daily_routine.length >= 3 && !formData.daily_routine.includes(item)}
                />
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2 text-center">{formData.daily_routine.length}/3 selecionados</p>
          </div>
        );

      // TELA 15: Locomoção
      case 'transportation':
        return (
          <div>
            <h2 className="text-base md:text-lg font-bold mb-1">Como você se locomove?</h2>
            <p className="text-slate-500 mb-3 text-xs">Selecione todas que se aplicam</p>
            <div className="space-y-2">
              {[
                'Tenho 1 carro',
                'Tenho 2 ou mais carros',
                'Uso principalmente transporte público',
                'Uso aplicativos / não tenho carro',
                'Trabalho perto de casa ou em casa'
              ].map((item) => (
                <CheckboxCard
                  key={item}
                  selected={formData.transportation.includes(item)}
                  onClick={() => handleMultiSelect('transportation', item)}
                  text={item}
                />
              ))}
            </div>
          </div>
        );

      // TELA 16: O que incomoda
      case 'deal_breakers':
        return (
          <div>
            <h2 className="text-base md:text-lg font-bold mb-1">O que mais te incomoda?</h2>
            <p className="text-slate-500 mb-3 text-xs">Selecione até 3 opções</p>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                'Pouca luz natural', 'Barulho externo', 'Espaços pequenos ou apertados',
                'Acabamento ruim ou ultrapassado', 'Planta fechada / compartimentada',
                'Localização ruim ou isolada', 'Sem privacidade', 'Garagem ruim ou insuficiente',
                'Condomínio muito movimentado'
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

      // TELA 17: Proximidade
      case 'proximity_needs':
        return (
          <div>
            <h2 className="text-base md:text-lg font-bold mb-1">O que precisa estar perto?</h2>
            <p className="text-slate-500 mb-3 text-xs">Selecione até 3 opções</p>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                'Escola / creche', 'Trabalho', 'Academia', 'Transporte público',
                'Mercado / comércio', 'Parque / área verde', 'Restaurantes e lazer',
                'Hospital / clínica', 'Tanto faz'
              ].map((item) => (
                <CheckboxCard
                  key={item}
                  selected={formData.proximity_needs.includes(item)}
                  onClick={() => {
                    if (item === 'Tanto faz') {
                      if (formData.proximity_needs.includes('Tanto faz')) {
                        setFormData(prev => ({ ...prev, proximity_needs: [] }));
                      } else {
                        setFormData(prev => ({ ...prev, proximity_needs: ['Tanto faz'] }));
                      }
                    } else {
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

      // TELA 18: Finalização
      case 'finalization':
        const minChars = 20;
        const currentChars = formData.additional_notes?.length || 0;
        const isFieldValid = currentChars >= minChars;
        
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
            <p className="text-slate-500 mb-3 text-xs">Conte mais sobre o que você precisa *</p>
            <Textarea
              value={formData.additional_notes}
              onChange={(e) => setFormData(prev => ({ ...prev, additional_notes: e.target.value }))}
              placeholder="Ex: Tenho pets, faço home office, prefiro andar alto, aceito permuta..."
              className={`min-h-[70px] text-sm rounded-lg border-2 resize-none mb-2 ${!isFieldValid && currentChars > 0 ? 'border-amber-400' : ''}`}
            />
            <p className={`text-xs mb-4 ${isFieldValid ? 'text-green-600' : 'text-slate-400'}`}>
              {currentChars}/{minChars} caracteres mínimos
            </p>
            
            {/* Terms of Use Acceptance */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4 text-left">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="terms-checkbox"
                  checked={termsAccepted}
                  onCheckedChange={(checked) => setTermsAccepted(checked)}
                  className="mt-0.5 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                />
                <label htmlFor="terms-checkbox" className="text-xs text-slate-600 leading-relaxed cursor-pointer">
                  Li e aceito os{' '}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowTermsModal(true);
                    }}
                    className="text-indigo-600 hover:text-indigo-700 font-medium underline inline-flex items-center gap-1"
                  >
                    Termos de Uso e Compromisso de Intermediação
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </label>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!isFieldValid || !termsAccepted || isSubmitting}
              className="w-full rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 h-10"
            >
              {isSubmitting ? 'Enviando...' : 'Finalizar Cadastro'}
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4">
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-white font-bold text-lg">Cadastro de Interesse</h1>
              <button onClick={onClose} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-white/20 rounded-full h-1.5">
              <motion.div
                className="bg-white rounded-full h-1.5"
                initial={{ width: 0 }}
                animate={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
              />
            </div>
            <p className="text-white/80 text-xs mt-1.5">
              Passo {currentStep + 1} de {totalSteps}
            </p>
          </div>

          {/* Content */}
          <div className="p-4 max-h-[60vh] overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          {currentScreenId !== 'finalization' && (
            <div className="p-4 border-t flex gap-3">
              {currentStep > 0 && (
                <Button
                  onClick={prevStep}
                  variant="outline"
                  className="flex-1 rounded-full"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
              )}
              <Button
                onClick={nextStep}
                disabled={!canProceed()}
                className={`${currentStep === 0 ? 'w-full' : 'flex-1'} rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500`}
              >
                Continuar
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {showTermsModal && (
          <TermsModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} />
        )}
      </AnimatePresence>
    </>
  );
};

export default InterestFormModal;

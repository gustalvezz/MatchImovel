import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Home, Send, Sparkles, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Field definitions per property type — mirrors backend PROPERTY_FIELDS_BY_TYPE
const FIELDS_BY_TYPE = {
  apartamento:    ['location','address','price','payment_methods','floor','area_m2','bedrooms','suites','bathrooms','parking_spots','has_balcony','condition','furnished','style','condo_fee','condo_amenities','iptu','accepts_financing','accepts_exchange','link'],
  casa:           ['location','address','price','payment_methods','area_m2','land_area_m2','bedrooms','suites','bathrooms','parking_spots','has_backyard','has_pool','has_bbq','condition','furnished','style','iptu','accepts_financing','accepts_exchange','link'],
  casa_condominio:['location','address','price','payment_methods','area_m2','land_area_m2','bedrooms','suites','bathrooms','parking_spots','has_backyard','has_pool','has_bbq','condition','furnished','style','condo_fee','condo_amenities','pet_friendly','iptu','accepts_financing','accepts_exchange','link'],
  terreno:        ['location','address','price','payment_methods','land_area_m2','frontage_m','zoning','topography','documentation_status','accepts_financing','accepts_exchange','link'],
  studio_loft:    ['location','address','price','payment_methods','floor','area_m2','bathrooms','parking_spots','layout_type','has_balcony','condition','furnished','style','condo_fee','condo_amenities','iptu','accepts_financing','accepts_exchange','link'],
  sala_comercial: ['location','address','price','payment_methods','floor','area_m2','parking_spots','layout','has_ac','has_generator','condo_fee','iptu','accepts_pj','accepts_financing','accepts_exchange','link'],
};

const FIELD_META = {
  location:             { label: 'Cidade / Bairro', type: 'text', required: true },
  address:              { label: 'Endereço completo', type: 'text', required: true },
  price:                { label: 'Valor (R$)', type: 'currency', required: true },
  payment_methods:      { label: 'Formas de pagamento aceitas', type: 'multiselect', options: ['À vista','Financiamento','Permuta','FGTS'], required: true },
  floor:                { label: 'Andar (0 = térreo)', type: 'number', required: true },
  area_m2:              { label: 'Área útil (m²)', type: 'number', required: true },
  land_area_m2:         { label: 'Área do terreno (m²)', type: 'number', required: true },
  frontage_m:           { label: 'Frente do terreno (m)', type: 'number', required: true },
  bedrooms:             { label: 'Quartos', type: 'number', required: true },
  suites:               { label: 'Suítes', type: 'number', required: true },
  bathrooms:            { label: 'Banheiros', type: 'number', required: true },
  parking_spots:        { label: 'Vagas de garagem', type: 'number', required: true },
  has_balcony:          { label: 'Tem varanda?', type: 'boolean', required: true },
  has_backyard:         { label: 'Tem quintal?', type: 'boolean', required: true },
  has_pool:             { label: 'Tem piscina própria?', type: 'boolean', required: true },
  has_bbq:              { label: 'Tem churrasqueira?', type: 'boolean', required: true },
  has_ac:               { label: 'Tem ar condicionado central?', type: 'boolean', required: true },
  has_generator:        { label: 'Tem gerador?', type: 'boolean', required: true },
  pet_friendly:         { label: 'Aceita pets no condomínio?', type: 'boolean', required: true },
  accepts_financing:    { label: 'Aceita financiamento?', type: 'boolean', required: true },
  accepts_pj:           { label: 'Aceita pessoa jurídica?', type: 'boolean', required: true },
  accepts_exchange:     { label: 'Aceita permuta?', type: 'select', options: ['Sim','Não','Parcial'], required: true },
  condition:            { label: 'Estado de conservação', type: 'select', options: ['novo','reformado','original_conservado','precisa_reforma'], labels: ['Novo','Reformado','Original conservado','Precisa reforma'], required: true },
  furnished:            { label: 'Mobília', type: 'select', options: ['mobiliado','semimobiliado','sem_moveis'], labels: ['Mobiliado','Semimobiliado','Sem móveis'], required: true },
  style:                { label: 'Estilo arquitetônico', type: 'select', options: ['moderno','classico','rustico','industrial','retrofit','minimalista','sem_estilo_definido'], labels: ['Moderno/Contemporâneo','Clássico/Tradicional','Rústico/Campestre','Industrial','Retrofit','Minimalista','Sem estilo definido'], required: true },
  layout_type:          { label: 'Configuração', type: 'select', options: ['conjugado','studio','loft_aberto'], labels: ['Conjugado','Studio','Loft aberto'], required: true },
  layout:               { label: 'Layout', type: 'select', options: ['planta_livre','dividida'], labels: ['Planta livre','Dividida'], required: true },
  condo_fee:            { label: 'Condomínio (R$/mês)', type: 'currency', required: true },
  iptu:                 { label: 'IPTU anual (R$)', type: 'currency', required: true },
  condo_amenities:      { label: 'Áreas do condomínio', type: 'multiselect', options: ['portaria_24h','academia','piscina','salao_festas','playground','quadra','camera_seguranca','gerador'], labels: ['Portaria 24h','Academia','Piscina','Salão de festas','Playground','Quadra','Câmeras de segurança','Gerador'], required: true },
  zoning:               { label: 'Zoneamento', type: 'select', options: ['residencial','comercial','misto'], labels: ['Residencial','Comercial','Misto'], required: true },
  topography:           { label: 'Topografia', type: 'select', options: ['plano','aclive','declive'], labels: ['Plano','Aclive','Declive'], required: true },
  documentation_status: { label: 'Situação documental', type: 'select', options: ['regular','inventario','financiado_com_saldo','acao_judicial'], labels: ['Regular','Em inventário','Financiado com saldo','Ação judicial'], required: true },
  link:                 { label: 'Link do anúncio (opcional)', type: 'url', required: false },
};

// Coerce each extracted field to its expected type to prevent rendering crashes
const normalizeExtracted = (raw) => {
  const result = {};
  for (const [key, value] of Object.entries(raw)) {
    if (value === null || value === undefined) { result[key] = null; continue; }
    const meta = FIELD_META[key];
    if (!meta) { result[key] = value; continue; }

    if (meta.type === 'boolean') {
      result[key] = value === true || value === 'true' || value === 1;
    } else if (meta.type === 'number') {
      const n = parseFloat(value);
      result[key] = isNaN(n) ? null : n;
    } else if (meta.type === 'currency') {
      const n = parseFloat(String(value).replace(/\D/g, ''));
      result[key] = isNaN(n) ? null : n;
    } else if (meta.type === 'multiselect') {
      if (Array.isArray(value)) result[key] = value;
      else if (typeof value === 'string' && value.trim()) result[key] = value.split(',').map(s => s.trim()).filter(Boolean);
      else result[key] = [];
    } else if (meta.type === 'text' || meta.type === 'url' || meta.type === 'select') {
      result[key] = typeof value === 'string' ? value : null;
    } else {
      result[key] = value;
    }
  }
  // ai_summary must always be a string or null
  if (result.ai_summary !== null && result.ai_summary !== undefined) {
    result.ai_summary = typeof result.ai_summary === 'string' ? result.ai_summary : null;
  }
  return result;
};

const formatCurrencyDisplay = (val) => {
  if (val === null || val === undefined || val === '') return '';
  const n = String(val).replace(/\D/g, '');
  if (!n) return '';
  return parseInt(n, 10).toLocaleString('pt-BR');
};

const parseCurrency = (val) => {
  const n = String(val).replace(/\D/g, '');
  return n ? parseFloat(n) : null;
};

// Individual field renderer
const FieldRenderer = ({ fieldKey, meta, value, onChange, error }) => {
  const baseInput = `mt-1 rounded-xl ${error ? 'border-red-500' : ''}`;

  if (meta.type === 'text' || meta.type === 'url') {
    return (
      <Input
        type="text"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        className={baseInput}
        placeholder={meta.type === 'url' ? 'https://...' : ''}
      />
    );
  }

  if (meta.type === 'number') {
    return (
      <Input
        type="number"
        min="0"
        value={value ?? ''}
        onChange={e => onChange(e.target.value === '' ? null : Number(e.target.value))}
        className={baseInput}
      />
    );
  }

  if (meta.type === 'currency') {
    return (
      <div className="relative mt-1">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">R$</span>
        <Input
          type="text"
          value={formatCurrencyDisplay(value)}
          onChange={e => {
            const n = e.target.value.replace(/\D/g, '');
            onChange(n ? parseFloat(n) : null);
          }}
          className={`pl-9 rounded-xl ${error ? 'border-red-500' : ''}`}
        />
      </div>
    );
  }

  if (meta.type === 'boolean') {
    return (
      <div className="flex gap-3 mt-1">
        {[{ v: true, l: 'Sim' }, { v: false, l: 'Não' }].map(opt => (
          <button
            key={String(opt.v)}
            type="button"
            onClick={() => onChange(opt.v)}
            className={`flex-1 py-2 rounded-xl border-2 text-sm font-medium transition-colors ${
              value === opt.v
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                : 'border-slate-200 text-slate-600 hover:border-slate-300'
            } ${error ? 'border-red-300' : ''}`}
          >
            {opt.l}
          </button>
        ))}
      </div>
    );
  }

  if (meta.type === 'select') {
    const labels = meta.labels || meta.options;
    return (
      <select
        value={value ?? ''}
        onChange={e => onChange(e.target.value || null)}
        className={`w-full h-10 px-3 mt-1 rounded-xl border focus:border-indigo-500 focus:outline-none bg-white text-sm ${error ? 'border-red-500' : 'border-slate-200'}`}
      >
        <option value="">Selecione...</option>
        {meta.options.map((opt, i) => (
          <option key={opt} value={opt}>{labels[i]}</option>
        ))}
      </select>
    );
  }

  if (meta.type === 'multiselect') {
    const selected = Array.isArray(value) ? value : [];
    const labels = meta.labels || meta.options;
    return (
      <div className={`flex flex-wrap gap-2 mt-1 p-3 rounded-xl border ${error ? 'border-red-500' : 'border-slate-200'} bg-slate-50`}>
        {meta.options.map((opt, i) => {
          const active = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => {
                onChange(active ? selected.filter(s => s !== opt) : [...selected, opt]);
              }}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                active
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
              }`}
            >
              {labels ? labels[i] : opt}
            </button>
          );
        })}
      </div>
    );
  }

  return null;
};

// ---- Main Modal ----
const PropertyInfoModal = ({ isOpen, onClose, onSubmit, buyerName, interestLocation, initialDescription = '', propertyType = 'casa', propertyPrice = null, initialExtracted = null }) => {
  const [step, setStep] = useState(1); // 1 = description, 2 = form
  const [description, setDescription] = useState(initialDescription);
  const [analyzing, setAnalyzing] = useState(false);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fields = FIELDS_BY_TYPE[propertyType] || FIELDS_BY_TYPE['casa'];

  useEffect(() => {
    if (isOpen) {
      setDescription(initialDescription);
      setErrors({});
      if (initialExtracted) {
        const { ai_summary, ...formFields } = normalizeExtracted(initialExtracted);
        setFormData({ ...formFields, ai_summary: ai_summary || null });
        setStep(2);
      } else {
        setStep(1);
        setFormData({});
      }
    }
  }, [isOpen, initialDescription, initialExtracted]);

  const handleAnalyze = async () => {
    if (!description.trim() || description.trim().length < 20) {
      toast.error('Descreva o imóvel com pelo menos 20 caracteres');
      return;
    }
    setAnalyzing(true);
    try {
      const res = await axios.post(`${API}/agents/analyze-property`, {
        property_type: propertyType,
        property_price: propertyPrice,
        description: description.trim(),
      });
      const raw = res.data.extracted || {};
      const extracted = normalizeExtracted(raw);
      const { ai_summary, ...formFields } = extracted;
      setFormData({ ...formFields, ai_summary: ai_summary || null });
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erro ao analisar descrição. Tente novamente.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFieldChange = (key, val) => {
    setFormData(prev => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: null }));
  };

  const validate = () => {
    const newErrors = {};
    fields.forEach(key => {
      const meta = FIELD_META[key];
      if (!meta || !meta.required) return;
      const val = formData[key];
      if (val === null || val === undefined || val === '') {
        newErrors[key] = 'Obrigatório';
      } else if (meta.type === 'multiselect' && Array.isArray(val) && val.length === 0) {
        newErrors[key] = 'Selecione ao menos uma opção';
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit({
        property_type: propertyType,
        original_description: description,
        ai_summary: formData.ai_summary || null,
        ...formData,
      });
      onClose();
    } catch (err) {
      console.error('Submit error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filledCount = fields.filter(k => {
    const v = formData[k];
    if (v === null || v === undefined || v === '') return false;
    if (Array.isArray(v)) return v.length > 0;
    return true;
  }).length;
  const totalRequired = fields.filter(k => FIELD_META[k]?.required).length;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <Card className="p-6 rounded-3xl shadow-2xl" data-testid="property-info-modal">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <Home className="w-6 h-6 text-indigo-600" />
                  Informações do Imóvel
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Match com <span className="font-medium">{buyerName}</span> • {interestLocation}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full" data-testid="close-property-modal">
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Step indicators */}
            <div className="flex items-center gap-3 mb-6">
              <div className={`flex items-center gap-2 text-sm font-medium ${step === 1 ? 'text-indigo-600' : 'text-green-600'}`}>
                {step > 1 ? <CheckCircle className="w-4 h-4" /> : <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center">1</span>}
                Descrição
              </div>
              <div className="flex-1 h-px bg-slate-200" />
              <div className={`flex items-center gap-2 text-sm font-medium ${step === 2 ? 'text-indigo-600' : 'text-slate-400'}`}>
                <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center ${step === 2 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>2</span>
                Ficha do imóvel
              </div>
            </div>

            {/* ---- STEP 1: Description ---- */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">
                    Descrição do Imóvel <span className="text-red-500">*</span>
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5 mb-2">
                    Descreva com o máximo de detalhes — a IA irá preencher a ficha automaticamente com base no que você escrever.
                  </p>
                  <Textarea
                    data-testid="property-description"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Ex: Apartamento de 85m² no 4º andar do Ed. Parque Verde, Bairro Jardim Paulista. 2 suítes, varanda gourmet, 2 vagas. Reformado em 2023, cozinha americana integrada à sala. Condomínio com academia e piscina. Aceita financiamento. IPTU R$ 3.600/ano, condomínio R$ 950/mês..."
                    className="min-h-[180px] rounded-xl resize-none"
                  />
                </div>
                <Button
                  data-testid="analyze-description-button"
                  onClick={handleAnalyze}
                  disabled={analyzing || description.trim().length < 20}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500"
                >
                  {analyzing ? (
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
              </div>
            )}

            {/* ---- STEP 2: Dynamic Form ---- */}
            {step === 2 && (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* AI notice */}
                <div className="flex items-start gap-3 p-4 bg-indigo-50 rounded-xl border border-indigo-200">
                  <Sparkles className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-indigo-800 font-medium">Ficha preenchida pela IA</p>
                    <p className="text-xs text-indigo-600 mt-0.5">
                      Confira os campos abaixo e preencha os que ficaram em branco.{' '}
                      <span className="font-medium">{filledCount}/{totalRequired} obrigatórios preenchidos.</span>
                    </p>
                  </div>
                  <button type="button" onClick={() => setStep(1)} className="text-xs text-indigo-600 hover:underline flex-shrink-0">
                    Editar descrição
                  </button>
                </div>

                {/* AI Summary preview (read-only) */}
                {typeof formData.ai_summary === 'string' && formData.ai_summary && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-xs font-medium text-slate-500 mb-1">Resumo gerado pela IA (será usado no match)</p>
                    <p className="text-sm text-slate-700">{formData.ai_summary}</p>
                  </div>
                )}

                {/* Dynamic fields — grouped */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {fields.filter(k => k !== 'link').map(key => {
                    const meta = FIELD_META[key];
                    if (!meta) return null;
                    const isWide = ['location','address','payment_methods','condo_amenities'].includes(key);
                    return (
                      <div key={key} className={isWide ? 'sm:col-span-2' : ''}>
                        <Label className="text-sm font-medium flex items-center gap-1">
                          {meta.label}
                          {meta.required && <span className="text-red-500">*</span>}
                          {formData[key] !== null && formData[key] !== undefined && formData[key] !== '' && (
                            <Badge className="ml-1 text-[10px] px-1.5 py-0 bg-green-100 text-green-700 font-normal">IA</Badge>
                          )}
                        </Label>
                        <FieldRenderer
                          fieldKey={key}
                          meta={meta}
                          value={formData[key]}
                          onChange={val => handleFieldChange(key, val)}
                          error={errors[key]}
                        />
                        {errors[key] && <p className="text-red-500 text-xs mt-1">{errors[key]}</p>}
                      </div>
                    );
                  })}
                </div>

                {/* Link — optional, full width */}
                <div>
                  <Label className="text-sm font-medium">{FIELD_META.link.label}</Label>
                  <FieldRenderer
                    fieldKey="link"
                    meta={FIELD_META.link}
                    value={formData.link}
                    onChange={val => handleFieldChange('link', val)}
                    error={null}
                  />
                </div>

                {/* Missing required fields warning */}
                {Object.keys(errors).length > 0 && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-200">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <p className="text-sm text-red-700">
                      {Object.keys(errors).length} campo(s) obrigatório(s) não preenchido(s).
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={onClose} className="flex-1 rounded-full">
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500"
                    data-testid="submit-property-info"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Confirmar Match
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PropertyInfoModal;

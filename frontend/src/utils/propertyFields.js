import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

export const FIELDS_BY_TYPE = {
  apartamento:    ['location','address','price','payment_methods','floor','area_m2','bedrooms','suites','bathrooms','parking_spots','has_balcony','condition','furnished','style','condo_fee','condo_amenities','iptu','accepts_financing','accepts_exchange','link'],
  casa:           ['location','address','price','payment_methods','area_m2','land_area_m2','bedrooms','suites','bathrooms','parking_spots','has_backyard','has_pool','has_bbq','condition','furnished','style','iptu','accepts_financing','accepts_exchange','link'],
  casa_condominio:['location','address','price','payment_methods','area_m2','land_area_m2','bedrooms','suites','bathrooms','parking_spots','has_backyard','has_pool','has_bbq','condition','furnished','style','condo_fee','condo_amenities','pet_friendly','iptu','accepts_financing','accepts_exchange','link'],
  terreno:        ['location','address','price','payment_methods','land_area_m2','frontage_m','zoning','topography','documentation_status','accepts_financing','accepts_exchange','link'],
  studio_loft:    ['location','address','price','payment_methods','floor','area_m2','bathrooms','parking_spots','layout_type','has_balcony','condition','furnished','style','condo_fee','condo_amenities','iptu','accepts_financing','accepts_exchange','link'],
  sala_comercial: ['location','address','price','payment_methods','floor','area_m2','parking_spots','layout','has_ac','has_generator','condo_fee','iptu','accepts_pj','accepts_financing','accepts_exchange','link'],
};

export const FIELD_META = {
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

export const formatCurrencyDisplay = (val) => {
  if (val === null || val === undefined || val === '') return '';
  const n = String(val).replace(/\D/g, '');
  if (!n) return '';
  return parseInt(n, 10).toLocaleString('pt-BR');
};

export const normalizeExtracted = (raw) => {
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
  if (result.ai_summary !== null && result.ai_summary !== undefined) {
    result.ai_summary = typeof result.ai_summary === 'string' ? result.ai_summary : null;
  }
  return result;
};

export const validatePropertyForm = (formData, fields) => {
  const errors = {};
  fields.forEach(key => {
    const meta = FIELD_META[key];
    if (!meta || !meta.required) return;
    const val = formData[key];
    if (val === null || val === undefined || val === '') {
      errors[key] = 'Obrigatório';
    } else if (meta.type === 'multiselect' && Array.isArray(val) && val.length === 0) {
      errors[key] = 'Selecione ao menos uma opção';
    }
  });
  return errors;
};

export const FieldRenderer = ({ fieldKey, meta, value, onChange, error }) => {
  const baseClass = `mt-1 rounded-xl ${error ? 'border-red-500' : ''}`;

  if (meta.type === 'text' || meta.type === 'url') {
    return (
      <Input
        type="text"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        className={baseClass}
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
        className={baseClass}
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
              onClick={() => onChange(active ? selected.filter(s => s !== opt) : [...selected, opt])}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                active ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
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

export const PropertyFormFields = ({ formData, onChange, errors, fields, aiBadgeKeys = [] }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {fields.filter(k => k !== 'link').map(key => {
        const meta = FIELD_META[key];
        if (!meta) return null;
        const isWide = ['location','address','payment_methods','condo_amenities'].includes(key);
        const hasAiBadge = aiBadgeKeys.includes(key) && formData[key] !== null && formData[key] !== undefined && formData[key] !== '';
        return (
          <div key={key} className={isWide ? 'sm:col-span-2' : ''}>
            <Label className="text-sm font-medium flex items-center gap-1">
              {meta.label}
              {meta.required && <span className="text-red-500">*</span>}
              {hasAiBadge && (
                <span className="ml-1 text-[10px] px-1.5 py-0 bg-green-100 text-green-700 rounded-full font-normal">IA</span>
              )}
            </Label>
            <FieldRenderer
              fieldKey={key}
              meta={meta}
              value={formData[key]}
              onChange={val => onChange(key, val)}
              error={errors[key]}
            />
            {errors[key] && <p className="text-red-500 text-xs mt-1">{errors[key]}</p>}
          </div>
        );
      })}
      <div className="sm:col-span-2">
        <Label className="text-sm font-medium">{FIELD_META.link.label}</Label>
        <FieldRenderer
          fieldKey="link"
          meta={FIELD_META.link}
          value={formData.link}
          onChange={val => onChange('link', val)}
          error={null}
        />
      </div>
    </div>
  );
};

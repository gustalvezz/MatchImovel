import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CreateInterestModal = ({ onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    property_type: '',
    location: '',
    neighborhoods: [],
    min_price: '',
    max_price: '',
    min_area: '',
    max_area: '',
    bedrooms: '',
    bathrooms: '',
    parking_spaces: '',
    features: [],
    additional_notes: ''
  });

  const propertyTypes = ['Apartamento', 'Casa', 'Terreno', 'Comercial', 'Chácara', 'Cobertura'];
  const availableFeatures = [
    'Piscina', 'Churrasqueira', 'Elevador', 'Varanda', 'Sacada',
    'Quintal', 'Área de serviço', 'Armários embutidos', 'Academia',
    'Salão de festas', 'Playground', 'Pet place'
  ];

  const toggleFeature = (feature) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  const addNeighborhood = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      e.preventDefault();
      const neighborhood = e.target.value.trim();
      if (!formData.neighborhoods.includes(neighborhood)) {
        setFormData(prev => ({
          ...prev,
          neighborhoods: [...prev.neighborhoods, neighborhood]
        }));
      }
      e.target.value = '';
    }
  };

  const removeNeighborhood = (neighborhood) => {
    setFormData(prev => ({
      ...prev,
      neighborhoods: prev.neighborhoods.filter(n => n !== neighborhood)
    }));
  };

  const handleNext = () => {
    if (step === 1 && (!formData.property_type || !formData.location)) {
      toast.error('Preencha o tipo de imóvel e localização');
      return;
    }
    if (step === 2 && (!formData.min_price || !formData.max_price)) {
      toast.error('Preencha o orçamento');
      return;
    }
    setStep(step + 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        ...formData,
        min_price: parseFloat(formData.min_price),
        max_price: parseFloat(formData.max_price),
        min_area: formData.min_area ? parseFloat(formData.min_area) : null,
        max_area: formData.max_area ? parseFloat(formData.max_area) : null,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
        bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : null,
        parking_spaces: formData.parking_spaces ? parseInt(formData.parking_spaces) : null
      };
      
      await axios.post(`${API}/buyers/interests`, payload);
      toast.success('Interesse cadastrado com sucesso!');
      onSuccess();
    } catch (error) {
      toast.error('Erro ao cadastrar interesse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" data-testid="create-interest-modal">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl"
      >
        <Card className="p-8 rounded-3xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-semibold" data-testid="modal-title">Cadastrar Interesse</h2>
              <p className="text-sm text-muted-foreground">Etapa {step} de 4</p>
            </div>
            <Button 
              data-testid="modal-close-button"
              onClick={onClose} 
              variant="ghost" 
              size="icon" 
              className="rounded-full"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-indigo-600 to-purple-600"
                initial={{ width: '0%' }}
                animate={{ width: `${(step / 4) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
                data-testid="step-1"
              >
                <div>
                  <Label className="text-base mb-3 block">Tipo de Imóvel *</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {propertyTypes.map(type => (
                      <Button
                        key={type}
                        data-testid={`property-type-${type.toLowerCase()}`}
                        type="button"
                        onClick={() => setFormData({...formData, property_type: type})}
                        variant={formData.property_type === type ? 'default' : 'outline'}
                        className="rounded-xl h-12"
                      >
                        {type}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="location" className="text-base">Cidade *</Label>
                  <Input
                    data-testid="location-input"
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="mt-2 h-12 rounded-xl"
                    placeholder="Ex: São Paulo, Rio de Janeiro"
                  />
                </div>

                <div>
                  <Label htmlFor="neighborhoods" className="text-base">Bairros de Interesse (opcional)</Label>
                  <Input
                    data-testid="neighborhoods-input"
                    id="neighborhoods"
                    onKeyDown={addNeighborhood}
                    className="mt-2 h-12 rounded-xl"
                    placeholder="Digite e pressione Enter para adicionar"
                  />
                  <div className="flex flex-wrap gap-2 mt-3">
                    {formData.neighborhoods.map((n, idx) => (
                      <Badge 
                        key={idx} 
                        className="rounded-full flex items-center gap-1 pr-1"
                        data-testid={`neighborhood-badge-${idx}`}
                      >
                        {n}
                        <button
                          type="button"
                          onClick={() => removeNeighborhood(n)}
                          className="ml-1 hover:bg-white/20 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
                data-testid="step-2"
              >
                <div>
                  <Label className="text-base mb-3 block">Orçamento *</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="min_price" className="text-sm text-muted-foreground">Valor Mínimo (R$)</Label>
                      <Input
                        data-testid="min-price-input"
                        id="min_price"
                        type="number"
                        value={formData.min_price}
                        onChange={(e) => setFormData({...formData, min_price: e.target.value})}
                        className="mt-2 h-12 rounded-xl"
                        placeholder="200.000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="max_price" className="text-sm text-muted-foreground">Valor Máximo (R$)</Label>
                      <Input
                        data-testid="max-price-input"
                        id="max_price"
                        type="number"
                        value={formData.max_price}
                        onChange={(e) => setFormData({...formData, max_price: e.target.value})}
                        className="mt-2 h-12 rounded-xl"
                        placeholder="500.000"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-base mb-3 block">Área (m²) - Opcional</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="min_area" className="text-sm text-muted-foreground">Área Mínima</Label>
                      <Input
                        data-testid="min-area-input"
                        id="min_area"
                        type="number"
                        value={formData.min_area}
                        onChange={(e) => setFormData({...formData, min_area: e.target.value})}
                        className="mt-2 h-12 rounded-xl"
                        placeholder="50"
                      />
                    </div>
                    <div>
                      <Label htmlFor="max_area" className="text-sm text-muted-foreground">Área Máxima</Label>
                      <Input
                        data-testid="max-area-input"
                        id="max_area"
                        type="number"
                        value={formData.max_area}
                        onChange={(e) => setFormData({...formData, max_area: e.target.value})}
                        className="mt-2 h-12 rounded-xl"
                        placeholder="100"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
                data-testid="step-3"
              >
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="bedrooms" className="text-base">Quartos</Label>
                    <Input
                      data-testid="bedrooms-input"
                      id="bedrooms"
                      type="number"
                      value={formData.bedrooms}
                      onChange={(e) => setFormData({...formData, bedrooms: e.target.value})}
                      className="mt-2 h-12 rounded-xl"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bathrooms" className="text-base">Banheiros</Label>
                    <Input
                      data-testid="bathrooms-input"
                      id="bathrooms"
                      type="number"
                      value={formData.bathrooms}
                      onChange={(e) => setFormData({...formData, bathrooms: e.target.value})}
                      className="mt-2 h-12 rounded-xl"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="parking_spaces" className="text-base">Vagas</Label>
                    <Input
                      data-testid="parking-spaces-input"
                      id="parking_spaces"
                      type="number"
                      value={formData.parking_spaces}
                      onChange={(e) => setFormData({...formData, parking_spaces: e.target.value})}
                      className="mt-2 h-12 rounded-xl"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-base mb-3 block">Características Desejadas</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {availableFeatures.map(feature => (
                      <Button
                        key={feature}
                        data-testid={`feature-${feature.toLowerCase().replace(/\s/g, '-')}`}
                        type="button"
                        onClick={() => toggleFeature(feature)}
                        variant={formData.features.includes(feature) ? 'default' : 'outline'}
                        className="rounded-xl h-10 text-sm"
                      >
                        {formData.features.includes(feature) && <Check className="w-4 h-4 mr-1" />}
                        {feature}
                      </Button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
                data-testid="step-4"
              >
                <div>
                  <Label htmlFor="additional_notes" className="text-base">Observações Adicionais</Label>
                  <Textarea
                    data-testid="additional-notes-input"
                    id="additional_notes"
                    value={formData.additional_notes}
                    onChange={(e) => setFormData({...formData, additional_notes: e.target.value})}
                    className="mt-2 rounded-xl min-h-32"
                    placeholder="Alguma informação adicional que possa ajudar os corretores a encontrar o imóvel ideal para você..."
                  />
                </div>

                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-2xl">
                  <h3 className="font-semibold mb-3">Resumo do seu interesse:</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-muted-foreground">Tipo:</span> <span className="font-medium">{formData.property_type}</span></p>
                    <p><span className="text-muted-foreground">Localização:</span> <span className="font-medium">{formData.location}</span></p>
                    <p><span className="text-muted-foreground">Orçamento:</span> <span className="font-medium">R$ {parseFloat(formData.min_price || 0).toLocaleString()} - R$ {parseFloat(formData.max_price || 0).toLocaleString()}</span></p>
                    {formData.bedrooms && <p><span className="text-muted-foreground">Quartos:</span> <span className="font-medium">{formData.bedrooms}</span></p>}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <Button
              data-testid="modal-back-button"
              onClick={() => setStep(step - 1)}
              disabled={step === 1}
              variant="outline"
              className="rounded-full"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>

            {step < 4 ? (
              <Button
                data-testid="modal-next-button"
                onClick={handleNext}
                className="rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500"
              >
                Próximo
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                data-testid="modal-submit-button"
                onClick={handleSubmit}
                disabled={loading}
                className="rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500"
              >
                {loading ? 'Cadastrando...' : 'Finalizar Cadastro'}
              </Button>
            )}
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default CreateInterestModal;

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Check } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const EditInterestModal = ({ interest, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    property_type: interest.property_type || '',
    location: interest.location || '',
    neighborhoods: interest.neighborhoods || [],
    min_price: interest.min_price || '',
    max_price: interest.max_price || '',
    min_area: interest.min_area || '',
    max_area: interest.max_area || '',
    bedrooms: interest.bedrooms || '',
    bathrooms: interest.bathrooms || '',
    parking_spaces: interest.parking_spaces || '',
    features: interest.features || [],
    additional_notes: interest.additional_notes || ''
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

  const handleSubmit = async () => {
    if (!formData.property_type || !formData.location) {
      toast.error('Preencha o tipo de imóvel e localização');
      return;
    }
    
    if (!formData.min_price || !formData.max_price) {
      toast.error('Preencha o orçamento');
      return;
    }

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
      
      await axios.put(`${API}/buyers/interests/${interest.id}`, payload);
      toast.success('Interesse atualizado com sucesso!');
      onSuccess();
    } catch (error) {
      toast.error('Erro ao atualizar interesse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" data-testid="edit-interest-modal">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl"
      >
        <Card className="p-8 rounded-3xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold" data-testid="edit-modal-title">Editar Interesse</h2>
            <Button 
              data-testid="edit-modal-close-button"
              onClick={onClose} 
              variant="ghost" 
              size="icon" 
              className="rounded-full"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="space-y-6">
            <div>
              <Label className="text-base mb-3 block">Tipo de Imóvel *</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {propertyTypes.map(type => (
                  <Button
                    key={type}
                    data-testid={`edit-property-type-${type.toLowerCase()}`}
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
              <Label htmlFor="edit-location" className="text-base">Cidade *</Label>
              <Input
                data-testid="edit-location-input"
                id="edit-location"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                className="mt-2 h-12 rounded-xl"
                placeholder="Ex: São Paulo, Rio de Janeiro"
              />
            </div>

            <div>
              <Label htmlFor="edit-neighborhoods" className="text-base">Bairros de Interesse</Label>
              <Input
                data-testid="edit-neighborhoods-input"
                id="edit-neighborhoods"
                onKeyDown={addNeighborhood}
                className="mt-2 h-12 rounded-xl"
                placeholder="Digite e pressione Enter"
              />
              <div className="flex flex-wrap gap-2 mt-3">
                {formData.neighborhoods.map((n, idx) => (
                  <Badge key={idx} className="rounded-full flex items-center gap-1 pr-1">
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

            <div>
              <Label className="text-base mb-3 block">Orçamento *</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-min-price" className="text-sm text-muted-foreground">Valor Mínimo (R$)</Label>
                  <Input
                    data-testid="edit-min-price-input"
                    id="edit-min-price"
                    type="number"
                    value={formData.min_price}
                    onChange={(e) => setFormData({...formData, min_price: e.target.value})}
                    className="mt-2 h-12 rounded-xl"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-max-price" className="text-sm text-muted-foreground">Valor Máximo (R$)</Label>
                  <Input
                    data-testid="edit-max-price-input"
                    id="edit-max-price"
                    type="number"
                    value={formData.max_price}
                    onChange={(e) => setFormData({...formData, max_price: e.target.value})}
                    className="mt-2 h-12 rounded-xl"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit-bedrooms" className="text-base">Quartos</Label>
                <Input
                  data-testid="edit-bedrooms-input"
                  id="edit-bedrooms"
                  type="number"
                  value={formData.bedrooms}
                  onChange={(e) => setFormData({...formData, bedrooms: e.target.value})}
                  className="mt-2 h-12 rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="edit-bathrooms" className="text-base">Banheiros</Label>
                <Input
                  data-testid="edit-bathrooms-input"
                  id="edit-bathrooms"
                  type="number"
                  value={formData.bathrooms}
                  onChange={(e) => setFormData({...formData, bathrooms: e.target.value})}
                  className="mt-2 h-12 rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="edit-parking" className="text-base">Vagas</Label>
                <Input
                  data-testid="edit-parking-input"
                  id="edit-parking"
                  type="number"
                  value={formData.parking_spaces}
                  onChange={(e) => setFormData({...formData, parking_spaces: e.target.value})}
                  className="mt-2 h-12 rounded-xl"
                />
              </div>
            </div>

            <div>
              <Label className="text-base mb-3 block">Características</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {availableFeatures.map(feature => (
                  <Button
                    key={feature}
                    data-testid={`edit-feature-${feature.toLowerCase().replace(/\s/g, '-')}`}
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

            <div>
              <Label htmlFor="edit-notes" className="text-base">Observações</Label>
              <Textarea
                data-testid="edit-notes-input"
                id="edit-notes"
                value={formData.additional_notes}
                onChange={(e) => setFormData({...formData, additional_notes: e.target.value})}
                className="mt-2 rounded-xl min-h-24"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
            <Button
              data-testid="edit-cancel-button"
              onClick={onClose}
              variant="outline"
              className="rounded-full"
            >
              Cancelar
            </Button>
            <Button
              data-testid="edit-submit-button"
              onClick={handleSubmit}
              disabled={loading}
              className="rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500"
            >
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default EditInterestModal;

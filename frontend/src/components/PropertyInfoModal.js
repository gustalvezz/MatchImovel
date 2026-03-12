import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { X, Home, MapPin, Ruler, BedDouble, Bath, DollarSign, Link as LinkIcon, Send } from 'lucide-react';

const PropertyInfoModal = ({ isOpen, onClose, onSubmit, buyerName, interestLocation }) => {
  const [formData, setFormData] = useState({
    description: '',
    bedrooms: '',
    bathrooms: '',
    area_m2: '',
    address: '',
    price: '',
    link: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.description.trim()) {
      newErrors.description = 'A descrição do imóvel é obrigatória';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        description: formData.description,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
        bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : null,
        area_m2: formData.area_m2 ? parseFloat(formData.area_m2) : null,
        address: formData.address || null,
        price: formData.price ? parseFloat(formData.price.replace(/\D/g, '')) : null,
        link: formData.link || null
      });
      onClose();
      setFormData({
        description: '',
        bedrooms: '',
        bathrooms: '',
        area_m2: '',
        address: '',
        price: '',
        link: ''
      });
    } catch (error) {
      console.error('Error submitting property info:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (value) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

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
          transition={{ type: "spring", duration: 0.5 }}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <Card className="p-6 rounded-3xl shadow-2xl" data-testid="property-info-modal">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <Home className="w-6 h-6 text-indigo-600" />
                  Informações do Imóvel
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Match com <span className="font-medium">{buyerName}</span> • {interestLocation}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="rounded-full"
                data-testid="close-property-modal"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Description - Required */}
              <div>
                <Label className="text-base font-medium flex items-center gap-1">
                  Descrição do Imóvel <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  data-testid="property-description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Descreva o imóvel em detalhes: características, diferenciais, estado de conservação..."
                  className={`mt-2 min-h-[120px] rounded-xl ${errors.description ? 'border-red-500' : ''}`}
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                )}
              </div>

              {/* Grid - Optional fields */}
              <div className="grid grid-cols-2 gap-4">
                {/* Bedrooms */}
                <div>
                  <Label className="text-sm flex items-center gap-1">
                    <BedDouble className="w-4 h-4 text-indigo-500" />
                    Quartos
                  </Label>
                  <Input
                    data-testid="property-bedrooms"
                    type="number"
                    min="0"
                    value={formData.bedrooms}
                    onChange={(e) => handleChange('bedrooms', e.target.value)}
                    placeholder="Ex: 3"
                    className="mt-1 rounded-xl"
                  />
                </div>

                {/* Bathrooms */}
                <div>
                  <Label className="text-sm flex items-center gap-1">
                    <Bath className="w-4 h-4 text-indigo-500" />
                    Banheiros
                  </Label>
                  <Input
                    data-testid="property-bathrooms"
                    type="number"
                    min="0"
                    value={formData.bathrooms}
                    onChange={(e) => handleChange('bathrooms', e.target.value)}
                    placeholder="Ex: 2"
                    className="mt-1 rounded-xl"
                  />
                </div>

                {/* Area */}
                <div>
                  <Label className="text-sm flex items-center gap-1">
                    <Ruler className="w-4 h-4 text-indigo-500" />
                    Área (m²)
                  </Label>
                  <Input
                    data-testid="property-area"
                    type="number"
                    min="0"
                    value={formData.area_m2}
                    onChange={(e) => handleChange('area_m2', e.target.value)}
                    placeholder="Ex: 120"
                    className="mt-1 rounded-xl"
                  />
                </div>

                {/* Price */}
                <div>
                  <Label className="text-sm flex items-center gap-1">
                    <DollarSign className="w-4 h-4 text-indigo-500" />
                    Valor (R$)
                  </Label>
                  <Input
                    data-testid="property-price"
                    value={formData.price}
                    onChange={(e) => handleChange('price', formatPrice(e.target.value))}
                    placeholder="Ex: 500.000"
                    className="mt-1 rounded-xl"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <Label className="text-sm flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-indigo-500" />
                  Endereço / Localização
                </Label>
                <Input
                  data-testid="property-address"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="Ex: Rua das Flores, 123 - Jardim América"
                  className="mt-1 rounded-xl"
                />
              </div>

              {/* Link - Optional */}
              <div>
                <Label className="text-sm flex items-center gap-1">
                  <LinkIcon className="w-4 h-4 text-indigo-500" />
                  Link do Anúncio (opcional)
                </Label>
                <Input
                  data-testid="property-link"
                  type="url"
                  value={formData.link}
                  onChange={(e) => handleChange('link', e.target.value)}
                  placeholder="https://..."
                  className="mt-1 rounded-xl"
                />
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 rounded-full"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500"
                  data-testid="submit-property-info"
                >
                  {isSubmitting ? (
                    'Enviando...'
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Confirmar Match
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PropertyInfoModal;

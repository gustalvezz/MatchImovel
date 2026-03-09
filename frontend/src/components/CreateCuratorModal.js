import React, { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { X, Mail, User, Phone } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CreateCuratorModal = ({ onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    phone: ''
  });
  const [registrationLink, setRegistrationLink] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/admin/create-curator`, formData);
      setRegistrationLink(response.data.registration_link);
      toast.success('Curador criado! Link de registro gerado.');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao criar curador');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(registrationLink);
    toast.success('Link copiado para a área de transferência');
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" data-testid="create-curator-modal">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md"
      >
        <Card className="p-8 rounded-3xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold" data-testid="curator-modal-title">Cadastrar Curador</h2>
            <Button 
              data-testid="curator-modal-close"
              onClick={registrationLink ? onSuccess : onClose} 
              variant="ghost" 
              size="icon" 
              className="rounded-full"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {!registrationLink ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="curator-name" className="text-base">Nome Completo</Label>
                <div className="relative mt-2">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    data-testid="curator-name-input"
                    id="curator-name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="pl-10 h-12 rounded-xl"
                    placeholder="Nome do curador"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="curator-email" className="text-base">Email</Label>
                <div className="relative mt-2">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    data-testid="curator-email-input"
                    id="curator-email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="pl-10 h-12 rounded-xl"
                    placeholder="email@exemplo.com"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="curator-phone" className="text-base">Telefone</Label>
                <div className="relative mt-2">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    data-testid="curator-phone-input"
                    id="curator-phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="pl-10 h-12 rounded-xl"
                    placeholder="(11) 98765-4321"
                  />
                </div>
              </div>

              <Button
                data-testid="curator-submit-button"
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium"
              >
                {loading ? 'Criando...' : 'Criar Curador'}
              </Button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                <p className="text-sm font-semibold text-green-900 mb-2">✓ Curador criado com sucesso!</p>
                <p className="text-sm text-green-700">Envie o link abaixo para o curador completar o cadastro:</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border">
                <Label className="text-xs text-muted-foreground mb-2 block">Link de Registro</Label>
                <p className="text-sm break-all font-mono">{registrationLink}</p>
              </div>

              <div className="flex gap-3">
                <Button
                  data-testid="copy-link-button"
                  onClick={copyLink}
                  variant="outline"
                  className="flex-1 rounded-full"
                >
                  Copiar Link
                </Button>
                <Button
                  data-testid="done-button"
                  onClick={onSuccess}
                  className="flex-1 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600"
                >
                  Concluir
                </Button>
              </div>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
};

export default CreateCuratorModal;

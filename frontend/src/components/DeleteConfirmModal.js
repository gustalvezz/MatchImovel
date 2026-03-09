import React, { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DeleteConfirmModal = ({ type, item, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [otherReason, setOtherReason] = useState('');

  const reasons = [
    { value: 'ja_comprei', label: type === 'interest' ? 'Já comprei um imóvel' : 'Imóvel já vendido' },
    { value: 'imovel_vendido', label: 'Imóvel já foi vendido' },
    { value: 'mudei_planos', label: 'Mudei de planos' },
    { value: 'nao_interessado', label: 'Não tenho mais interesse' },
    { value: 'outro', label: 'Outro motivo' }
  ];

  const handleDelete = async () => {
    if (!selectedReason) {
      toast.error('Selecione um motivo para exclusão');
      return;
    }

    if (selectedReason === 'outro' && !otherReason.trim()) {
      toast.error('Descreva o motivo da exclusão');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        reason: selectedReason,
        other_reason: selectedReason === 'outro' ? otherReason : null
      };

      if (type === 'interest') {
        await axios.delete(`${API}/buyers/interests/${item.id}`, { data: payload });
        toast.success('Interesse excluído com sucesso');
      } else if (type === 'match') {
        await axios.delete(`${API}/agents/match/${item.id}`, { data: payload });
        toast.success('Match excluído com sucesso');
      }

      onSuccess();
    } catch (error) {
      toast.error('Erro ao excluir');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" data-testid="delete-confirm-modal">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md"
      >
        <Card className="p-8 rounded-3xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold" data-testid="delete-modal-title">Confirmar Exclusão</h2>
              <p className="text-sm text-muted-foreground">Esta ação não pode ser desfeita</p>
            </div>
            <Button 
              data-testid="delete-modal-close-button"
              onClick={onClose} 
              variant="ghost" 
              size="icon" 
              className="rounded-full ml-auto"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="space-y-4 mb-6">
            <Label className="text-base">Por que você está excluindo?</Label>
            <div className="space-y-2">
              {reasons.map(reason => (
                <button
                  key={reason.value}
                  data-testid={`delete-reason-${reason.value}`}
                  onClick={() => setSelectedReason(reason.value)}
                  className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                    selectedReason === reason.value
                      ? 'border-primary bg-primary/5 font-medium'
                      : 'border-slate-200 hover:border-primary/50'
                  }`}
                >
                  {reason.label}
                </button>
              ))}
            </div>

            {selectedReason === 'outro' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Label htmlFor="other-reason" className="text-sm">Descreva o motivo</Label>
                <Textarea
                  data-testid="delete-other-reason-input"
                  id="other-reason"
                  value={otherReason}
                  onChange={(e) => setOtherReason(e.target.value)}
                  className="mt-2 rounded-xl min-h-24"
                  placeholder="Explique o motivo da exclusão..."
                />
              </motion.div>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              data-testid="delete-cancel-button"
              onClick={onClose}
              variant="outline"
              className="flex-1 rounded-full"
            >
              Cancelar
            </Button>
            <Button
              data-testid="delete-confirm-button"
              onClick={handleDelete}
              disabled={loading}
              className="flex-1 rounded-full bg-red-600 hover:bg-red-700"
            >
              {loading ? 'Excluindo...' : 'Excluir'}
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default DeleteConfirmModal;

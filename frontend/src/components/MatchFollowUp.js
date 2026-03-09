import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, User, Building2, Clock } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MatchFollowUp = ({ match }) => {
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newFollowup, setNewFollowup] = useState('');
  const [contactType, setContactType] = useState('corretor');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchFollowups();
  }, [match.id]);

  const fetchFollowups = async () => {
    try {
      const response = await axios.get(`${API}/matches/${match.id}/followups`);
      setFollowups(response.data);
    } catch (error) {
      console.error('Erro ao carregar follow-ups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newFollowup.trim()) {
      toast.error('Digite uma observação');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(`${API}/matches/${match.id}/followup`, {
        content: newFollowup,
        contact_type: contactType
      });
      
      setNewFollowup('');
      toast.success('Follow-up adicionado');
      fetchFollowups();
    } catch (error) {
      toast.error('Erro ao adicionar follow-up');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4" data-testid="followup-section">
      {/* Add New Follow-up */}
      <Card className="p-6 rounded-2xl border-2 border-indigo-100">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-indigo-600" />
          Adicionar Follow-up
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-sm mb-2 block">Tipo de Contato</Label>
            <div className="flex gap-3">
              <Button
                type="button"
                data-testid="contact-type-corretor"
                onClick={() => setContactType('corretor')}
                variant={contactType === 'corretor' ? 'default' : 'outline'}
                className="rounded-full flex-1"
              >
                <Building2 className="w-4 h-4 mr-2" />
                Corretor
              </Button>
              <Button
                type="button"
                data-testid="contact-type-comprador"
                onClick={() => setContactType('comprador')}
                variant={contactType === 'comprador' ? 'default' : 'outline'}
                className="rounded-full flex-1"
              >
                <User className="w-4 h-4 mr-2" />
                Comprador
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="followup-content" className="text-sm">Observações</Label>
            <Textarea
              data-testid="followup-content-input"
              id="followup-content"
              value={newFollowup}
              onChange={(e) => setNewFollowup(e.target.value)}
              className="mt-2 rounded-xl min-h-24"
              placeholder="Descreva o contato, negociações, próximos passos..."
            />
          </div>

          <Button
            data-testid="followup-submit-button"
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-gradient-to-r from-indigo-600 to-purple-600"
          >
            {submitting ? 'Salvando...' : 'Adicionar Follow-up'}
          </Button>
        </form>
      </Card>

      {/* Follow-up History */}
      {followups.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-600" />
            Histórico de Follow-ups
          </h3>
          
          {followups.map((followup) => (
            <motion.div
              key={followup.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="p-4 rounded-2xl" data-testid={`followup-${followup.id}`}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant={followup.contact_type === 'corretor' ? 'default' : 'secondary'} className="rounded-full">
                      {followup.contact_type === 'corretor' ? (
                        <><Building2 className="w-3 h-3 mr-1" /> Corretor</>
                      ) : (
                        <><User className="w-3 h-3 mr-1" /> Comprador</>
                      )}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {followup.curator_name}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(followup.created_at).toLocaleString('pt-BR')}
                  </span>
                </div>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{followup.content}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {!loading && followups.length === 0 && (
        <Card className="p-8 rounded-2xl text-center">
          <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhum follow-up registrado ainda</p>
        </Card>
      )}
    </div>
  );
};

export default MatchFollowUp;

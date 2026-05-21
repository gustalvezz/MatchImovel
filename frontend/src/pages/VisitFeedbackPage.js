import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, Loader2, MapPin, Calendar, Clock, ThumbsUp, ThumbsDown } from 'lucide-react';
import AppLogo from '@/components/AppLogo';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
};

const VisitFeedbackPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [visitInfo, setVisitInfo] = useState(null);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  const [impressions, setImpressions] = useState('');
  const [interestLevel, setInterestLevel] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Link inválido. Verifique o e-mail recebido.');
      setLoading(false);
      return;
    }
    axios.get(`${API}/api/visits/feedback-info/${token}`)
      .then(r => { setVisitInfo(r.data); setLoading(false); })
      .catch(e => {
        setError(e.response?.data?.detail || 'Link inválido ou expirado.');
        setLoading(false);
      });
  }, [token]);

  const handleSubmit = async () => {
    if (!impressions.trim() || impressions.trim().length < 10) {
      toast.error('Por favor, descreva suas impressões (mínimo 10 caracteres).');
      return;
    }
    if (!interestLevel) {
      toast.error('Por favor, indique seu nível de interesse.');
      return;
    }
    if (interestLevel === 'not_interested' && !rejectionReason.trim()) {
      toast.error('Por favor, informe o motivo do não interesse.');
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(`${API}/api/visits/feedback/${token}`, {
        impressions,
        interest_level: interestLevel,
        rejection_reason: rejectionReason || undefined,
      });
      setDone(true);
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Erro ao enviar. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-white flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-white flex items-center justify-center p-6">
        <Card className="p-8 rounded-3xl max-w-md text-center shadow-xl">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Link inválido</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Link to="/login"><Button className="rounded-full">Acessar minha conta</Button></Link>
        </Card>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-white flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <Card className="p-8 rounded-3xl shadow-xl text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">Obrigado pelo feedback!</h2>
            <p className="text-muted-foreground mb-6">
              Suas impressões foram registradas e compartilhadas com nossa equipe de curadoria. Isso nos ajuda a encontrar o imóvel ideal para você!
            </p>
            <Link to="/login"><Button variant="outline" className="rounded-full">Acessar minha conta</Button></Link>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-white flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-1 text-2xl font-bold mb-2">
            <AppLogo />
            <span><span className="text-slate-900">Match</span><span className="text-indigo-600">Imovel</span></span>
          </Link>
          <h1 className="text-3xl font-semibold mt-4 mb-2">Como foi a visita?</h1>
          <p className="text-muted-foreground">Suas impressões são muito importantes para nós</p>
        </div>

        <Card className="p-8 rounded-3xl shadow-xl border-2">
          {visitInfo && (
            <div className="bg-indigo-50 p-4 rounded-xl mb-6 space-y-2 text-sm">
              <p className="flex items-center gap-2 text-slate-700">
                <MapPin className="w-4 h-4 text-indigo-500 shrink-0" />
                {visitInfo.property_address}
              </p>
              <p className="flex items-center gap-2 text-slate-700">
                <Calendar className="w-4 h-4 text-indigo-500" />
                {formatDate(visitInfo.visit_date)}
              </p>
              <p className="flex items-center gap-2 text-slate-700">
                <Clock className="w-4 h-4 text-indigo-500" />
                {visitInfo.visit_time}
              </p>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <Label className="text-base font-semibold">Suas impressões sobre o imóvel *</Label>
              <Textarea
                value={impressions}
                onChange={e => setImpressions(e.target.value)}
                placeholder="O que você achou do imóvel? Descreva os pontos positivos e negativos, como foi o ambiente, localização, estado do imóvel..."
                className="mt-2 rounded-xl"
                rows={4}
              />
            </div>

            <div>
              <Label className="text-base font-semibold mb-3 block">Qual é o seu interesse neste imóvel? *</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => { setInterestLevel('interested'); setRejectionReason(''); }}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                    interestLevel === 'interested'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-slate-200 hover:border-green-300'
                  }`}
                >
                  <ThumbsUp className="w-6 h-6" />
                  <div className="text-left">
                    <p className="font-semibold text-sm">Tenho interesse</p>
                    <p className="text-xs text-muted-foreground">Quero seguir em frente</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setInterestLevel('not_interested')}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                    interestLevel === 'not_interested'
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-slate-200 hover:border-red-300'
                  }`}
                >
                  <ThumbsDown className="w-6 h-6" />
                  <div className="text-left">
                    <p className="font-semibold text-sm">Não tenho interesse</p>
                    <p className="text-xs text-muted-foreground">Não é o que procuro</p>
                  </div>
                </button>
              </div>
            </div>

            {interestLevel === 'not_interested' && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <Label className="text-base font-semibold">Por que não tem interesse? *</Label>
                <p className="text-sm text-muted-foreground mb-2">Isso nos ajuda a encontrar um imóvel mais adequado para você.</p>
                <Textarea
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  placeholder="Ex: Localização não atende, preço acima do esperado, tamanho insuficiente..."
                  className="rounded-xl"
                  rows={3}
                />
              </motion.div>
            )}

            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full h-12 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium text-base"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enviar minhas impressões'}
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default VisitFeedbackPage;

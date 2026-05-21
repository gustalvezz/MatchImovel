import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, RefreshCw, Loader2, MapPin, Calendar, Clock } from 'lucide-react';
import AppLogo from '@/components/AppLogo';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
};

const VisitActionPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const action = searchParams.get('action');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [visitInfo, setVisitInfo] = useState(null);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  const [reason, setReason] = useState('');
  const [proposedDate, setProposedDate] = useState('');
  const [proposedTime, setProposedTime] = useState('');

  useEffect(() => {
    if (!token || !action) {
      setError('Link inválido. Verifique o e-mail recebido.');
      setLoading(false);
      return;
    }
    axios.get(`${API}/api/visits/token-info/${token}`)
      .then(r => { setVisitInfo(r.data); setLoading(false); })
      .catch(e => {
        setError(e.response?.data?.detail || 'Link inválido ou expirado.');
        setLoading(false);
      });
  }, [token, action]);

  const handleSubmit = async () => {
    if (action === 'reschedule' && !reason.trim()) {
      toast.error('Por favor, informe o motivo do reagendamento.');
      return;
    }
    if (action === 'cancel' && !reason.trim()) {
      toast.error('Por favor, informe o motivo do cancelamento.');
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(`${API}/api/visits/token-action`, {
        token,
        action,
        reason: reason || undefined,
        proposed_date: proposedDate || undefined,
        proposed_time: proposedTime || undefined,
      });
      setDone(true);
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Erro ao processar. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const actionConfig = {
    confirm: { label: 'Confirmar presença', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', btnClass: 'bg-green-600 hover:bg-green-700' },
    cancel: { label: 'Cancelar visita', icon: XCircle, color: 'text-red-600', bg: 'bg-red-100', btnClass: 'bg-red-600 hover:bg-red-700' },
    reschedule: { label: 'Solicitar reagendamento', icon: RefreshCw, color: 'text-amber-600', bg: 'bg-amber-100', btnClass: 'bg-amber-600 hover:bg-amber-700' },
  };
  const cfg = actionConfig[action] || actionConfig.confirm;

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
    const doneMessages = {
      confirm: { title: 'Presença confirmada!', desc: 'Ótimo! Sua presença foi confirmada. Até lá!' },
      cancel: { title: 'Visita cancelada', desc: 'Sua solicitação de cancelamento foi registrada. Nossa equipe entrará em contato se necessário.' },
      reschedule: { title: 'Reagendamento solicitado!', desc: 'Nossa equipe de curadoria analisará o pedido e entrará em contato com a nova data.' },
    };
    const msg = doneMessages[action] || doneMessages.confirm;
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-white flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <Card className="p-8 rounded-3xl shadow-xl text-center">
            <div className={`w-16 h-16 ${cfg.bg} rounded-full flex items-center justify-center mx-auto mb-4`}>
              <cfg.icon className={`w-8 h-8 ${cfg.color}`} />
            </div>
            <h2 className="text-2xl font-semibold mb-2">{msg.title}</h2>
            <p className="text-muted-foreground mb-6">{msg.desc}</p>
            <Link to="/login"><Button variant="outline" className="rounded-full">Acessar minha conta</Button></Link>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-white flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-1 text-2xl font-bold mb-2">
            <AppLogo />
            <span><span className="text-slate-900">Match</span><span className="text-indigo-600">Imovel</span></span>
          </Link>
        </div>

        <Card className="p-8 rounded-3xl shadow-xl border-2">
          <div className={`w-14 h-14 ${cfg.bg} rounded-full flex items-center justify-center mb-4`}>
            <cfg.icon className={`w-7 h-7 ${cfg.color}`} />
          </div>
          <h2 className="text-2xl font-semibold mb-1">{cfg.label}</h2>

          {visitInfo && (
            <div className="bg-indigo-50 p-4 rounded-xl my-4 space-y-2 text-sm">
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

          {action === 'confirm' && (
            <p className="text-muted-foreground mb-6">Clique abaixo para confirmar sua presença nesta visita.</p>
          )}

          {action === 'cancel' && (
            <div className="space-y-4 mb-6">
              <p className="text-muted-foreground">Por favor, informe o motivo do cancelamento:</p>
              <Textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Motivo do cancelamento..."
                className="rounded-xl"
                rows={3}
              />
            </div>
          )}

          {action === 'reschedule' && (
            <div className="space-y-4 mb-6">
              <div>
                <Label>Motivo do reagendamento *</Label>
                <Textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Por que você precisa reagendar?"
                  className="mt-1 rounded-xl"
                  rows={3}
                />
              </div>
              <div>
                <Label>Nova data sugerida (opcional)</Label>
                <Input
                  type="date"
                  value={proposedDate}
                  onChange={e => setProposedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="mt-1 rounded-xl"
                />
              </div>
              {proposedDate && (
                <div>
                  <Label>Horário sugerido (opcional)</Label>
                  <Input
                    type="time"
                    value={proposedTime}
                    onChange={e => setProposedTime(e.target.value)}
                    className="mt-1 rounded-xl"
                  />
                </div>
              )}
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className={`w-full h-12 rounded-full text-white font-medium ${cfg.btnClass}`}
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : cfg.label}
          </Button>
        </Card>
      </motion.div>
    </div>
  );
};

export default VisitActionPage;

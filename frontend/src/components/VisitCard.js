import React, { useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Calendar, Clock, MapPin, CheckCircle, XCircle, RefreshCw,
  ThumbsUp, ThumbsDown, Loader2, AlertTriangle, User
} from 'lucide-react';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
};

const isPast = (dateStr, timeStr) => {
  const dt = new Date(`${dateStr}T${timeStr || '00:00'}:00`);
  return dt < new Date();
};

// ─── Visit info strip ────────────────────────────────────────────────────────

const VisitInfoStrip = ({ visit }) => (
  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-1 text-sm mb-3">
    {visit.property_info?.address && (
      <p className="flex items-center gap-2 text-slate-700">
        <MapPin className="w-4 h-4 text-blue-500 shrink-0" />
        {visit.property_info.address}
      </p>
    )}
    <p className="flex items-center gap-2 text-slate-700">
      <Calendar className="w-4 h-4 text-blue-500" />
      {formatDate(visit.visit_date)}
    </p>
    <p className="flex items-center gap-2 text-slate-700">
      <Clock className="w-4 h-4 text-blue-500" />
      {visit.visit_time}
    </p>
  </div>
);

// ─── Confirmation chips ───────────────────────────────────────────────────────

const ConfirmChip = ({ confirmed, label }) => (
  <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
    confirmed ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
  }`}>
    {confirmed ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
    {label}: {confirmed ? 'confirmado' : 'aguardando'}
  </span>
);

// ─── Buyer visit section (inside BuyerDashboard match card) ───────────────────

export const BuyerVisitSection = ({ visit, onRefresh }) => {
  const [showReschedule, setShowReschedule] = useState(false);
  const [reason, setReason] = useState('');
  const [proposedDate, setProposedDate] = useState('');
  const [proposedTime, setProposedTime] = useState('');
  const [loading, setLoading] = useState(false);

  const past = isPast(visit.visit_date, visit.visit_time);
  const isCancelled = visit.status === 'cancelled';
  const isRescheduling = visit.status === 'rescheduling';

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await axios.post(`${API}/api/buyer/visits/${visit.id}/confirm`);
      toast.success('Presença confirmada!');
      onRefresh?.();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Erro ao confirmar');
    } finally { setLoading(false); }
  };

  const handleReschedule = async () => {
    if (!reason.trim()) { toast.error('Informe o motivo'); return; }
    setLoading(true);
    try {
      await axios.post(`${API}/api/buyer/visits/${visit.id}/reschedule-request`, {
        reason, proposed_date: proposedDate || undefined, proposed_time: proposedTime || undefined,
      });
      toast.success('Pedido de reagendamento enviado!');
      setShowReschedule(false);
      onRefresh?.();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Erro ao solicitar reagendamento');
    } finally { setLoading(false); }
  };

  const handleCancel = async () => {
    if (!window.confirm('Deseja cancelar esta visita?')) return;
    setLoading(true);
    try {
      await axios.post(`${API}/api/buyer/visits/${visit.id}/cancel`, { reason: 'Cancelado pelo comprador' });
      toast.success('Visita cancelada');
      onRefresh?.();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Erro ao cancelar');
    } finally { setLoading(false); }
  };

  return (
    <div className="border-t pt-4 mt-4">
      <p className="text-sm font-semibold text-blue-700 mb-2 flex items-center gap-1">
        <Calendar className="w-4 h-4" /> Visita Agendada
      </p>
      <VisitInfoStrip visit={visit} />

      <div className="flex flex-wrap gap-2 mb-3">
        <ConfirmChip confirmed={visit.buyer_confirmed} label="Sua confirmação" />
        <ConfirmChip confirmed={visit.agent_confirmed} label="Corretor" />
      </div>

      {isCancelled && <Badge className="bg-red-100 text-red-700 rounded-full">Cancelada</Badge>}
      {isRescheduling && <Badge className="bg-amber-100 text-amber-700 rounded-full">Aguardando reagendamento</Badge>}

      {!past && !isCancelled && !isRescheduling && (
        <div className="flex flex-wrap gap-2 mt-2">
          {!visit.buyer_confirmed && (
            <Button size="sm" onClick={handleConfirm} disabled={loading} className="rounded-full bg-green-600 hover:bg-green-700 text-white">
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <><CheckCircle className="w-3 h-3 mr-1" />Confirmar</>}
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => setShowReschedule(!showReschedule)} disabled={loading} className="rounded-full border-amber-400 text-amber-700">
            <RefreshCw className="w-3 h-3 mr-1" />Reagendar
          </Button>
          <Button size="sm" variant="outline" onClick={handleCancel} disabled={loading} className="rounded-full border-red-400 text-red-600">
            <XCircle className="w-3 h-3 mr-1" />Cancelar
          </Button>
        </div>
      )}

      {showReschedule && (
        <div className="mt-3 p-3 bg-amber-50 rounded-xl space-y-3">
          <Textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Motivo do reagendamento..." className="rounded-lg text-sm" rows={2} />
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-xs">Nova data (opcional)</Label>
              <Input type="date" value={proposedDate} onChange={e => setProposedDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="rounded-lg text-sm mt-1" />
            </div>
            <div><Label className="text-xs">Horário (opcional)</Label>
              <Input type="time" value={proposedTime} onChange={e => setProposedTime(e.target.value)} className="rounded-lg text-sm mt-1" />
            </div>
          </div>
          <Button size="sm" onClick={handleReschedule} disabled={loading} className="rounded-full bg-amber-600 hover:bg-amber-700 text-white">
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Enviar pedido'}
          </Button>
        </div>
      )}

      {/* Feedback section */}
      {past && !isCancelled && (
        <div className="mt-3">
          {visit.feedback?.submitted_by_buyer ? (
            <div className="bg-green-50 border border-green-200 p-3 rounded-xl text-sm">
              <p className="font-medium text-green-700 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Suas impressões foram enviadas</p>
              {visit.feedback.interest_level === 'interested' && (
                <p className="text-green-600 mt-1 flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> Interesse confirmado</p>
              )}
              {visit.feedback.interest_level === 'not_interested' && (
                <p className="text-red-600 mt-1 flex items-center gap-1"><ThumbsDown className="w-3 h-3" /> Sem interesse informado</p>
              )}
              {visit.feedback.curator_decision === 'approved_rejection' && (
                <p className="text-slate-500 mt-1 text-xs">Rejeição confirmada pelo curador</p>
              )}
            </div>
          ) : (
            <a
              href={`/dashboard/buyer`}
              className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium bg-indigo-50 px-3 py-2 rounded-xl"
            >
              📝 Acesse sua conta para deixar suas impressões
            </a>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Agent visit section ─────────────────────────────────────────────────────

export const AgentVisitSection = ({ visit, onRefresh }) => {
  const [showReschedule, setShowReschedule] = useState(false);
  const [reason, setReason] = useState('');
  const [proposedDate, setProposedDate] = useState('');
  const [proposedTime, setProposedTime] = useState('');
  const [loading, setLoading] = useState(false);

  const past = isPast(visit.visit_date, visit.visit_time);
  const isCancelled = visit.status === 'cancelled';
  const isRescheduling = visit.status === 'rescheduling';

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await axios.post(`${API}/api/agent/visits/${visit.id}/confirm`);
      toast.success('Presença confirmada!');
      onRefresh?.();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Erro ao confirmar');
    } finally { setLoading(false); }
  };

  const handleReschedule = async () => {
    if (!reason.trim()) { toast.error('Informe o motivo'); return; }
    setLoading(true);
    try {
      await axios.post(`${API}/api/agent/visits/${visit.id}/reschedule-request`, {
        reason, proposed_date: proposedDate || undefined, proposed_time: proposedTime || undefined,
      });
      toast.success('Pedido de reagendamento enviado!');
      setShowReschedule(false);
      onRefresh?.();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Erro ao solicitar reagendamento');
    } finally { setLoading(false); }
  };

  const handleCancel = async () => {
    if (!window.confirm('Deseja cancelar esta visita?')) return;
    setLoading(true);
    try {
      await axios.post(`${API}/api/agent/visits/${visit.id}/cancel`, { reason: 'Cancelado pelo corretor' });
      toast.success('Visita cancelada');
      onRefresh?.();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Erro ao cancelar');
    } finally { setLoading(false); }
  };

  return (
    <div className="border-t pt-4 mt-4">
      <p className="text-sm font-semibold text-blue-700 mb-2 flex items-center gap-1">
        <Calendar className="w-4 h-4" /> Visita Agendada
      </p>
      <VisitInfoStrip visit={visit} />

      {visit.buyer && (
        <p className="flex items-center gap-2 text-sm text-slate-600 mb-3">
          <User className="w-4 h-4 text-indigo-400" />
          Comprador: <strong>{visit.buyer.name}</strong>
        </p>
      )}

      <div className="flex flex-wrap gap-2 mb-3">
        <ConfirmChip confirmed={visit.buyer_confirmed} label="Comprador" />
        <ConfirmChip confirmed={visit.agent_confirmed} label="Sua confirmação" />
      </div>

      {isCancelled && <Badge className="bg-red-100 text-red-700 rounded-full">Cancelada</Badge>}
      {isRescheduling && <Badge className="bg-amber-100 text-amber-700 rounded-full">Aguardando reagendamento</Badge>}

      {!past && !isCancelled && !isRescheduling && (
        <div className="flex flex-wrap gap-2 mt-2">
          {!visit.agent_confirmed && (
            <Button size="sm" onClick={handleConfirm} disabled={loading} className="rounded-full bg-green-600 hover:bg-green-700 text-white">
              <CheckCircle className="w-3 h-3 mr-1" />Confirmar presença
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => setShowReschedule(!showReschedule)} disabled={loading} className="rounded-full border-amber-400 text-amber-700">
            <RefreshCw className="w-3 h-3 mr-1" />Reagendar
          </Button>
          <Button size="sm" variant="outline" onClick={handleCancel} disabled={loading} className="rounded-full border-red-400 text-red-600">
            <XCircle className="w-3 h-3 mr-1" />Cancelar
          </Button>
        </div>
      )}

      {showReschedule && (
        <div className="mt-3 p-3 bg-amber-50 rounded-xl space-y-3">
          <Textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Motivo do reagendamento..." className="rounded-lg text-sm" rows={2} />
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-xs">Nova data (opcional)</Label>
              <Input type="date" value={proposedDate} onChange={e => setProposedDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="rounded-lg text-sm mt-1" />
            </div>
            <div><Label className="text-xs">Horário (opcional)</Label>
              <Input type="time" value={proposedTime} onChange={e => setProposedTime(e.target.value)} className="rounded-lg text-sm mt-1" />
            </div>
          </div>
          <Button size="sm" onClick={handleReschedule} disabled={loading} className="rounded-full bg-amber-600 hover:bg-amber-700 text-white">
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Enviar pedido'}
          </Button>
        </div>
      )}

      {/* Agent sees buyer feedback after visit */}
      {past && visit.feedback?.submitted_by_buyer && (
        <div className="mt-3 bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm">
          <p className="font-semibold text-slate-700 mb-1">Impressões do comprador:</p>
          <p className="text-slate-600 italic mb-2">"{visit.feedback.impressions}"</p>
          {visit.feedback.interest_level === 'interested' && (
            <Badge className="bg-green-100 text-green-700 rounded-full"><ThumbsUp className="w-3 h-3 mr-1" />Com interesse</Badge>
          )}
          {visit.feedback.interest_level === 'not_interested' && (
            <Badge className="bg-red-100 text-red-700 rounded-full"><ThumbsDown className="w-3 h-3 mr-1" />Sem interesse</Badge>
          )}
          {visit.feedback.rejection_reason && (
            <p className="text-slate-500 mt-2 text-xs">Motivo: {visit.feedback.rejection_reason}</p>
          )}
          {visit.feedback.curator_decision === 'approved_rejection' && (
            <p className="text-red-500 mt-1 text-xs font-medium">Rejeição aprovada pelo curador</p>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Curator visit outcome section ───────────────────────────────────────────

export const CuratorVisitSection = ({ visit, onRefresh }) => {
  const [showOutcome, setShowOutcome] = useState(false);
  const [outcomeNotes, setOutcomeNotes] = useState('');
  const [showCuratorFeedback, setShowCuratorFeedback] = useState(false);
  const [curatorImpressions, setCuratorImpressions] = useState('');
  const [curatorInterest, setCuratorInterest] = useState('');
  const [curatorRejectionReason, setCuratorRejectionReason] = useState('');
  const [showApproveReschedule, setShowApproveReschedule] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const past = isPast(visit.visit_date, visit.visit_time);
  const isCancelled = visit.status === 'cancelled';
  const isRescheduling = visit.status === 'rescheduling';
  const hasOutcome = !!visit.outcome;
  const feedback = visit.feedback;

  const handleOutcome = async (outcome) => {
    if (outcome === 'no_show' && !outcomeNotes.trim()) {
      toast.error('Informe o motivo');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API}/api/curator/visits/${visit.id}/outcome`, {
        outcome, notes: outcomeNotes || undefined,
      });
      toast.success(outcome === 'completed' ? 'Visita marcada como realizada!' : 'Registrado.');
      setShowOutcome(false);
      onRefresh?.();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Erro');
    } finally { setLoading(false); }
  };

  const handleCuratorFeedback = async () => {
    if (!curatorImpressions.trim() || !curatorInterest) {
      toast.error('Preencha as impressões e o nível de interesse');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API}/api/curator/visits/${visit.id}/curator-feedback`, {
        impressions: curatorImpressions,
        interest_level: curatorInterest,
        rejection_reason: curatorRejectionReason || undefined,
      });
      toast.success('Feedback registrado!');
      setShowCuratorFeedback(false);
      onRefresh?.();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Erro');
    } finally { setLoading(false); }
  };

  const handleApproveReschedule = async () => {
    if (!newDate || !newTime) { toast.error('Informe data e horário'); return; }
    setLoading(true);
    try {
      await axios.put(`${API}/api/curator/visits/${visit.id}/approve-reschedule`, {
        new_date: newDate, new_time: newTime, notes: newNotes || undefined,
      });
      toast.success('Reagendamento aprovado! Novos e-mails enviados.');
      setShowApproveReschedule(false);
      onRefresh?.();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Erro');
    } finally { setLoading(false); }
  };

  const handleApproveRejection = async () => {
    if (!window.confirm('Aprovar rejeição do comprador e notificar o corretor?')) return;
    setLoading(true);
    try {
      await axios.post(`${API}/api/curator/visits/${visit.id}/approve-rejection`);
      toast.success('Rejeição aprovada. Corretor notificado.');
      onRefresh?.();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Erro');
    } finally { setLoading(false); }
  };

  return (
    <div className="border-t pt-4 mt-4 space-y-3">
      <p className="text-sm font-semibold text-blue-700 flex items-center gap-1">
        <Calendar className="w-4 h-4" /> Visita
        {isCancelled && <Badge className="ml-2 bg-red-100 text-red-700 rounded-full text-xs">Cancelada</Badge>}
        {isRescheduling && <Badge className="ml-2 bg-amber-100 text-amber-700 rounded-full text-xs">Pedido de reagendamento</Badge>}
      </p>

      <VisitInfoStrip visit={visit} />

      <div className="flex flex-wrap gap-2">
        <ConfirmChip confirmed={visit.buyer_confirmed} label="Comprador" />
        <ConfirmChip confirmed={visit.agent_confirmed} label="Corretor" />
      </div>

      {/* Reschedule request */}
      {isRescheduling && visit.reschedule_request && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm space-y-2">
          <p className="font-semibold text-amber-800 flex items-center gap-1">
            <AlertTriangle className="w-4 h-4" /> Pedido de reagendamento
          </p>
          <p><strong>Por:</strong> {visit.reschedule_request.requested_by_type === 'buyer' ? 'Comprador' : 'Corretor'}</p>
          <p><strong>Motivo:</strong> {visit.reschedule_request.reason}</p>
          {visit.reschedule_request.proposed_date && (
            <p><strong>Data proposta:</strong> {formatDate(visit.reschedule_request.proposed_date)} {visit.reschedule_request.proposed_time}</p>
          )}
          {!showApproveReschedule ? (
            <Button size="sm" onClick={() => { setShowApproveReschedule(true); setNewDate(visit.reschedule_request.proposed_date || ''); setNewTime(visit.reschedule_request.proposed_time || ''); }} className="rounded-full bg-amber-600 hover:bg-amber-700 text-white">
              Aprovar e definir nova data
            </Button>
          ) : (
            <div className="space-y-2 mt-2">
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-xs">Nova data *</Label>
                  <Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="rounded-lg text-sm mt-1" />
                </div>
                <div><Label className="text-xs">Horário *</Label>
                  <Input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} className="rounded-lg text-sm mt-1" />
                </div>
              </div>
              <input value={newNotes} onChange={e => setNewNotes(e.target.value)} placeholder="Observações (opcional)" className="w-full border rounded-lg px-3 py-1.5 text-sm" />
              <Button size="sm" onClick={handleApproveReschedule} disabled={loading} className="rounded-full bg-green-600 hover:bg-green-700 text-white">
                {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Confirmar novo agendamento'}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Outcome buttons (past visits, not cancelled) */}
      {past && !isCancelled && !hasOutcome && (
        <div className="bg-slate-50 rounded-xl p-3 space-y-2">
          <p className="text-sm font-semibold text-slate-700">Resultado da visita:</p>
          {!showOutcome ? (
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" onClick={() => handleOutcome('completed')} disabled={loading} className="rounded-full bg-green-600 hover:bg-green-700 text-white">
                <CheckCircle className="w-3 h-3 mr-1" />Visita realizada
              </Button>
              <Button size="sm" onClick={() => setShowOutcome(true)} disabled={loading} variant="outline" className="rounded-full border-red-400 text-red-600">
                <XCircle className="w-3 h-3 mr-1" />Não foi realizada
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Textarea value={outcomeNotes} onChange={e => setOutcomeNotes(e.target.value)} placeholder="Motivo (ex: comprador não apareceu, imóvel indisponível...)" className="rounded-lg text-sm" rows={2} />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleOutcome('no_show')} disabled={loading} className="rounded-full bg-red-600 hover:bg-red-700 text-white">
                  {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Confirmar não realizada'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowOutcome(false)}>Cancelar</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Outcome badge */}
      {hasOutcome && (
        <div className={`flex items-center gap-2 text-sm p-2 rounded-lg ${visit.outcome === 'completed' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {visit.outcome === 'completed' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {visit.outcome === 'completed' ? 'Visita realizada' : `Não realizada${visit.outcome_notes ? ': ' + visit.outcome_notes : ''}`}
        </div>
      )}

      {/* Buyer feedback view */}
      {visit.outcome === 'completed' && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-sm space-y-2">
          <p className="font-semibold text-purple-800">Impressões do comprador:</p>
          {feedback?.submitted_by_buyer ? (
            <>
              <p className="text-slate-700 italic">"{feedback.impressions}"</p>
              <div className="flex gap-2 flex-wrap">
                {feedback.interest_level === 'interested' && (
                  <Badge className="bg-green-100 text-green-700 rounded-full"><ThumbsUp className="w-3 h-3 mr-1" />Com interesse</Badge>
                )}
                {feedback.interest_level === 'not_interested' && (
                  <Badge className="bg-red-100 text-red-700 rounded-full"><ThumbsDown className="w-3 h-3 mr-1" />Sem interesse</Badge>
                )}
              </div>
              {feedback.rejection_reason && (
                <p className="text-slate-500 text-xs">Motivo: {feedback.rejection_reason}</p>
              )}
              {feedback.interest_level === 'not_interested' && !feedback.curator_decision && (
                <Button size="sm" onClick={handleApproveRejection} disabled={loading} className="rounded-full bg-red-600 hover:bg-red-700 text-white">
                  <XCircle className="w-3 h-3 mr-1" />Aprovar rejeição e notificar corretor
                </Button>
              )}
              {feedback.curator_decision === 'approved_rejection' && (
                <Badge className="bg-red-100 text-red-700 rounded-full text-xs">Rejeição aprovada • Corretor notificado</Badge>
              )}
            </>
          ) : feedback?.curator_notes ? (
            <>
              <p className="text-slate-700 italic">"{feedback.curator_notes}" <span className="text-xs text-slate-400">(preenchido pelo curador)</span></p>
              {feedback.interest_level === 'not_interested' && !feedback.curator_decision && (
                <Button size="sm" onClick={handleApproveRejection} disabled={loading} className="rounded-full bg-red-600 hover:bg-red-700 text-white">
                  <XCircle className="w-3 h-3 mr-1" />Aprovar rejeição
                </Button>
              )}
            </>
          ) : (
            <>
              <p className="text-slate-500">Aguardando comprador preencher as impressões...</p>
              {!showCuratorFeedback ? (
                <Button size="sm" variant="outline" onClick={() => setShowCuratorFeedback(true)} className="rounded-full">
                  Preencher pelo curador
                </Button>
              ) : (
                <div className="space-y-2">
                  <Textarea value={curatorImpressions} onChange={e => setCuratorImpressions(e.target.value)} placeholder="Impressões do comprador (relatadas ao curador)..." className="rounded-lg text-sm" rows={3} />
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setCuratorInterest('interested')} className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm border-2 ${curatorInterest === 'interested' ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-200'}`}>
                      <ThumbsUp className="w-3 h-3" />Interesse
                    </button>
                    <button type="button" onClick={() => setCuratorInterest('not_interested')} className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm border-2 ${curatorInterest === 'not_interested' ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-200'}`}>
                      <ThumbsDown className="w-3 h-3" />Sem interesse
                    </button>
                  </div>
                  {curatorInterest === 'not_interested' && (
                    <input value={curatorRejectionReason} onChange={e => setCuratorRejectionReason(e.target.value)} placeholder="Motivo do não interesse..." className="w-full border rounded-lg px-3 py-1.5 text-sm" />
                  )}
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleCuratorFeedback} disabled={loading} className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white">
                      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Salvar'}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowCuratorFeedback(false)}>Cancelar</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

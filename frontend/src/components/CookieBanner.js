import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const CONSENT_KEY = 'cookie_consent';
const CONSENT_ID_KEY = 'cookie_consent_id';
const BANNER_VERSION = 'v1';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function getConsentId() {
  try {
    let id = localStorage.getItem(CONSENT_ID_KEY);
    if (!id) {
      id = uuid();
      localStorage.setItem(CONSENT_ID_KEY, id);
    }
    return id;
  } catch (e) {
    return uuid();
  }
}

// Returns {analytics, marketing} or null if no choice was made yet.
// Migrates the old flat-string format ('all' / 'essential') transparently.
export function getCookieConsent() {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    if (raw === 'all') return { analytics: true, marketing: true };
    if (raw === 'essential') return { analytics: false, marketing: false };
    const parsed = JSON.parse(raw);
    return { analytics: !!parsed.analytics, marketing: !!parsed.marketing };
  } catch (e) {
    return null;
  }
}

function saveConsent(categories) {
  const record = { ...categories, version: BANNER_VERSION, timestamp: new Date().toISOString() };
  localStorage.setItem(CONSENT_KEY, JSON.stringify(record));

  axios.post(`${API}/consent-log`, {
    consent_id: getConsentId(),
    categories,
    banner_version: BANNER_VERSION,
  }).catch(() => {});
}

const CookieBanner = ({ onConsent }) => {
  const [visible, setVisible] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [draftCategories, setDraftCategories] = useState({ analytics: false, marketing: false });

  useEffect(() => {
    if (!getCookieConsent()) setVisible(true);

    const reopen = () => {
      const current = getCookieConsent();
      setDraftCategories(current || { analytics: false, marketing: false });
      setCustomizing(false);
      setVisible(true);
    };
    window.addEventListener('reopen-cookie-preferences', reopen);
    return () => window.removeEventListener('reopen-cookie-preferences', reopen);
  }, []);

  const choose = (categories) => {
    saveConsent(categories);
    setVisible(false);
    setCustomizing(false);
    onConsent?.(categories);
  };

  const acceptAll = () => choose({ analytics: true, marketing: true });
  const rejectNonEssential = () => choose({ analytics: false, marketing: false });
  const openCustomize = () => {
    setDraftCategories(getCookieConsent() || { analytics: false, marketing: false });
    setCustomizing(true);
  };
  const saveCustom = () => choose(draftCategories);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
        >
          <div className="max-w-4xl mx-auto bg-slate-900 text-white rounded-2xl shadow-2xl px-6 py-5">
            {!customizing ? (
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                <p className="text-sm text-slate-300 flex-1 leading-relaxed">
                  Usamos cookies para melhorar sua experiência e analisar o tráfego do site.
                  Veja nossa{' '}
                  <Link to="/privacidade" className="text-indigo-400 underline hover:text-indigo-300">
                    Política de Privacidade
                  </Link>
                  .
                </p>
                <div className="flex flex-wrap gap-3 flex-shrink-0">
                  <button
                    onClick={rejectNonEssential}
                    className="px-4 py-2 rounded-full text-sm font-medium border border-slate-600 text-slate-300 hover:border-slate-400 hover:text-white transition-colors"
                  >
                    Rejeitar não essenciais
                  </button>
                  <button
                    onClick={openCustomize}
                    className="px-4 py-2 rounded-full text-sm font-medium border border-slate-600 text-slate-300 hover:border-slate-400 hover:text-white transition-colors"
                  >
                    Personalizar
                  </button>
                  <button
                    onClick={acceptAll}
                    className="px-5 py-2 rounded-full text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                  >
                    Aceitar todos
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-slate-300 leading-relaxed">
                  Escolha quais categorias de cookies você permite. Necessários ficam sempre ativos.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4 bg-slate-800 rounded-xl px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold">Necessários</p>
                      <p className="text-xs text-slate-400">Login, segurança e funcionamento básico do site.</p>
                    </div>
                    <span className="text-xs text-slate-500 font-medium">Sempre ativo</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 bg-slate-800 rounded-xl px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold">Analytics</p>
                      <p className="text-xs text-slate-400">Google Analytics 4, para entender o uso do site.</p>
                    </div>
                    <button
                      onClick={() => setDraftCategories(prev => ({ ...prev, analytics: !prev.analytics }))}
                      className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${draftCategories.analytics ? 'bg-indigo-600' : 'bg-slate-600'}`}
                    >
                      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${draftCategories.analytics ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-4 bg-slate-800 rounded-xl px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold">Marketing / Anúncios</p>
                      <p className="text-xs text-slate-400">Meta Pixel, para anúncios e remarketing.</p>
                    </div>
                    <button
                      onClick={() => setDraftCategories(prev => ({ ...prev, marketing: !prev.marketing }))}
                      className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${draftCategories.marketing ? 'bg-indigo-600' : 'bg-slate-600'}`}
                    >
                      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${draftCategories.marketing ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setCustomizing(false)}
                    className="px-4 py-2 rounded-full text-sm font-medium border border-slate-600 text-slate-300 hover:border-slate-400 hover:text-white transition-colors"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={saveCustom}
                    className="px-5 py-2 rounded-full text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                  >
                    Salvar preferências
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieBanner;

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const CONSENT_KEY = 'cookie_consent';

export function getCookieConsent() {
  return localStorage.getItem(CONSENT_KEY);
}

const CookieBanner = ({ onConsent }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(CONSENT_KEY)) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, 'all');
    setVisible(false);
    onConsent?.('all');
  };

  const essential = () => {
    localStorage.setItem(CONSENT_KEY, 'essential');
    setVisible(false);
    onConsent?.('essential');
  };

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
          <div className="max-w-4xl mx-auto bg-slate-900 text-white rounded-2xl shadow-2xl px-6 py-5 flex flex-col md:flex-row items-start md:items-center gap-4">
            <p className="text-sm text-slate-300 flex-1 leading-relaxed">
              Usamos cookies para melhorar sua experiência e analisar o tráfego do site.
              Ao aceitar, você concorda com nossa{' '}
              <Link to="/privacidade" className="text-indigo-400 underline hover:text-indigo-300">
                Política de Privacidade
              </Link>
              .
            </p>
            <div className="flex gap-3 flex-shrink-0">
              <button
                onClick={essential}
                className="px-4 py-2 rounded-full text-sm font-medium border border-slate-600 text-slate-300 hover:border-slate-400 hover:text-white transition-colors"
              >
                Somente essenciais
              </button>
              <button
                onClick={accept}
                className="px-5 py-2 rounded-full text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
              >
                Aceitar tudo
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieBanner;

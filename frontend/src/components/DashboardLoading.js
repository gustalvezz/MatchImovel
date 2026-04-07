import React from 'react';
import { motion } from 'framer-motion';
import { Home, Loader2 } from 'lucide-react';

const DashboardLoading = ({ message = "Carregando seu dashboard..." }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-white flex flex-col items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center"
      >
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <Home className="w-10 h-10 text-slate-900" />
          <span className="text-2xl font-bold text-slate-900">Match</span>
          <span className="text-2xl font-bold text-indigo-600">Imovel</span>
        </div>
        
        {/* Loading Animation */}
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-full border-4 border-indigo-100"></div>
          <motion.div
            className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-indigo-600"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <Loader2 className="absolute inset-0 m-auto w-6 h-6 text-indigo-600 animate-pulse" />
        </div>
        
        {/* Loading Text */}
        <motion.p 
          className="text-slate-600 font-medium text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {message}
        </motion.p>
        
        {/* Animated Dots */}
        <div className="flex gap-1 mt-4">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-indigo-400 rounded-full"
              animate={{ 
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ 
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default DashboardLoading;

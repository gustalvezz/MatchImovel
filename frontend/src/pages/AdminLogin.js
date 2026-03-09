import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { Home, Mail, Lock, Shield } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await axios.post(`${API}/auth/login`, formData);
      const { token, user_id, role, name } = response.data;
      
      if (role !== 'admin') {
        toast.error('Acesso negado. Apenas administradores podem acessar esta área.');
        return;
      }
      
      login(token, { id: user_id, role, name, email: formData.email });
      toast.success('Login realizado com sucesso!');
      navigate('/admin/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Email ou senha incorretos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-semibold text-white mt-4 mb-2" data-testid="admin-login-title">
            Área Administrativa
          </h1>
          <p className="text-slate-300 flex items-center justify-center gap-0.5">
            <span className="text-white">Match</span>
            <span className="text-indigo-400">Imovel</span>
            <span className="text-slate-300"> - Painel de Controle</span>
          </p>
        </div>

        <Card className="p-8 rounded-3xl shadow-2xl border-2 border-white/10 bg-white/5 backdrop-blur-xl" data-testid="admin-login-card">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="admin-email" className="text-base text-white">Email do Administrador</Label>
              <div className="relative mt-2">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  data-testid="admin-email-input"
                  id="admin-email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="pl-10 h-12 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                  placeholder="admin@matchimob.com"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="admin-password" className="text-base text-white">Senha</Label>
              <div className="relative mt-2">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  data-testid="admin-password-input"
                  id="admin-password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="pl-10 h-12 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                  placeholder="Sua senha"
                />
              </div>
            </div>

            <Button
              data-testid="admin-login-submit"
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium text-base"
            >
              {loading ? 'Entrando...' : 'Acessar Painel'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <Link to="/" className="text-slate-300 hover:text-white flex items-center justify-center gap-2" data-testid="back-home-link">
              <Home className="w-4 h-4" />
              Voltar para o site
            </Link>
          </div>
        </Card>

        <div className="mt-6 text-center text-xs text-slate-400">
          <p>🔒 Área restrita - Apenas administradores autorizados</p>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;

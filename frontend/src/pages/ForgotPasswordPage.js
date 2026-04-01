import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Home, Mail, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Por favor, informe seu email');
      return;
    }
    
    setLoading(true);
    
    try {
      await axios.post(`${API}/api/auth/forgot-password`, { email });
      setSubmitted(true);
      toast.success('Email enviado com sucesso!');
    } catch (error) {
      toast.error('Erro ao enviar email. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-white flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-1 text-2xl font-bold mb-2">
            <Home className="w-8 h-8 text-slate-900" />
            <span className="text-slate-900">Match</span>
            <span className="text-indigo-600">Imovel</span>
          </Link>
          <h1 className="text-3xl font-semibold mt-4 mb-2" data-testid="forgot-password-title">
            Esqueceu sua senha?
          </h1>
          <p className="text-muted-foreground">
            Não se preocupe, vamos te ajudar a recuperar o acesso
          </p>
        </div>

        <Card className="p-8 rounded-3xl shadow-xl border-2" data-testid="forgot-password-card">
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-sm font-medium mb-2 block">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    data-testid="forgot-email-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 rounded-xl"
                    placeholder="seu@email.com"
                    required
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Digite o email cadastrado na sua conta
                </p>
              </div>

              <Button
                data-testid="forgot-submit-button"
                type="submit"
                className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar link de recuperação'
                )}
              </Button>

              <div className="text-center">
                <Link 
                  to="/login" 
                  className="text-indigo-600 hover:text-indigo-700 text-sm font-medium inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar para o login
                </Link>
              </div>
            </form>
          ) : (
            <div className="text-center py-6" data-testid="forgot-success-message">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Email enviado!</h3>
              <p className="text-muted-foreground mb-6">
                Se o email <strong>{email}</strong> estiver cadastrado, você receberá um link para redefinir sua senha.
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                O link expira em 24 horas. Verifique também sua caixa de spam.
              </p>
              <div className="space-y-3">
                <Button
                  onClick={() => setSubmitted(false)}
                  variant="outline"
                  className="w-full rounded-xl"
                >
                  Tentar outro email
                </Button>
                <Link to="/login">
                  <Button
                    className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600"
                  >
                    Voltar para o login
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;

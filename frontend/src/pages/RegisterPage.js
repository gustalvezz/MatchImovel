import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { Home, Mail, Lock, User, Phone, Shield, MapPin, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ESTADOS_BRASIL = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const RegisterPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const roleFromUrl = searchParams.get('role') || 'buyer';
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    role: roleFromUrl,
    creci: '',
    creci_uf: 'SP',
    creci_completo: ''
  });
  const [loading, setLoading] = useState(false);
  const [validatingCreci, setValidatingCreci] = useState(false);
  const [creciValidation, setCreciValidation] = useState(null); // null, 'valid', 'invalid'
  const [creciError, setCreciError] = useState('');

  // Phone mask function
  const formatPhone = (value) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      // Format: 99 9999-9999
      return numbers
        .replace(/(\d{2})(\d)/, '$1 $2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .substring(0, 12);
    } else {
      // Format: 99 99999-9999
      return numbers
        .replace(/(\d{2})(\d)/, '$1 $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .substring(0, 13);
    }
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhone(e.target.value);
    setFormData(prev => ({ ...prev, phone: formatted }));
  };

  const handleCreciChange = (e) => {
    // Reset validation when CRECI changes
    setCreciValidation(null);
    setCreciError('');
    setFormData(prev => ({ ...prev, creci: e.target.value.toUpperCase(), creci_completo: '' }));
  };

  const handleUfChange = (e) => {
    // Reset validation when UF changes
    setCreciValidation(null);
    setCreciError('');
    setFormData(prev => ({ ...prev, creci_uf: e.target.value, creci_completo: '' }));
  };

  const validateCreci = async () => {
    if (!formData.creci.trim()) {
      toast.error('Informe o número do CRECI');
      return false;
    }

    // Check for J suffix before API call
    if (formData.creci.trim().toUpperCase().endsWith('J')) {
      setCreciValidation('invalid');
      setCreciError('CRECI de Pessoa Jurídica (J) não é aceito. Apenas CRECI de Pessoa Física (F).');
      return false;
    }

    setValidatingCreci(true);
    setCreciValidation(null);
    setCreciError('');

    try {
      const response = await axios.post(`${API}/validate-creci`, {
        creci: formData.creci.trim(),
        uf: formData.creci_uf
      });

      if (response.data.valid) {
        setCreciValidation('valid');
        setFormData(prev => ({ ...prev, creci_completo: response.data.creci_completo }));
        toast.success(`CRECI validado: ${response.data.nome_completo}`);
        return true;
      } else {
        setCreciValidation('invalid');
        setCreciError(response.data.error || 'CRECI inválido');
        return false;
      }
    } catch (error) {
      setCreciValidation('invalid');
      setCreciError('Erro ao validar CRECI. Tente novamente.');
      return false;
    } finally {
      setValidatingCreci(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate phone
    const phoneNumbers = formData.phone.replace(/\D/g, '');
    if (phoneNumbers.length < 10) {
      toast.error('Por favor, informe um telefone válido');
      return;
    }

    // For agents, validate CRECI first
    if (formData.role === 'agent') {
      if (!formData.creci.trim()) {
        toast.error('Por favor, informe o número do CRECI');
        return;
      }
      
      // If not validated yet, validate now
      if (creciValidation !== 'valid') {
        const isValid = await validateCreci();
        if (!isValid) {
          return;
        }
      }
    }
    
    setLoading(true);
    
    try {
      const response = await axios.post(`${API}/auth/register`, formData);
      const { token, user_id, role, name } = response.data;
      
      login(token, { id: user_id, role, name, email: formData.email });
      toast.success('Cadastro realizado com sucesso!');
      
      if (role === 'buyer') {
        navigate('/dashboard/buyer');
      } else if (role === 'agent') {
        navigate('/dashboard/agent');
      } else {
        navigate('/dashboard/curator');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao cadastrar');
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
          <h1 className="text-3xl font-semibold mt-4 mb-2" data-testid="register-title">
            {formData.role === 'buyer' ? 'Cadastro de Comprador' : 'Cadastro de Corretor'}
          </h1>
          <p className="text-muted-foreground">
            {formData.role === 'buyer' 
              ? 'Encontre seu imóvel ideal'
              : 'Ganhe mais com seus imóveis'
            }
          </p>
        </div>

        <Card className="p-8 rounded-3xl shadow-xl border-2" data-testid="register-form-card">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="name" className="text-base">Nome Completo *</Label>
              <div className="relative mt-2">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  data-testid="register-name-input"
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="pl-10 h-12 rounded-xl"
                  placeholder="Seu nome"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email" className="text-base">Email *</Label>
              <div className="relative mt-2">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  data-testid="register-email-input"
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="pl-10 h-12 rounded-xl"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="phone" className="text-base">Telefone/WhatsApp *</Label>
              <div className="relative mt-2">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  data-testid="register-phone-input"
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  className="pl-10 h-12 rounded-xl"
                  placeholder="99 99999-9999"
                  maxLength={13}
                />
              </div>
            </div>

            {/* CRECI Fields - Only for agents */}
            {formData.role === 'agent' && (
              <div className="space-y-4 p-4 bg-indigo-50 rounded-xl border-2 border-indigo-100">
                <div className="flex items-center gap-2 text-indigo-700">
                  <Shield className="w-5 h-5" />
                  <span className="font-medium">Validação CRECI</span>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <Label htmlFor="creci_uf" className="text-sm">UF *</Label>
                    <select
                      data-testid="register-creci-uf"
                      id="creci_uf"
                      value={formData.creci_uf}
                      onChange={handleUfChange}
                      className="w-full h-12 mt-1 px-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:outline-none bg-white"
                      disabled={validatingCreci}
                    >
                      {ESTADOS_BRASIL.map(uf => (
                        <option key={uf} value={uf}>{uf}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="col-span-2">
                    <Label htmlFor="creci" className="text-sm">Número CRECI *</Label>
                    <div className="relative mt-1">
                      <Input
                        data-testid="register-creci-input"
                        id="creci"
                        name="creci"
                        type="text"
                        value={formData.creci}
                        onChange={handleCreciChange}
                        className={`h-12 rounded-xl pr-10 ${
                          creciValidation === 'valid' ? 'border-green-500' :
                          creciValidation === 'invalid' ? 'border-red-500' : ''
                        }`}
                        placeholder="123456-F"
                        disabled={validatingCreci}
                      />
                      {creciValidation === 'valid' && (
                        <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                      )}
                      {creciValidation === 'invalid' && (
                        <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
                      )}
                    </div>
                  </div>
                </div>

                {creciError && (
                  <p className="text-red-600 text-sm" data-testid="creci-error">{creciError}</p>
                )}

                {creciValidation === 'valid' && formData.creci_completo && (
                  <p className="text-green-600 text-sm font-medium" data-testid="creci-success">
                    ✓ {formData.creci_completo} - Ativo
                  </p>
                )}

                <Button
                  type="button"
                  variant="outline"
                  onClick={validateCreci}
                  disabled={validatingCreci || !formData.creci.trim()}
                  className="w-full h-10 rounded-xl"
                  data-testid="validate-creci-button"
                >
                  {validatingCreci ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Validando CRECI... (pode levar até 30s)
                    </>
                  ) : (
                    'Validar CRECI'
                  )}
                </Button>

                <p className="text-xs text-slate-500 text-center">
                  A validação consulta o sistema oficial do CRECI e pode levar alguns segundos.
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="password" className="text-base">Senha *</Label>
              <div className="relative mt-2">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  data-testid="register-password-input"
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="pl-10 h-12 rounded-xl"
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                />
              </div>
            </div>

            <Button
              data-testid="register-submit-button"
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium text-base"
            >
              {loading ? 'Cadastrando...' : 'Criar Conta'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Já tem uma conta? </span>
            <Link to="/login" className="text-primary font-medium hover:underline" data-testid="login-link">
              Fazer login
            </Link>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default RegisterPage;

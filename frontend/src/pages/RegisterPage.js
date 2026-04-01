import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { Home, Mail, Lock, User, Phone, Shield, MapPin, Eye, EyeOff, FileText, X, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Agent Terms Modal Component
const AgentTermsModal = ({ isOpen, onClose, creci }) => {
  if (!isOpen) return null;
  
  const currentDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric'
  });
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl max-h-[85vh] flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-2xl">
            <div className="flex items-center gap-2 text-white">
              <FileText className="w-5 h-5" />
              <h2 className="font-bold">Termo de Parceria — Corretor MatchImóvel</h2>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 text-sm text-slate-700 space-y-4">
            <p className="text-center font-bold text-base text-slate-900">
              TERMO DE PARCERIA E CREDENCIAMENTO DE CORRETOR<br/>
              MatchImóvel — Plataforma de Conexão Imobiliária<br/>
              <span className="font-normal text-slate-500">Versão 1.0 — {currentDate}</span>
            </p>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-slate-900">1. DAS PARTES</h3>
                <p>O presente termo é celebrado entre:</p>
                <p><strong>MatchImóvel</strong>, nome fantasia de G. A. SILVA NEGOCIOS IMOBILIARIOS - ME, inscrita no CNPJ sob o nº 31.957.586/0001-00, doravante denominada PLATAFORMA; e</p>
                <p>O profissional que realizou o cadastro e aceitou eletronicamente este instrumento, corretor de imóveis devidamente inscrito no CRECI sob o nº <strong>{creci || '[CRECI]'}</strong>, doravante denominado CORRETOR PARCEIRO.</p>
              </div>
              
              <div>
                <h3 className="font-bold text-slate-900">2. DO OBJETO</h3>
                <p>O presente termo estabelece as condições de parceria entre a MatchImóvel e o CORRETOR PARCEIRO para fins de acesso à base de compradores qualificados da plataforma e realização de negócios de intermediação imobiliária com a proteção e suporte da PLATAFORMA.</p>
                <p>A parceria não cria vínculo empregatício, societário ou de subordinação entre as partes. O CORRETOR PARCEIRO mantém sua autonomia profissional e pode operar simultaneamente com outros canais de venda.</p>
              </div>
              
              <div>
                <h3 className="font-bold text-slate-900">3. DO CREDENCIAMENTO</h3>
                <p>Para ser credenciado como CORRETOR PARCEIRO, o profissional deve:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Possuir inscrição ativa no CRECI de sua região, sem suspensões ou penalidades vigentes;</li>
                  <li>Aceitar eletronicamente este termo em sua integralidade;</li>
                  <li>Fornecer informações verdadeiras no cadastro, incluindo nome completo, CPF, CRECI, telefone e email profissional;</li>
                  <li>Passar pela análise de credenciamento da equipe MatchImóvel, que pode aprovar ou recusar o cadastro sem necessidade de justificativa.</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-bold text-slate-900">4. DAS OBRIGAÇÕES DA PLATAFORMA</h3>
                <p>A MatchImóvel compromete-se a:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Disponibilizar ao CORRETOR PARCEIRO acesso à base de compradores qualificados cadastrados na plataforma;</li>
                  <li>Realizar a curadoria e validação de cada match identificado pelo CORRETOR PARCEIRO antes de qualquer apresentação ao comprador;</li>
                  <li>Intermediar o contato inicial entre CORRETOR PARCEIRO e comprador;</li>
                  <li>Garantir ao CORRETOR PARCEIRO o percentual de 60% da comissão total de intermediação sobre os negócios fechados;</li>
                  <li>Emitir o Registro de Apresentação para cada visita realizada;</li>
                  <li>Manter sigilo sobre a carteira de imóveis e informações estratégicas do CORRETOR PARCEIRO;</li>
                  <li>Comunicar ao CORRETOR PARCEIRO o resultado da curadoria de cada match submetido, com retorno em até 48 horas úteis.</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-bold text-slate-900">5. DAS OBRIGAÇÕES DO CORRETOR PARCEIRO</h3>
                <p>O CORRETOR PARCEIRO compromete-se a:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Utilizar a base de compradores da plataforma exclusivamente para fins de intermediação imobiliária legítima;</li>
                  <li>Não entrar em contato direto com os compradores cadastrados na plataforma por meios externos ao sistema;</li>
                  <li>Apresentar apenas imóveis que efetivamente estejam disponíveis para venda;</li>
                  <li>Fornecer à plataforma informações completas, verdadeiras e atualizadas sobre o imóvel;</li>
                  <li>Comparecer à visita agendada com o comprador, ou comunicar o cancelamento com antecedência mínima de 24 horas;</li>
                  <li>Atualizar imediatamente a MatchImóvel sobre qualquer alteração relevante no imóvel apresentado;</li>
                  <li>Manter postura profissional no atendimento ao comprador durante todo o processo;</li>
                  <li>Manter sigilo absoluto sobre a metodologia, base de dados, critérios de curadoria e informações operacionais da MatchImóvel.</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-bold text-slate-900">6. DA COMISSÃO E DO MODELO DE REMUNERAÇÃO</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>A comissão total de intermediação seguirá os percentuais praticados pelo mercado;</li>
                  <li>Sobre o valor total da comissão recebida, caberá ao CORRETOR PARCEIRO 60% e à MatchImóvel 40%;</li>
                  <li>O repasse da comissão ao CORRETOR PARCEIRO será realizado em até 3 dias úteis após o recebimento integral pela PLATAFORMA;</li>
                  <li>Em caso de comissão parcelada, o repasse seguirá o mesmo cronograma de recebimento.</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-bold text-slate-900">7. DA PROTEÇÃO DO DIREITO À COMISSÃO</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>O Registro de Apresentação emitido pela MatchImóvel para cada visita realizada constitui prova da intermediação;</li>
                  <li>Caso o comprador realize negócio diretamente com o proprietário após apresentação realizada pela plataforma, a MatchImóvel acionará os mecanismos previstos no Termo de Uso do Comprador;</li>
                  <li>O CORRETOR PARCEIRO deve comunicar à MatchImóvel qualquer tentativa de contato direto por parte do comprador fora dos canais da plataforma.</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-bold text-slate-900">8. DAS VEDAÇÕES</h3>
                <p>É expressamente vedado ao CORRETOR PARCEIRO:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Utilizar os dados de compradores para cadastrá-los em outros sistemas ou plataformas concorrentes;</li>
                  <li>Compartilhar com terceiros qualquer informação sobre os compradores;</li>
                  <li>Submeter imóveis fictícios, indisponíveis ou sem autorização de venda;</li>
                  <li>Oferecer ao comprador condições comerciais diferentes das informadas à plataforma;</li>
                  <li>Realizar acordos paralelos visando contornar o pagamento da comissão à MatchImóvel.</li>
                </ul>
                <p className="mt-2 text-red-600 font-medium">O descumprimento implicará descredenciamento imediato, sem prejuízo das medidas legais cabíveis.</p>
              </div>
              
              <div>
                <h3 className="font-bold text-slate-900">9. DO DESCREDENCIAMENTO</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>O CORRETOR PARCEIRO pode solicitar seu descredenciamento a qualquer momento;</li>
                  <li>O descredenciamento não exime das obrigações decorrentes de matches já realizados;</li>
                  <li>A MatchImóvel pode descredenciar o CORRETOR PARCEIRO em caso de violação deste termo, cancelamentos reiterados, reclamações fundamentadas ou suspensão do CRECI.</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-bold text-slate-900">10. DA EXCLUSIVIDADE</h3>
                <p>A parceria prevista neste termo não é exclusiva. O CORRETOR PARCEIRO pode manter sua atuação em outros canais, portais e plataformas. Da mesma forma, a MatchImóvel pode credenciar quantos corretores parceiros julgar necessário.</p>
              </div>
              
              <div>
                <h3 className="font-bold text-slate-900">11. DA PRIVACIDADE E PROTEÇÃO DE DADOS</h3>
                <p>Em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018):</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Os dados do CORRETOR PARCEIRO serão utilizados exclusivamente para as finalidades descritas neste termo;</li>
                  <li>O CORRETOR PARCEIRO, ao acessar informações de perfil dos compradores, torna-se corresponsável pelo tratamento desses dados;</li>
                  <li>Qualquer vazamento ou uso indevido de dados será de exclusiva responsabilidade do CORRETOR PARCEIRO perante a ANPD e os titulares dos dados.</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-bold text-slate-900">12. DO ACEITE ELETRÔNICO</h3>
                <p>O aceite deste termo se dá pelo clique no botão "Li e aceito o Termo de Parceria" no momento do cadastro como corretor parceiro. O sistema registrará automaticamente a data, hora e endereço IP do aceite, vinculando-o ao CPF e CRECI cadastrados, constituindo prova válida nos termos do Marco Civil da Internet.</p>
              </div>
              
              <div>
                <h3 className="font-bold text-slate-900">13. DO FORO</h3>
                <p>Fica eleito o foro da comarca de Jundiaí/SP para dirimir quaisquer controvérsias oriundas deste instrumento, com renúncia expressa a qualquer outro, por mais privilegiado que seja.</p>
              </div>
              
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl mt-4">
                <p className="text-sm text-amber-800">
                  <strong>Ao clicar em "Li e aceito o Termo de Parceria"</strong>, o CORRETOR PARCEIRO declara ter lido, compreendido e concordado com todas as cláusulas deste instrumento, estando ciente de que o descumprimento de suas obrigações poderá acarretar descredenciamento, cobrança de perdas e danos e demais medidas legais cabíveis.
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-4 border-t bg-slate-50 rounded-b-2xl">
            <Button
              onClick={onClose}
              className="w-full h-11 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600"
            >
              Fechar e Voltar
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const ESTADOS_BRASIL = [
  { sigla: 'AC', nome: 'Acre' },
  { sigla: 'AL', nome: 'Alagoas' },
  { sigla: 'AP', nome: 'Amapá' },
  { sigla: 'AM', nome: 'Amazonas' },
  { sigla: 'BA', nome: 'Bahia' },
  { sigla: 'CE', nome: 'Ceará' },
  { sigla: 'DF', nome: 'Distrito Federal' },
  { sigla: 'ES', nome: 'Espírito Santo' },
  { sigla: 'GO', nome: 'Goiás' },
  { sigla: 'MA', nome: 'Maranhão' },
  { sigla: 'MT', nome: 'Mato Grosso' },
  { sigla: 'MS', nome: 'Mato Grosso do Sul' },
  { sigla: 'MG', nome: 'Minas Gerais' },
  { sigla: 'PA', nome: 'Pará' },
  { sigla: 'PB', nome: 'Paraíba' },
  { sigla: 'PR', nome: 'Paraná' },
  { sigla: 'PE', nome: 'Pernambuco' },
  { sigla: 'PI', nome: 'Piauí' },
  { sigla: 'RJ', nome: 'Rio de Janeiro' },
  { sigla: 'RN', nome: 'Rio Grande do Norte' },
  { sigla: 'RS', nome: 'Rio Grande do Sul' },
  { sigla: 'RO', nome: 'Rondônia' },
  { sigla: 'RR', nome: 'Roraima' },
  { sigla: 'SC', nome: 'Santa Catarina' },
  { sigla: 'SP', nome: 'São Paulo' },
  { sigla: 'SE', nome: 'Sergipe' },
  { sigla: 'TO', nome: 'Tocantins' }
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
    creci_uf: 'SP'
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate phone
    const phoneNumbers = formData.phone.replace(/\D/g, '');
    if (phoneNumbers.length < 10) {
      toast.error('Por favor, informe um telefone válido');
      return;
    }

    // For agents, validate CRECI fields
    if (formData.role === 'agent') {
      if (!formData.creci.trim()) {
        toast.error('Por favor, informe o número do CRECI');
        return;
      }
      if (!formData.creci_uf) {
        toast.error('Por favor, selecione o estado do CRECI');
        return;
      }
      if (!termsAccepted) {
        toast.error('Você precisa aceitar o Termo de Parceria para continuar');
        return;
      }
    }
    
    setLoading(true);
    
    try {
      const payload = {
        ...formData,
        // Include terms data for agents
        ...(formData.role === 'agent' && {
          terms_accepted: true,
          terms_accepted_at: new Date().toISOString()
        })
      };
      
      const response = await axios.post(`${API}/auth/register`, payload);
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
                  <span className="font-medium">Dados do CRECI</span>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <Label htmlFor="creci_uf" className="text-sm">Estado *</Label>
                    <select
                      data-testid="register-creci-uf"
                      id="creci_uf"
                      value={formData.creci_uf}
                      onChange={(e) => setFormData(prev => ({ ...prev, creci_uf: e.target.value }))}
                      className="w-full h-12 mt-1 px-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:outline-none bg-white"
                      required
                    >
                      {ESTADOS_BRASIL.map(estado => (
                        <option key={estado.sigla} value={estado.sigla}>{estado.sigla} - {estado.nome}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="col-span-2">
                    <Label htmlFor="creci" className="text-sm">Número do CRECI *</Label>
                    <Input
                      data-testid="register-creci-input"
                      id="creci"
                      name="creci"
                      type="text"
                      value={formData.creci}
                      onChange={(e) => setFormData(prev => ({ ...prev, creci: e.target.value }))}
                      className="h-12 mt-1 rounded-xl"
                      placeholder="Ex: 123456-F"
                      required
                    />
                  </div>
                </div>

                <p className="text-xs text-slate-500">
                  Seu CRECI será verificado pela nossa equipe após o cadastro.
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
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="pl-10 pr-10 h-12 rounded-xl"
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-slate-700"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Terms acceptance - Only for agents */}
            {formData.role === 'agent' && (
              <div className="space-y-3 p-4 bg-amber-50 rounded-xl border-2 border-amber-200">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="agent-terms-checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    data-testid="agent-terms-checkbox"
                  />
                  <label htmlFor="agent-terms-checkbox" className="text-sm text-slate-700 leading-relaxed cursor-pointer">
                    Li e aceito o{' '}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowTermsModal(true);
                      }}
                      className="text-indigo-600 font-semibold hover:underline inline-flex items-center gap-1"
                    >
                      Termo de Parceria e Credenciamento
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </label>
                </div>
                {!termsAccepted && (
                  <p className="text-xs text-amber-700 flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Obrigatório para finalizar o cadastro
                  </p>
                )}
              </div>
            )}

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
      
      {/* Agent Terms Modal */}
      <AgentTermsModal 
        isOpen={showTermsModal} 
        onClose={() => setShowTermsModal(false)} 
        creci={formData.creci ? `${formData.creci_uf}-${formData.creci}` : null}
      />
    </div>
  );
};

export default RegisterPage;

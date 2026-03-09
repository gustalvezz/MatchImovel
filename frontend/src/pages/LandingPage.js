import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Home, Search, Users, Zap, Building2, Heart, CheckCircle2, ArrowRight, Shield, Target, Clock, Eye, MessageSquare, TrendingUp, Lock } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  const scrollToForm = () => {
    document.getElementById('cadastro')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-purple-50 to-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-200 via-purple-100 to-transparent opacity-60"></div>
        
        <nav className="relative max-w-7xl mx-auto px-6 py-6 flex justify-between items-center" data-testid="landing-nav">
          <div className="text-2xl font-bold flex items-center gap-2">
            <Home className="w-8 h-8 text-indigo-600" />
            <span className="text-slate-900">Match</span>
            <span className="text-indigo-600">Imóvel</span>
          </div>
          <Button 
            data-testid="nav-login-button"
            onClick={() => navigate('/login')} 
            variant="outline" 
            className="rounded-full border-2 border-slate-200 hover:border-indigo-600"
          >
            Entrar
          </Button>
        </nav>

        <div className="relative max-w-7xl mx-auto px-6 py-20 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-block px-4 py-2 bg-indigo-100 rounded-full mb-6">
              <p className="text-sm font-semibold text-indigo-600">Nova forma de comprar imóvel</p>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-6" data-testid="hero-title">
              O imóvel ideal
              <span className="block text-indigo-600 italic">te encontra.</span>
            </h1>
            <p className="text-lg md:text-xl leading-relaxed text-slate-600 mb-12 max-w-2xl mx-auto" data-testid="hero-subtitle">
              Cansado de enviar mensagens para dezenas de corretores e descobrir que o imóvel já foi vendido?
              Cadastre o que você procura — nossa plataforma e equipe de curadoria trabalham para você.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                data-testid="hero-buyer-cta"
                onClick={() => scrollToForm()} 
                size="lg" 
                className="rounded-full h-14 px-10 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/25 text-lg font-medium"
              >
                Cadastrar meu interesse <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                data-testid="hero-agent-cta"
                onClick={() => navigate('/register?role=agent')} 
                size="lg" 
                variant="outline" 
                className="rounded-full h-14 px-10 text-lg font-medium border-2 border-slate-300 hover:border-indigo-600"
              >
                Sou corretor
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* O Problema */}
      <div className="bg-slate-900 text-white py-24">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto"
          >
            <p className="text-sm font-semibold text-indigo-400 mb-4 uppercase tracking-wider">O problema que resolvemos</p>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              O mercado é feito de imóveis.
              <span className="block text-indigo-400 italic mt-2">Nós somos feitos de compradores.</span>
            </h2>
            <p className="text-lg text-slate-300 leading-relaxed">
              Em vez de mais um portal cheio de anúncios desatualizados, criamos uma vitrine de pessoas reais com intenção real de compra. Corretores encontram compradores. Compradores encontram o imóvel certo. Sem desperdício de tempo.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Como Funciona */}
      <div className="max-w-7xl mx-auto px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-sm font-semibold text-indigo-600 mb-4 uppercase tracking-wider">O processo</p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Da busca ao
            <span className="text-indigo-600 italic"> fechamento</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {[
            { 
              number: '1', 
              icon: Search, 
              title: 'Comprador cadastra', 
              desc: 'Bairro, metragem, valor, necessidades específicas. Rápido e sem compromisso inicial.',
              color: 'bg-indigo-100 text-indigo-600'
            },
            { 
              number: '2', 
              icon: Users, 
              title: 'Corretor busca', 
              desc: 'Corretores navegam na base de compradores e identificam matches com seus imóveis.',
              color: 'bg-purple-100 text-purple-600'
            },
            { 
              number: '3', 
              icon: Shield, 
              title: 'Curadoria valida', 
              desc: 'Nossa equipe verifica se é um match real antes de qualquer contato. Sem perda de tempo para ninguém.',
              color: 'bg-green-100 text-green-600'
            },
            { 
              number: '4', 
              icon: CheckCircle2, 
              title: 'Visita agendada', 
              desc: 'Apresentação organizada com ambos os lados. Negociação segura e protegida pela plataforma.',
              color: 'bg-blue-100 text-blue-600'
            }
          ].map((step, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="p-8 rounded-3xl border-2 hover:border-indigo-200 transition-all h-full">
                <div className={`w-12 h-12 rounded-full ${step.color} flex items-center justify-center mb-6`}>
                  <step.icon className="w-6 h-6" />
                </div>
                <div className="text-3xl font-bold text-slate-200 mb-3">{step.number}</div>
                <h3 className="text-xl font-bold mb-3 text-slate-900">{step.title}</h3>
                <p className="text-slate-600 leading-relaxed">{step.desc}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Para Compradores */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <p className="text-sm font-semibold text-indigo-600 mb-4 uppercase tracking-wider">Para compradores</p>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Cadastre o que você quer.
                <span className="block text-indigo-600 italic mt-2">Nós buscamos pra você.</span>
              </h2>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                Sem precisar ficar monitorando portais ou esperando retorno de corretores. Você define o perfil, nós trabalhamos.
              </p>
              
              <div className="space-y-4">
                {[
                  { icon: CheckCircle2, text: 'Cadastro gratuito e sem compromisso' },
                  { icon: Shield, text: 'Sugestões curadas por especialistas' },
                  { icon: Eye, text: 'Sem exposição do seu contato' },
                  { icon: Target, text: 'Visitas apenas de imóveis validados' },
                  { icon: Lock, text: 'Proteção contratual da negociação' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <item.icon className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-slate-700 font-medium">{item.text}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <img 
                src="https://images.unsplash.com/photo-1758523419991-c6d6dae06626?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTJ8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBoYXBweSUyMGNvdXBsZSUyMGhvbWUlMjBrZXlzfGVufDB8fHx8MTc3Mjc3NjA1OHww&ixlib=rb-4.1.0&q=85"
                alt="Casal feliz com chaves"
                className="rounded-3xl shadow-2xl"
              />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Para Corretores */}
      <div className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-2 md:order-1"
            >
              <img 
                src="https://images.unsplash.com/photo-1649151139875-ae8ea07082e2?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTN8MHwxfHNlYXJjaHwyfHxwcm9mZXNzaW9uYWwlMjByZWFsJTIwZXN0YXRlJTIwYWdlbnQlMjB0YWJsZXR8ZW58MHx8fHwxNzcyNzc2MDU5fDA&ixlib=rb-4.1.0&q=85"
                alt="Corretor profissional"
                className="rounded-3xl shadow-2xl"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-1 md:order-2"
            >
              <p className="text-sm font-semibold text-purple-600 mb-4 uppercase tracking-wider">Para corretores</p>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Encontre compradores para
                <span className="block text-purple-600 italic mt-2">aquele imóvel difícil.</span>
              </h2>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                Acesse uma base real de compradores qualificados. Faça buscas, identifique matches e feche mais negócios.
              </p>
              
              <div className="space-y-4">
                {[
                  { icon: Users, text: 'Acesso à base de compradores ativos' },
                  { icon: TrendingUp, text: 'Comissão maior: 60% para o corretor' },
                  { icon: Shield, text: 'Intermediação profissional garantida' },
                  { icon: Zap, text: 'Sem custo de captação de leads' },
                  { icon: Lock, text: 'Visitas com proteção da plataforma' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <item.icon className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-slate-700 font-medium">{item.text}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Modelo de Comissão */}
      <div className="bg-slate-900 text-white py-24">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-sm font-semibold text-indigo-400 mb-4 uppercase tracking-wider">Modelo de comissão</p>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Mais vantajoso para
              <span className="block text-indigo-400 italic mt-2">quem trabalha em campo</span>
            </h2>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto">
              Corretores ganham mais aqui. Porque queremos que você venha buscar seus compradores.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="p-8 rounded-3xl bg-slate-800 border-slate-700">
              <p className="text-sm text-slate-400 mb-4 uppercase tracking-wider">Modelo tradicional</p>
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1">
                  <div className="h-3 bg-slate-600 rounded-full mb-2"></div>
                  <p className="text-sm text-slate-400">50% Plataforma</p>
                </div>
                <div className="flex-1">
                  <div className="h-3 bg-slate-500 rounded-full mb-2"></div>
                  <p className="text-sm text-slate-400">50% Corretor</p>
                </div>
              </div>
            </Card>

            <Card className="p-8 rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-600 border-0">
              <p className="text-sm text-indigo-200 mb-4 uppercase tracking-wider">MatchImóvel</p>
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-[0.4]">
                  <div className="h-3 bg-indigo-400 rounded-full mb-2"></div>
                  <p className="text-sm text-white">40%</p>
                </div>
                <div className="flex-[0.6]">
                  <div className="h-3 bg-white rounded-full mb-2"></div>
                  <p className="text-sm text-white font-bold">60% Você fica com mais!</p>
                </div>
              </div>
              <p className="text-sm text-indigo-100">Comissão padrão do mercado. O corretor recebe 60% do valor total.</p>
            </Card>
          </div>
        </div>
      </div>

      {/* Curadoria Humana - SEÇÃO NOVA */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-sm font-semibold text-indigo-600 mb-4 uppercase tracking-wider">Diferenciais</p>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Curadoria humana.
              <span className="block text-indigo-600 italic mt-2">Tecnologia por trás.</span>
            </h2>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Não enviamos qualquer imóvel para qualquer comprador. Antes de cada apresentação, nosso curador — um corretor experiente — analisa se aquele match faz sentido real.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-12">
            <Card className="p-8 rounded-3xl border-2 hover:border-indigo-300 transition-all">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                  <Lock className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-2xl font-bold">0 contatos expostos</h3>
              </div>
              <p className="text-slate-600 leading-relaxed">
                O contato do comprador nunca é exposto. Todo processo acontece dentro da plataforma, garantindo privacidade e proteção.
              </p>
            </Card>

            <Card className="p-8 rounded-3xl border-2 hover:border-indigo-300 transition-all">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold">100% intermediado</h3>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Proteção contra negociações diretas que prejudicam a comissão. Tudo passa pelo curador especializado.
              </p>
            </Card>
          </div>

          {/* Exemplo de Curadoria */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <Card className="p-8 rounded-3xl bg-white border-2 border-indigo-200">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1 bg-purple-50 p-4 rounded-2xl rounded-tl-none">
                    <p className="text-sm font-semibold text-purple-600 mb-1">Corretor</p>
                    <p className="text-slate-700">Olá! Identificamos um possível match para o ap. Rua Bela Cintra. Pode nos enviar detalhes?</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="flex-1 bg-indigo-50 p-4 rounded-2xl rounded-tl-none">
                    <p className="text-sm font-semibold text-indigo-600 mb-1">Bot IA</p>
                    <p className="text-slate-700">2 dormitórios, 78m², R$590k, vaga inclusa. Prédio novo, entrega imediata.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1 bg-green-50 p-4 rounded-2xl rounded-tl-none">
                    <p className="text-sm font-semibold text-green-600 mb-1">Curador</p>
                    <p className="text-slate-700">Curador avaliando o match... O comprador busca 70-80m² e orçamento até R$620k em Consolação/Bela Cintra.</p>
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <p className="text-green-700 font-semibold">✓ Match validado — visita agendada para sáb 14h</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* CTA Final */}
      <div id="cadastro" className="bg-gradient-to-br from-indigo-600 to-purple-600 py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-sm font-semibold text-indigo-200 mb-4 uppercase tracking-wider">Comece agora</p>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Seu próximo imóvel
              <span className="block italic mt-2">está esperando por você.</span>
            </h2>
            <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
              Cadastre o que você procura. É gratuito, sem compromisso, e nossa equipe trabalha pra você encontrar o lar ideal.
            </p>
            <Button 
              data-testid="final-cta-button"
              onClick={() => navigate('/register?role=buyer')} 
              size="lg" 
              className="rounded-full h-14 px-10 bg-white text-indigo-600 hover:bg-slate-50 text-lg font-medium shadow-xl"
            >
              Cadastrar Gratuitamente <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Home className="w-6 h-6" />
            <span className="text-xl font-bold">
              <span className="text-white">Match</span>
              <span className="text-indigo-400">Imóvel</span>
            </span>
          </div>
          <p>© 2026 MatchImóvel. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

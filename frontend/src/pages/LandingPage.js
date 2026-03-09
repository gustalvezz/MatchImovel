import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Home, Search, Users, Zap, Building2, CheckCircle2, ArrowRight, Shield, Target, Eye, TrendingUp, Lock, ChevronLeft, ChevronRight, Star } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const testimonials = [
    {
      name: 'Ricardo Mendes',
      role: 'Comprador',
      location: 'Pinheiros, São Paulo',
      text: 'Depois de 6 meses procurando, encontrei meu apartamento em 2 semanas com o MatchImovel. A curadoria realmente funciona, só recebi imóveis que faziam sentido para mim.',
      rating: 5
    },
    {
      name: 'Ana Paula Costa',
      role: 'Corretora',
      location: 'Rio de Janeiro',
      text: 'Consegui vender um apartamento que estava parado há 8 meses. A comissão de 60% e a base de compradores qualificados fizeram toda a diferença no meu faturamento.',
      rating: 5
    },
    {
      name: 'Carlos Eduardo Silva',
      role: 'Comprador',
      location: 'Moema, São Paulo',
      text: 'Impressionante como a equipe entendeu exatamente o que eu precisava. Visitei apenas 3 imóveis e fechei negócio no segundo. Processo transparente e rápido.',
      rating: 5
    },
    {
      name: 'Juliana Rodrigues',
      role: 'Corretora',
      location: 'Belo Horizonte',
      text: 'Melhor plataforma para corretores que trabalham sério. Sem perda de tempo com curiosos, todos os compradores são pré-qualificados e realmente interessados.',
      rating: 5
    }
  ];

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-purple-50 to-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-200 via-purple-100 to-transparent opacity-60"></div>
        
        <nav className="relative max-w-7xl mx-auto px-6 py-6 flex justify-between items-center" data-testid="landing-nav">
          <div className="text-2xl font-bold flex items-center gap-1">
            <Home className="w-8 h-8 text-slate-900" />
            <span className="text-slate-900">Match</span>
            <span className="text-indigo-600">Imovel</span>
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
                onClick={() => navigate('/register?role=buyer')} 
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
                src="https://images.unsplash.com/photo-1758611972971-1c8b9c6d7822?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NzV8MHwxfHNlYXJjaHwzfHxibGFjayUyMHdvbWFuJTIwcmVhbCUyMGVzdGF0ZSUyMGFnZW50JTIwc21pbGluZyUyMGxvb2tpbmclMjBhdCUyMHBob25lJTIwcHJvZmVzc2lvbmFsfGVufDB8fHx8MTc3MzA5Mzk5Mnww&ixlib=rb-4.1.0&q=85"
                alt="Corretora profissional"
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
              <p className="text-sm text-indigo-200 mb-4 uppercase tracking-wider">MatchImovel</p>
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

      {/* Curadoria Humana */}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
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
        </div>
      </div>

      {/* Depoimentos */}
      <div className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-sm font-semibold text-indigo-600 mb-4 uppercase tracking-wider">Depoimentos</p>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              O que dizem sobre
              <span className="block text-indigo-600 italic mt-2">o MatchImovel</span>
            </h2>
          </motion.div>

          <div className="max-w-4xl mx-auto relative">
            <Card className="p-12 rounded-3xl border-2 border-indigo-100 relative overflow-hidden">
              <div className="absolute top-8 left-8 text-indigo-200 text-8xl font-serif leading-none">"</div>
              
              <motion.div
                key={currentTestimonial}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className="relative z-10"
              >
                <div className="flex gap-1 mb-6 justify-center">
                  {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                
                <p className="text-xl text-slate-700 leading-relaxed mb-8 text-center italic">
                  {testimonials[currentTestimonial].text}
                </p>
                
                <div className="text-center">
                  <p className="font-bold text-lg text-slate-900">{testimonials[currentTestimonial].name}</p>
                  <p className="text-sm text-slate-600">{testimonials[currentTestimonial].role} • {testimonials[currentTestimonial].location}</p>
                </div>
              </motion.div>
            </Card>

            <div className="flex items-center justify-center gap-4 mt-8">
              <Button
                onClick={prevTestimonial}
                variant="outline"
                size="icon"
                className="rounded-full w-12 h-12 border-2 hover:border-indigo-600"
                data-testid="testimonial-prev"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              
              <div className="flex gap-2">
                {testimonials.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentTestimonial(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === currentTestimonial
                        ? 'w-8 bg-indigo-600'
                        : 'bg-slate-300 hover:bg-slate-400'
                    }`}
                    data-testid={`testimonial-dot-${idx}`}
                  />
                ))}
              </div>

              <Button
                onClick={nextTestimonial}
                variant="outline"
                size="icon"
                className="rounded-full w-12 h-12 border-2 hover:border-indigo-600"
                data-testid="testimonial-next"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-1 mb-4">
            <Home className="w-6 h-6" />
            <span className="text-xl font-bold">
              <span className="text-white">Match</span>
              <span className="text-indigo-400">Imovel</span>
            </span>
          </div>
          <p>© 2026 MatchImovel. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

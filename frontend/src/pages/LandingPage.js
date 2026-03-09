import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Home, Search, Users, Zap, Building2, Heart, CheckCircle2, ArrowRight } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const [userType, setUserType] = useState(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-200 via-purple-100 to-transparent opacity-60"></div>
        
        <nav className="relative max-w-7xl mx-auto px-6 py-6 flex justify-between items-center" data-testid="landing-nav">
          <div className="text-2xl font-bold text-primary flex items-center gap-2">
            <Home className="w-8 h-8" />
            <span>Match Imob</span>
          </div>
          <Button 
            data-testid="nav-login-button"
            onClick={() => navigate('/login')} 
            variant="outline" 
            className="rounded-full"
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
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-6" data-testid="hero-title">
              Encontre seu
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600"> Imóvel Ideal</span>
            </h1>
            <p className="text-lg md:text-xl leading-relaxed text-muted-foreground mb-12 max-w-2xl mx-auto" data-testid="hero-subtitle">
              Cansado de enviar mensagens para inúmeros corretores? Cadastre seu interesse e receba sugestões personalizadas dos melhores imóveis do mercado.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                data-testid="hero-buyer-cta"
                onClick={() => navigate('/register?role=buyer')} 
                size="lg" 
                className="rounded-full h-14 px-10 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/25 text-lg font-medium"
              >
                Quero Comprar <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                data-testid="hero-agent-cta"
                onClick={() => navigate('/register?role=agent')} 
                size="lg" 
                variant="outline" 
                className="rounded-full h-14 px-10 text-lg font-medium border-2"
              >
                Sou Corretor
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white/70 backdrop-blur-xl border-y border-slate-200/50 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-center"
              data-testid="stat-matches"
            >
              <div className="text-4xl font-bold text-primary mb-2">1.2K+</div>
              <div className="text-muted-foreground">Matches Realizados</div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-center"
              data-testid="stat-buyers"
            >
              <div className="text-4xl font-bold text-secondary mb-2">500+</div>
              <div className="text-muted-foreground">Compradores Ativos</div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="text-center"
              data-testid="stat-agents"
            >
              <div className="text-4xl font-bold text-accent mb-2">200+</div>
              <div className="text-muted-foreground">Corretores Parceiros</div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* How it Works - Buyers */}
      <div className="max-w-7xl mx-auto px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4" data-testid="how-it-works-title">
            Como Funciona para Compradores
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Simples, rápido e sem complicação
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-8 hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50 rounded-3xl" data-testid="step-card-1">
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mb-6">
                <Search className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-2xl font-medium mb-3">1. Cadastre seu Interesse</h3>
              <p className="text-muted-foreground leading-relaxed">
                Conte-nos o que você procura: tipo de imóvel, localização, orçamento e características desejadas.
              </p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-8 hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50 rounded-3xl" data-testid="step-card-2">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-6">
                <Heart className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-2xl font-medium mb-3">2. Receba Matches</h3>
              <p className="text-muted-foreground leading-relaxed">
                Corretores encontram seu perfil e apresentam imóveis que combinam perfeitamente com você.
              </p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-8 hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50 rounded-3xl" data-testid="step-card-3">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-6">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-2xl font-medium mb-3">3. Visite e Decida</h3>
              <p className="text-muted-foreground leading-relaxed">
                Agende visitas aos imóveis selecionados e escolha o seu lar ideal com segurança.
              </p>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* For Agents Section */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-6" data-testid="agents-section-title">
                Para Corretores: Comissão Mais Vantajosa
              </h2>
              <p className="text-lg text-slate-300 leading-relaxed mb-8">
                Diferente do modelo tradicional de 50/50, oferecemos 60% da comissão para você, corretor parceiro. Encontre compradores qualificados e aumente seus ganhos.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <Zap className="w-6 h-6 text-secondary mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">60% da Comissão para Você</h4>
                    <p className="text-slate-300">Modelo mais vantajoso que o mercado tradicional</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="w-6 h-6 text-secondary mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">Compradores Qualificados</h4>
                    <p className="text-slate-300">Busca ativa por perfis que combinam com seus imóveis</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Building2 className="w-6 h-6 text-secondary mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">Venda Imóveis de Difícil Saída</h4>
                    <p className="text-slate-300">Encontre o comprador ideal para qualquer imóvel</p>
                  </div>
                </div>
              </div>

              <Button 
                data-testid="agents-cta"
                onClick={() => navigate('/register?role=agent')} 
                size="lg" 
                className="rounded-full h-14 px-10 bg-secondary hover:bg-secondary/90 text-white text-lg font-medium"
              >
                Seja um Corretor Parceiro
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <img 
                src="https://images.unsplash.com/photo-1649151139875-ae8ea07082e2?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTN8MHwxfHNlYXJjaHwyfHxwcm9mZXNzaW9uYWwlMjByZWFsJTIwZXN0YXRlJTIwYWdlbnQlMjB0YWJsZXR8ZW58MHx8fHwxNzcyNzc2MDU5fDA&ixlib=rb-4.1.0&q=85"
                alt="Corretor profissional"
                className="rounded-3xl shadow-2xl"
                data-testid="agents-section-image"
              />
            </motion.div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-6 py-24">
        <Card className="p-12 md:p-16 rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white text-center" data-testid="final-cta">
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-6">
            Pronto para Encontrar seu Imóvel Ideal?
          </h2>
          <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
            Cadastre-se gratuitamente e comece a receber sugestões personalizadas hoje mesmo.
          </p>
          <Button 
            data-testid="final-cta-button"
            onClick={() => navigate('/register?role=buyer')} 
            size="lg" 
            className="rounded-full h-14 px-10 bg-white text-indigo-600 hover:bg-slate-50 text-lg font-medium shadow-xl"
          >
            Cadastrar Gratuitamente
          </Button>
        </Card>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Home className="w-6 h-6" />
            <span className="text-xl font-bold text-white">Match Imob</span>
          </div>
          <p>© 2026 Match Imob. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

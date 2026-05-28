import React from 'react';
import { Link } from 'react-router-dom';
import AppLogo from '@/components/AppLogo';

const PrivacyPage = () => (
  <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-white">
    <header className="bg-white/70 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2">
          <AppLogo />
          <span className="font-bold text-lg">
            <span className="text-slate-900">Match</span>
            <span className="text-indigo-600">Imovel</span>
          </span>
        </Link>
      </div>
    </header>

    <main className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-bold text-slate-900 mb-2">Política de Privacidade</h1>
      <p className="text-sm text-slate-500 mb-10">Última atualização: junho de 2026</p>

      <div className="prose prose-slate max-w-none space-y-8 text-slate-700 leading-relaxed">

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">1. Quem somos</h2>
          <p>
            O <strong>MatchImóvel</strong> é uma plataforma de intermediação imobiliária operada por
            Gustavo Alves, com sede em Jundiaí — SP. Nosso site é <strong>matchimovel.com.br</strong>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">2. Dados que coletamos</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Dados de cadastro:</strong> nome, e-mail, telefone e, para corretores, número do CRECI.</li>
            <li><strong>Dados de perfil:</strong> preferências de imóvel, localização desejada, faixa de orçamento e características declaradas pelo comprador.</li>
            <li><strong>Dados de navegação:</strong> páginas visitadas, origem do acesso (UTM), dispositivo e navegador — coletados via Google Analytics 4 e Meta Pixel, apenas com seu consentimento.</li>
            <li><strong>Cookies técnicos:</strong> necessários para autenticação e funcionamento da plataforma.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">3. Como usamos seus dados</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Identificar matches entre compradores e imóveis disponíveis.</li>
            <li>Enviar notificações por e-mail sobre o andamento do seu match.</li>
            <li>Melhorar nossos serviços com base em análises de uso (com consentimento).</li>
            <li>Cumprir obrigações legais.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">4. Compartilhamento de dados</h2>
          <p>
            <strong>Não vendemos seus dados.</strong> Seus dados pessoais não são compartilhados com
            corretores sem sua autorização explícita — o corretor só recebe seu contato após a curadoria
            aprovar o match e você concordar com o contato. Podemos compartilhar dados com prestadores
            de serviço técnico (hospedagem, e-mail transacional) estritamente para operar a plataforma.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">5. Cookies e rastreamento</h2>
          <p>
            Utilizamos cookies de duas categorias:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Essenciais:</strong> necessários para login e segurança. Sempre ativos.</li>
            <li><strong>Analíticos:</strong> Google Analytics 4 e Meta Pixel, para medir audiência e melhorar campanhas. Ativados apenas com seu consentimento.</li>
          </ul>
          <p className="mt-3">
            Você pode alterar sua preferência a qualquer momento limpando os dados do navegador.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">6. Seus direitos (LGPD)</h2>
          <p>Conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem direito a:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Acessar seus dados pessoais.</li>
            <li>Corrigir dados incompletos ou desatualizados.</li>
            <li>Solicitar a exclusão dos seus dados.</li>
            <li>Revogar o consentimento de rastreamento analítico.</li>
          </ul>
          <p className="mt-3">
            Para exercer seus direitos, entre em contato: <strong>contato@matchimovel.com.br</strong>
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">7. Retenção de dados</h2>
          <p>
            Seus dados são mantidos enquanto sua conta estiver ativa ou pelo prazo necessário para
            cumprir obrigações legais. Você pode solicitar a exclusão a qualquer momento.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">8. Contato</h2>
          <p>
            Dúvidas sobre esta política? Fale conosco:<br />
            <strong>contato@matchimovel.com.br</strong>
          </p>
        </section>
      </div>

      <div className="mt-12 pt-8 border-t border-slate-200 text-center">
        <Link to="/" className="text-indigo-600 hover:text-indigo-700 font-medium text-sm">
          ← Voltar para o início
        </Link>
      </div>
    </main>
  </div>
);

export default PrivacyPage;

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
      <p className="text-sm text-slate-500 mb-10">Versão 1.1 — Última atualização: 27 de setembro de 2026</p>

      <div className="prose prose-slate max-w-none space-y-8 text-slate-700 leading-relaxed">

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">1. Quem somos (controlador dos dados)</h2>
          <p>
            O <strong>MatchImóvel</strong> é uma plataforma de intermediação imobiliária operada por
            <strong> G. A. SILVA NEGÓCIOS IMOBILIÁRIOS - ME</strong>, inscrita no CNPJ sob o nº
            <strong> 31.957.586/0001-00</strong>, com sede em Jundiaí — SP. Nosso site é
            <strong> matchimovel.com.br</strong>. Para qualquer assunto relacionado a este documento
            ou ao tratamento dos seus dados, o contato é <strong>contato@matchimovel.com.br</strong>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">2. Dados que coletamos</h2>
          <p>Coletamos dados diferentes conforme o seu papel na plataforma:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Compradores:</strong> nome, e-mail, telefone e as respostas do formulário de perfil (tipo de imóvel, localização, orçamento, características e estilo de vida declarados).</li>
            <li><strong>Corretores:</strong> nome, e-mail, telefone, número do CRECI e dados dos imóveis cadastrados — que podem incluir dados de terceiros (o proprietário do imóvel).</li>
            <li><strong>Dados de navegação:</strong> páginas visitadas, origem do acesso (UTM), dispositivo e navegador — coletados via Google Analytics 4 e Meta Pixel, apenas com o seu consentimento.</li>
            <li><strong>Cookies técnicos:</strong> necessários para autenticação e funcionamento da plataforma, sempre ativos.</li>
            <li><strong>Consentimento de WhatsApp:</strong> caso você opte por receber novidades e ofertas pelo WhatsApp, registramos essa autorização separadamente do cadastro geral, com data, hora e a versão do texto aceito.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">3. Como usamos seus dados e a base legal de cada uso</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Execução do serviço solicitado</strong> (base legal: execução de contrato) — identificar matches entre compradores e imóveis, incluindo o uso de inteligência artificial para interpretar seu perfil e cruzar com imóveis cadastrados por corretores.</li>
            <li><strong>Comunicação sobre o andamento do seu match</strong> (execução de contrato) — notificações por e-mail e WhatsApp sobre o status do seu cadastro, visitas agendadas e propostas.</li>
            <li><strong>Análise de uso e melhoria do produto</strong> (consentimento) — via Google Analytics 4, ativado apenas se você autorizar no banner de cookies.</li>
            <li><strong>Anúncios e remarketing</strong> (consentimento) — via Meta Pixel, ativado apenas se você autorizar a categoria "Marketing" no banner de cookies.</li>
            <li><strong>Novidades e ofertas por WhatsApp</strong> (consentimento específico) — somente se você marcar o checkbox de opt-in correspondente, separado do aceite geral dos Termos de Uso.</li>
            <li><strong>Cumprimento de obrigações legais</strong> (obrigação legal) — quando exigido por lei ou autoridade competente.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">4. Com quem compartilhamos seus dados</h2>
          <p>
            <strong>Não vendemos seus dados.</strong> Seus dados de contato não são compartilhados com
            corretores sem sua autorização explícita — o corretor só recebe seu contato após a curadoria
            aprovar o match. Para operar a plataforma, utilizamos os seguintes prestadores de serviço,
            que processam dados em nosso nome:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Vercel</strong> — hospedagem do site e da aplicação.</li>
            <li><strong>Cloudinary</strong> — armazenamento e otimização de imagens de imóveis.</li>
            <li><strong>Meta (WhatsApp Business API e Meta Pixel)</strong> — comunicação via WhatsApp e, com consentimento, rastreamento de anúncios.</li>
            <li><strong>Google (Analytics e, futuramente, Google Ads)</strong> — análise de audiência, com consentimento.</li>
            <li><strong>Provedor de inteligência artificial em uso na plataforma (OpenAI e/ou Anthropic)</strong> — interpretação de perfil e matching entre compradores e imóveis.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">5. Cookies e rastreamento</h2>
          <p>Utilizamos cookies de três categorias:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Necessários:</strong> essenciais para login, segurança e funcionamento básico do site. Sempre ativos, sem opção de desligar.</li>
            <li><strong>Analíticos:</strong> Google Analytics 4, para entender como o site é usado e melhorar a experiência. Ativados apenas com o seu consentimento.</li>
            <li><strong>Marketing/Anúncios:</strong> Meta Pixel e remarketing, para exibir anúncios relevantes e medir campanhas. Ativados apenas com o seu consentimento, separadamente da categoria Analíticos.</li>
          </ul>
          <p className="mt-3">
            Você pode alterar sua preferência a qualquer momento clicando em <strong>"Preferências de cookies"</strong>,
            disponível no rodapé de todas as páginas do site.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">6. Seus direitos (LGPD, art. 18)</h2>
          <p>Conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem direito a:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Confirmar a existência de tratamento e acessar seus dados pessoais.</li>
            <li>Corrigir dados incompletos, inexatos ou desatualizados.</li>
            <li>Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade com a lei.</li>
            <li>Solicitar a portabilidade dos seus dados a outro fornecedor de serviço.</li>
            <li>Solicitar a exclusão dos dados tratados com base no seu consentimento.</li>
            <li>Obter informação sobre com quem compartilhamos seus dados (ver seção 4).</li>
            <li>Ser informado sobre a possibilidade de não fornecer consentimento e as consequências (por exemplo, não usar cookies de marketing não impede o cadastro nem o matching).</li>
            <li>Solicitar revisão de decisões tomadas unicamente com base em tratamento automatizado — o que inclui o uso de inteligência artificial no processo de matching, que sempre passa por curadoria humana antes de qualquer contato ser liberado.</li>
            <li>Revogar, a qualquer momento, o consentimento dado para cookies analíticos, de marketing, ou para o recebimento de mensagens de WhatsApp.</li>
          </ul>
          <p className="mt-3">
            Para exercer qualquer um desses direitos, entre em contato: <strong>contato@matchimovel.com.br</strong>
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">7. Prazo de retenção</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Dados de cadastro e perfil</strong> (compradores e corretores): mantidos enquanto a conta estiver ativa, e por até 5 anos após a última interação, prazo usado como referência para eventuais obrigações legais e fiscais relacionadas à intermediação.</li>
            <li><strong>Registros de consentimento de cookies e de WhatsApp marketing:</strong> mantidos pelo mesmo período do dado a que se referem, como prova do consentimento coletado.</li>
            <li><strong>Dados de navegação (Analytics/Pixel):</strong> conforme o prazo padrão de retenção de cada ferramenta (Google Analytics 4 e Meta), tipicamente entre 14 e 26 meses.</li>
          </ul>
          <p className="mt-3">Você pode solicitar a exclusão antecipada dos seus dados a qualquer momento, ressalvadas obrigações legais de guarda.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">8. Contato</h2>
          <p>
            Dúvidas sobre esta política ou sobre o tratamento dos seus dados? Fale conosco:<br />
            <strong>contato@matchimovel.com.br</strong>
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">9. Histórico de versões</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Versão 1.1</strong> (27/09/2026) — inclusão de categoria de cookies de Marketing, opt-in específico de WhatsApp, terceiros nomeados, direitos LGPD completos e prazos de retenção.</li>
            <li><strong>Versão 1.0</strong> (junho de 2026) — publicação inicial.</li>
          </ul>
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

import React from 'react';
import { Link } from 'react-router-dom';
import AppLogo from '@/components/AppLogo';

const TermsOfUsePage = () => (
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
      <h1 className="text-4xl font-bold text-slate-900 mb-2">Termos de Uso</h1>
      <p className="text-sm text-slate-500 mb-10">
        Termo de Uso e Compromisso de Intermediação — Versão 1.0
      </p>

      <div className="prose prose-slate max-w-none space-y-6 text-slate-700 leading-relaxed">
        <p className="text-center font-bold text-base text-slate-900">
          TERMO DE USO E COMPROMISSO DE INTERMEDIAÇÃO<br />
          MatchImóvel — Plataforma de Conexão Imobiliária
        </p>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-2">1. Das partes</h2>
          <p>O presente termo é celebrado entre:</p>
          <p><strong>MatchImóvel</strong>, nome fantasia de G. A. SILVA NEGÓCIOS IMOBILIÁRIOS - ME, inscrita no CNPJ sob o nº 31.957.586/0001-00, doravante denominada PLATAFORMA; e</p>
          <p>O usuário que realizou o cadastro e aceitou eletronicamente este instrumento, doravante denominado COMPRADOR.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-2">2. Do objeto</h2>
          <p>A MatchImóvel é uma plataforma de intermediação imobiliária especializada no lado do comprador. Sua função é receber o perfil de busca do COMPRADOR, conectá-lo a corretores parceiros credenciados e realizar a curadoria das oportunidades antes de qualquer apresentação.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-2">3. Das obrigações da plataforma</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Manter o sigilo absoluto dos dados de contato do COMPRADOR;</li>
            <li>Realizar curadoria prévia de todas as oportunidades;</li>
            <li>Não cobrar qualquer valor do COMPRADOR pelo serviço.</li>
          </ul>
        </section>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h2 className="text-lg font-bold text-slate-900 mb-2">5. Da proteção da intermediação</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>O COMPRADOR reconhece que qualquer imóvel apresentado pela MatchImóvel foi originado através da rede de intermediação da PLATAFORMA;</li>
            <li>A comissão de intermediação é de <strong>6% sobre o valor do negócio</strong>;</li>
            <li>A obrigação persiste pelo prazo de <strong>18 meses</strong>.</li>
          </ul>
        </div>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-2">8. Do aceite eletrônico</h2>
          <p>O aceite deste termo se dá pelo clique no botão "Li e aceito os Termos de Uso" no momento do cadastro. O sistema registra automaticamente a data, hora e endereço IP do aceite.</p>
        </section>

        <p className="text-center font-medium text-slate-600 pt-4 border-t">
          Ao clicar em "Li e aceito os Termos de Uso", o COMPRADOR declara ter lido, compreendido e concordado com todas as cláusulas deste instrumento.
        </p>
      </div>

      <div className="mt-12 pt-8 border-t border-slate-200 text-center">
        <Link to="/" className="text-indigo-600 hover:text-indigo-700 font-medium text-sm">
          ← Voltar para o início
        </Link>
      </div>
    </main>
  </div>
);

export default TermsOfUsePage;

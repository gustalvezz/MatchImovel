import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { FileText, X } from 'lucide-react';

/**
 * Modal com o Termo de Parceria do Corretor.
 * commissionRate: 60 (padrão) ou 80 (campanha especial)
 */
const AgentTermsModal = ({ isOpen, onClose, creci, commissionRate = 60 }) => {
  if (!isOpen) return null;

  const currentDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });

  const platformRate = 100 - commissionRate;
  const isCampaign = commissionRate !== 60;

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
          <div className={`flex items-center justify-between p-4 border-b rounded-t-2xl ${isCampaign ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-indigo-600 to-purple-600'}`}>
            <div className="flex items-center gap-2 text-white">
              <FileText className="w-5 h-5" />
              <h2 className="font-bold">Termo de Parceria — Corretor MatchImóvel</h2>
              {isCampaign && <span className="ml-2 bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">CAMPANHA {commissionRate}%</span>}
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 text-sm text-slate-700 space-y-4">
            <p className="text-center font-bold text-base text-slate-900">
              TERMO DE PARCERIA E CREDENCIAMENTO DE CORRETOR<br />
              MatchImóvel — Plataforma de Conexão Imobiliária<br />
              <span className="font-normal text-slate-500">Versão 1.0 — {currentDate}</span>
            </p>

            {isCampaign && (
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-4">
                <p className="text-amber-800 font-semibold text-sm">
                  🏆 Condição especial de campanha: comissão de <strong>{commissionRate}%</strong> ao Corretor Parceiro ({platformRate}% à MatchImóvel). Esta condição substitui o percentual padrão e está vinculada ao código promocional utilizado no cadastro.
                </p>
              </div>
            )}

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
                  <li>Garantir ao CORRETOR PARCEIRO o percentual de <strong>{commissionRate}%</strong> da comissão total de intermediação sobre os negócios fechados;</li>
                  <li>Assumir a responsabilidade jurídica sobre contratos, cláusulas de compra e venda, vistorias e demais obrigações legais da intermediação;</li>
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
                  <li>Sobre o valor total da comissão recebida, caberá ao CORRETOR PARCEIRO <strong>{commissionRate}%</strong> e à MatchImóvel <strong>{platformRate}%</strong>;</li>
                  {isCampaign && <li className="text-amber-700 font-medium">Esta condição é vinculada ao código promocional <strong>CAMP80</strong> utilizado no cadastro e está garantida por tempo indeterminado para o presente CORRETOR PARCEIRO;</li>}
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
              className={`w-full h-11 rounded-full ${isCampaign ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-indigo-600 to-purple-600'}`}
            >
              Fechar e Voltar
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AgentTermsModal;

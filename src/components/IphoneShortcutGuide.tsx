import React, { useState } from 'react';
import { 
  Smartphone, 
  Copy, 
  Check, 
  Play, 
  Zap, 
  CreditCard, 
  Mail, 
  ShieldCheck, 
  CheckCircle2, 
  Mic, 
  Building2, 
  Cloud 
} from 'lucide-react';

interface IphoneShortcutGuideProps {
  webhookSecret: string;
  onSimulateSuccess: () => void;
}

export function IphoneShortcutGuide({ webhookSecret, onSimulateSuccess }: IphoneShortcutGuideProps) {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [simulating, setSimulating] = useState<string | null>(null);
  const [simulationResult, setSimulationResult] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'apple_pay' | 'email' | 'siri_widget' | 'open_finance'>('apple_pay');

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://seu-dominio.vercel.app';
  const applePayUrl = `${origin}/api/webhook/apple-pay`;
  const bankUrl = `${origin}/api/webhook/santander`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(label);
    setTimeout(() => setCopiedUrl(null), 2500);
  };

  const handleSimulate = async (type: 'apple_pay' | 'santander_pix' | 'santander_card') => {
    setSimulating(type);
    setSimulationResult(null);
    try {
      const res = await fetch('/api/webhook/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (res.ok) {
        setSimulationResult(`Lançamento de teste simulado com sucesso: ${data.transaction.merchant} (-R$ ${data.transaction.amount.toFixed(2)})!`);
        onSimulateSuccess();
      } else {
        setSimulationResult('Erro ao simular: ' + (data.error || 'Falha na requisição'));
      }
    } catch (err: any) {
      setSimulationResult('Erro de conexão: ' + err.message);
    } finally {
      setSimulating(null);
    }
  };

  return (
    <div className="bg-white dark:bg-[#121216] border border-slate-200/90 dark:border-zinc-800/80 rounded-3xl p-5 shadow-sm dark:shadow-lg space-y-6 transition-colors">
      {/* Cabeçalho */}
      <div>
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-xs uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" />
          Central de Automação iOS (iPhone)
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
          Como Automatizar no seu iPhone
        </h3>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed">
          Como você não recebe SMS do Santander, estruturamos os canais automáticos ideais: o <strong className="text-slate-800 dark:text-zinc-200">Apple Pay</strong> (100% silencioso), <strong className="text-slate-800 dark:text-zinc-200">Notificações por E-mail</strong> do Santander, ou o <strong className="text-slate-800 dark:text-zinc-200">Atalho Rápido por Voz/Widget</strong>.
        </p>
      </div>

      {/* Seletor de Abas das Opções */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 rounded-2xl bg-slate-100 dark:bg-zinc-900 p-1.5 border border-slate-200 dark:border-zinc-800 text-xs">
        <button
          onClick={() => setActiveTab('apple_pay')}
          className={`py-2 px-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'apple_pay'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          Apple Pay
        </button>

        <button
          onClick={() => setActiveTab('email')}
          className={`py-2 px-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'email'
              ? 'bg-santander-red text-white shadow-sm'
              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          E-mail Banco
        </button>

        <button
          onClick={() => setActiveTab('siri_widget')}
          className={`py-2 px-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'siri_widget'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Mic className="w-3.5 h-3.5" />
          Siri / Widget
        </button>

        <button
          onClick={() => setActiveTab('open_finance')}
          className={`py-2 px-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'open_finance'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          Open Finance
        </button>
      </div>

      {/* ABA 1: Apple Pay */}
      {activeTab === 'apple_pay' && (
        <div className="space-y-4">
          <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 p-3.5 rounded-2xl text-xs text-emerald-800 dark:text-emerald-200">
            <strong>✨ 100% Automático e Silencioso:</strong> Toda vez que você aproximar o iPhone ou pagar com Apple Pay na internet (iFood, Uber, sites, etc.), o iOS executa a automação em segundo plano sem pedir nenhuma confirmação!
          </div>

          <div className="bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 p-4 rounded-2xl space-y-3">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs flex items-center justify-center font-bold">1</span>
              Criando o Gatilho no App Atalhos
            </h4>
            <ol className="text-xs text-slate-700 dark:text-zinc-300 space-y-2 list-decimal list-inside leading-relaxed">
              <li>No iPhone, abra o app <strong>Atalhos</strong>.</li>
              <li>Toque na aba <strong>Automação</strong> e depois no <strong>+</strong>.</li>
              <li>Selecione <strong>Transação</strong> (ícone de cartão da Carteira).</li>
              <li>Em <em>Cartão</em> selecione <strong>Qualquer Cartão</strong>.</li>
              <li>Em <em>Categoria</em> deixe <strong>Qualquer</strong>.</li>
              <li>Marque <strong>Executar Imediatamente</strong> e desmarque <em>Notificar ao Executar</em>.</li>
              <li>Toque em <strong>Avançar</strong> e escolha <strong>Nova Automação em Branco</strong>.</li>
            </ol>
          </div>

          <div className="bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 p-4 rounded-2xl space-y-3">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs flex items-center justify-center font-bold">2</span>
              Ação: Obter Conteúdo de URL
            </h4>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Adicione a ação <strong>"Obter Conteúdo de URL"</strong> com os seguintes valores:
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-600 dark:text-zinc-400">URL do Webhook Apple Pay:</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={applePayUrl}
                  className="bg-white dark:bg-black/50 border border-slate-300 dark:border-zinc-800 text-xs text-slate-800 dark:text-zinc-300 px-3 py-2 rounded-xl flex-1 font-mono select-all"
                />
                <button
                  onClick={() => copyToClipboard(applePayUrl, 'apple-pay-url')}
                  className="bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 px-3 py-2 rounded-xl text-xs flex items-center gap-1 font-semibold border border-slate-300 dark:border-zinc-700"
                >
                  {copiedUrl === 'apple-pay-url' ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  Copiar
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-black/40 p-3 rounded-xl border border-slate-200 dark:border-zinc-800/80 space-y-1 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-zinc-400">
                <span>Método:</span> <strong className="text-slate-900 dark:text-white">POST</strong>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-zinc-400">
                <span>Cabeçalho:</span> <strong className="text-slate-900 dark:text-white">Content-Type: application/json</strong>
              </div>
              <div className="mt-2 text-slate-700 dark:text-zinc-300">
                <span className="font-semibold block text-slate-600 dark:text-zinc-400 mb-1">Corpo da Requisição (JSON):</span>
                <pre className="bg-slate-100 dark:bg-zinc-950 p-2.5 rounded-lg text-[11px] text-emerald-800 dark:text-emerald-300 font-mono overflow-x-auto border border-slate-200 dark:border-transparent">
{`{
  "amount": Entrada do Atalho (Valor),
  "merchant": Entrada do Atalho (Comerciante),
  "category": Entrada do Atalho (Categoria),
  "card": Entrada do Atalho (Cartão),
  "secret": "${webhookSecret}"
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ABA 2: E-mail do Santander */}
      {activeTab === 'email' && (
        <div className="space-y-4">
          <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40 p-3.5 rounded-2xl text-xs text-rose-800 dark:text-rose-200">
            <strong>📧 Como funciona o E-mail Santander:</strong> O Santander envia comprovante de Pix e compras no cartão para seu e-mail cadastrado. O app Atalhos do iPhone consegue ler esses e-mails e repassar automaticamente para o nosso app!
          </div>

          <div className="bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 p-4 rounded-2xl space-y-3">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 text-xs flex items-center justify-center font-bold">1</span>
              Gatilho de E-mail no Atalhos do iOS
            </h4>
            <ol className="text-xs text-slate-700 dark:text-zinc-300 space-y-2 list-decimal list-inside leading-relaxed">
              <li>No app <strong>Atalhos</strong>, vá em <strong>Automação &gt; +</strong>.</li>
              <li>Escolha o gatilho <strong>E-mail</strong>.</li>
              <li>Em <em>Remetente</em>, coloque o e-mail do Santander (ex: <code>comunicados@santander.com.br</code>).</li>
              <li>Em <em>Assunto Contém</em>, digite <strong>Pix</strong> ou <strong>Comprovante</strong>.</li>
              <li>Marque <strong>Executar Imediatamente</strong>.</li>
              <li>Na ação, use <strong>Obter Conteúdo de URL (POST)</strong> enviando o texto do e-mail para a URL do Webhook Santander:</li>
            </ol>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="text"
                readOnly
                value={bankUrl}
                className="bg-white dark:bg-black/50 border border-slate-300 dark:border-zinc-800 text-xs text-slate-800 dark:text-zinc-300 px-3 py-2 rounded-xl flex-1 font-mono select-all"
              />
              <button
                onClick={() => copyToClipboard(bankUrl, 'santander-url')}
                className="bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 px-3 py-2 rounded-xl text-xs flex items-center gap-1 font-semibold border border-slate-300 dark:border-zinc-700"
              >
                {copiedUrl === 'santander-url' ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                Copiar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ABA 3: Atalho Rápido por Voz (Siri) / Widget */}
      {activeTab === 'siri_widget' && (
        <div className="space-y-4">
          <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800/40 p-3.5 rounded-2xl text-xs text-indigo-800 dark:text-indigo-200">
            <strong>⚡ Registro em 2 Segundos sem abrir o app:</strong> Ideal para quando você fizer um Pix e quiser lançar na hora falando com a Siri ou tocando no Widget da Tela Bloqueada / Botão de Ação do iPhone.
          </div>

          <div className="bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 p-4 rounded-2xl space-y-3">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Como configurar o Atalho "Lançar Pix"
            </h4>
            <ol className="text-xs text-slate-700 dark:text-zinc-300 space-y-2 list-decimal list-inside leading-relaxed">
              <li>No app <strong>Atalhos</strong>, crie um novo atalho com o nome <strong>"Lançar Despesa"</strong>.</li>
              <li>Ação 1: <strong>Solicitar Entrada</strong> (Número) com a pergunta: <em>"Qual o valor?"</em>.</li>
              <li>Ação 2: <strong>Solicitar Entrada</strong> (Texto) com a pergunta: <em>"Onde você gastou?"</em>.</li>
              <li>Ação 3: <strong>Obter Conteúdo de URL</strong> (POST para a URL do webhook).</li>
              <li>Agora você pode simplesmente dizer: <strong>"E aí Siri, Lançar Despesa"</strong> ou colocar o botão direto na tela de bloqueio do seu iPhone!</li>
            </ol>
          </div>
        </div>
      )}

      {/* ABA 4: Open Finance */}
      {activeTab === 'open_finance' && (
        <div className="space-y-4">
          <div className="bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800/40 p-3.5 rounded-2xl text-xs text-teal-800 dark:text-teal-200">
            <strong>🏦 Conexão Bancária Direta via Open Finance Brasil:</strong> O Banco Central regulamenta a conexão direta entre contas bancárias e aplicativos via agregadores como o <strong>Pluggy</strong>.
          </div>

          <div className="bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 p-4 rounded-2xl space-y-3">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Vantagens do Open Finance
            </h4>
            <ul className="text-xs text-slate-700 dark:text-zinc-300 space-y-2 list-disc list-inside leading-relaxed">
              <li>Dispensa completamente notificações no celular.</li>
              <li>Sincroniza extrato completo da conta corrente, Pix enviados/recebidos e fatura do cartão de crédito.</li>
              <li>Pronto para integração via API Pluggy (pluggy.ai) com webhook diário direto na sua nuvem.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Simulador Interativo */}
      <div className="bg-slate-50 dark:bg-gradient-to-br dark:from-zinc-900 dark:to-black border border-slate-200 dark:border-zinc-800 p-4 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Play className="w-4 h-4 text-emerald-600 dark:text-emerald-400 fill-emerald-600 dark:fill-emerald-400" />
              Simulador em Tempo Real
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400">
              Clique abaixo para ver a categorização e o painel reagindo instantaneamente:
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
          <button
            onClick={() => handleSimulate('apple_pay')}
            disabled={simulating !== null}
            className="p-3 rounded-xl bg-white dark:bg-zinc-800/90 hover:bg-slate-100 dark:hover:bg-zinc-700 text-left border border-slate-200 dark:border-zinc-700 transition-all group flex flex-col justify-between shadow-sm"
          >
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <Smartphone className="w-3 h-3" /> Testar Apple Pay
            </span>
            <span className="text-xs font-bold text-slate-900 dark:text-white mt-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-300">
              Starbucks (R$ 24,50)
            </span>
            <span className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5">Alimentação</span>
          </button>

          <button
            onClick={() => handleSimulate('santander_pix')}
            disabled={simulating !== null}
            className="p-3 rounded-xl bg-white dark:bg-zinc-800/90 hover:bg-slate-100 dark:hover:bg-zinc-700 text-left border border-slate-200 dark:border-zinc-700 transition-all group flex flex-col justify-between shadow-sm"
          >
            <span className="text-[10px] text-teal-700 dark:text-teal-400 font-semibold flex items-center gap-1">
              <Zap className="w-3 h-3" /> Testar Santander PIX
            </span>
            <span className="text-xs font-bold text-slate-900 dark:text-white mt-1 group-hover:text-teal-600 dark:group-hover:text-teal-300">
              Restaurante (R$ 68,00)
            </span>
            <span className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5">Alimentação</span>
          </button>

          <button
            onClick={() => handleSimulate('santander_card')}
            disabled={simulating !== null}
            className="p-3 rounded-xl bg-white dark:bg-zinc-800/90 hover:bg-slate-100 dark:hover:bg-zinc-700 text-left border border-slate-200 dark:border-zinc-700 transition-all group flex flex-col justify-between shadow-sm"
          >
            <span className="text-[10px] text-rose-700 dark:text-rose-400 font-semibold flex items-center gap-1">
              <CreditCard className="w-3 h-3" /> Testar Cartão Santander
            </span>
            <span className="text-xs font-bold text-slate-900 dark:text-white mt-1 group-hover:text-rose-600 dark:group-hover:text-rose-300">
              Posto Ipiranga (R$ 139,90)
            </span>
            <span className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5">Transporte</span>
          </button>
        </div>

        {simulationResult && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{simulationResult}</span>
          </div>
        )}
      </div>
    </div>
  );
}

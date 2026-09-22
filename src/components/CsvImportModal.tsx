import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  Check, 
  AlertCircle, 
  Copy, 
  Download, 
  CheckCircle2, 
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Sparkles,
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react';
import { parseBankCSV, ParsedCsvRow, getSampleCsvTemplate } from '@/lib/csv-parser';
import { formatBRL } from '@/lib/formatters';
import { CategoryIcon } from './CategoryIcon';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CsvImportModal({ isOpen, onClose, onSuccess }: CsvImportModalProps) {
  const [tab, setTab] = useState<'upload' | 'paste' | 'help'>('upload');
  const [pastedText, setPastedText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedCsvRow[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState<{ count: number; skipped: number } | null>(null);
  const [allowDuplicates, setAllowDuplicates] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleProcessCsvText = (text: string, name?: string) => {
    setErrorMsg(null);
    setImportSuccess(null);
    const result = parseBankCSV(text);

    if (!result.success || result.transactions.length === 0) {
      setErrorMsg(result.error || 'Nenhum lançamento válido pôde ser extraído do arquivo.');
      setParsedRows([]);
      setSelectedIndices(new Set());
      return;
    }

    if (name) setFileName(name);
    setParsedRows(result.transactions);
    // Seleciona todas as linhas válidas por padrão
    const validSet = new Set<number>();
    result.transactions.forEach(t => {
      if (t.isValid) validSet.add(t.index);
    });
    setSelectedIndices(validSet);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      handleProcessCsvText(content, file.name);
    };
    reader.onerror = () => {
      setErrorMsg('Falha ao ler o arquivo selecionado.');
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      handleProcessCsvText(content, file.name);
    };
    reader.readAsText(file, 'utf-8');
  };

  const toggleSelectAll = () => {
    const validRows = parsedRows.filter(r => r.isValid);
    if (selectedIndices.size === validRows.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(validRows.map(r => r.index)));
    }
  };

  const toggleRow = (index: number) => {
    const next = new Set(selectedIndices);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    setSelectedIndices(next);
  };

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(getSampleCsvTemplate());
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2000);
  };

  const handleDownloadTemplate = () => {
    const content = getSampleCsvTemplate();
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'modelo_extrato_financas.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = async () => {
    const rowsToImport = parsedRows.filter(r => selectedIndices.has(r.index) && r.isValid);
    if (rowsToImport.length === 0) {
      setErrorMsg('Selecione pelo menos um lançamento válido para importar.');
      return;
    }

    setImporting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/transactions/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactions: rowsToImport,
          allowDuplicates,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao importar transações');
      }

      setImportSuccess({
        count: data.importedCount,
        skipped: data.skippedCount,
      });

      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro de comunicação ao importar.');
    } finally {
      setImporting(false);
    }
  };

  const selectedRows = parsedRows.filter(r => selectedIndices.has(r.index) && r.isValid);
  const totalSelectedExpense = selectedRows.filter(r => r.type === 'expense').reduce((acc, r) => acc + r.amount, 0);
  const totalSelectedIncome = selectedRows.filter(r => r.type === 'income').reduce((acc, r) => acc + r.amount, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-[#151518] border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-2xl max-h-[92vh] shadow-2xl flex flex-col overflow-hidden transition-colors">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-zinc-800/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Importar Extrato Bancário (CSV)
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Santander, Nubank, Itaú ou planilha própria
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Abas */}
        <div className="flex border-b border-slate-100 dark:border-zinc-800 px-5 pt-2 shrink-0 gap-4 text-xs font-semibold">
          <button
            onClick={() => setTab('upload')}
            className={`pb-2.5 border-b-2 flex items-center gap-1.5 transition-colors ${
              tab === 'upload'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 dark:border-emerald-400 font-bold'
                : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Arquivo CSV
          </button>
          <button
            onClick={() => setTab('paste')}
            className={`pb-2.5 border-b-2 flex items-center gap-1.5 transition-colors ${
              tab === 'paste'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 dark:border-emerald-400 font-bold'
                : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Colar Texto
          </button>
          <button
            onClick={() => setTab('help')}
            className={`pb-2.5 border-b-2 flex items-center gap-1.5 transition-colors ${
              tab === 'help'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 dark:border-emerald-400 font-bold'
                : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Estrutura & Modelo
          </button>
        </div>

        {/* Conteúdo com Scroll */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {importSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-900 dark:text-emerald-200 space-y-2 animate-fadeIn">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>Importação Concluída com Sucesso!</span>
              </div>
              <p>
                <strong>{importSuccess.count} lançamentos</strong> foram importados e salvos no banco.
                {importSuccess.skipped > 0 && ` (${importSuccess.skipped} transações idênticas já existiam e foram desconsideradas para evitar duplicatas).`}
              </p>
              <div className="pt-2 flex justify-end">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                >
                  Concluir e Ver no App
                </button>
              </div>
            </div>
          )}

          {/* ABA 1: UPLOAD DE ARQUIVO */}
          {tab === 'upload' && !importSuccess && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-zinc-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-zinc-900/40 space-y-2"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".csv,.txt"
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-800 dark:text-white block">
                    {fileName ? fileName : 'Clique para selecionar ou arraste o arquivo CSV aqui'}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 block">
                    Suporta extratos exportados do Santander, Nubank, Itaú, C6, Inter ou arquivo próprio
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ABA 2: COLAR TEXTO */}
          {tab === 'paste' && !importSuccess && (
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block">
                Cole abaixo o conteúdo do arquivo CSV:
              </label>
              <textarea
                value={pastedText}
                onChange={e => setPastedText(e.target.value)}
                placeholder={`Data,Estabelecimento,Valor,Categoria\n22/09/2026,Supermercado Pao de Acucar,185.50,Alimentação\n21/09/2026,Posto Shell,120.00,Transporte`}
                rows={6}
                className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-2xl p-3 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => handleProcessCsvText(pastedText, 'Texto Colado')}
                disabled={!pastedText.trim()}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Processar Texto Colado
              </button>
            </div>
          )}

          {/* ABA 3: ESTRUTURA & MODELO */}
          {tab === 'help' && (
            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 dark:bg-zinc-900/80 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-2">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  Como o arquivo CSV deve estar formatado:
                </h4>
                <p className="text-slate-600 dark:text-zinc-300 leading-relaxed">
                  O importador inteligente aceita tanto arquivos exportados diretamente do seu banco (Santander, Nubank, Itaú) quanto planilhas preenchidas por você no Excel ou Google Sheets.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 space-y-1">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 block">1. Data (Obrigatória)</span>
                    <span className="text-[11px] text-slate-600 dark:text-zinc-400 block">Ex: <code>22/09/2026</code> ou <code>2026-09-22</code></span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 space-y-1">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 block">2. Estabelecimento / Descrição</span>
                    <span className="text-[11px] text-slate-600 dark:text-zinc-400 block">Ex: <code>Supermercado</code>, <code>Posto Shell</code></span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 space-y-1">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 block">3. Valor (Obrigatório)</span>
                    <span className="text-[11px] text-slate-600 dark:text-zinc-400 block">Ex: <code>150,00</code> ou <code>150.00</code></span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 space-y-1">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 block">4. Categoria (Opcional)</span>
                    <span className="text-[11px] text-slate-600 dark:text-zinc-400 block">Se omitida, o app categoriza sozinho!</span>
                  </div>
                </div>
              </div>

              {/* Pré-visualização do Modelo */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-zinc-200">Exemplo de Conteúdo:</span>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopyTemplate}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-semibold flex items-center gap-1 text-[11px]"
                    >
                      {copiedTemplate ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      {copiedTemplate ? 'Copiado!' : 'Copiar Modelo'}
                    </button>
                    <button
                      onClick={handleDownloadTemplate}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-semibold flex items-center gap-1 text-[11px]"
                    >
                      <Download className="w-3 h-3" />
                      Baixar .CSV Pronto
                    </button>
                  </div>
                </div>
                <pre className="bg-slate-900 text-emerald-400 p-3 rounded-xl font-mono text-[11px] overflow-x-auto">
{getSampleCsvTemplate()}
                </pre>
              </div>
            </div>
          )}

          {/* TABELA DE PRÉ-VISUALIZAÇÃO */}
          {parsedRows.length > 0 && !importSuccess && (
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Pré-visualização dos Lançamentos</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                      {selectedIndices.size} de {parsedRows.length} selecionados
                    </span>
                  </h4>
                  <div className="flex gap-3 text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                    <span>Despesas: <strong className="text-rose-600 dark:text-rose-400">{formatBRL(totalSelectedExpense)}</strong></span>
                    {totalSelectedIncome > 0 && (
                      <span>Receitas: <strong className="text-emerald-600 dark:text-emerald-400">+{formatBRL(totalSelectedIncome)}</strong></span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
                >
                  {selectedIndices.size === parsedRows.filter(r => r.isValid).length ? 'Desmarcar todos' : 'Selecionar todos'}
                </button>
              </div>

              {/* Lista rolável de linhas detectadas */}
              <div className="border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-800/80">
                {parsedRows.map(row => {
                  const isChecked = selectedIndices.has(row.index);
                  const isIncome = row.type === 'income';

                  return (
                    <div
                      key={row.index}
                      onClick={() => row.isValid && toggleRow(row.index)}
                      className={`p-3 flex items-center justify-between gap-3 text-xs transition-colors cursor-pointer ${
                        !row.isValid 
                          ? 'bg-rose-50/50 dark:bg-rose-950/20 opacity-60 cursor-not-allowed'
                          : isChecked 
                          ? 'bg-slate-50/80 dark:bg-zinc-900/60' 
                          : 'hover:bg-slate-50 dark:hover:bg-zinc-900/30'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          disabled={!row.isValid}
                          checked={isChecked}
                          onChange={() => row.isValid && toggleRow(row.index)}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="font-semibold text-slate-900 dark:text-white truncate block">
                            {row.merchant}
                          </span>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                            <span>{row.formattedDate}</span>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-zinc-300">
                              <CategoryIcon name={row.category} className="w-3 h-3 text-emerald-500" />
                              {row.category}
                            </span>
                          </div>
                          {row.error && (
                            <span className="text-[10px] text-rose-500 font-semibold block mt-0.5">
                              ⚠️ {row.error}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`font-bold block ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                          {isIncome ? '+ ' : '- '}{formatBRL(row.amount)}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                          {isIncome ? 'Receita' : 'Despesa'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Opção de aceitar duplicatas */}
              <div className="pt-1 flex items-center justify-between text-xs text-slate-600 dark:text-zinc-400">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={allowDuplicates}
                    onChange={e => setAllowDuplicates(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Permitir importar duplicatas se houver mesmo valor e data</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé fixo */}
        <div className="p-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-semibold text-xs hover:bg-slate-300 dark:hover:bg-zinc-700 transition-colors"
          >
            Cancelar
          </button>

          {parsedRows.length > 0 && !importSuccess && (
            <button
              type="button"
              disabled={importing || selectedIndices.size === 0}
              onClick={handleImport}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/20 active:scale-95"
            >
              {importing ? (
                <span>Importando...</span>
              ) : (
                <>
                  <span>Importar {selectedIndices.size} Lançamentos</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

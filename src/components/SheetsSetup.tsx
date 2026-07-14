/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Table, Search, Download, FileSpreadsheet, CheckCircle, Save, Loader2, RefreshCw, Layers } from 'lucide-react';
import { Product, SheetsConfig } from '../types';

interface SheetsSetupProps {
  token: string;
}

export default function SheetsSetup({ token }: SheetsSetupProps) {
  const [config, setConfig] = useState<SheetsConfig | null>(null);
  const [planilhaNome, setPlanilhaNome] = useState('');
  const [abaNome, setAbaNome] = useState('');
  const [planilhaId, setPlanilhaId] = useState('1C-w7eEjn0w2Zp24yLr-tB-u-uBTYbnSk6zOfbUtoJ8Y');
  const [clientEmail, setClientEmail] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [webAppUrl, setWebAppUrl] = useState('');
  const [tipoConexao, setTipoConexao] = useState<'local' | 'script' | 'service_account'>('script');
  const [modoLocal, setModoLocal] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const itemsPerPage = 12;

  useEffect(() => {
    fetchConfigAndProducts();
  }, []);

  const fetchConfigAndProducts = async () => {
    setIsLoading(true);
    try {
      // Fetch Sheets configuration
      const configRes = await fetch('/api/config/sheets', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (configRes.ok) {
        const configData = await configRes.json();
        setConfig(configData);
        setPlanilhaNome(configData.planilhaNome || '');
        setAbaNome(configData.abaNome || '');
        setPlanilhaId(configData.planilhaId || '1C-w7eEjn0w2Zp24yLr-tB-u-uBTYbnSk6zOfbUtoJ8Y');
        setClientEmail(configData.clientEmail || '');
        setPrivateKey(configData.privateKey || '');
        setWebAppUrl(configData.webAppUrl || '');
        setTipoConexao(configData.tipoConexao || (configData.modoLocal ? 'local' : 'script'));
        setModoLocal(configData.modoLocal !== undefined ? configData.modoLocal : false);
      }

      // Fetch products list
      const productsRes = await fetch('/api/products', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setProducts(productsData);
      }
    } catch (err) {
      console.error('Erro ao buscar dados da planilha:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/config/sheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          planilhaNome,
          abaNome,
          planilhaId,
          clientEmail,
          privateKey,
          webAppUrl,
          tipoConexao,
          modoLocal: tipoConexao === 'local'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Falha ao salvar configuração.');
      }

      setConfig(data);
      setMessage({ type: 'success', text: 'Configurações da planilha atualizadas com sucesso!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erro ao salvar configurações.' });
    } finally {
      setIsSaving(false);
    }
  };

  // Export to CSV helper
  const handleExportCSV = () => {
    if (products.length === 0) return;

    const headers = [
      'ID', 'Código', 'SKU', 'Nome', 'Descrição', 'Categoria', 'Marca', 'Unidade',
      'Situação', 'Preço', 'Preço Promocional', 'Estoque Atual', 'Estoque Mínimo',
      'NCM', 'GTIN/EAN', 'Peso Líquido', 'Peso Bruto', 'Altura', 'Largura', 'Comprimento',
      'Data de Cadastro', 'Última Atualização'
    ];

    const csvRows = [headers.join(';')];

    for (const p of products) {
      const row = [
        p.id,
        p.codigo,
        p.sku,
        `"${p.nome.replace(/"/g, '""')}"`,
        `"${p.descricao.replace(/"/g, '""')}"`,
        p.categoria,
        p.marca,
        p.unidade,
        p.situacao,
        p.preco.toFixed(2),
        p.precoPromocional.toFixed(2),
        p.estoqueAtual,
        p.estoqueMinimo,
        p.ncm,
        p.gtinEan,
        p.pesoLiquido.toFixed(3),
        p.pesoBruto.toFixed(3),
        p.altura.toFixed(1),
        p.largura.toFixed(1),
        p.comprimento.toFixed(1),
        p.dataCadastro,
        p.ultimaAtualizacao
      ];
      csvRows.push(row.join(';'));
    }

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csvRows.join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `${config?.planilhaNome.replace(/\s+/g, '_') || 'Produtos_Bling'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredProducts = products.filter(p => {
    const q = search.toLowerCase();
    return (
      p.nome.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.codigo.toLowerCase().includes(q) ||
      p.categoria.toLowerCase().includes(q) ||
      p.marca.toLowerCase().includes(q)
    );
  });

  // Pagination calculation
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6" id="sheets-setup-panel">
      {/* Sheets Integration Header */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 font-display">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              Painel de Sincronização de Planilhas
            </h2>
            <p className="text-xs text-slate-400">
              Gerencie a planilha de destino e visualize os dados sincronizados em tempo real.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {tipoConexao === 'local' ? (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-display">
                <CheckCircle className="w-4 h-4" />
                Planilha Virtual Ativa
              </span>
            ) : tipoConexao === 'script' ? (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-display">
                <CheckCircle className="w-4 h-4" />
                Apps Script Conectado
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase bg-amber-500/10 border border-amber-500/20 text-amber-400 font-display">
                <CheckCircle className="w-4 h-4" />
                Conta de Serviço Ativa
              </span>
            )}
          </div>
        </div>
        
        {/* User request notice */}
        {tipoConexao === 'script' && (
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-5 mt-4 text-xs leading-relaxed font-sans">
            <h4 className="font-bold text-indigo-200 text-sm mb-2 flex items-center gap-1.5 font-display">
              🛠️ Como Configurar o Google Apps Script (Recomendado):
            </h4>
            <ol className="list-decimal list-inside space-y-1.5 text-indigo-300">
              <li>Na sua planilha do Google Sheets, clique no menu superior em <b>Extensões &gt; Apps Script</b>.</li>
              <li>Apague todo o código existente e cole o script abaixo.</li>
              <li>Clique no ícone de <b>Salvar</b> 💾 e depois no botão azul <b>Implantar &gt; Nova implantação</b>.</li>
              <li>Em "Selecione o tipo", escolha <b>Aplicativo da Web</b> (ícone de engrenagem).</li>
              <li>Configure <b>Executar como:</b> "Eu" e <b>Quem tem acesso:</b> "Qualquer pessoa" (fundamental para o servidor poder enviar os dados).</li>
              <li>Clique em <b>Implantar</b>, autorize o acesso com sua conta Google se solicitado, copie o <b>URL do URL do aplicativo da Web</b> gerado e cole no campo "URL de Execução" ao lado.</li>
            </ol>

            <div className="mt-4">
              <span className="font-bold text-indigo-200 block mb-1">Copie este código para colar no Apps Script:</span>
              <textarea
                readOnly
                value={`function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var products = payload.products || [];
    var structures = payload.structures || [];
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // 1. Atualiza aba de Produtos
    updateSheet(ss, "Produtos", getProductHeaders(), getProductRows(products), 0);
    
    // 2. Atualiza aba de Estrutura
    updateSheet(ss, "Estrutura", getStructureHeaders(), getStructureRows(structures), [0, 3]);
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success", count: products.length }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function updateSheet(ss, sheetName, headers, newRows, keyIndex) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  
  var existingData = [];
  var lastRow = sheet.getLastRow();
  if (lastRow > 0) {
    existingData = sheet.getRange(1, 1, lastRow, sheet.getLastColumn()).getValues();
  }
  
  var mergedRows = [];
  var rowMap = {};
  
  if (existingData.length > 0) {
    mergedRows.push(existingData[0]); // Cabeçalho
    for (var i = 1; i < existingData.length; i++) {
      var row = existingData[i];
      var key = getRowKey(row, keyIndex);
      if (key) {
        rowMap[key] = mergedRows.length;
      }
      mergedRows.push(row);
    }
  } else {
    mergedRows.push(headers);
  }
  
  for (var j = 0; j < newRows.length; j++) {
    var newRow = newRows[j];
    var newKey = getRowKey(newRow, keyIndex);
    if (newKey && rowMap[newKey] !== undefined) {
      mergedRows[rowMap[newKey]] = newRow;
    } else {
      if (newKey) {
        rowMap[newKey] = mergedRows.length;
      }
      mergedRows.push(newRow);
    }
  }
  
  sheet.clear();
  sheet.getRange(1, 1, mergedRows.length, headers.length).setValues(mergedRows);
}

function getRowKey(row, keyIndex) {
  if (Array.isArray(keyIndex)) {
    return keyIndex.map(function(idx) { return String(row[idx] || '').trim(); }).join('-');
  }
  return String(row[keyIndex] || '').trim();
}

function getProductHeaders() {
  return [
    'ID', 'Código', 'Descrição', 'Unidade', 'NCM', 'Origem', 'Preço', 'Valor IPI fixo', 
    'Observações', 'Situação', 'Estoque', 'Preço de custo', 'Cód. no fornecedor', 
    'Fornecedor', 'Localização', 'Estoque máximo', 'Estoque mínimo', 'Peso líquido (Kg)', 
    'Peso bruto (Kg)', 'GTIN/EAN', 'GTIN/EAN da Embalagem', 'Largura do produto', 
    'Altura do Produto', 'Profundidade do produto', 'Data Validade', 
    'Descrição do Produto no Fornecedor', 'Descrição Complementar', 'Itens p/ caixa', 
    'Produto Variação', 'Tipo Produção', 'Classe de enquadramento do IPI', 
    'Código na Lista de Serviços', 'Tipo do item', 'Grupo de Tags/Tags', 'Tributos', 
    'Código Pai', 'Código Integração', 'Grupo de produtos', 'Marca', 'CEST', 'Volumes', 
    'Descrição Curta', 'Cross-Docking', 'URL Imagens Externas', 'Link Externo', 
    'Meses Garantia no Fornecedor', 'Clonar dados do pai', 'Condição do Produto', 
    'Frete Grátis', 'Número FCI', 'Vídeo', 'Departamento', 'Unidade de Medida', 
    'Preço de Compra', 'Valor base ICMS ST para retenção', 'Valor ICMS ST para retenção', 
    'Valor ICMS próprio do substituto', 'Categoria do produto', 'Informações Adicionais',
    'Última Sincronização'
  ];
}

function getProductRows(products) {
  var headers = getProductHeaders();
  var syncTime = new Date().toLocaleString('pt-BR');
  return products.map(function(p) {
    var row = new Array(headers.length).fill('');
    row[0] = p.id;
    row[1] = p.codigo;
    row[2] = p.nome;
    row[3] = p.unidade;
    row[4] = p.ncm;
    row[6] = p.preco;
    row[9] = p.situacao;
    row[10] = p.estoqueAtual;
    row[16] = p.estoqueMinimo;
    row[17] = p.pesoLiquido;
    row[18] = p.pesoBruto;
    row[19] = p.gtinEan;
    row[21] = p.largura;
    row[22] = p.altura;
    row[23] = p.comprimento;
    row[38] = p.marca;
    row[57] = p.categoria;
    row[headers.length - 1] = syncTime;
    return row;
  });
}

function getStructureHeaders() {
  return [
    'ID da composição', 'Descrição da composição', 'Código da composição', 
    'ID do componente', 'Descrição do componente', 'Código do componente', 
    'Quantidade do Componente', 'Custo unitário', 'Operação', 'Última Sincronização'
  ];
}

function getStructureRows(structures) {
  var syncTime = new Date().toLocaleString('pt-BR');
  return structures.map(function(s) {
    return [
      s.idComposicao,
      s.descricaoComposicao,
      s.codigoComposicao,
      s.idComponente,
      s.descricaoComponente,
      s.codigoComponente,
      s.quantidadeComponente,
      s.custoUnitario,
      s.operacao || 'A',
      syncTime
    ];
  });
}`}
                onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                className="w-full bg-[#0c0e12] border border-white/10 rounded-xl p-3 text-[10px] font-mono text-slate-300 h-28 focus:outline-none resize-none cursor-pointer"
                title="Clique para selecionar tudo e copiar"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">💡 Dica: Clique na caixa de texto acima para selecionar todo o código e copiar de uma vez.</span>
            </div>
          </div>
        )}

        {tipoConexao === 'service_account' && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-5 mt-4 text-xs leading-relaxed font-sans">
            <h4 className="font-bold text-amber-200 text-sm mb-2 flex items-center gap-1.5 font-display">
              🔑 Conexão via IAM / Conta de Serviço (Google Cloud):
            </h4>
            <p className="text-amber-300">
              Esta conexão utiliza as credenciais de API oficiais do Google Cloud. Lembre-se de que é necessário criar uma conta de desenvolvedor no Google Cloud Console, gerar uma chave em formato JSON para a Conta de Serviço, e compartilhar sua Planilha do Google com o e-mail da Conta de Serviço como <b>Editor</b>.
            </p>
          </div>
        )}

        {tipoConexao === 'local' && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-5 mt-4 text-xs leading-relaxed font-sans">
            <h4 className="font-bold text-emerald-200 text-sm mb-2 flex items-center gap-1.5 font-display">
              🟢 Modo Local / Sincronizador Virtual:
            </h4>
            <p className="text-emerald-300">
              No Modo Local, os dados consultados no Bling ficam salvos de forma temporária apenas dentro da base de dados do próprio integrador (Visualização Virtual). Você poderá ver e filtrar os produtos abaixo, e também exportá-los em formato CSV para carregar no Excel.
            </p>
          </div>
        )}
      </div>

      {message && (
        <div className={`p-4 rounded-xl border text-xs leading-relaxed ${
          message.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      {/* Grid of config and preview */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-1">
          <form onSubmit={handleSaveConfig} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 space-y-4 sticky top-4 shadow-xl max-h-[85vh] overflow-y-auto">
            <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5 pb-2.5 border-b border-white/10 font-display">
              <Layers className="w-4.5 h-4.5 text-indigo-400" />
              Configurações do Sheets
            </h3>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-300 font-medium">Modo de Operação</label>
              <div className="flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => { setTipoConexao('local'); setModoLocal(true); }}
                  className={`w-full py-2 px-2.5 rounded-xl text-[10px] font-bold border transition text-left cursor-pointer ${
                    tipoConexao === 'local'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  🟢 Local (Virtual/Simulado)
                </button>
                <button
                  type="button"
                  onClick={() => { setTipoConexao('script'); setModoLocal(false); }}
                  className={`w-full py-2 px-2.5 rounded-xl text-[10px] font-bold border transition text-left cursor-pointer ${
                    tipoConexao === 'script'
                      ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  ⚡ Apps Script (Recomendado)
                </button>
                <button
                  type="button"
                  onClick={() => { setTipoConexao('service_account'); setModoLocal(false); }}
                  className={`w-full py-2 px-2.5 rounded-xl text-[10px] font-bold border transition text-left cursor-pointer ${
                    tipoConexao === 'service_account'
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  🔑 Conta de Serviço Google Cloud
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="sheet-name" className="text-xs text-slate-300 font-medium">Nome da Conexão</label>
              <input
                id="sheet-name"
                type="text"
                value={planilhaNome}
                onChange={(e) => setPlanilhaNome(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 focus:border-white/20 rounded-xl py-2 px-3 text-xs text-slate-100 placeholder-slate-600 outline-none transition"
                placeholder="Ex: Planilha de Produtos Bling"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="tab-name" className="text-xs text-slate-300 font-medium">Nome da Aba (Tab)</label>
              <input
                id="tab-name"
                type="text"
                value={abaNome}
                onChange={(e) => setAbaNome(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 focus:border-white/20 rounded-xl py-2 px-3 text-xs text-slate-100 placeholder-slate-600 outline-none transition"
                placeholder="Ex: Produtos"
              />
            </div>

            {tipoConexao === 'script' && (
              <div className="space-y-1.5 animate-fadeIn">
                <label htmlFor="web-app-url" className="text-xs text-slate-300 font-medium">URL de Execução do Apps Script</label>
                <input
                  id="web-app-url"
                  type="url"
                  value={webAppUrl}
                  onChange={(e) => setWebAppUrl(e.target.value)}
                  required={tipoConexao === 'script'}
                  className="w-full bg-white/5 border border-white/10 focus:border-white/20 rounded-xl py-2 px-3 text-xs text-slate-100 placeholder-slate-600 outline-none transition font-mono"
                  placeholder="https://script.google.com/macros/s/.../exec"
                />
              </div>
            )}

            {tipoConexao === 'service_account' && (
              <>
                <div className="space-y-1.5 animate-fadeIn">
                  <label htmlFor="planilha-id" className="text-xs text-slate-300 font-medium">ID da Planilha</label>
                  <input
                    id="planilha-id"
                    type="text"
                    value={planilhaId}
                    onChange={(e) => setPlanilhaId(e.target.value)}
                    required={tipoConexao === 'service_account'}
                    className="w-full bg-white/5 border border-white/10 focus:border-white/20 rounded-xl py-2 px-3 text-xs text-slate-100 placeholder-slate-600 outline-none transition"
                    placeholder="Cole o ID da planilha..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="client-email" className="text-xs text-slate-300 font-medium">E-mail da Conta de Serviço</label>
                  <input
                    id="client-email"
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    required={tipoConexao === 'service_account'}
                    className="w-full bg-white/5 border border-white/10 focus:border-white/20 rounded-xl py-2 px-3 text-xs text-slate-100 placeholder-slate-600 outline-none transition"
                    placeholder="servico@projeto.iam.gserviceaccount.com"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="private-key" className="text-xs text-slate-300 font-medium">Chave Privada (Private Key)</label>
                  <textarea
                    id="private-key"
                    value={privateKey}
                    onChange={(e) => setPrivateKey(e.target.value)}
                    required={tipoConexao === 'service_account'}
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 focus:border-white/20 rounded-xl py-2 px-3 text-xs text-slate-100 placeholder-slate-600 outline-none transition resize-none font-mono"
                    placeholder="-----BEGIN PRIVATE KEY-----\n..."
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold disabled:opacity-50 text-xs rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-500/10"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Salvar Configurações
            </button>
          </form>
        </div>

        {/* Spreadsheet Data Grid */}
        <div className="lg:col-span-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 space-y-4 flex flex-col shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5 font-display">
                <Table className="w-4.5 h-4.5 text-indigo-400" />
                Planilha Virtual: <span className="text-indigo-400 font-mono font-normal">"{config?.planilhaNome}" ({config?.abaNome})</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Visualização formatada idêntica à planilha eletrônica. Total: <b>{products.length}</b> produtos cadastrados.
              </p>
            </div>
            
            <div className="flex items-center gap-2 self-stretch sm:self-auto">
              <button
                onClick={fetchConfigAndProducts}
                className="p-2 hover:bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white transition cursor-pointer"
                title="Recarregar dados"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleExportCSV}
                disabled={products.length === 0}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/10 text-white disabled:opacity-40 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Exportar CSV
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Pesquisar produto por nome, SKU, código, categoria ou marca..."
              className="w-full bg-white/5 border border-white/10 focus:border-white/20 rounded-xl py-2.5 pl-9 pr-4 text-xs text-slate-100 outline-none transition placeholder-slate-500"
            />
          </div>

          {/* Grid View */}
          <div className="overflow-x-auto border border-white/10 rounded-xl bg-white/5">
            <table className="w-full text-left text-[11px] border-collapse font-sans">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="px-3 py-2.5 border-r border-white/10 whitespace-nowrap">CÓDIGO</th>
                  <th className="px-3 py-2.5 border-r border-white/10 whitespace-nowrap">SKU</th>
                  <th className="px-3 py-2.5 border-r border-white/10 whitespace-nowrap min-w-[200px]">NOME</th>
                  <th className="px-3 py-2.5 border-r border-white/10 whitespace-nowrap">CATEGORIA</th>
                  <th className="px-3 py-2.5 border-r border-white/10 whitespace-nowrap">MARCA</th>
                  <th className="px-3 py-2.5 border-r border-white/10 text-right whitespace-nowrap">PREÇO (R$)</th>
                  <th className="px-3 py-2.5 border-r border-white/10 text-right whitespace-nowrap">ESTOQUE</th>
                  <th className="px-3 py-2.5 border-r border-white/10 whitespace-nowrap">SITUAÇÃO</th>
                  <th className="px-3 py-2.5 whitespace-nowrap font-display">ÚLT. SINC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginatedProducts.length > 0 ? (
                  paginatedProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-white/5 text-slate-300 transition-colors">
                      <td className="px-3 py-2 border-r border-white/10 font-mono text-slate-400 whitespace-nowrap">{p.codigo}</td>
                      <td className="px-3 py-2 border-r border-white/10 font-mono text-slate-400 whitespace-nowrap">{p.sku}</td>
                      <td className="px-3 py-2 border-r border-white/10 font-semibold text-slate-200" title={p.nome}>{p.nome}</td>
                      <td className="px-3 py-2 border-r border-white/10 whitespace-nowrap">{p.categoria}</td>
                      <td className="px-3 py-2 border-r border-white/10 whitespace-nowrap">{p.marca}</td>
                      <td className="px-3 py-2 border-r border-white/10 text-right font-mono whitespace-nowrap text-indigo-400">
                        {p.precoPromocional > 0 ? (
                          <div className="flex flex-col items-end">
                            <span className="line-through text-slate-500 text-[10px]">R$ {p.preco.toFixed(2)}</span>
                            <span>R$ {p.precoPromocional.toFixed(2)}</span>
                          </div>
                        ) : (
                          <span>R$ {p.preco.toFixed(2)}</span>
                        )}
                      </td>
                      <td className={`px-3 py-2 border-r border-white/10 text-right font-mono whitespace-nowrap ${
                        p.estoqueAtual === 0 ? 'text-red-400 font-bold bg-red-500/5' : 
                        p.estoqueAtual <= p.estoqueMinimo ? 'text-amber-400 bg-amber-500/5' : 'text-slate-300'
                      }`}>
                        {p.estoqueAtual} <span className="text-[9px] text-slate-500">/ {p.estoqueMinimo}</span>
                      </td>
                      <td className="px-3 py-2 border-r border-white/10 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${
                          p.situacao === 'Ativo' 
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                            : 'bg-white/5 border-white/10 text-slate-400'
                        }`}>
                          {p.situacao}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-400 whitespace-nowrap font-mono">{p.ultimaAtualizacao}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-slate-500 text-xs">
                      {products.length === 0 
                        ? 'Nenhum produto sincronizado. Clique em "Atualizar Produtos" no painel principal.' 
                        : 'Nenhum produto corresponde aos critérios da busca.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination controls */}
          {totalItems > 0 && (
            <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-white/10">
              <span>
                Mostrando <b>{startIndex + 1}</b> a <b>{Math.min(startIndex + itemsPerPage, totalItems)}</b> de <b>{totalItems}</b> produtos
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 disabled:opacity-40 text-slate-300 hover:bg-white/10 transition cursor-pointer"
                >
                  Anterior
                </button>
                <span className="font-mono text-slate-300">Pág. {currentPage} / {totalPages}</span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 disabled:opacity-40 text-slate-300 hover:bg-white/10 transition cursor-pointer"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

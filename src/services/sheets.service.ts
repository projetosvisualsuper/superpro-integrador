/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { google } from 'googleapis';
import { Product } from '../types';

export class SheetsService {
  /**
   * Syncs products and structures to the target Google Sheet using an upsert logic.
   */
  static async syncToGoogleSheets(
    tipoConexao: 'local' | 'script' | 'service_account',
    planilhaId: string,
    clientEmail: string,
    privateKey: string,
    webAppUrl: string,
    products: Product[],
    structures: any[]
  ): Promise<void> {
    if (tipoConexao === 'script') {
      if (!webAppUrl || webAppUrl.trim() === '') {
        throw new Error('URL da API do Google Apps Script não configurada.');
      }
      
      const response = await fetch(webAppUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'sync',
          products,
          structures
        })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Falha ao se conectar com o Apps Script: ${response.status} - ${text}`);
      }
      return;
    }

    if (!planilhaId || !clientEmail || !privateKey) {
      throw new Error('Parâmetros do Google Sheets incompletos (ID da Planilha, Email de Serviço e Chave Privada são necessários).');
    }

    let formattedPrivateKey = privateKey.trim();
    if (formattedPrivateKey.startsWith('"') && formattedPrivateKey.endsWith('"')) {
      formattedPrivateKey = formattedPrivateKey.slice(1, -1);
    }
    formattedPrivateKey = formattedPrivateKey.replace(/\\n/g, '\n');
    const auth = new google.auth.JWT({
      email: clientEmail,
      key: formattedPrivateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // -------------------------------------------------------------
    // PART 1: UPSERT PRODUCTS (Tab: "Produtos")
    // -------------------------------------------------------------
    const prodTabName = 'Produtos';
    const prodHeaders = [
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

    let existingProdRows: any[][] = [];
    try {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: planilhaId,
        range: `${prodTabName}!A:BH`,
      });
      existingProdRows = res.data.values || [];
    } catch (err: any) {
      console.warn('Aba "Produtos" não encontrada ou erro de leitura. Criando aba...', err.message);
      await this.ensureTabExists(sheets, planilhaId, prodTabName);
    }

    // Index existing products by ID (Column 0)
    const prodMap = new Map<string, number>(); // ID -> rowIndex in merged list
    const mergedProducts: any[][] = [];
    
    if (existingProdRows.length > 0) {
      // Keep headers from sheet
      mergedProducts.push(existingProdRows[0]);
      for (let i = 1; i < existingProdRows.length; i++) {
        const row = existingProdRows[i];
        const id = String(row[0] || '').trim();
        if (id) {
          prodMap.set(id, mergedProducts.length);
        }
        mergedProducts.push(row);
      }
    } else {
      mergedProducts.push(prodHeaders);
    }

    // Upsert products from Bling
    for (const p of products) {
      const pRow = new Array(prodHeaders.length).fill('');
      pRow[0] = p.id;
      pRow[1] = p.codigo;
      pRow[2] = p.nome;
      pRow[3] = p.unidade;
      pRow[4] = p.ncm;
      pRow[6] = String(p.preco);
      pRow[9] = p.situacao;
      pRow[10] = String(p.estoqueAtual);
      pRow[16] = String(p.estoqueMinimo);
      pRow[17] = String(p.pesoLiquido);
      pRow[18] = String(p.pesoBruto);
      pRow[19] = p.gtinEan;
      pRow[21] = String(p.largura);
      pRow[22] = String(p.altura);
      pRow[23] = String(p.comprimento);
      pRow[38] = p.marca;
      pRow[57] = p.categoria;
      pRow[59] = new Date().toLocaleString('pt-BR');

      const existingIndex = prodMap.get(String(p.id).trim());
      if (existingIndex !== undefined) {
        // Update existing row
        mergedProducts[existingIndex] = pRow;
      } else {
        // Add new row
        prodMap.set(String(p.id).trim(), mergedProducts.length);
        mergedProducts.push(pRow);
      }
    }

    // Write Products back
    await sheets.spreadsheets.values.update({
      spreadsheetId: planilhaId,
      range: `${prodTabName}!A1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: mergedProducts,
      },
    });

    // -------------------------------------------------------------
    // PART 2: UPSERT STRUCTURES (Tab: "Estrutura")
    // -------------------------------------------------------------
    const structTabName = 'Estrutura';
    const structHeaders = [
      'ID da composição', 'Descrição da composição', 'Código da composição', 
      'ID do componente', 'Descrição do componente', 'Código do componente', 
      'Quantidade do Componente', 'Custo unitário', 'Operação', 'Última Sincronização'
    ];

    let existingStructRows: any[][] = [];
    try {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: planilhaId,
        range: `${structTabName}!A:J`,
      });
      existingStructRows = res.data.values || [];
    } catch (err: any) {
      console.warn('Aba "Estrutura" não encontrada or erro de leitura. Criando aba...', err.message);
      await this.ensureTabExists(sheets, planilhaId, structTabName);
    }

    const structMap = new Map<string, number>(); // "parentId-childId" -> rowIndex
    const mergedStructures: any[][] = [];

    if (existingStructRows.length > 0) {
      mergedStructures.push(existingStructRows[0]);
      for (let i = 1; i < existingStructRows.length; i++) {
        const row = existingStructRows[i];
        const parentId = String(row[0] || '').trim();
        const childId = String(row[3] || '').trim();
        if (parentId && childId) {
          structMap.set(`${parentId}-${childId}`, mergedStructures.length);
        }
        mergedStructures.push(row);
      }
    } else {
      mergedStructures.push(structHeaders);
    }

    // Upsert structures from Bling
    for (const s of structures) {
      const sRow = [
        s.idComposicao,
        s.descricaoComposicao,
        s.codigoComposicao,
        s.idComponente,
        s.descricaoComponente,
        s.codigoComponente,
        String(s.quantidadeComponente),
        String(s.custoUnitario),
        s.operacao || 'A',
        new Date().toLocaleString('pt-BR')
      ];

      const key = `${String(s.idComposicao).trim()}-${String(s.idComponente).trim()}`;
      const existingIndex = structMap.get(key);
      if (existingIndex !== undefined) {
        mergedStructures[existingIndex] = sRow;
      } else {
        structMap.set(key, mergedStructures.length);
        mergedStructures.push(sRow);
      }
    }

    // Write Structures back
    await sheets.spreadsheets.values.update({
      spreadsheetId: planilhaId,
      range: `${structTabName}!A1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: mergedStructures,
      },
    });
  }

  private static async ensureTabExists(sheets: any, spreadsheetId: string, title: string): Promise<void> {
    try {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: { title },
              },
            },
          ],
        },
      });
    } catch (err: any) {
      if (!err.message.includes('already exists')) {
        throw err;
      }
    }
  }
}

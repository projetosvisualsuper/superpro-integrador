/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product } from '../types';

// Let's create a robust collection of sample products for the simulation.
const CATEGORIES = [
  'Celulares e Smartphones',
  'Informática e Notebooks',
  'Áudio e Fones',
  'Eletrodomésticos',
  'Móveis e Decoração',
  'Ferramentas',
  'Beleza e Cuidado Pessoal',
  'Esporte e Lazer',
  'Games e Consoles'
];

const BRANDS: Record<string, string[]> = {
  'Celulares e Smartphones': ['Apple', 'Samsung', 'Motorola', 'Xiaomi'],
  'Informática e Notebooks': ['Dell', 'Lenovo', 'HP', 'Asus', 'Acer'],
  'Áudio e Fones': ['JBL', 'Sony', 'Bose', 'Philips', 'Sennheiser'],
  'Eletrodomésticos': ['Brastemp', 'Electrolux', 'Consul', 'Arno', 'Mondial'],
  'Móveis e Decoração': ['Tok&Stok', 'Mobly', 'Kappesberg', 'Madesa'],
  'Ferramentas': ['Bosch', 'Makita', 'DeWalt', 'Black+Decker', 'Vonder'],
  'Beleza e Cuidado Pessoal': ['L\'Oréal', 'Nivea', 'O Boticário', 'Natura', 'Gillette'],
  'Esporte e Lazer': ['Nike', 'Adidas', 'Puma', 'Under Armour', 'Decathlon'],
  'Games e Consoles': ['Sony PlayStation', 'Microsoft Xbox', 'Nintendo', 'Logitech']
};

const PRODUCT_NAMES: Record<string, string[]> = {
  'Celulares e Smartphones': [
    'iPhone 15 Pro Max 256GB',
    'Galaxy S24 Ultra 512GB',
    'Moto G84 5G 256GB',
    'Redmi Note 13 Pro 5G',
    'iPhone 13 128GB Estelar',
    'Galaxy A55 5G 128GB'
  ],
  'Informática e Notebooks': [
    'Notebook Dell Inspiron Intel Core i7',
    'MacBook Air M2 8GB 256GB',
    'Notebook Lenovo IdeaPad Ryzen 5',
    'Monitor Gamer LG UltraWide 29"',
    'Teclado Mecânico HyperX Alloy',
    'SSD Kingston NV2 1TB NVMe M.2'
  ],
  'Áudio e Fones': [
    'Fone de Ouvido Noise Cancelling Sony WH-1000XM5',
    'Caixa de Som Bluetooth JBL Charge 5',
    'Fone de Ouvido Apple AirPods Pro 2',
    'Soundbar Samsung 2.1 Canais',
    'Microfone Condensador HyperX QuadCast',
    'Fone de Ouvido Bluetooth QCY T13'
  ],
  'Eletrodomésticos': [
    'Fritadeira Elétrica Airfryer Mondial',
    'Liquidificador Arno PowerMax 1400W',
    'Cafeteira Nespresso Essenza Mini',
    'Micro-ondas Electrolux 20L',
    'Aspirador de Pó Vertical Philco',
    'Batedeira Planetária Oster'
  ],
  'Móveis e Decoração': [
    'Cadeira de Escritório Ergonômica Presidente',
    'Escrivaninha para Computador em L',
    'Luminária de Mesa Articulada Pixe',
    'Prateleira Suspensa de Madeira Maciça',
    'Espelho Adnet Redondo com Alça',
    'Mesa de Cabeceira Industrial'
  ],
  'Ferramentas': [
    'Furadeira e Parafusadeira de Impacto Bosch',
    'Jogo de Chaves de Fenda Tramontina',
    'Serra Circular Manual Makita',
    'Esmerilhadeira Angular DeWalt',
    'Nível a Laser de Linhas Cruzadas',
    'Maleta de Ferramentas Completa 110 Peças'
  ],
  'Beleza e Cuidado Pessoal': [
    'Secador de Cabelo Taiff Easy',
    'Barbeador Elétrico Philips AquaTouch',
    'Escova Rotativa Modeladora Conair',
    'Prancha Alisadora Arno',
    'Aparador de Pelos Mondial Super Trim',
    'Irrigador Oral Waterpik'
  ],
  'Esporte e Lazer': [
    'Tênis de Corrida Nike Air Zoom',
    'Bicicleta Aro 29 Groove',
    'Mochila Cargueira Deuter 45L',
    'Garrafa Térmica Stanley 1.2L',
    'Tapete de Yoga em EVA 10mm',
    'Par de Halteres Emborrachados 5kg'
  ],
  'Games e Consoles': [
    'Console PlayStation 5 Slim 1TB',
    'Console Nintendo Switch OLED 64GB',
    'Controle Sem Fio Xbox Velvet',
    'Headset Gamer Razer Kraken V3',
    'Volante Logitech G29 Force Feedback',
    'Jogo EA Sports FC 24 PS5'
  ]
};

// Generates simulated e-commerce products
export function generateSimulatedProducts(count: number = 840): Product[] {
  const list: Product[] = [];
  
  for (let i = 1; i <= count; i++) {
    const category = CATEGORIES[i % CATEGORIES.length];
    const brands = BRANDS[category];
    const brand = brands[i % brands.length];
    const names = PRODUCT_NAMES[category];
    const baseName = names[i % names.length];
    
    // Add variations so names look diverse
    const variations = ['', 'Premium', 'Pro', 'V2', 'Edition', 'Eco', 'Max'];
    const variation = variations[i % variations.length];
    const name = variation ? `${baseName} ${variation}` : baseName;
    
    const skuSuffix = (1000 + i).toString();
    const sku = `${brand.toUpperCase().replace(/\s+/g, '-')}-${skuSuffix}`;
    const price = Math.round((50 + (i * 7.5) % 3500) * 100) / 100;
    const promoRandom = (i % 3 === 0) ? Math.round((price * 0.9) * 100) / 100 : 0;
    
    const stockCurrent = (i % 12 === 0) ? 0 : (i % 8) * 12 + 3;
    const stockMin = (i % 5) * 2 + 1;
    
    // Calculate simulated date
    const dateObj = new Date();
    dateObj.setDate(dateObj.getDate() - (i % 180));
    const dataCadastro = dateObj.toISOString().split('T')[0];
    
    const updateObj = new Date();
    updateObj.setDate(updateObj.getDate() - (i % 5));
    const ultimaAtualizacao = updateObj.toISOString().split('T')[0];

    list.push({
      id: `bling-${10000 + i}`,
      codigo: `BL-${100 + i}`,
      sku,
      nome: name,
      descricao: `Descrição detalhada do produto ${name}. Ideal para uso diário, oferecendo altíssimo desempenho e durabilidade sob as diretrizes da marca ${brand}.`,
      categoria: category,
      marca: brand,
      unidade: 'UN',
      situacao: stockCurrent > 0 ? 'Ativo' : (i % 10 === 0 ? 'Inativo' : 'Ativo'),
      preco: price,
      precoPromocional: promoRandom,
      estoqueAtual: stockCurrent,
      estoqueMinimo: stockMin,
      ncm: `${7318 + (i % 200)}.${(i % 10).toString().padStart(2, '0')}.00`,
      gtinEan: `789${(1000000000 + i * 17).toString().substring(0, 10)}`,
      pesoLiquido: Math.round(((0.1 + (i % 5) * 0.4) * 100)) / 100,
      pesoBruto: Math.round(((0.15 + (i % 5) * 0.42) * 100)) / 100,
      altura: Math.round((5 + (i % 10) * 3) * 10) / 10,
      largura: Math.round((10 + (i % 10) * 4) * 10) / 10,
      comprimento: Math.round((15 + (i % 10) * 5) * 10) / 10,
      dataCadastro,
      ultimaAtualizacao
    });
  }
  
  return list;
}

export interface SyncProgressCallback {
  (current: number, total: number, percentage: number, message: string): void;
}

/**
 * Service to emulate Bling API endpoints or make actual requests
 */
export class BlingService {
  /**
   * Refreshes Bling Access Token using refresh token
   */
  static async refreshBlingToken(
    clientId: string,
    clientSecret: string,
    refreshToken: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    
    const response = await fetch('https://www.bling.com.br/Api/v3/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`
      },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Falha ao renovar token do Bling: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken
    };
  }

  /**
   * Fetches products and structures in a paginated way, providing a progress callback
   */
  static async fetchAllProducts(
    clientId: string,
    clientSecret: string,
    accessToken: string,
    refreshToken: string,
    onTokenRefreshed: (tokens: { accessToken: string; refreshToken: string }) => void,
    onProgress: SyncProgressCallback
  ): Promise<{ products: Product[]; structures: any[] }> {
    const isRealBling = clientId && clientId.trim() !== '' && !clientId.includes('exemplo') && accessToken && accessToken.trim() !== '';
    
    if (!isRealBling) {
      // Return simulation data
      const TOTAL_PRODUCTS = 300;
      const PAGE_SIZE = 50;
      const TOTAL_PAGES = Math.ceil(TOTAL_PRODUCTS / PAGE_SIZE);
      const allProducts = generateSimulatedProducts(TOTAL_PRODUCTS);
      const retrievedProducts: Product[] = [];
      const simulatedStructures: any[] = [];
      
      for (let page = 1; page <= TOTAL_PAGES; page++) {
        await new Promise(resolve => setTimeout(resolve, 150));
        
        const startIdx = (page - 1) * PAGE_SIZE;
        const endIdx = Math.min(startIdx + PAGE_SIZE, TOTAL_PRODUCTS);
        const pageProducts = allProducts.slice(startIdx, endIdx);
        
        retrievedProducts.push(...pageProducts);
        
        // Generate some compositions for simulated products
        pageProducts.forEach((p, idx) => {
          if (idx % 5 === 0) {
            simulatedStructures.push({
              idComposicao: p.id,
              descricaoComposicao: p.nome,
              codigoComposicao: p.codigo,
              idComponente: `comp-${p.id}-1`,
              descricaoComponente: 'Matéria Prima Componente A',
              codigoComponente: 'COMP-A',
              quantidadeComponente: 1.5,
              custoUnitario: 12.50,
              operacao: 'A'
            });
            simulatedStructures.push({
              idComposicao: p.id,
              descricaoComposicao: p.nome,
              codigoComposicao: p.codigo,
              idComponente: `comp-${p.id}-2`,
              descricaoComponente: 'Insumo de Embalagem B',
              codigoComponente: 'COMP-B',
              quantidadeComponente: 1.0,
              custoUnitario: 3.20,
              operacao: 'A'
            });
          }
        });

        const current = retrievedProducts.length;
        const percentage = Math.round((current / TOTAL_PRODUCTS) * 100);
        const message = `Lendo produtos simulados (Página ${page}/${TOTAL_PAGES})...`;
        
        onProgress(current, TOTAL_PRODUCTS, percentage, message);
      }
      
      return { products: retrievedProducts, structures: simulatedStructures };
    }

    // Real API integration
    let activeToken = accessToken;
    let productsList: Product[] = [];
    let structuresList: any[] = [];
    let page = 1;
    let totalItems = 0;
    
    const fetchPage = async (p: number, token: string): Promise<any> => {
      // Bling API v3 /produtos endpoint
      const res = await fetch(`https://api.bling.com.br/v3/produtos?pagina=${p}&limite=100`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (res.status === 401) {
        // Token expired, trigger refresh
        const newTokens = await BlingService.refreshBlingToken(clientId, clientSecret, refreshToken);
        activeToken = newTokens.accessToken;
        onTokenRefreshed(newTokens);
        // Retry
        return fetchPage(p, activeToken);
      }

      if (!res.ok) {
        throw new Error(`Erro na API do Bling: ${res.status} - ${await res.text()}`);
      }

      return res.json();
    };

    try {
      let hasMore = true;
      const itemsToFetchStructure: { id: string; nome: string; codigo: string }[] = [];
      let lastPageSize = 100;

      // Phase 1: Fetch all products
      while (hasMore) {
        const estTotal = lastPageSize === 100 ? (page * 100 + 100) : (productsList.length || 100);
        const currentProgress = productsList.length;
        const progressPercent = Math.min(Math.round((currentProgress / estTotal) * 100), 99);
        
        onProgress(
          currentProgress,
          estTotal,
          progressPercent,
          `Buscando lista de produtos do Bling (Página ${page})...`
        );
        
        const responseData = await fetchPage(page, activeToken);
        const pageDataTemp = responseData.data || [];
        lastPageSize = pageDataTemp.length;
        
        if (pageDataTemp.length === 0) {
          hasMore = false;
          break;
        }

        for (const item of pageDataTemp) {
          const mappedProduct: Product = {
            id: String(item.id),
            codigo: item.codigo || '',
            sku: item.codigo || '',
            nome: item.nome || '',
            descricao: item.descricaoCurta || item.nome || '',
            categoria: item.categoria?.descricao || 'Sem Categoria',
            marca: item.marca || '',
            unidade: item.unidade || 'UN',
            situacao: item.situacao === 'A' ? 'Ativo' : 'Inativo',
            preco: Number(item.preco) || 0,
            precoPromocional: 0,
            estoqueAtual: Number(item.estoque?.saldo) || 0,
            estoqueMinimo: Number(item.estoque?.minimo) || 0,
            ncm: item.tributacao?.ncm || '',
            gtinEan: item.gtin || '',
            pesoLiquido: Number(item.pesoLiquido) || 0,
            pesoBruto: Number(item.pesoBruto) || 0,
            altura: Number(item.dimensoes?.altura) || 0,
            largura: Number(item.dimensoes?.largura) || 0,
            comprimento: Number(item.dimensoes?.profundidade) || 0,
            dataCadastro: new Date().toISOString().split('T')[0],
            ultimaAtualizacao: new Date().toISOString().split('T')[0]
          };

          productsList.push(mappedProduct);

          if (item.formato === 'E') {
            itemsToFetchStructure.push({
              id: String(item.id),
              nome: item.nome || '',
              codigo: item.codigo || ''
            });
          }
        }

        // Bling doesn't explicitly return total count sometimes, so page incrementally
        page++;
        if (pageDataTemp.length < 100) {
          hasMore = false;
        }
      }

      // Phase 2: Fetch composition structures in parallel batches
      const totalStructures = itemsToFetchStructure.length;
      if (totalStructures > 0) {
        const batchSize = 5;
        for (let i = 0; i < totalStructures; i += batchSize) {
          const batch = itemsToFetchStructure.slice(i, i + batchSize);
          
          const overallProgress = productsList.length + i;
          const overallTotal = productsList.length + totalStructures;
          const overallPercent = Math.round((overallProgress / overallTotal) * 100);
          
          onProgress(
            overallProgress,
            overallTotal,
            overallPercent,
            `Buscando composições: estrutura ${i + 1} de ${totalStructures}...`
          );
          
          await Promise.all(batch.map(async (item) => {
            try {
              const structRes = await fetch(`https://api.bling.com.br/v3/produtos/estruturas/${item.id}`, {
                headers: {
                  'Authorization': `Bearer ${activeToken}`
                }
              });

              if (structRes.ok) {
                const structData = await structRes.json();
                if (structData.data && structData.data.componentes) {
                  for (const comp of structData.data.componentes) {
                    structuresList.push({
                      idComposicao: item.id,
                      descricaoComposicao: item.nome,
                      codigoComposicao: item.codigo,
                      idComponente: String(comp.produto?.id || ''),
                      descricaoComponente: comp.produto?.nome || 'Componente',
                      codigoComponente: comp.produto?.codigo || '',
                      quantidadeComponente: Number(comp.quantidade) || 1,
                      custoUnitario: Number(comp.custo) || 0,
                      operacao: 'A'
                    });
                  }
                }
              } else {
                console.error(`Erro ao buscar estrutura do produto ${item.id}: ${structRes.status}`);
              }
            } catch (err) {
              console.error(`Erro ao processar estrutura do produto ${item.id}:`, err);
            }
          }));
          
          // Wait 250ms between batches to respect Bling API rate limits (10-20 requests/sec)
          await new Promise(resolve => setTimeout(resolve, 250));
        }
      }
      
      return { products: productsList, structures: structuresList };
    } catch (error) {
      console.error('Erro na sincronização Bling:', error);
      throw error;
    }
  }
}

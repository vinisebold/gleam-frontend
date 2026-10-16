import { ProdutoModel } from '@modules/inventario/models/produto.model';
import {
  RegistrarVendaRequest,
  StatusVenda,
  VendaResponse,
} from '@modules/inventario/models/venda.model';
import { RespostaPaginada } from '@shared/models/resposta-paginada';
import {
  DemoDados,
  VendaRegistro,
  arredondar,
  paraLocalDateTime,
} from './demo-seed';

export { gerarDadosIniciais } from './demo-seed';

export interface DemoRequisicao {
  metodo: string;
  /** Caminho relativo à apiUrl, ex.: '/clientes/3'. */
  caminho: string;
  params: Record<string, string | null>;
  corpo: unknown;
}

export interface DemoResposta {
  status: number;
  corpo: unknown;
}

/** Usuário fictício devolvido por /user/me no modo demonstração. */
export const USUARIO_DEMO = { name: 'Visitante', email: 'demo@gleam.app' };

/** Mesmo tamanho de página padrão do Spring Data quando o cliente não envia `size`. */
const TAMANHO_PAGINA_PADRAO = 20;

const PREFIXO_POR_CATEGORIA: Record<string, keyof DemoDados['fornecedores'][number]> = {
  anel: 'codigoAnel',
  bracelete: 'codigoBracelete',
  colar: 'codigoColar',
  brinco: 'codigoBrinco',
  pulseira: 'codigoPulseira',
  pingente: 'codigoPingente',
  conjunto: 'codigoConjunto',
  berloque: 'codigoBerloque',
  piercing: 'codigoPiercing',
};

class ErroDemo extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

const ok = (corpo: unknown, status = 200): DemoResposta => ({ status, corpo });

/**
 * Responde às rotas da API do Gleam usando o banco em memória.
 * Reproduz as regras de negócio do backend (VendaService, ProdutoService,
 * AnaliseService) para que a demonstração se comporte como o sistema real.
 *
 * `dados` é alterado no lugar; quem chama decide quando persistir.
 */
export function responderDemo(
  req: DemoRequisicao,
  dados: DemoDados,
  agora: Date = new Date()
): DemoResposta {
  try {
    return rotear(req, dados, agora);
  } catch (e) {
    if (e instanceof ErroDemo) {
      return {
        status: e.status,
        corpo: {
          status: e.status,
          error: e.status === 404 ? 'Not Found' : 'Bad Request',
          message: e.message,
          path: `/api${req.caminho}`,
        },
      };
    }
    throw e;
  }
}

function rotear(req: DemoRequisicao, dados: DemoDados, agora: Date): DemoResposta {
  const { metodo } = req;
  const partes = req.caminho.split('?')[0].split('/').filter(Boolean);
  const [recurso, idTexto, acao] = partes;
  const id = idTexto !== undefined ? Number(idTexto) : undefined;

  if (req.caminho.endsWith('/logout')) return ok(null);
  if (recurso === 'user' && idTexto === 'me') return ok(USUARIO_DEMO);

  switch (recurso) {
    case 'clientes':
      return crud(req, dados, 'clientes', id, agora, (clienteId) => {
        if (dados.vendas.some((v) => v.clienteId === clienteId)) {
          throw new ErroDemo(400, 'Não é possível excluir um cliente com vendas registradas.');
        }
      });
    case 'fornecedores':
      return crud(req, dados, 'fornecedores', id, agora, (fornecedorId) => {
        if (dados.produtos.some((p) => p.idFornecedor === fornecedorId)) {
          throw new ErroDemo(400, 'Não é possível excluir um fornecedor com produtos cadastrados.');
        }
      });
    case 'produtos':
      return produtos(req, dados, id, agora);
    case 'vendas':
      return vendas(req, dados, id, acao, agora);
    case 'analises':
      if (metodo === 'GET' && idTexto === 'lucro-total') {
        return ok({ totalLucro: lucroTotal(dados, req.params['periodo'], agora) });
      }
      if (metodo === 'GET' && idTexto === 'lucro-grafico') {
        return ok(graficoLucro(dados, req.params['periodo'], agora));
      }
      break;
    case 'estoque':
      if (metodo === 'GET' && idTexto === 'resumo-por-categoria') {
        return ok(resumoPorCategoria(dados));
      }
      if (metodo === 'GET' && idTexto === 'resumo-global') {
        const emEstoque = dados.produtos.filter((p) => p.status === 'EM_ESTOQUE');
        return ok({
          quantidadeTotal: emEstoque.length,
          valorTotalCusto: arredondar(emEstoque.reduce((s, p) => s + p.precoCusto, 0)),
        });
      }
      break;
  }
  throw new ErroDemo(404, `Rota não disponível no modo demonstração: ${metodo} ${req.caminho}`);
}

// ---------------------------------------------------------------- CRUD simples

type Colecao = 'clientes' | 'fornecedores';

function crud(
  req: DemoRequisicao,
  dados: DemoDados,
  colecao: Colecao,
  id: number | undefined,
  agora: Date,
  validarExclusao: (id: number) => void
): DemoResposta {
  const lista = dados[colecao] as unknown as Array<{ id: number } & Record<string, unknown>>;
  const encontrar = () => {
    const item = lista.find((i) => i.id === id);
    if (!item) throw new ErroDemo(404, `Registro com ID ${id} não encontrado.`);
    return item;
  };

  if (req.metodo === 'GET' && id === undefined) return ok(paginar(lista, req.params));
  if (req.metodo === 'GET') return ok(encontrar());

  if (req.metodo === 'POST' && id === undefined) {
    const novo = {
      ...(req.corpo as object),
      id: dados.proximoId++,
      dataCriacao: paraLocalDateTime(agora),
      dataAtualizacao: null,
    };
    lista.push(novo);
    return ok(novo, 201);
  }

  if (req.metodo === 'PUT' && id !== undefined) {
    const atual = encontrar();
    Object.assign(atual, req.corpo as object, {
      id: atual.id,
      dataCriacao: atual['dataCriacao'],
      dataAtualizacao: paraLocalDateTime(agora),
    });
    return ok(atual);
  }

  if (req.metodo === 'DELETE' && id !== undefined) {
    encontrar();
    validarExclusao(id);
    lista.splice(lista.findIndex((i) => i.id === id), 1);
    return ok(null, 204);
  }

  throw new ErroDemo(404, `Rota não disponível no modo demonstração: ${req.metodo} ${req.caminho}`);
}

// ---------------------------------------------------------------- Produtos

function produtos(
  req: DemoRequisicao,
  dados: DemoDados,
  id: number | undefined,
  agora: Date
): DemoResposta {
  const encontrar = () => {
    const p = dados.produtos.find((x) => x.id === id);
    if (!p) throw new ErroDemo(404, `Produto não encontrado com o ID: ${id}`);
    return p;
  };

  if (req.metodo === 'GET' && id === undefined) {
    const fornecedorId = Number(req.params['fornecedorId'] ?? req.params['fornecedor']) || null;
    const status = req.params['status'];
    let lista = dados.produtos.filter(
      (p) => (!fornecedorId || p.idFornecedor === fornecedorId) && (!status || p.status === status)
    );
    const ordenacao = req.params['sort'];
    if (ordenacao) {
      const [campo, direcao] = ordenacao.split(',');
      if (campo.toLowerCase() === 'datacriacao') {
        const fator = direcao === 'desc' ? -1 : 1;
        lista = [...lista].sort(
          (a, b) => fator * String(a.dataCriacao).localeCompare(String(b.dataCriacao))
        );
      }
    }
    return ok(paginar(lista, req.params));
  }

  if (req.metodo === 'GET') return ok(encontrar());

  if (req.metodo === 'POST' && id === undefined) {
    const corpo = req.corpo as ProdutoModel;
    const criado = paraLocalDateTime(agora);
    const novo: ProdutoModel = {
      ...camposProduto(corpo, dados),
      id: dados.proximoId++,
      status: corpo.status ?? 'EM_ESTOQUE',
      dataCriacao: criado,
      dataAtualizacao: criado,
    };
    dados.produtos.push(novo);
    return ok(novo, 201);
  }

  if (req.metodo === 'PUT' && id !== undefined) {
    const atual = encontrar();
    if (atual.status === 'VENDIDO') {
      throw new ErroDemo(400, 'Não é possível alterar um produto que já foi vendido.');
    }
    const corpo = req.corpo as ProdutoModel;
    Object.assign(atual, camposProduto(corpo, dados), {
      status: corpo.status ?? atual.status,
      dataAtualizacao: paraLocalDateTime(agora),
    });
    return ok(atual);
  }

  if (req.metodo === 'DELETE' && id !== undefined) {
    encontrar();
    dados.produtos.splice(dados.produtos.findIndex((p) => p.id === id), 1);
    return ok(null, 204);
  }

  throw new ErroDemo(404, `Rota não disponível no modo demonstração: ${req.metodo} ${req.caminho}`);
}

/** Valida o fornecedor e gera o idReferencia com o prefixo da categoria, como o ProdutoService. */
function camposProduto(corpo: ProdutoModel, dados: DemoDados) {
  const fornecedor = dados.fornecedores.find((f) => f.id === Number(corpo.idFornecedor));
  if (!fornecedor) {
    throw new ErroDemo(404, `Fornecedor não encontrado com o ID: ${corpo.idFornecedor}`);
  }
  const chave = PREFIXO_POR_CATEGORIA[(corpo.categoria ?? '').toLowerCase()];
  const prefixo = chave ? (fornecedor[chave] as string | undefined) : undefined;
  if (!prefixo || !prefixo.trim()) {
    throw new ErroDemo(
      400,
      `O fornecedor '${fornecedor.nome}' não possui um prefixo de código definido para a categoria '${corpo.categoria}'.`
    );
  }
  return {
    nome: corpo.nome,
    precoVenda: corpo.precoVenda,
    precoCusto: Number(corpo.precoCusto),
    categoria: corpo.categoria,
    acabamento: corpo.acabamento,
    idFornecedor: fornecedor.id,
    idReferencia: `${prefixo}${corpo.idReferencia ?? ''}`,
  };
}

// ---------------------------------------------------------------- Vendas

function vendas(
  req: DemoRequisicao,
  dados: DemoDados,
  id: number | undefined,
  acao: string | undefined,
  agora: Date
): DemoResposta {
  const encontrar = () => {
    const v = dados.vendas.find((x) => x.id === id);
    if (!v) throw new ErroDemo(404, `Venda com ID ${id} não encontrada.`);
    return v;
  };

  if (req.metodo === 'GET' && id === undefined) {
    const status = req.params['status'] as StatusVenda | null;
    const lista = dados.vendas.filter((v) => !status || v.status === status);
    return ok(paginar(lista.map((v) => paraResposta(v, dados)), req.params));
  }

  if (req.metodo === 'POST' && id === undefined) {
    const corpo = req.corpo as RegistrarVendaRequest;
    const produto = dados.produtos.find((p) => p.id === Number(corpo.produtoId));
    if (!produto) throw new ErroDemo(404, `Produto com ID ${corpo.produtoId} não encontrado.`);
    const cliente = dados.clientes.find((c) => c.id === Number(corpo.clienteId));
    if (!cliente) throw new ErroDemo(404, `Cliente com ID ${corpo.clienteId} não encontrado.`);
    if (produto.status !== 'EM_ESTOQUE') {
      throw new ErroDemo(400, `O produto '${produto.nome}' não está disponível para venda.`);
    }

    produto.status = 'VENDIDO';
    const precoVenda = Number(corpo.precoVenda);
    const venda: VendaRegistro = {
      id: dados.proximoId++,
      produtoId: produto.id!,
      produtoSnapshot: { ...produto },
      clienteId: cliente.id,
      precoVenda,
      lucro: arredondar(precoVenda - produto.precoCusto),
      formaPagamento: corpo.formaPagamento,
      status: corpo.status,
      totalParcelas: corpo.totalParcelas,
      parcelasPagas: corpo.status === 'PAGO' ? corpo.totalParcelas : 0,
      dataVencimento: corpo.dataVencimento ?? null,
      dataCriacao: paraLocalDateTime(agora),
    };
    dados.vendas.push(venda);
    return ok(paraResposta(venda, dados), 201);
  }

  if (req.metodo === 'POST' && acao === 'pagar-parcela') {
    const venda = encontrar();
    if (venda.status === 'PAGO') throw new ErroDemo(400, 'Esta venda já está totalmente paga.');
    venda.parcelasPagas += 1;
    if (venda.parcelasPagas >= venda.totalParcelas) venda.status = 'PAGO';
    return ok(paraResposta(venda, dados));
  }

  if (req.metodo === 'POST' && acao === 'cancelar') {
    const venda = encontrar();
    if (venda.status === 'CANCELADO') throw new ErroDemo(400, 'Esta venda já está cancelada.');
    const produto = dados.produtos.find((p) => p.id === venda.produtoId);
    if (produto) produto.status = 'EM_ESTOQUE';
    venda.status = 'CANCELADO';
    return ok(paraResposta(venda, dados));
  }

  throw new ErroDemo(404, `Rota não disponível no modo demonstração: ${req.metodo} ${req.caminho}`);
}

/** Equivalente ao VendaResponseDto do backend. */
function paraResposta(venda: VendaRegistro, dados: DemoDados): VendaResponse {
  const produto = dados.produtos.find((p) => p.id === venda.produtoId) ?? venda.produtoSnapshot;
  const cliente = dados.clientes.find((c) => c.id === venda.clienteId);
  return {
    id: venda.id,
    produto: { ...produto },
    clienteId: venda.clienteId,
    nomeCliente: cliente?.nome ?? 'Cliente removido',
    precoVenda: venda.precoVenda,
    lucro: venda.lucro,
    formaPagamento: venda.formaPagamento,
    status: venda.status,
    totalParcelas: venda.totalParcelas,
    parcelasPagas: venda.parcelasPagas,
    valorTotalParcelasPagas: valorTotalPago(venda),
    dataVencimento: venda.dataVencimento,
    dataCriacao: venda.dataCriacao,
  };
}

function valorTotalPago(venda: VendaRegistro): number {
  if (venda.totalParcelas <= 0 || venda.parcelasPagas <= 0) return 0;
  if (venda.status === 'PAGO') return venda.precoVenda;
  const parcela = arredondar(venda.precoVenda / venda.totalParcelas);
  return arredondar(parcela * venda.parcelasPagas);
}

// ---------------------------------------------------------------- Análises

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];
const DIAS_SEMANA = [
  'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
  'Quinta-feira', 'Sexta-feira', 'Sábado',
];

const inicioDoDia = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const chaveDia = (d: Date) => paraLocalDateTime(d).slice(0, 10);

/** Vendas que contam como lucro: PAGO ou PENDENTE (igual ao VendaRepository). */
function vendasComLucro(dados: DemoDados) {
  return dados.vendas
    .filter((v) => v.status === 'PAGO' || v.status === 'PENDENTE')
    .map((v) => ({ data: new Date(v.dataCriacao), lucro: v.lucro }));
}

function lucroTotal(dados: DemoDados, periodo: string | null, agora: Date): number {
  const hoje = inicioDoDia(agora);
  let inicio: Date;
  switch (periodo) {
    case 'DIA':
      inicio = hoje;
      break;
    case 'SEMANA': {
      // Semana começa na segunda-feira, como TemporalAdjusters.previousOrSame(MONDAY).
      const desdeSegunda = (hoje.getDay() + 6) % 7;
      inicio = new Date(hoje);
      inicio.setDate(hoje.getDate() - desdeSegunda);
      break;
    }
    case 'MES':
      inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      break;
    default:
      throw new ErroDemo(400, `Período inválido para esta análise: ${periodo}`);
  }
  const fim = new Date(hoje);
  fim.setDate(fim.getDate() + 1);
  return arredondar(
    vendasComLucro(dados)
      .filter((v) => v.data >= inicio && v.data < fim)
      .reduce((s, v) => s + v.lucro, 0)
  );
}

function graficoLucro(dados: DemoDados, periodo: string | null, agora: Date) {
  const hoje = inicioDoDia(agora);
  const porDia = new Map<string, number>();
  const porMes = new Map<number, number>();
  for (const v of vendasComLucro(dados)) {
    const k = chaveDia(v.data);
    porDia.set(k, (porDia.get(k) ?? 0) + v.lucro);
    if (v.data.getFullYear() === hoje.getFullYear()) {
      porMes.set(v.data.getMonth(), (porMes.get(v.data.getMonth()) ?? 0) + v.lucro);
    }
  }

  switch (periodo) {
    case 'SEMANA':
      return Array.from({ length: 7 }, (_, i) => {
        const dia = new Date(hoje);
        dia.setDate(hoje.getDate() - 6 + i);
        return { periodo: DIAS_SEMANA[dia.getDay()], lucro: arredondar(porDia.get(chaveDia(dia)) ?? 0) };
      });
    case 'MES':
      return Array.from({ length: hoje.getDate() }, (_, i) => {
        const dia = new Date(hoje.getFullYear(), hoje.getMonth(), i + 1);
        const rotulo = `${String(i + 1).padStart(2, '0')}/${String(hoje.getMonth() + 1).padStart(2, '0')}`;
        return { periodo: rotulo, lucro: arredondar(porDia.get(chaveDia(dia)) ?? 0) };
      });
    case 'ANO':
      return Array.from({ length: hoje.getMonth() + 1 }, (_, m) => ({
        periodo: MESES[m],
        lucro: arredondar(porMes.get(m) ?? 0),
      }));
    default:
      throw new ErroDemo(400, `Período inválido para análise de gráfico: ${periodo}`);
  }
}

function resumoPorCategoria(dados: DemoDados) {
  const mapa = new Map<string, { quantidade: number; valorTotalCusto: number }>();
  for (const p of dados.produtos.filter((x) => x.status === 'EM_ESTOQUE')) {
    const atual = mapa.get(p.categoria) ?? { quantidade: 0, valorTotalCusto: 0 };
    atual.quantidade += 1;
    atual.valorTotalCusto = arredondar(atual.valorTotalCusto + p.precoCusto);
    mapa.set(p.categoria, atual);
  }
  return [...mapa.entries()].map(([categoria, v]) => ({ categoria, ...v }));
}

// ---------------------------------------------------------------- Paginação

/** Monta uma resposta no formato Page do Spring Data. */
export function paginar<T>(lista: T[], params: Record<string, string | null>): RespostaPaginada<T> {
  const numero = Math.max(0, Number(params['page'] ?? 0) || 0);
  const tamanho = Math.max(1, Number(params['size'] ?? TAMANHO_PAGINA_PADRAO) || TAMANHO_PAGINA_PADRAO);
  const content = lista.slice(numero * tamanho, numero * tamanho + tamanho);
  const totalPages = Math.ceil(lista.length / tamanho);
  return {
    content,
    totalPages,
    totalElements: lista.length,
    last: numero >= totalPages - 1,
    first: numero === 0,
    size: tamanho,
    number: numero,
    numberOfElements: content.length,
    empty: content.length === 0,
  };
}

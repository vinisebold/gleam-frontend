import { ClienteModel } from '@modules/cadastros/models/cliente.model';
import { FornecedorModel } from '@modules/cadastros/models/fornecedor.model';
import { ProdutoModel } from '@modules/inventario/models/produto.model';
import {
  FormaPagamento,
  StatusVenda,
} from '@modules/inventario/models/venda.model';

/** Venda como fica guardada no banco em memória (não é o DTO de resposta). */
export interface VendaRegistro {
  id: number;
  produtoId: number;
  /** Cópia do produto no momento da venda, usada se o produto for excluído. */
  produtoSnapshot: ProdutoModel;
  clienteId: number;
  precoVenda: number;
  lucro: number;
  formaPagamento: FormaPagamento;
  status: StatusVenda;
  totalParcelas: number;
  parcelasPagas: number;
  dataVencimento: string | null;
  dataCriacao: string;
}

export interface DemoDados {
  versao: number;
  fornecedores: FornecedorModel[];
  clientes: ClienteModel[];
  produtos: ProdutoModel[];
  vendas: VendaRegistro[];
  proximoId: number;
}

/** Formata uma data como o Jackson serializa um LocalDateTime: sem fuso, sem 'Z'. */
export function paraLocalDateTime(data: Date): string {
  const p = (n: number, t = 2) => String(n).padStart(t, '0');
  return (
    `${data.getFullYear()}-${p(data.getMonth() + 1)}-${p(data.getDate())}` +
    `T${p(data.getHours())}:${p(data.getMinutes())}:${p(data.getSeconds())}`
  );
}

/** Formata uma data como LocalDate (yyyy-MM-dd). */
export function paraLocalDate(data: Date): string {
  return paraLocalDateTime(data).slice(0, 10);
}

const CODIGOS_PADRAO = {
  codigoAnel: 'an',
  codigoPulseira: 'pl',
  codigoBrinco: 'br',
  codigoBracelete: 'bc',
  codigoPingente: 'pg',
  codigoBerloque: 'bq',
  codigoColar: 'cl',
  codigoConjunto: 'cj',
  codigoPiercing: 'pirc',
};

/**
 * Gera os dados fictícios da demonstração. As datas são relativas a `agora`,
 * para que os gráficos de "semana", "mês" e "ano" sempre tenham movimento.
 */
export function gerarDadosIniciais(agora: Date = new Date()): DemoDados {
  let id = 1;
  const proximo = () => id++;

  const diasAtras = (dias: number, hora = 14) => {
    const d = new Date(agora);
    d.setDate(d.getDate() - dias);
    d.setHours(hora, (dias * 7) % 60, 0, 0);
    return d;
  };

  const fornecedores: FornecedorModel[] = [
    {
      nome: 'Aurum Semijoias',
      descricao: 'Semijoias banhadas a ouro 18k',
      telefone: '(47) 99999-0001',
      cnpj: '11.222.333/0001-81',
    },
    {
      nome: 'Prata Fina Atacado',
      descricao: 'Peças em prata 925',
      telefone: '(47) 99999-0002',
      cnpj: '22.333.444/0001-90',
    },
    {
      nome: 'Aço Brilho Acessórios',
      descricao: 'Acessórios em aço inoxidável',
      telefone: '(47) 99999-0003',
      cnpj: '33.444.555/0001-03',
    },
  ].map((f, i) => ({
    ...f,
    ...CODIGOS_PADRAO,
    id: proximo(),
    dataCriacao: paraLocalDateTime(diasAtras(320 - i * 10)),
    dataAtualizacao: null,
  }));

  const clientes: ClienteModel[] = [
    ['Ana Souza', 'Prefere peças douradas', '(47) 98888-1001', 'ana.souza@exemplo.com'],
    ['Bruna Lima', 'Cliente desde a inauguração', '(47) 98888-1002', 'bruna.lima@exemplo.com'],
    ['Carla Mendes', 'Compra para presente', '(47) 98888-1003', null],
    ['Daniela Rocha', 'Gosta de prata', '(47) 98888-1004', 'dani.rocha@exemplo.com'],
    ['Eduarda Alves', 'Parcelamento no cartão', '(47) 98888-1005', null],
    ['Fernanda Costa', 'Revendedora', '(47) 98888-1006', 'fe.costa@exemplo.com'],
    ['Gabriela Martins', 'Prefere brincos', '(47) 98888-1007', null],
    ['Helena Ribeiro', 'Indicação da Ana', '(47) 98888-1008', 'helena.r@exemplo.com'],
  ].map(([nome, descricao, telefone, email], i) => ({
    id: proximo(),
    nome: nome as string,
    descricao: descricao as string,
    telefone: telefone as string,
    email: email as string | null,
    cpf: null,
    dataCriacao: paraLocalDateTime(diasAtras(300 - i * 15)),
    dataAtualizacao: null,
  }));

  type Peca = [string, string, ProdutoModel['acabamento'], number, number, number];
  // [nome, categoria, acabamento, custo, venda, índice do fornecedor]
  const pecas: Peca[] = [
    ['Anel Solitário Zircônia', 'Anel', 'BANHO_DOURADO', 38, 119.9, 0],
    ['Anel Aparador Cravejado', 'Anel', 'BANHO_DOURADO', 29, 89.9, 0],
    ['Anel Liso Prata', 'Anel', 'PRATA', 45, 129.9, 1],
    ['Brinco Argola Média', 'Brinco', 'BANHO_DOURADO', 22, 69.9, 0],
    ['Brinco Ponto de Luz', 'Brinco', 'PRATA', 18, 59.9, 1],
    ['Brinco Ear Cuff', 'Brinco', 'ACO', 12, 39.9, 2],
    ['Brinco Gota Cristal', 'Brinco', 'BANHO_PRATA', 20, 64.9, 1],
    ['Colar Veneziana 45cm', 'Colar', 'BANHO_DOURADO', 35, 109.9, 0],
    ['Colar Choker Pérolas', 'Colar', 'BANHO_DOURADO', 42, 139.9, 0],
    ['Colar Corrente Cartier', 'Colar', 'PRATA', 60, 179.9, 1],
    ['Pulseira Riviera', 'Pulseira', 'BANHO_PRATA', 48, 149.9, 1],
    ['Pulseira Elos Grumet', 'Pulseira', 'ACO', 25, 79.9, 2],
    ['Pulseira Berloques', 'Pulseira', 'PRATA', 55, 169.9, 1],
    ['Bracelete Liso', 'Bracelete', 'BANHO_DOURADO', 40, 119.9, 0],
    ['Bracelete Torcido', 'Bracelete', 'ACO', 28, 84.9, 2],
    ['Pingente Coração', 'Pingente', 'PRATA', 15, 49.9, 1],
    ['Pingente Inicial', 'Pingente', 'BANHO_DOURADO', 14, 44.9, 0],
    ['Berloque Estrela', 'Berloque', 'PRATA', 10, 34.9, 1],
    ['Conjunto Colar + Brinco', 'Conjunto', 'BANHO_DOURADO', 65, 199.9, 0],
    ['Piercing Argolinha', 'Piercing', 'ACO', 8, 29.9, 2],
    ['Anel Trio Corações', 'Anel', 'BANHO_DOURADO', 26, 79.9, 0],
    ['Brinco Trio Pérolas', 'Brinco', 'BANHO_DOURADO', 24, 74.9, 0],
    ['Colar Gravatinha', 'Colar', 'PRATA', 52, 159.9, 1],
    ['Pulseira Masculina Cadeado', 'Pulseira', 'ACO', 30, 94.9, 2],
    ['Anel Falange', 'Anel', 'PRATA', 20, 59.9, 1],
    ['Brinco Argola Grande', 'Brinco', 'BANHO_DOURADO', 27, 84.9, 0],
    ['Colar Ponto de Luz', 'Colar', 'BANHO_PRATA', 33, 99.9, 1],
    ['Pingente Mandala', 'Pingente', 'ACO', 11, 39.9, 2],
    ['Conjunto Prata Delicado', 'Conjunto', 'PRATA', 70, 219.9, 1],
    ['Piercing Cravejado', 'Piercing', 'BANHO_PRATA', 9, 32.9, 1],
  ];

  const prefixoPorCategoria: Record<string, string> = {
    Anel: 'an', Pulseira: 'pl', Brinco: 'br', Bracelete: 'bc', Pingente: 'pg',
    Berloque: 'bq', Colar: 'cl', Conjunto: 'cj', Piercing: 'pirc',
  };

  const produtos: ProdutoModel[] = pecas.map(([nome, categoria, acabamento, custo, venda, f], i) => {
    const criado = paraLocalDateTime(diasAtras(330 - i * 9));
    return {
      id: proximo(),
      nome,
      categoria,
      acabamento,
      precoCusto: custo,
      precoVenda: venda,
      idReferencia: `${prefixoPorCategoria[categoria]}${1001 + i}`,
      idFornecedor: fornecedores[f].id,
      status: 'EM_ESTOQUE',
      dataCriacao: criado,
      dataAtualizacao: criado,
    };
  });

  // [índice do produto, índice do cliente, dias atrás, forma, parcelas, parcelas pagas, status]
  type VendaSeed = [number, number, number, FormaPagamento, number, number, StatusVenda];
  const vendasSeed: VendaSeed[] = [
    [0, 0, 290, 'PIX', 1, 1, 'PAGO'],
    [3, 1, 250, 'CARTAO_CREDITO', 3, 3, 'PAGO'],
    [7, 2, 215, 'DINHEIRO', 1, 1, 'PAGO'],
    [10, 3, 180, 'CARTAO_CREDITO', 2, 2, 'PAGO'],
    [15, 4, 150, 'PIX', 1, 1, 'PAGO'],
    [18, 5, 120, 'CARTAO_CREDITO', 4, 4, 'PAGO'],
    [4, 6, 95, 'CARTAO_DEBITO', 1, 1, 'PAGO'],
    [8, 7, 70, 'PIX', 1, 1, 'PAGO'],
    [12, 0, 45, 'CARTAO_CREDITO', 3, 3, 'PAGO'],
    [13, 1, 30, 'DINHEIRO', 1, 1, 'PAGO'],
    [16, 2, 20, 'PIX', 1, 1, 'PAGO'],
    [1, 3, 12, 'CARTAO_CREDITO', 3, 1, 'PENDENTE'],
    [9, 4, 9, 'CARTAO_CREDITO', 5, 2, 'PENDENTE'],
    [5, 5, 6, 'PIX', 1, 1, 'PAGO'],
    [21, 6, 4, 'DINHEIRO', 2, 0, 'PENDENTE'],
    [19, 7, 3, 'CARTAO_DEBITO', 1, 1, 'PAGO'],
    [11, 0, 2, 'PIX', 1, 1, 'PAGO'],
    [17, 1, 1, 'CARTAO_CREDITO', 2, 1, 'PENDENTE'],
    [22, 2, 0, 'PIX', 1, 1, 'PAGO'],
    [2, 3, 40, 'PIX', 1, 0, 'CANCELADO'],
  ];

  const vendas: VendaRegistro[] = vendasSeed.map(
    ([pi, ci, dias, forma, parcelas, pagas, status]) => {
      const produto = produtos[pi];
      if (status !== 'CANCELADO') {
        produto.status = 'VENDIDO';
      }
      const criada = diasAtras(dias, 10 + (pi % 8));
      const vencimento = new Date(criada);
      vencimento.setDate(vencimento.getDate() + 30 * Math.max(1, parcelas));
      const precoVenda = produto.precoVenda ?? produto.precoCusto;
      return {
        id: proximo(),
        produtoId: produto.id!,
        produtoSnapshot: { ...produto },
        clienteId: clientes[ci].id,
        precoVenda,
        lucro: arredondar(precoVenda - produto.precoCusto),
        formaPagamento: forma,
        status,
        totalParcelas: parcelas,
        parcelasPagas: pagas,
        dataVencimento: status === 'PENDENTE' ? paraLocalDate(vencimento) : null,
        dataCriacao: paraLocalDateTime(criada),
      };
    }
  );

  return { versao: 1, fornecedores, clientes, produtos, vendas, proximoId: id };
}

export function arredondar(valor: number): number {
  return Math.round(valor * 100) / 100;
}

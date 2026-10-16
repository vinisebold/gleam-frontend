import { DemoRequisicao, responderDemo } from './demo-api';
import { DemoDados, gerarDadosIniciais } from './demo-seed';

// Quinta-feira, 15/10/2026, 15h.
const AGORA = new Date(2026, 9, 15, 15, 0, 0);

function req(
  metodo: string,
  caminho: string,
  params: Record<string, string> = {},
  corpo: unknown = null
): DemoRequisicao {
  return { metodo, caminho, params, corpo };
}

describe('responderDemo', () => {
  let dados: DemoDados;

  beforeEach(() => {
    dados = gerarDadosIniciais(AGORA);
  });

  it('devolve o usuário demo em /user/me', () => {
    const r = responderDemo(req('GET', '/user/me'), dados, AGORA);
    expect(r.status).toBe(200);
    expect((r.corpo as { email: string }).email).toBe('demo@gleam.app');
  });

  it('pagina listas no formato do Spring, com tamanho padrão 20', () => {
    const r = responderDemo(req('GET', '/produtos'), dados, AGORA);
    const pagina = r.corpo as { content: unknown[]; totalElements: number; size: number };
    expect(pagina.size).toBe(20);
    expect(pagina.content.length).toBe(20);
    expect(pagina.totalElements).toBe(dados.produtos.length);
  });

  it('filtra produtos por fornecedor e status', () => {
    const fornecedorId = dados.fornecedores[0].id;
    const r = responderDemo(
      req('GET', '/produtos', { fornecedorId: String(fornecedorId), status: 'EM_ESTOQUE', size: '50' }),
      dados,
      AGORA
    );
    const lista = (r.corpo as { content: { idFornecedor: number; status: string }[] }).content;
    expect(lista.length).toBeGreaterThan(0);
    expect(lista.every((p) => p.idFornecedor === fornecedorId && p.status === 'EM_ESTOQUE')).toBeTrue();
  });

  it('gera o idReferencia com o prefixo do fornecedor ao criar produto', () => {
    const r = responderDemo(
      req('POST', '/produtos', {}, {
        nome: 'Anel Teste',
        precoCusto: 10,
        precoVenda: 30,
        categoria: 'Anel',
        acabamento: 'PRATA',
        idReferencia: '777',
        idFornecedor: dados.fornecedores[1].id,
      }),
      dados,
      AGORA
    );
    expect(r.status).toBe(201);
    expect((r.corpo as { idReferencia: string }).idReferencia).toBe('an777');
  });

  it('registrar venda marca o produto como VENDIDO e calcula o lucro', () => {
    const produto = dados.produtos.find((p) => p.status === 'EM_ESTOQUE')!;
    const r = responderDemo(
      req('POST', '/vendas', {}, {
        produtoId: produto.id,
        clienteId: dados.clientes[0].id,
        precoVenda: produto.precoCusto + 50,
        formaPagamento: 'PIX',
        totalParcelas: 1,
        status: 'PAGO',
      }),
      dados,
      AGORA
    );
    expect(r.status).toBe(201);
    expect((r.corpo as { lucro: number }).lucro).toBe(50);
    expect(produto.status).toBe('VENDIDO');
  });

  it('recusa vender um produto que não está em estoque', () => {
    const vendido = dados.produtos.find((p) => p.status === 'VENDIDO')!;
    const r = responderDemo(
      req('POST', '/vendas', {}, {
        produtoId: vendido.id,
        clienteId: dados.clientes[0].id,
        precoVenda: 100,
        formaPagamento: 'PIX',
        totalParcelas: 1,
        status: 'PAGO',
      }),
      dados,
      AGORA
    );
    expect(r.status).toBe(400);
    expect((r.corpo as { message: string }).message).toContain('não está disponível');
  });

  it('pagar a última parcela quita a venda', () => {
    const venda = dados.vendas.find((v) => v.status === 'PENDENTE')!;
    let r;
    do {
      r = responderDemo(req('POST', `/vendas/${venda.id}/pagar-parcela`), dados, AGORA);
    } while ((r.corpo as { status: string }).status === 'PENDENTE');
    expect((r.corpo as { status: string; valorTotalParcelasPagas: number }).status).toBe('PAGO');
    expect((r.corpo as { valorTotalParcelasPagas: number }).valorTotalParcelasPagas).toBe(venda.precoVenda);
  });

  it('cancelar venda devolve o produto ao estoque', () => {
    const venda = dados.vendas.find((v) => v.status === 'PAGO')!;
    responderDemo(req('POST', `/vendas/${venda.id}/cancelar`), dados, AGORA);
    expect(venda.status).toBe('CANCELADO');
    expect(dados.produtos.find((p) => p.id === venda.produtoId)!.status).toBe('EM_ESTOQUE');
  });

  it('não altera produto já vendido', () => {
    const vendido = dados.produtos.find((p) => p.status === 'VENDIDO')!;
    const r = responderDemo(req('PUT', `/produtos/${vendido.id}`, {}, { ...vendido, nome: 'X' }), dados, AGORA);
    expect(r.status).toBe(400);
  });

  it('lucro do dia soma só vendas PAGO/PENDENTE criadas hoje', () => {
    const esperado = dados.vendas
      .filter((v) => v.dataCriacao.startsWith('2026-10-15') && v.status !== 'CANCELADO')
      .reduce((s, v) => s + v.lucro, 0);
    const r = responderDemo(req('GET', '/analises/lucro-total', { periodo: 'DIA' }), dados, AGORA);
    expect((r.corpo as { totalLucro: number }).totalLucro).toBeCloseTo(esperado, 2);
    expect(esperado).toBeGreaterThan(0);
  });

  it('gráfico semanal tem 7 pontos terminando no dia atual', () => {
    const r = responderDemo(req('GET', '/analises/lucro-grafico', { periodo: 'SEMANA' }), dados, AGORA);
    const pontos = r.corpo as { periodo: string }[];
    expect(pontos.length).toBe(7);
    expect(pontos[6].periodo).toBe('Quinta-feira');
  });

  it('gráfico anual vai de janeiro ao mês atual', () => {
    const r = responderDemo(req('GET', '/analises/lucro-grafico', { periodo: 'ANO' }), dados, AGORA);
    const pontos = r.corpo as { periodo: string }[];
    expect(pontos.length).toBe(10);
    expect(pontos[0].periodo).toBe('Janeiro');
  });

  it('resumo global conta só produtos em estoque', () => {
    const r = responderDemo(req('GET', '/estoque/resumo-global'), dados, AGORA);
    const emEstoque = dados.produtos.filter((p) => p.status === 'EM_ESTOQUE').length;
    expect((r.corpo as { quantidadeTotal: number }).quantidadeTotal).toBe(emEstoque);
  });

  it('impede excluir fornecedor com produtos', () => {
    const r = responderDemo(req('DELETE', `/fornecedores/${dados.fornecedores[0].id}`), dados, AGORA);
    expect(r.status).toBe(400);
  });

  it('responde 404 para rota desconhecida', () => {
    const r = responderDemo(req('GET', '/inexistente'), dados, AGORA);
    expect(r.status).toBe(404);
  });
});

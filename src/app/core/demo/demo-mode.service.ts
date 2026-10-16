import { Injectable, signal } from '@angular/core';
import { environment } from '@env/environment';
import type { DemoDados } from './demo-seed';

const CHAVE_STORAGE = 'gleam-demo-dados';
const VERSAO_DADOS = 1;
const TIMEOUT_DETECCAO_MS = 1500;

/**
 * Decide se a aplicação roda contra a API real ou no modo demonstração,
 * e guarda o "banco" da demonstração no localStorage do navegador.
 */
@Injectable({ providedIn: 'root' })
export class DemoModeService {
  /** true quando as requisições à API são respondidas localmente. */
  readonly ativo = signal(false);

  private dados: DemoDados | null = null;

  /**
   * Executado uma vez na inicialização (provideAppInitializer).
   * - environment.demoMode === 'always' ou `?demo=1` na URL: força a demonstração.
   * - caso contrário, tenta alcançar o backend; se não houver resposta, ativa a demonstração.
   */
  async detectar(): Promise<void> {
    if (environment.demoMode === 'always' || this.forcadoPelaUrl()) {
      this.ativo.set(true);
      return;
    }
    this.ativo.set(!(await this.backendDisponivel()));
  }

  /**
   * Banco em memória da demonstração, carregado do localStorage sob demanda.
   * O gerador dos dados iniciais é recebido por parâmetro para que o seed
   * (carregado via import dinâmico) não entre no bundle inicial.
   */
  obterDados(gerarIniciais: () => DemoDados): DemoDados {
    if (!this.dados) {
      this.dados = this.carregar() ?? gerarIniciais();
      this.salvar();
    }
    return this.dados;
  }

  salvar(): void {
    if (!this.dados) return;
    try {
      localStorage.setItem(CHAVE_STORAGE, JSON.stringify(this.dados));
    } catch {
      // Sem localStorage (ex.: modo privado restrito): a demo segue só em memória.
    }
  }

  /** Descarta as alterações do visitante; os dados iniciais são gerados no próximo acesso. */
  restaurarDados(): void {
    this.dados = null;
    try {
      localStorage.removeItem(CHAVE_STORAGE);
    } catch {}
  }

  private carregar(): DemoDados | null {
    try {
      const bruto = localStorage.getItem(CHAVE_STORAGE);
      if (!bruto) return null;
      const dados = JSON.parse(bruto) as DemoDados;
      return dados?.versao === VERSAO_DADOS ? dados : null;
    } catch {
      return null;
    }
  }

  private forcadoPelaUrl(): boolean {
    try {
      return new URLSearchParams(window.location.search).get('demo') === '1';
    } catch {
      return false;
    }
  }

  /**
   * Requisição `no-cors` à origem da API: resolve se houver algo escutando
   * (mesmo sem CORS ou sem login) e rejeita só em erro de rede/timeout.
   * Não usa /api/user/me porque, sem sessão, o Spring redireciona para o
   * Google e o navegador reporta isso como erro de rede, igual a "backend fora".
   */
  private async backendDisponivel(): Promise<boolean> {
    try {
      const origem = new URL(environment.apiUrl).origin;
      await fetch(`${origem}/`, {
        mode: 'no-cors',
        cache: 'no-store',
        signal: AbortSignal.timeout(TIMEOUT_DETECCAO_MS),
      });
      return true;
    } catch {
      return false;
    }
  }
}

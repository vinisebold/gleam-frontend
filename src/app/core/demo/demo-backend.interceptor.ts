import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '@env/environment';
import {
  delay,
  dematerialize,
  from,
  materialize,
  mergeMap,
  of,
  throwError,
} from 'rxjs';
import { DemoModeService } from './demo-mode.service';

/** Latência simulada, para os skeletons e estados de carregamento aparecerem. */
const LATENCIA_MS = 250;

/**
 * No modo demonstração, responde localmente às requisições para a API
 * em vez de enviá-las ao backend. Fora dele, não faz nada.
 *
 * A "API falsa" e os dados iniciais são carregados por import dinâmico,
 * então quem usa o backend real não baixa esse código.
 */
export const demoBackendInterceptor: HttpInterceptorFn = (req, next) => {
  const demo = inject(DemoModeService);

  if (!demo.ativo() || !req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  return from(import('./demo-api')).pipe(
    mergeMap(({ responderDemo, gerarDadosIniciais }) => {
      const params: Record<string, string | null> = {};
      for (const chave of req.params.keys()) {
        params[chave] = req.params.get(chave);
      }

      const resposta = responderDemo(
        {
          metodo: req.method,
          caminho: req.url.slice(environment.apiUrl.length) || '/',
          params,
          corpo: req.body,
        },
        demo.obterDados(gerarDadosIniciais)
      );

      if (resposta.status >= 400) {
        return throwError(
          () =>
            new HttpErrorResponse({
              status: resposta.status,
              error: resposta.corpo,
              url: req.url,
            })
        );
      }

      if (req.method !== 'GET') {
        demo.salvar();
      }

      // Clona o corpo para a tela não alterar o "banco" por referência.
      const corpo = resposta.corpo === null ? null : structuredClone(resposta.corpo);
      return of(new HttpResponse({ status: resposta.status, body: corpo, url: req.url }));
    }),
    // materialize/dematerialize aplica a latência também aos erros.
    materialize(),
    delay(LATENCIA_MS),
    dematerialize()
  );
};

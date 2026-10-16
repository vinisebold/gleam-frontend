import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '@env/environment';
import { demoBackendInterceptor } from './demo-backend.interceptor';
import { DemoModeService } from './demo-mode.service';

describe('demoBackendInterceptor', () => {
  let http: HttpClient;
  let demo: DemoModeService;

  beforeEach(() => {
    localStorage.removeItem('gleam-demo-dados');
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([demoBackendInterceptor]))],
    });
    http = TestBed.inject(HttpClient);
    demo = TestBed.inject(DemoModeService);
    demo.ativo.set(true);
  });

  afterEach(() => localStorage.removeItem('gleam-demo-dados'));

  it('responde à API localmente quando o modo demo está ativo', async () => {
    const pagina = await firstValueFrom(
      http.get<{ content: unknown[] }>(`${environment.apiUrl}/clientes`)
    );
    expect(pagina.content.length).toBeGreaterThan(0);
  });

  it('persiste alterações no localStorage', async () => {
    await firstValueFrom(
      http.post(`${environment.apiUrl}/clientes`, { nome: 'Nova', descricao: '', telefone: '1' })
    );
    const salvo = JSON.parse(localStorage.getItem('gleam-demo-dados')!);
    expect(salvo.clientes.some((c: { nome: string }) => c.nome === 'Nova')).toBeTrue();
  });

  it('converte erros de negócio em HttpErrorResponse com message', async () => {
    try {
      await firstValueFrom(http.get(`${environment.apiUrl}/produtos/999999`));
      fail('deveria ter falhado');
    } catch (e) {
      expect(e instanceof HttpErrorResponse).toBeTrue();
      expect((e as HttpErrorResponse).status).toBe(404);
      expect((e as HttpErrorResponse).error.message).toContain('999999');
    }
  });

  it('restaurarDados descarta as alterações do visitante', async () => {
    await firstValueFrom(
      http.post(`${environment.apiUrl}/clientes`, { nome: 'Temporária', descricao: '', telefone: '1' })
    );
    demo.restaurarDados();
    const pagina = await firstValueFrom(
      http.get<{ content: { nome: string }[] }>(`${environment.apiUrl}/clientes`)
    );
    expect(pagina.content.some((c) => c.nome === 'Temporária')).toBeFalse();
  });
});


describe('demoBackendInterceptor (modo demo desligado)', () => {
  it('deixa a requisição seguir para o backend real', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([demoBackendInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    const http = TestBed.inject(HttpClient);
    const controle = TestBed.inject(HttpTestingController);
    TestBed.inject(DemoModeService).ativo.set(false);

    const resposta = firstValueFrom(http.get(`${environment.apiUrl}/clientes`));
    controle.expectOne(`${environment.apiUrl}/clientes`).flush({ content: [] });
    expect(await resposta).toEqual({ content: [] });
    controle.verify();
  });
});

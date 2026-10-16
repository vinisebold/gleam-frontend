import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DemoModeService } from './demo-mode.service';

/** Aviso fixo exibido dentro do sistema enquanto o modo demonstração estiver ativo. */
@Component({
  selector: 'app-demo-banner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (demo.ativo()) {
      <div
        role="status"
        class="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#b7c46d]/40 bg-[#f5f7ee] px-4 py-2 text-sm text-gray-700"
      >
        <span>
          <strong class="font-semibold text-[#7d8a3a]">Modo demonstração</strong>
          — dados fictícios, salvos só neste navegador. Para usar a API real, inicie o backend em
          <code class="rounded bg-white px-1">localhost:8080</code>.
        </span>
        <button
          type="button"
          (click)="restaurar()"
          class="rounded-lg border border-[#b7c46d] px-3 py-1 font-semibold text-[#7d8a3a] transition hover:bg-[#b7c46d] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7d8a3a]"
        >
          Restaurar dados
        </button>
      </div>
    }
  `,
})
export class DemoBanner {
  protected readonly demo = inject(DemoModeService);

  restaurar(): void {
    this.demo.restaurarDados();
    // Recarrega para que todas as telas busquem os dados iniciais de novo.
    window.location.reload();
  }
}

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DemoModeService } from './demo-mode.service';

/** Cartão discreto na sidebar, visível só enquanto o modo demonstração estiver ativo. */
@Component({
  selector: 'app-demo-banner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    @if (demo.ativo()) {
      <div
        role="status"
        class="mx-2 mb-2 rounded-xl bg-surface-container2 px-3 py-2 text-xs text-on-surface-variant"
      >
        <p class="font-medium">Modo demonstração</p>
        <p class="mt-0.5 opacity-80">Dados fictícios neste navegador.</p>
        <button
          type="button"
          (click)="restaurar(); $event.stopPropagation()"
          class="mt-1 cursor-pointer underline underline-offset-2 opacity-80 transition hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2"
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
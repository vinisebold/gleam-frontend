import { Component, inject } from '@angular/core';
import { NavBar } from "@shared";
import { RouterOutlet } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { DemoBanner } from '../demo/demo-banner';

@Component({
  selector: 'app-layout',
  imports: [NavBar, RouterOutlet, DemoBanner],
  templateUrl: './layout.html',
  styleUrl: './layout.scss'
})
export class Layout {
  private authService = inject(AuthService);

  ngOnInit(): void {
    this.authService.fetchCurrentUser().subscribe();
  }
}

import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SECTORS, Sector } from '../../data/sectors';
import { UiStateService } from '../../services/ui-state.service';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  protected uiState = inject(UiStateService);

  sectors: Sector[] = SECTORS;
}

import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dataset-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dataset-card.component.html',
  styleUrl: './dataset-card.component.css'
})
export class DatasetCardComponent {
  @Input() id!: string;
  @Input() title!: string;
  @Input() uploader!: string;
  @Input() date!: string;
  @Input() imageUrl!: string; // URL de la imagen (puede ser local o remota)
  @Input() year!: string;
  @Input() imageCount!: string;
  @Input() status!: string;

  getStatusClasses(status: string | undefined): string {
    if (!status) return 'bg-gray-500/10 text-gray-400 border-gray-500/20'; // Default style for unknown status

    const s = status.toUpperCase();

    switch (s) {
      case 'APPROVED':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';

      case 'REJECTED':
        return 'bg-red-500/10 text-red-600 border-red-500/20';

      case 'PENDING':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      
      default:
        // Por defecto o cualquier otro estado, usamos gris
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  }
}

import { Component, inject, Input, signal } from '@angular/core';
import { DatasetService } from '../../../../core/services/dataset.service';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dataset-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './dataset-detail.component.html',
  styleUrl: './dataset-detail.component.css'
})
export class DatasetDetailComponent {
  @Input() id!: string;
  private _datasetService = inject(DatasetService);

  data = signal<{ dataset: any, images: any[] } | null>(null);

  ngOnInit() {
    this.fetchData();
  }

  fetchData() {
    if (this.id) {
      this._datasetService.getDatasetById(this.id).subscribe({
        next: (response) => {
          console.log('Datos recibidos:', response);
          this.data.set(response);
        },
        error: (err) => console.error('Error cargando detalle:', err)
      });
    }
  }
}

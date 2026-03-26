import { Component, inject } from '@angular/core';
import { DatasetCardComponent } from '../../../../shared/components/dataset-card/dataset-card.component';
import { DatasetService } from '../../../../core/services/dataset.service';
import { RouterLink } from "@angular/router";
import { DatePipe, DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [DatasetCardComponent, RouterLink, DatePipe, DecimalPipe],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent {
  datasetService = inject(DatasetService);
  datasets: any[] = [];

  stats = {
    pending: 0,
    approved: 0,
    totalImages: 0
  }

  ngOnInit() {
    this.datasetService.getDatasets().subscribe({
      next: (data) => {
        this.datasets = data;
        this.calculateStats(); // Llamamos al cálculo después de recibir la data
      },
      error: (err) => console.error('Error cargando datasets', err)
    });
  }  

  calculateStats() {
    // 1. Contamos los pendientes
    this.stats.pending = this.datasets.filter(ds => ds.status === 'PENDING').length;
    
    // 2. Contamos los aprobados
    this.stats.approved = this.datasets.filter(ds => ds.status === 'APPROVED').length;
    
    // 3. Sumamos todas las imágenes usando reduce
    this.stats.totalImages = this.datasets.reduce((sum, ds) => sum + (ds.image_count || 0), 0);
  }
}

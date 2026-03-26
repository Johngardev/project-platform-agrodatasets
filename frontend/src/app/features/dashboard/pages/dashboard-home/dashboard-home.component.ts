import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';
import { DatasetCardComponent } from '../../../../shared/components/dataset-card/dataset-card.component';
import { DatasetService } from '../../../../core/services/dataset.service';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule, StatCardComponent, DatasetCardComponent],
  templateUrl: './dashboard-home.component.html',
  styleUrl: './dashboard-home.component.css'
})
export class DashboardHomeComponent implements OnInit {
  datasetService = inject(DatasetService);

  myDatasets: any[] = [];
  publicDatasets: any[] = [];

  stats = {
    total: 0,
    pending: 0,
    approved:0
  };

  ngOnInit() {
    // TODO: Obtén el ID del usuario logueado desde tu AuthService o LocalStorage.
    // Ejemplo: const currentUserId = this.authService.getUserId();
    // Por ahora pondré un ID de ejemplo o puedes leerlo de tu sesión:
    const currentUserId = localStorage.getItem('userId') || 'AQUI_PON_EL_ID_DEL_USUARIO';

    this.datasetService.getDatasets().subscribe({
      next: (data) => {
        // 1. Mis datasets (donde el ID de uploaded_by coincide)
        this.myDatasets = data.filter(ds => ds.uploaded_by?._id === currentUserId);
        
        // 2. Datasets públicos (los demás, y usualmente querrás que solo sean los 'APPROVED')
        this.publicDatasets = data.filter(ds => 
          ds.uploaded_by?._id !== currentUserId && ds.status === 'APPROVED'
        );

        // 3. Calculamos las estadísticas reales del usuario
        this.stats.total = this.myDatasets.length;
        this.stats.pending = this.myDatasets.filter(ds => ds.status === 'PENDING').length;
        this.stats.approved = this.myDatasets.filter(ds => ds.status === 'APPROVED').length;
      },
      error: (err) => console.error('Error cargando datasets', err)
    });
  }
}

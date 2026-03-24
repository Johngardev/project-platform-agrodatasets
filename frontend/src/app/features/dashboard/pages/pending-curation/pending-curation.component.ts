import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Dataset, DatasetService } from '../../../../core/services/dataset.service';

export interface UserPopulated {
  _id: string;
  name: string;
  email: string;
}

export interface DatasetDocument {
  _id: string;
  name: string;
  description?: string;
  uploaded_by: UserPopulated; // Cuando haces .populate('uploaded_by') en NestJS
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejection_reason?: string;
  image_count: number;
  crop_type: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

@Component({
  selector: 'app-pending-curation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pending-curation.component.html',
  styleUrl: './pending-curation.component.css'
})
export class PendingCurationComponent {
  private _datasetService = inject(DatasetService);

  allDatasets = signal<Dataset[]>([]);

  pendingDatasets = computed(() => this.allDatasets().filter(d => d.status === 'PENDING'));
  historyDatasets = computed(() => this.allDatasets().filter(d => d.status !== 'PENDING'));

  ngOnInit() {
    this.loadDatasets();
  }

  loadDatasets() {
    this._datasetService.getDatasets().subscribe({
      next: (data) => this.allDatasets.set(data),
      error: (err) => console.error('Error al cargar datasets:', err)
    });
  }  
  
  approveDataset(id: string) {
    if (confirm('¿Estás seguro de que quieres aprobar este dataset?')) {
      this._datasetService.updateDatasetStatus(id, 'APPROVED').subscribe({
        next: (updatedDataset) => {
          // Actualizamos la lista local para que la UI reaccione al instante
          this.updateLocalDataset(updatedDataset);
        },
        error: (err) => console.error('Error aprobando', err)
      });
    }
  }

  rejectDataset(id: string) {
    const reason = prompt('Por favor, ingresa el motivo del rechazo:');
    
    if (reason !== null) { // Si el usuario no canceló el prompt
      this._datasetService.updateDatasetStatus(id, 'REJECTED', reason).subscribe({
        next: (updatedDataset) => {
          this.updateLocalDataset(updatedDataset);
        },
        error: (err) => console.error('Error rechazando', err)
      });
    }
  }

  private updateLocalDataset(updatedDataset: Dataset) {
    this.allDatasets.update(datasets => 
      datasets.map(d => d._id === updatedDataset._id ? updatedDataset : d)
    );
  }

  getInitials(name: string | undefined): string {
    // Si name no existe, devolvemos un valor por defecto
    if (!name) return 'US'; 
    
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  } 
}

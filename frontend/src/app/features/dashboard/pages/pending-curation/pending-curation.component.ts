import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Dataset, DatasetService } from '../../../../core/services/dataset.service';
import Swal from 'sweetalert2';
import { RouterLink } from '@angular/router';

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
  imports: [CommonModule, RouterLink],
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
    Swal.fire({
      title: '¿Aprobar este dataset?',
      text: "El dataset pasará al historial como aprobado y estará disponible.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981', // Verde esmeralda (estilo Tailwind)
      cancelButtonColor: '#4b5563', // Gris oscuro
      confirmButtonText: 'Sí, aprobar',
      cancelButtonText: 'Cancelar',
      background: '#1f2937', // Fondo oscuro para que combine con tu tema
      color: '#f3f4f6' // Texto claro
    }).then((result) => {
      if (result.isConfirmed) {
        this._datasetService.updateDatasetStatus(id, 'APPROVED').subscribe({
          next: (updatedDataset) => {
            this.updateLocalDataset(updatedDataset);
            Swal.fire({
              title: '¡Aprobado!',
              text: 'El dataset ha sido aprobado con éxito.',
              icon: 'success',
              background: '#1f2937',
              color: '#f3f4f6',
              confirmButtonColor: '#10b981'
            });
          },
          error: (err) => {
            console.error('Error aprobando', err);
            Swal.fire({
              title: 'Error',
              text: 'Hubo un problema al aprobar el dataset.',
              icon: 'error',
              background: '#1f2937',
              color: '#f3f4f6'
            });
          }
        });
      }
    });
  }

  rejectDataset(id: string) {
    Swal.fire({
      title: 'Rechazar Dataset',
      text: 'Por favor, explica el motivo del rechazo para que el investigador pueda corregirlo:',
      input: 'textarea',
      inputPlaceholder: 'Ej: Las imágenes están desenfocadas...',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444', // Rojo (estilo Tailwind)
      cancelButtonColor: '#4b5563',
      confirmButtonText: 'Confirmar Rechazo',
      cancelButtonText: 'Cancelar',
      background: '#1f2937',
      color: '#f3f4f6',
      inputValidator: (value) => {
        if (!value || value.trim() === '') {
          return '¡Debes ingresar un motivo para poder rechazarlo!';
        }
        return null;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const reason = result.value;
        this._datasetService.updateDatasetStatus(id, 'REJECTED', reason).subscribe({
          next: (updatedDataset) => {
            this.updateLocalDataset(updatedDataset);
            Swal.fire({
              title: '¡Rechazado!',
              text: 'El dataset ha sido movido al historial con estado rechazado.',
              icon: 'success',
              background: '#1f2937',
              color: '#f3f4f6',
              confirmButtonColor: '#10b981'
            });
          },
          error: (err) => {
            console.error('Error rechazando', err);
            Swal.fire({
              title: 'Error',
              text: 'Hubo un problema al rechazar el dataset.',
              icon: 'error',
              background: '#1f2937',
              color: '#f3f4f6'
            });
          }
        });
      }
    });
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

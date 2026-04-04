import { CommonModule } from '@angular/common';
import { Component, computed, ElementRef, inject, signal, ViewChild } from '@angular/core';
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
  has_annotations: boolean;
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

  @ViewChild('csvFileInput') csvFileInput!: ElementRef<HTMLInputElement>;
  private selectedDatasetIdForCsv: string | null = null;

  isDownloading = false;

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
  
  triggerCsvUpload(datasetId: string) {
    this.selectedDatasetIdForCsv = datasetId;
    // Esto simula un clic en el input de archivo oculto, abriendo el explorador de Windows/Mac
    this.csvFileInput.nativeElement.click(); 
  }

  onCsvFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file || !this.selectedDatasetIdForCsv) return;

    // Limpiamos el valor del input por si el usuario quiere subir el mismo archivo después de corregir un error
    event.target.value = '';

    Swal.fire({
      title: 'Validando CSV...',
      text: 'Comprobando estructura y actualizando base de datos.',
      allowOutsideClick: false,
      background: '#1f2937', color: '#f3f4f6',
      didOpen: () => Swal.showLoading()
    });

    this._datasetService.uploadAnnotationsCsv(this.selectedDatasetIdForCsv, file).subscribe({
      next: (response: any) => {

        this.allDatasets.update(datasets => 
          datasets.map(d => d._id === this.selectedDatasetIdForCsv ? { ...d, has_annotations: true } : d)
        );
        // Generar un reporte claro en HTML
        let htmlReport = `
          <div style="text-align: left; font-size: 14px;">
            <p>Imágenes actualizadas: <b>${response.updatedImages}</b></p>
            <p>Errores encontrados: <b style="color: #ef4444;">${response.errorsFound}</b></p>
        `;

        if (response.errorsFound > 0) {
          htmlReport += `<hr class="my-2 border-gray-600"><ul style="color: #ef4444; max-height: 150px; overflow-y: auto; font-size: 13px;">`;
          response.errorDetails.forEach((err: any) => {
            htmlReport += `<li class="mb-1"><b>Fila ${err.row} (${err.file}):</b> ${err.message}</li>`;
          });
          htmlReport += `</ul>`;
        }
        htmlReport += `</div>`;

        Swal.fire({
          title: response.errorsFound > 0 ? 'Completado con Advertencias' : '¡Anotaciones Cargadas!',
          html: htmlReport,
          icon: response.errorsFound > 0 ? 'warning' : 'success',
          background: '#1f2937', color: '#f3f4f6', confirmButtonColor: '#10b981'
        });
      },
      error: (err: any) => {
        Swal.fire({
          title: 'Error de Estructura',
          text: err.error?.message || 'El CSV no cumple con el formato requerido o está corrupto.',
          icon: 'error',
          background: '#1f2937', color: '#f3f4f6', confirmButtonColor: '#ef4444'
        });
      }
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

  triggerDownload(id: string, datasetName: string) {
    this.isDownloading = true;
    
    // Opcional: Mostrar un Toast de carga con SweetAlert2
    Swal.fire({
      title: 'You download is being prepared',
      text: 'Compressing images and metadata...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    this._datasetService.downloadDatasetZip(id).subscribe({
      next: (blob) => {
        // Magia para descargar archivos en Angular
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${datasetName.replace(/\s+/g, '_')}.zip`;
        a.click(); // Simulamos un clic
        window.URL.revokeObjectURL(url); // Limpiamos memoria
        
        this.isDownloading = false;
        Swal.close();
      },
      error: (err) => {
        console.error('Error descargando', err);
        this.isDownloading = false;
        Swal.fire('Error', 'There was an error downloading the dataset.', 'error');
      }
    });
  }
}

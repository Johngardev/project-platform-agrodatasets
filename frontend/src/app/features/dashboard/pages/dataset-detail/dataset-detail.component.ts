import { Component, inject, Input, signal } from '@angular/core';
import { DatasetService } from '../../../../core/services/dataset.service';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import Swal from 'sweetalert2';

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

  selectedFile: File | null = null;
  isUploadModalOpen = false;

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

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  uploadSingleImage() {
    if (!this.selectedFile) {
      Swal.fire('Error', 'Por favor, selecciona un archivo para subir.', 'error');
      return;
    }

    const dummyMetadata = {
      width: 800,
      height: 600,
      ripeness_degree: 'Maduro',
      spectral_values: { r: 120, g: 150, b: 80, nir: 200 }
    };

    this._datasetService.uploadImage(this.id, this.selectedFile, dummyMetadata).subscribe({
      next: (res) => {
        Swal.fire('Imagen cargada', 'Imagen se agrego correctamente al dataset.', 'success');
        this.selectedFile = null;
        this.closeUploadModal();
        this.fetchData();
      },
      error: (err) => {
        console.error('Error al subir imagen:', err);
        Swal.fire('Error', 'Hubo un error al subir la imagen. Inténtalo de nuevo.', 'error');
      }
    });
  }

  openUploadModal() {
    this.isUploadModalOpen = true;
  }

  closeUploadModal() {
    this.isUploadModalOpen = false;
    this.selectedFile = null;
  }
}

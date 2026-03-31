import { Component, computed, inject, Input, signal } from '@angular/core';
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
  isDownloading = false;

  data = signal<{ dataset: any, images: any[] } | null>(null);

  searchQuery = signal<string>('');

  filteredImages = computed(() => {
    const currentData = this.data();
    const query = this.searchQuery().toLowerCase().trim();

    if (!currentData || !currentData.images) return [];

    return currentData.images.filter(img => 
    (img.metadata?.ripeness_degree || 'N/A').toLowerCase().includes(query) || 
    (img.file_name && img.file_name.toLowerCase().includes(query))
    );
  });

  selectedFile: File | null = null;
  isUploadModalOpen = false;

  ngOnInit() {
    this.fetchData();
  }

  onSearchInput(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    this.searchQuery.set(inputElement.value);
  }

  fetchData() {
    if (this.id) {
      this._datasetService.getDatasetById(this.id).subscribe({
        next: (response) => {
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

  openUploadModal() {
    this.isUploadModalOpen = true;
  }

  closeUploadModal() {
    this.isUploadModalOpen = false;
    this.selectedFile = null;
  }
}

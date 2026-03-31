import { CommonModule, Location } from '@angular/common';
import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatasetService } from '../../../../core/services/dataset.service';

@Component({
  selector: 'app-image-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './image-detail.component.html',
  styleUrl: './image-detail.component.css'
})
export class ImageDetailComponent implements OnInit {
  private _route = inject(ActivatedRoute);
  private _router = inject(Router);
  private _datasetService = inject(DatasetService);
  private _location = inject(Location);
  
  datasetId: string = '';
  imageId: string = '';

  image = signal<any>(null);
  dataset = signal<any>(null);
  imagesList = signal<any[]>([]);
  currentIndex = signal<number>(0);
  zoomLevel = signal<number>(1);

  canGoPrevious = computed(() => this.currentIndex() > 0);
  canGoNext = computed(() => this.currentIndex() < this.imagesList().length - 1);

  readonly ZOOM_STEP = 0.25;
  readonly MAX_ZOOM = 4;
  readonly MIN_ZOOM = 0.25;

  ngOnInit() {
    // IMPORTANTE: Usamos subscribe en lugar de snapshot. 
    // Así, si cambiamos de imagen pero seguimos en este componente, la URL se actualiza dinámicamente.
    this._route.paramMap.subscribe(params => {
      this.datasetId = params.get('datasetId') || '';
      this.imageId = params.get('imageId') || '';

      if (this.datasetId && this.imageId) {
        // Si no tenemos la lista cargada, llamamos al backend
        if (this.imagesList().length === 0) {
          this.fetchImageData();
        } else {
          // Si ya la tenemos, solo actualizamos la vista localmente (¡Súper rápido!)
          this.updateCurrentImage();
        }
      }
    });
  }

  fetchImageData() {
    this._datasetService.getDatasetById(this.datasetId).subscribe({
      next: (res) => {
        this.dataset.set(res.dataset);
        
        // 👇 ESTA ES LA LÍNEA MÁGICA QUE FALTABA 👇
        this.imagesList.set(res.images); 
        
        // Ahora que la lista ya está guardada, usamos nuestro propio método para actualizar la vista
        this.updateCurrentImage();
      },
      error: (err) => console.error('Error fetching image details', err)
    });
  }

  updateCurrentImage() {
    const list = this.imagesList();
    const index = list.findIndex(img => img._id === this.imageId);
    
    if (index !== -1) {
      this.currentIndex.set(index);
      this.image.set(list[index]);
      this.resetZoom();
    }
  }

  goPrevious() {
    if (this.canGoPrevious()) {
      const prevId = this.imagesList()[this.currentIndex() - 1]._id;
      this._router.navigate(['/dataset', this.datasetId, 'image', prevId]);
    }
  }

  goNext() {
    if (this.canGoNext()) {
      const nextId = this.imagesList()[this.currentIndex() + 1]._id;
      this._router.navigate(['/dataset', this.datasetId, 'image', nextId]);
    }
  }

  goBack() {
    this._router.navigate(['/dataset', this.datasetId]);
  }

  // Helper para construir la URL de la imagen
  getImageUrl(): string {
    const imgData = this.image();
    if (!imgData) return '';
    return 'http://localhost:3000/' + imgData.storage_url.replace(/\\/g, '/');
  }

  // Helper para formatear el JSON para la vista
  getFormattedMetadata(): string {
    const imgData = this.image();
    if (!imgData || !imgData.metadata) return '{}';
    return JSON.stringify(imgData.metadata, null, 2);
  }

  zoomIn() {
    this.zoomLevel.update(z => Math.min(z + this.ZOOM_STEP, this.MAX_ZOOM));
  }

  zoomOut() {
    this.zoomLevel.update(z => Math.max(z - this.ZOOM_STEP, this.MIN_ZOOM));
  }

  resetZoom() {
    this.zoomLevel.set(1);
  }

}

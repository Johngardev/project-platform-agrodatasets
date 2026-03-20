import { CommonModule, Location } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatasetService } from '../../../../core/services/dataset.service';

@Component({
  selector: 'app-image-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './image-detail.component.html',
  styleUrl: './image-detail.component.css'
})
export class ImageDetailComponent {
  private _route = inject(ActivatedRoute);
  private _datasetService = inject(DatasetService);
  private _location = inject(Location);
  
  datasetId: string = '';
  imageId: string = '';

  image = signal<any>(null);
  dataset = signal<any>(null);

  ngOnInit() {
    this.datasetId = this._route.snapshot.paramMap.get('datasetId') || '';
    this.imageId = this._route.snapshot.paramMap.get('imageId') || '';

    if (this.datasetId && this.imageId) {
      this.fetchImageData();
    }
  }

  fetchImageData() {
    // Reutilizamos tu método existente
    this._datasetService.getDatasetById(this.datasetId).subscribe({
      next: (res) => {
        this.dataset.set(res.dataset);
        
        // Buscamos la imagen específica en la lista
        const foundImage = res.images.find((img: any) => img._id === this.imageId);
        this.image.set(foundImage);
      },
      error: (err) => console.error('Error fetching image details', err)
    });
  }

  goBack() {
    this._location.back();
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

}

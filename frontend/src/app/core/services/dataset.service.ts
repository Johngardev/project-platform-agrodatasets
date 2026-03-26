import { HttpClient, HttpEvent, HttpRequest } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';

export interface User {
  _id: string;
  name?: string;
  username?: string;
  email: string;
}

export interface Dataset {
  _id: string;
  name: string;
  description?: string;
  crop_type: string;
  image_count: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  uploaded_by: User; // El populate del backend nos da el objeto completo
  createdAt: string;
  updatedAt: string;
  last_image_url?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DatasetService {
  private _http = inject(HttpClient);

  private apiUrl = 'http://localhost:3000/datasets';

  constructor() { }

  createDataset(data: { name: string; crop_type: string; description: string }): Observable<Dataset>{
    return this._http.post<Dataset>(this.apiUrl, data);
  }

  /**
   * Obtiene todos los datasets (Para el Dashboard) con la opcion de filtrado por estado (PENDING, APPROVED, REJECTED)
   */
  getDatasets(status?: string): Observable<Dataset[]> {
    let url = this.apiUrl;
    if(status) {
      url += `?status=${status}`;
    }
    return this._http.get<Dataset[]>(url);
  }

  /**
   * Obtiene un dataset por ID con sus imágenes (Para el detalle)
   */
  getDatasetById(id: string): Observable<any> {
    return this._http.get<any>(`${this.apiUrl}/${id}`);
  }

  /**
   * Aprueba o rechaza un dataset pendiente
   */
  updateDatasetStatus(id: string, status: 'APPROVED' | 'REJECTED', rejection_reason?: string): Observable<Dataset> {
    const body: any = { status };
    if (rejection_reason) {
      body.rejection_reason = rejection_reason;
    }
    return this._http.patch<Dataset>(`${this.apiUrl}/${id}/status`, body);
  }

  /**
   * Sube una imagen a un dataset existente
   */
  uploadImage(datasetId: string, file: File, metadata: any): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('metadata', JSON.stringify(metadata));

    return this._http.post(`${this.apiUrl}/${datasetId}/images`, formData);
  }

  /**
   * Subir un archivo .zip a un dataset existente
   */
  uploadDatasetZip(file: File): Observable<HttpEvent<any>> {
    const formData = new FormData();
    formData.append('file', file);

    const req = new HttpRequest('POST', `${this.apiUrl}/upload`, formData, {
      reportProgress: true,
      responseType: 'json'
    });

    return this._http.request(req);
  }

  /**
   * Obtiene las estadísticas de almacenamiento de datasets
   */
  getStorageStats() {
    return this._http.get<{ usedBytes: number, totalCapacityBytes: number, usedPercentage: number }>(
      `${this.apiUrl}/datasets/storage-stats` // Ajusta la ruta según tu backend
    );
  }
}
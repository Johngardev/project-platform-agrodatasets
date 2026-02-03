import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';

export interface User {
  _id: string;
  name: string;
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
   * Obtiene todos los datasets (Para el Dashboard)
   */
  getDatasets(): Observable<Dataset[]> {
    return this._http.get<Dataset[]>(this.apiUrl);
  }

  /**
   * Obtiene un dataset por ID con sus imágenes (Para el detalle)
   */
  getDatasetById(id: string): Observable<any> {
    return this._http.get<any>(`${this.apiUrl}/${id}`);
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
}

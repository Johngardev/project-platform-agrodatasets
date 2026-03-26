import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';

export interface UserDocument {
  _id: string;
  name: string;
  email: string;
  password?: string;
  role: 'ADMIN' | 'USER';
  userType: 'VIEWER' | 'CONTRIBUTOR';
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

@Injectable({
  providedIn: 'root'
})
export class ResearchersService {

  private _http = inject(HttpClient);

  private apiUrl = 'http://localhost:3000/users';

  /**
   * Obtiene la lista de todos los investigadores
   */
  getResearchers(): Observable<UserDocument[]> {
    return this._http.get<UserDocument[]>(this.apiUrl);
  }

  /**
   * Crea un nuevo investigador
   */
  createResearcher(userData: Partial<UserDocument>): Observable<UserDocument> {
    return this._http.post<UserDocument>(this.apiUrl, userData);
  }

  /**
   * Actualiza un investigador existente por su ID
   */
  updateResearcher(id: string, userData: Partial<UserDocument>): Observable<UserDocument> {
    return this._http.patch<UserDocument>(`${this.apiUrl}/${id}`, userData);
  }

  /**
   * Elimina un investigador por su ID
   */
  deleteResearcher(id: string): Observable<any> {
    return this._http.delete(`${this.apiUrl}/${id}`);
  }

  /**
   * Obtiene las estadísticas de almacenamiento de datasets
   */
  getStorageStats() {
    return this._http.get<{ usedBytes: number, totalCapacityBytes: number, usedPercentage: number }>(
      'http://localhost:3000/datasets/storage-stats' // Ajusta la ruta según tu backend
    );
  }
}

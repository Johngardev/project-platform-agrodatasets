import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

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
  rejection_reason?: string | null;
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

  allDatasets: DatasetDocument[] = [
    {
      _id: 'd1', name: 'Hass_Maturity_v2_Final', description: 'Imágenes de maduración semana 42',
      uploaded_by: { _id: 'u1', name: 'Dr. Arlo V.', email: 'arlo@avohub.org' },
      status: 'PENDING', image_count: 1450, crop_type: 'Hass Avocado',
      createdAt: '2023-10-24T10:00:00Z', updatedAt: '2023-10-24T10:00:00Z'
    },
    {
      _id: 'd2', name: 'Organic_Yield_Patterns_Q3', description: 'Patrones de rendimiento orgánico',
      uploaded_by: { _id: 'u2', name: 'Sarah Green', email: 'sarah@biotech.com' },
      status: 'PENDING', image_count: 890, crop_type: 'Hass Avocado',
      createdAt: '2023-10-23T14:30:00Z', updatedAt: '2023-10-23T14:30:00Z'
    },
    {
      _id: 'd3', name: 'Irrigation_Logic_v1', description: 'Estrés hídrico',
      uploaded_by: { _id: 'u3', name: 'Elena Rodriguez', email: 'elena@agri.com' },
      status: 'APPROVED', image_count: 3200, crop_type: 'Hass Avocado',
      createdAt: '2023-10-21T09:15:00Z', updatedAt: '2023-10-21T11:00:00Z'
    },
    {
      _id: 'd4', name: 'Soil_pH_Raw_Data', description: 'Imágenes con ruido, descartadas',
      uploaded_by: { _id: 'u4', name: 'Mark Chen', email: 'mark@eco.org' },
      status: 'REJECTED', rejection_reason: 'Imágenes desenfocadas e iluminación pobre', image_count: 400, crop_type: 'Hass Avocado',
      createdAt: '2023-10-20T16:45:00Z', updatedAt: '2023-10-20T18:20:00Z'
    }
  ];

  get pendingDatasets(): DatasetDocument[] {
    return  this.allDatasets.filter(d => d.status === 'PENDING');
  }

  get historyDatasets(): DatasetDocument[] {
    return  this.allDatasets.filter(d => d.status !== 'PENDING');
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  } 
}

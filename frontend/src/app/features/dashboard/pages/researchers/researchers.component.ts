import { CommonModule, DatePipe } from '@angular/common';
import { Component } from '@angular/core';

export interface UserDocument {
  _id?: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER';
  userType: 'VIEWER' | 'CONTRIBUTOR';
  createdAt: string | Date;
  updatedAt?: string | Date;
}

@Component({
  selector: 'app-researchers',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './researchers.component.html',
  styleUrl: './researchers.component.css'
})
export class ResearchersComponent {

  // Datos simulados (Mock data) imitando la respuesta de NestJS
  researchersList: UserDocument[] = [
    { 
      _id: '64a1b2c3d4e5f6g7h8i9j0k1',
      name: 'Dr. Elena Rodriguez', 
      email: 'e.rodriguez@avohub.org', 
      role: 'USER', 
      userType: 'CONTRIBUTOR',
      createdAt: '2023-10-24T10:30:00Z'
    },
    { 
      _id: '64a1b2c3d4e5f6g7h8i9j0k2',
      name: 'Mark Chen', 
      email: 'm.chen@biotech.com', 
      role: 'USER', 
      userType: 'VIEWER',
      createdAt: '2023-12-02T14:15:00Z'
    },
    { 
      _id: '64a1b2c3d4e5f6g7h8i9j0k3',
      name: 'Aaliyah Khan', 
      email: 'a.khan@avohub.org', 
      role: 'ADMIN', 
      userType: 'CONTRIBUTOR', // Un admin usualmente es contributor por defecto
      createdAt: '2023-05-30T09:00:00Z'
    }
  ];

}

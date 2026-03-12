import { CommonModule, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

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
  imports: [CommonModule, DatePipe, ReactiveFormsModule],
  templateUrl: './researchers.component.html',
  styleUrl: './researchers.component.css'
})
export class ResearchersComponent {

  isModalOpen: boolean = false;

  researcherForm = new FormGroup({
    name: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
    role: new FormControl<'ADMIN' | 'USER'>('USER', [Validators.required]),
    userType: new FormControl<'VIEWER' | 'CONTRIBUTOR'>('CONTRIBUTOR', [Validators.required])
  });

  researchersList: UserDocument[] = [
    { 
      _id: '64a1b2c3d4e5f6g7h8i9j0k1', name: 'Dr. Elena Rodriguez', email: 'e.rodriguez@avohub.org', 
      role: 'USER', userType: 'CONTRIBUTOR', createdAt: '2023-10-24T10:30:00Z'
    },
    { 
      _id: '64a1b2c3d4e5f6g7h8i9j0k2', name: 'Mark Chen', email: 'm.chen@biotech.com', 
      role: 'USER', userType: 'VIEWER', createdAt: '2023-12-02T14:15:00Z'
    },
    { 
      _id: '64a1b2c3d4e5f6g7h8i9j0k3', name: 'Aaliyah Khan', email: 'a.khan@avohub.org', 
      role: 'ADMIN', userType: 'CONTRIBUTOR', createdAt: '2023-05-30T09:00:00Z'
    }
  ];

  //Metodos para el modal
  openModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.researcherForm.reset({
      role: 'USER',
      userType: 'CONTRIBUTOR'
    });
  }

  onSubmit() {
    if (this.researcherForm.valid) {
      console.log('Payload listo para NestJS:', this.researcherForm.value);
      
      // Simulación de agregar a la lista (Aquí irá tu lógica de HTTP POST)
      const newUser: UserDocument = {
        _id: Math.random().toString(36).substring(2, 9),
        ...(this.researcherForm.value as any),
        createdAt: new Date().toISOString()
      };
      
      // Lo añadimos al inicio de la tabla
      this.researchersList.unshift(newUser);
      
      // Cerramos el modal
      this.closeModal();
    } else {
      // Si el formulario es inválido, marcamos todos los campos como tocados para mostrar errores
      this.researcherForm.markAllAsTouched();
    }
  }

}

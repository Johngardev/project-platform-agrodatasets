import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ResearchersService } from '../../../../core/services/researchers.service';
import Swal from 'sweetalert2';

export interface UserDocument {
  _id?: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER';
  userType: 'VIEWER' | 'CONTRIBUTOR';
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

@Component({
  selector: 'app-researchers',
  standalone: true,
  imports: [CommonModule, DatePipe, ReactiveFormsModule],
  templateUrl: './researchers.component.html',
  styleUrl: './researchers.component.css'
})
export class ResearchersComponent implements OnInit {
  
  private researchersService = inject(ResearchersService);

  isModalOpen: boolean = false;

  isEditing: boolean = false;
  editingUserId: string | null = null;

  researchersList: UserDocument[] = [];

  researcherForm = new FormGroup({
    name: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [
      Validators.required, 
      Validators.minLength(6),
      Validators.pattern(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/) // Al menos una mayúscula, una minúscula y un número o símbolo, sin espacios ni saltos de línea!
    ]),
    role: new FormControl<'ADMIN' | 'USER'>('USER', [Validators.required]),
    userType: new FormControl<'VIEWER' | 'CONTRIBUTOR'>('CONTRIBUTOR', [Validators.required])
  });

  ngOnInit(): void {
    this.loadResearchers();
  }

  loadResearchers() {
    this.researchersService.getResearchers().subscribe({
      next: (data) => {
        this.researchersList = data;
      },
      error: (err) => {
        console.error('Error fetching researchers:', err);
      }
    })
  }

  //Metodos para el modal
  openModal(userToEdit?: UserDocument) {
    if (userToEdit && userToEdit._id) {
      // Modo Edición
      this.isEditing = true;
      this.editingUserId = userToEdit._id;
      
      // Llenamos el formulario (la contraseña la dejamos vacía o la quitamos de los validadores si no queremos forzar a cambiarla)
      this.researcherForm.patchValue({
        name: userToEdit.name,
        email: userToEdit.email,
        role: userToEdit.role,
        userType: userToEdit.userType,
        // No parchamos la contraseña
      });

      // Si editamos, la contraseña no debería ser obligatoria (a menos que quieran cambiarla)
      this.researcherForm.get('password')?.clearValidators();
      this.researcherForm.get('password')?.updateValueAndValidity();

    } else {
      // Modo Creación
      this.isEditing = false;
      this.editingUserId = null;
      // Restauramos los validadores de la contraseña
      this.researcherForm.get('password')?.setValidators([
        Validators.required, 
        Validators.minLength(6),
        Validators.pattern(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/)
      ]);
      this.researcherForm.get('password')?.updateValueAndValidity();
    }
    
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
      const payload: any = { ...this.researcherForm.value };

      // Si estamos editando y dejaron la contraseña en blanco, la quitamos del payload para no actualizarla
      if (this.isEditing && !payload.password) {
        delete payload.password;
      }

      if (this.isEditing && this.editingUserId) {
        // === ACTUALIZAR USUARIO ===
        this.researchersService.updateResearcher(this.editingUserId, payload).subscribe({
          next: (updatedUser) => {
            // Actualizamos la lista local
            const index = this.researchersList.findIndex(u => u._id === this.editingUserId);
            if (index !== -1) {
              // Mezclamos los datos nuevos con los viejos para no perder info (como la fecha de creación)
              this.researchersList[index] = { ...this.researchersList[index], ...updatedUser };
            }
            this.closeModal();

            Swal.fire({
              title: '¡Actualizado!',
              text: 'El investigador se actualizó correctamente.',
              icon: 'success',
              timer: 2000, // Se cierra solo después de 2 segundos
              showConfirmButton: false
            });
          },
          error: (err) => console.error('Error updating researcher:', err)
        });
      } else {
        // === CREAR USUARIO === (Tu código original)
        this.researchersService.createResearcher(payload).subscribe({
          next: (newUser) => {
            this.researchersList.unshift(newUser);
            this.closeModal();

            Swal.fire({
              title: '¡Creado!',
              text: 'El investigador se creó correctamente.',
              icon: 'success',
              timer: 2000, // Se cierra solo después de 2 segundos
              showConfirmButton: false
            });
          },
          error: (err) => {
            console.error('Error creating researcher:', err);
            if (err.status === 409 || err.error?.message?.includes('duplicate')) {
              Swal.fire({
                title: 'Error',
                text: 'This email is already registered!',
                icon: 'error',
                timer: 2000,
                showConfirmButton: false
              });
            }
          }
        });
      }
    } else {
      this.researcherForm.markAllAsTouched();
    }
  }

  deleteResearcher(id?: string, name?: string){
    if (!id) return;

    // Alerta de confirmación nativa (puedes cambiarla por un modal de confirmación después)
    if (confirm(`Are you sure you want to delete the researcher "${name}"? This action cannot be undone.`)) {
      this.researchersService.deleteResearcher(id).subscribe({
        next: () => {
          // Removemos el usuario de la tabla sin recargar
          this.researchersList = this.researchersList.filter(user => user._id !== id);
          Swal.fire({
            title: 'Deleted!',
            text: 'The researcher has been deleted.',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });
        },
        error: (err) => {
          console.error('Error deleting researcher:', err);
          Swal.fire({
            title: 'Error',
            text: 'There was an error deleting the researcher. Please try again.',
            icon: 'error',
            timer: 2000,
            showConfirmButton: false
          });
        }
      });
    }
  }
}

import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import {
  Form,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  isLoginMode = true;
  authForm: FormGroup;

  private _fb = inject(FormBuilder);
  private _http = inject(HttpClient);
  private _router = inject(Router);

  private apiUrl = 'http://localhost:3000/auth';

  constructor() {
    this.authForm = this._fb.group({
      name: [''],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  toggleMode(mode: boolean) {
    this.isLoginMode = mode;

    const nameControl = this.authForm.get('name');

    if (!mode) {
      nameControl?.setValidators([Validators.required]);
    } else {
      nameControl?.clearValidators();
    }
    nameControl?.updateValueAndValidity();
  }

  onSubmit() {
    if (this.authForm.invalid) {
      this.authForm.markAllAsTouched();
      return;
    }

    const formValues = this.authForm.value;

    if (this.isLoginMode) {
      const loginPayload = {
        email: formValues.email,
        password: formValues.password,
      };

      this._http.post(`${this.apiUrl}/login`, loginPayload).subscribe({
        next: (res: any) => {
          console.log('Login successful:', res);
          // 1. Guardamos el token y los datos que nos envía tu backend
          localStorage.setItem('access_token', res.access_token);
          localStorage.setItem('user_data', JSON.stringify(res.user));

          // 2. Redirigimos a la ruta según el rol del usuario
          if (res.user.role === 'admin') {
            this._router.navigate(['/admin']);
          } else {
            this._router.navigate(['/']);
          }
        },
        error: (err) => {
          console.error('Login failed:', err);
          alert('Login failed. Please check your credentials and try again.');
        },
      });
    } else {
      const registerPayload = {
        name: formValues.name,
        email: formValues.email,
        password: formValues.password,
      };

      this._http
        .post(`http://localhost:3000/users`, registerPayload)
        .subscribe({
          next: (res: any) => {
            console.log('Registro exitoso:', res);
            alert('Cuenta creada con éxito. Ahora puedes iniciar sesión.');
            this.toggleMode(true); // Cambiamos a la vista de login
          },
          error: (err) => {
            console.error('Error en Registro:', err);
            alert('Hubo un error al crear la cuenta');
          },
        });
    }
  }
}

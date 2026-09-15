import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router'; // Importar RouterModule
import { AuthService } from '../../core/service/auth.service'; // Ajusta la ruta según donde lo creaste

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  loginForm: FormGroup;
  errorMessage: string = ''; // Variable para mostrar errores del backend
  isLoading: boolean = false; // Para deshabilitar el botón mientras carga
  
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService); // Inyectamos nuestro nuevo servicio

  constructor() {
    this.loginForm = this.fb.group({
      cedula: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(100)]]
    });
  }

  soloDigitos(event: Event): void {
    const input = event.target as HTMLInputElement;
    const valor = input.value.replace(/\D/g, '').slice(0, 10);
    input.value = valor;
    this.loginForm.get('cedula')?.setValue(valor, { emitEvent: false });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = ''; // Limpiamos errores previos

      // Llamamos al backend real a través de nuestro servicio
      this.authService.login(this.loginForm.value).subscribe({
        next: () => {
          // Si NestJS responde OK y el token se guardó, vamos al Dashboard
          this.isLoading = false;
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          // Si NestJS responde con error (ej. 401 Unauthorized o 404 Not Found)
          this.isLoading = false;
          const mensaje = err?.error?.message;
          this.errorMessage = Array.isArray(mensaje)
            ? mensaje.join(' ')
            : mensaje ?? 'No se pudo iniciar sesión. Revise la cédula y la contraseña.';
          console.error('Error de login:', err);
        }
      });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }
}

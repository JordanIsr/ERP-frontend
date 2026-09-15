import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/service/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class Register {
  registerForm: FormGroup;
  errorMessage: string = '';
  isLoading: boolean = false;

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);

  constructor() {
    this.registerForm = this.fb.group({
      cedula: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(100)]],
      aceptaPoliticaPrivacidad: [false, [Validators.requiredTrue]],
    });
  }

  soloDigitos(event: Event): void {
    const input = event.target as HTMLInputElement;
    const valor = input.value.replace(/\D/g, '').slice(0, 10);
    input.value = valor;
    this.registerForm.get('cedula')?.setValue(valor, { emitEvent: false });
  }

  onSubmit() {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      this.authService.register(this.registerForm.getRawValue()).subscribe({
        next: () => {
          this.isLoading = false;
          this.router.navigate(['/login']);
        },
        error: (err) => {
          this.isLoading = false;
          const mensaje = err?.error?.message;
          this.errorMessage = Array.isArray(mensaje)
            ? mensaje.join(' ')
            : mensaje ?? 'No se pudo registrar la cuenta.';
          console.error('Error de registro:', err);
        }
      });
    } else {
      this.registerForm.markAllAsTouched();
    }
  }
}

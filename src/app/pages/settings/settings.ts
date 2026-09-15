import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class Settings {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private readonly api = 'http://localhost:3000/api/auth';

  loading = false;
  error = '';
  success = '';
  mostrarAnterior = false;
  mostrarNueva = false;
  mostrarConfirmacion = false;

  form = this.fb.nonNullable.group({
    claveAnterior: ['', [Validators.required]],
    cambiarClave: ['', [Validators.required, Validators.minLength(6)]],
    confirmarClave: ['', [Validators.required]],
  });

  submit() {
    this.error = '';
    this.success = '';

    const value = this.form.getRawValue();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (value.cambiarClave !== value.confirmarClave) {
      this.error = 'La nueva clave y su confirmación no coinciden.';
      this.form.controls.confirmarClave.markAsTouched();
      return;
    }

    this.loading = true;
    this.http.post<{ message: string }>(`${this.api}/change-password`, {
      claveAnterior: value.claveAnterior,
      nuevaClave: value.cambiarClave,
    }).subscribe({
      next: (response) => {
        this.loading = false;
        this.success = response.message;
        this.form.reset();
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'No fue posible cambiar la clave.';
      },
    });
  }
}
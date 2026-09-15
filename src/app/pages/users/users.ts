import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsersService } from './users.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.html',
  styleUrl: './users.scss',
})
export class Users implements OnInit {
  private usersService = inject(UsersService);

  usuarios: any[] = [];
  cargando = true;
  guardandoId: string | null = null; // controla el spinner/estado por fila mientras guarda
  mensajeError = '';
  mensajeExito = '';

  roles = ['admin', 'secretaria', 'docente', 'estudiante', 'usuario'];

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios() {
    this.cargando = true;
    this.usersService.obtenerUsuarios().subscribe({
      next: (data: any) => {
        this.usuarios = data;
        this.cargando = false;
      },
      error: (err: any) => {
        console.error(err);
        this.cargando = false;
      }
    });
  }

cambiarRol(usuario: any): void {
  this.guardandoId = usuario.id;
  this.mensajeError = '';
  this.mensajeExito = '';

  this.usersService
    .actualizarRol(
      usuario.id,
      usuario.role,
    )
    .subscribe({
      next: () => {
        this.guardandoId = null;

        this.mensajeExito =
          `El rol de ${usuario.nombre} se actualizó correctamente.`;
      },

      error: (err: any) => {
        console.error(err);

        this.guardandoId = null;

        const mensaje =
          err?.error?.message;

        this.mensajeError =
          Array.isArray(mensaje)
            ? mensaje.join(' ')
            : mensaje ||
              'No se pudo actualizar el rol.';

        // Recupera el rol anterior desde el backend.
        this.cargarUsuarios();
      },
    });
}

  desactivar(usuario: any) {
    const confirmar = confirm(`¿Desactivar la cuenta de ${usuario.nombre}?`);
    if (!confirmar) return;

    this.usersService.desactivarUsuario(usuario.id).subscribe({
      next: () => {
        this.cargarUsuarios();
      },
      error: (err: any) => {
        console.error(err);
        alert('Error al desactivar el usuario.');
      }
    });
  }
}
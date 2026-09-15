import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Estudiante, EstudiantesService } from '../estudiantes.service';
import { MatriculaOficial, MatriculasService } from '../../../core/service/matriculas.service';

@Component({
  selector: 'app-buscar-estudiantes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './buscar-estudiantes.html',
  styleUrl: './buscar-estudiantes.scss',
})
export class BuscarEstudiantes implements OnInit {
  private readonly estudiantesService = inject(EstudiantesService);
  private readonly matriculasService = inject(MatriculasService);

  terminoBusqueda = '';
  todosLosEstudiantes: Estudiante[] = [];
  resultados: Estudiante[] = [];
  estudianteSeleccionado: Estudiante | null = null;
  matriculas: MatriculaOficial[] = [];
  modoEdicion = false;
  cargando = false;
  cargandoMatriculas = false;
  guardando = false;
  procesandoMatriculaId = '';
  busquedaRealizada = false;
  error = '';
  exito = '';

  get esSecretaria(): boolean {
    return localStorage.getItem('user_role') === 'secretaria';
  }

  ngOnInit(): void {
    this.cargarEstudiantes();
  }

  cargarEstudiantes(): void {
    this.cargando = true;
    this.error = '';
    this.estudiantesService.obtenerEstudiantes().subscribe({
      next: (data) => {
        this.todosLosEstudiantes = data;
        this.cargando = false;
        if (this.busquedaRealizada) this.aplicarFiltro();
      },
      error: (error) => {
        this.error = this.mensajeError(error, 'No se pudo cargar la lista de estudiantes.');
        this.cargando = false;
      },
    });
  }

  buscar(): void {
    this.busquedaRealizada = true;
    this.aplicarFiltro();
  }

  private aplicarFiltro(): void {
    const termino = this.terminoBusqueda.trim().toLowerCase();
    this.error = '';
    this.exito = '';
    if (!termino) {
      this.resultados = [];
      this.estudianteSeleccionado = null;
      this.matriculas = [];
      return;
    }

    this.resultados = this.todosLosEstudiantes.filter((estudiante) =>
      estudiante.cedula?.toLowerCase().includes(termino) ||
      estudiante.nombres?.toLowerCase().includes(termino) ||
      estudiante.apellidos?.toLowerCase().includes(termino) ||
      estudiante.correo?.toLowerCase().includes(termino),
    );
    this.estudianteSeleccionado = null;
    this.matriculas = [];
    this.modoEdicion = false;
  }

  seleccionar(estudiante: Estudiante): void {
    this.estudianteSeleccionado = { ...estudiante };
    this.modoEdicion = false;
    this.error = '';
    this.exito = '';
    this.cargarMatriculas(estudiante.id);
  }

  cargarMatriculas(estudianteId: string): void {
    this.cargandoMatriculas = true;
    this.matriculas = [];
    this.matriculasService.obtenerPorEstudiante(estudianteId).subscribe({
      next: (matriculas) => {
        this.matriculas = matriculas;
        this.cargandoMatriculas = false;
      },
      error: (error) => {
        this.error = this.mensajeError(error, 'No se pudo cargar la información académica.');
        this.cargandoMatriculas = false;
      },
    });
  }

  activarEdicion(): void {
    if (this.esSecretaria) this.modoEdicion = true;
  }

  cancelarEdicion(): void {
    const original = this.todosLosEstudiantes.find(
      (item) => item.id === this.estudianteSeleccionado?.id,
    );
    if (original) this.estudianteSeleccionado = { ...original };
    this.modoEdicion = false;
  }

  guardarActualizacion(): void {
    const estudiante = this.estudianteSeleccionado;
    if (!estudiante?.id) return;
    if (!estudiante.nombres.trim()) { this.error = 'Los nombres son obligatorios.'; return; }
    if (!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:[ '\-][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/.test(estudiante.nombres.trim())) { this.error = 'Los nombres solo pueden contener letras, espacios, apóstrofes o guiones.'; return; }
    if (!estudiante.apellidos.trim()) { this.error = 'Los apellidos son obligatorios.'; return; }
    if (!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:[ '\-][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/.test(estudiante.apellidos.trim())) { this.error = 'Los apellidos solo pueden contener letras, espacios, apóstrofes o guiones.'; return; }
    if (!estudiante.correo?.trim()) { this.error = 'El correo electrónico es obligatorio.'; return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(estudiante.correo.trim())) { this.error = 'Ingrese un correo electrónico válido.'; return; }
    if (!/^\d{10}$/.test(estudiante.telefono?.trim() ?? '')) { this.error = 'El teléfono es obligatorio y debe contener exactamente 10 dígitos.'; return; }

    this.guardando = true;
    this.error = '';
    this.exito = '';
    this.estudiantesService.actualizarEstudiante(estudiante.id, {
      nombres: estudiante.nombres.trim(),
      apellidos: estudiante.apellidos.trim(),
      correo: estudiante.correo.trim(),
      telefono: estudiante.telefono!.trim(),
    }).subscribe({
      next: (actualizado) => {
        this.estudianteSeleccionado = { ...actualizado };
        this.modoEdicion = false;
        this.guardando = false;
        this.exito = 'Datos personales actualizados correctamente.';
        this.cargarEstudiantes();
      },
      error: (error) => {
        this.error = this.mensajeError(error, 'No se pudieron actualizar los datos personales.');
        this.guardando = false;
      },
    });
  }

  anularMatricula(matricula: MatriculaOficial): void {
    if (!this.esSecretaria || matricula.estado !== 'ACTIVA') return;
    const descripcion = [
      matricula.periodo?.nombre,
      matricula.periodoCarrera?.carrera?.nombre,
      matricula.nivel?.nombre ?? `Nivel ${matricula.nivel?.numero}`,
    ].filter(Boolean).join(' · ');

    if (!confirm(`¿Anular la matrícula ${descripcion}? Esta acción no elimina al estudiante.`)) return;

    this.procesandoMatriculaId = matricula.id;
    this.error = '';
    this.exito = '';
    this.matriculasService.anular(matricula.id).subscribe({
      next: () => {
        this.procesandoMatriculaId = '';
        this.exito = 'Matrícula anulada correctamente.';
        this.cargarMatriculas(this.estudianteSeleccionado!.id);
      },
      error: (error) => {
        this.error = this.mensajeError(error, 'No se pudo anular la matrícula.');
        this.procesandoMatriculaId = '';
      },
    });
  }

  nombreNivel(matricula: MatriculaOficial): string {
    return matricula.nivel?.nombre ?? `Nivel ${matricula.nivel?.numero ?? ''}`;
  }

  soloDigitosTelefono(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/\D/g, '').slice(0, 10);
    if (this.estudianteSeleccionado) this.estudianteSeleccionado.telefono = input.value;
  }

  private mensajeError(error: any, predeterminado: string): string {
    const mensaje = error?.error?.message;
    return Array.isArray(mensaje) ? mensaje.join(' ') : mensaje ?? predeterminado;
  }
}

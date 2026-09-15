import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  AsignacionDocente,
  CalificacionesService,
  DetalleCalificacion,
  TipoNota,
} from '../../core/service/calificaciones.service';

interface EntradaNotas {
  PARCIAL_1?: number | null;
  PARCIAL_2?: number | null;
  RECUPERACION?: number | null;
}

@Component({
  selector: 'app-registrar-notas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './registrar-notas.html',
  styleUrl: './registrar-notas.scss',
})
export class RegistarNotas implements OnInit {
  private readonly service = inject(CalificacionesService);

  asignaciones: AsignacionDocente[] = [];
  estudiantes: DetalleCalificacion[] = [];
  entradas: Record<string, EntradaNotas> = {};
  periodoId = '';
  carreraId = '';
  asignacionId = '';
  cargando = true;
  cargandoEstudiantes = false;
  guardandoClave = '';
  error = '';
  exito = '';

  ngOnInit(): void {
    this.cargarAsignaciones();
  }

  cargarAsignaciones(): void {
    this.cargando = true;
    this.error = '';
    this.service.misAsignaturas().subscribe({
      next: (asignaciones) => {
        this.asignaciones = asignaciones;
        this.cargando = false;
      },
      error: (error) => {
        this.error = this.mensajeError(
          error,
          'No se pudieron cargar tus asignaturas. Verifica que tu cuenta esté vinculada con una ficha docente.',
        );
        this.cargando = false;
      },
    });
  }

  get periodos(): Array<{ id: string; nombre: string }> {
    return this.unicos(
      this.asignaciones.map((item) => item.paralelo.periodoCarrera.periodo),
      (item) => item.id,
    );
  }

  get carreras(): Array<{ id: string; nombre: string }> {
    return this.unicos(
      this.asignaciones
        .filter((item) => item.paralelo.periodoCarrera.periodo.id === this.periodoId)
        .map((item) => item.paralelo.periodoCarrera.carrera),
      (item) => item.id,
    );
  }

  get asignacionesFiltradas(): AsignacionDocente[] {
    return this.asignaciones.filter((item) =>
      item.paralelo.periodoCarrera.periodo.id === this.periodoId &&
      item.paralelo.periodoCarrera.carrera.id === this.carreraId,
    );
  }

  cambiarPeriodo(): void {
    this.carreraId = '';
    this.asignacionId = '';
    this.estudiantes = [];
  }

  cambiarCarrera(): void {
    this.asignacionId = '';
    this.estudiantes = [];
  }

  cargarEstudiantes(): void {
    this.estudiantes = [];
    this.entradas = {};
    this.error = '';
    this.exito = '';
    if (!this.asignacionId) return;

    this.cargandoEstudiantes = true;
    this.service.estudiantesPorAsignatura(this.asignacionId).subscribe({
      next: (estudiantes) => {
        this.estudiantes = estudiantes;
        this.entradas = Object.fromEntries(
          estudiantes.map((detalle) => [detalle.id, {}]),
        );
        this.cargandoEstudiantes = false;
      },
      error: (error) => {
        this.error = this.mensajeError(error, 'No se pudieron cargar los estudiantes matriculados.');
        this.cargandoEstudiantes = false;
      },
    });
  }

  registrar(detalle: DetalleCalificacion, tipoNota: TipoNota): void {
    const nota = this.entradas[detalle.id]?.[tipoNota];
    if (nota === null || nota === undefined || Number.isNaN(Number(nota))) {
      this.error = 'Ingresa una nota antes de guardar.';
      return;
    }
    if (Number(nota) < 0 || Number(nota) > 10) {
      this.error = 'La nota debe estar entre 0 y 10.';
      return;
    }
    if (!/^\d+(?:\.\d{1,2})?$/.test(String(nota))) {
      this.error = 'La nota puede tener como máximo dos decimales.';
      return;
    }

    const etiqueta = this.etiquetaNota(tipoNota);
    const notaFormateada = Number(nota).toFixed(2);
    const estudiante = `${detalle.matricula.estudiante.nombres} ${detalle.matricula.estudiante.apellidos}`;
    if (!confirm(`¿Guardar ${etiqueta} = ${notaFormateada} para ${estudiante}? El docente no podrá modificarla después.`)) {
      return;
    }

    this.guardandoClave = `${detalle.id}-${tipoNota}`;
    this.error = '';
    this.exito = '';
    this.service.registrar(detalle.id, tipoNota, Number(nota)).subscribe({
      next: () => {
        this.guardandoClave = '';
        this.exito = `${etiqueta} registrada correctamente con el valor ${notaFormateada}.`;
        this.cargarEstudiantes();
      },
      error: (error) => {
        this.error = this.mensajeError(error, 'No se pudo registrar la nota.');
        this.guardandoClave = '';
      },
    });
  }

  requiereRecuperacion(
  detalle: DetalleCalificacion,
): boolean {
  if (
    detalle.notaParcial1 === null ||
    detalle.notaParcial2 === null
  ) {
    return false;
  }

  const promedioSinTruncar =
    (
      Number(detalle.notaParcial1) +
      Number(detalle.notaParcial2)
    ) / 2;

  const promedio =
    Math.trunc(
      (
        promedioSinTruncar +
        Number.EPSILON
      ) * 100,
    ) / 100;

  return promedio >= 3 && promedio < 7;
}

  etiquetaNota(tipo: TipoNota): string {
    return ({
      PARCIAL_1: 'NP1',
      PARCIAL_2: 'NP2',
      RECUPERACION: 'Recuperación',
    } as Record<TipoNota, string>)[tipo];
  }

  bloquearCaracterNumericoInvalido(event: KeyboardEvent): void {
    if (['e', 'E', '+', '-'].includes(event.key)) event.preventDefault();
  }

  private unicos<T>(items: T[], clave: (item: T) => string): T[] {
    return [...new Map(items.map((item) => [clave(item), item])).values()];
  }

  private mensajeError(error: any, predeterminado: string): string {
    const mensaje = error?.error?.message;
    return Array.isArray(mensaje) ? mensaje.join(' ') : mensaje ?? predeterminado;
  }
}

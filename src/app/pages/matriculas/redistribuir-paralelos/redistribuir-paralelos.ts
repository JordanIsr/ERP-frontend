import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  MatriculaOficial,
  MatriculasService,
  ParaleloRedistribucion,
} from '../../../core/service/matriculas.service';

@Component({
  selector: 'app-redistribuir-paralelos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './redistribuir-paralelos.html',
  styleUrl: './redistribuir-paralelos.scss',
})
export class RedistribuirParalelos implements OnInit {
  private readonly matriculasService = inject(MatriculasService);

  paralelos: ParaleloRedistribucion[] = [];
  estudiantes: MatriculaOficial[] = [];
  carreraFiltroId = '';
  nivelFiltroId = '';
  origenId = '';
  destinoId = '';
  seleccionados = new Set<string>();
  cargandoParalelos = false;
  cargandoEstudiantes = false;
  trasladando = false;
  error = '';
  exito = '';

  ngOnInit(): void {
    this.cargarParalelos();
  }

  get carrerasDisponibles(): Array<{ id: string; nombre: string; codigo: string }> {
    const carreras = this.paralelos
      .filter((paralelo) => paralelo.bajoMinimo && paralelo.cuposOcupados > 0)
      .map((paralelo) => paralelo.periodoCarrera.carrera);
    return [...new Map(carreras.map((carrera) => [carrera.id, carrera])).values()]
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  get nivelesDisponibles(): Array<{ id: string; numero: number; nombre?: string }> {
    const niveles = this.paralelos
      .filter((paralelo) =>
        paralelo.bajoMinimo
        && paralelo.cuposOcupados > 0
        && paralelo.periodoCarrera.carrera.id === this.carreraFiltroId,
      )
      .map((paralelo) => paralelo.nivel);
    return [...new Map(niveles.map((nivel) => [nivel.id, nivel])).values()]
      .sort((a, b) => a.numero - b.numero);
  }

  get paralelosOrigen(): ParaleloRedistribucion[] {
    return this.paralelos.filter((paralelo) =>
      paralelo.bajoMinimo
      && paralelo.cuposOcupados > 0
      && paralelo.periodoCarrera.carrera.id === this.carreraFiltroId
      && paralelo.nivel.id === this.nivelFiltroId,
    );
  }

  get origen(): ParaleloRedistribucion | undefined {
    return this.paralelos.find((paralelo) => paralelo.id === this.origenId);
  }

  get destinosCompatibles(): ParaleloRedistribucion[] {
    const origen = this.origen;
    if (!origen) return [];
    return this.paralelos.filter((paralelo) =>
      paralelo.id !== origen.id
      && paralelo.periodoCarrera.id === origen.periodoCarrera.id
      && paralelo.nivel.id === origen.nivel.id
      && paralelo.cuposDisponibles > 0,
    );
  }

  get todosSeleccionados(): boolean {
    return this.estudiantes.length > 0
      && this.estudiantes.every((matricula) => this.seleccionados.has(matricula.id));
  }

  get cantidadSeleccionados(): number {
    return this.seleccionados.size;
  }

  cargarParalelos(mantenerOrigen = false): void {
    this.cargandoParalelos = true;
    this.error = '';
    this.matriculasService.obtenerParalelosParaRedistribucion().subscribe({
      next: (paralelos) => {
        this.paralelos = paralelos;
        this.cargandoParalelos = false;
        if (!mantenerOrigen || !this.paralelos.some((item) => item.id === this.origenId)) {
          this.carreraFiltroId = '';
          this.nivelFiltroId = '';
          this.origenId = '';
          this.destinoId = '';
          this.estudiantes = [];
          this.seleccionados.clear();
        }
      },
      error: (error) => {
        this.error = this.mensajeError(error, 'No se pudieron cargar los paralelos.');
        this.cargandoParalelos = false;
      },
    });
  }

  cambiarCarrera(): void {
    this.nivelFiltroId = '';
    this.limpiarSeleccionParalelo();
  }

  cambiarNivel(): void {
    this.limpiarSeleccionParalelo();
  }

  private limpiarSeleccionParalelo(): void {
    this.origenId = '';
    this.destinoId = '';
    this.estudiantes = [];
    this.seleccionados.clear();
    this.error = '';
    this.exito = '';
  }

  cambiarOrigen(): void {
    this.destinoId = '';
    this.estudiantes = [];
    this.seleccionados.clear();
    this.error = '';
    this.exito = '';
    if (!this.origenId) return;

    this.cargandoEstudiantes = true;
    this.matriculasService.obtenerEstudiantesPorParalelo(this.origenId).subscribe({
      next: (matriculas) => {
        this.estudiantes = matriculas;
        this.seleccionados = new Set(matriculas.map((matricula) => matricula.id));
        this.cargandoEstudiantes = false;
      },
      error: (error) => {
        this.error = this.mensajeError(error, 'No se pudieron cargar los estudiantes del paralelo.');
        this.cargandoEstudiantes = false;
      },
    });
  }

  alternarTodos(): void {
    if (this.todosSeleccionados) {
      this.seleccionados.clear();
    } else {
      this.seleccionados = new Set(this.estudiantes.map((matricula) => matricula.id));
    }
  }

  alternarMatricula(matriculaId: string, marcado: boolean): void {
    const nuevaSeleccion = new Set(this.seleccionados);
    marcado ? nuevaSeleccion.add(matriculaId) : nuevaSeleccion.delete(matriculaId);
    this.seleccionados = nuevaSeleccion;
  }

  estaSeleccionada(matriculaId: string): boolean {
    return this.seleccionados.has(matriculaId);
  }

  trasladar(): void {
    const destino = this.destinosCompatibles.find((item) => item.id === this.destinoId);
    if (!this.origenId) { this.error = 'Seleccione el paralelo de origen.'; return; }
    if (!this.destinoId || !destino) { this.error = 'Seleccione un paralelo de destino compatible.'; return; }
    if (this.cantidadSeleccionados === 0) { this.error = 'Seleccione al menos un estudiante.'; return; }
    if (this.cantidadSeleccionados > destino.cuposDisponibles) {
      this.error = `El destino solo tiene ${destino.cuposDisponibles} cupos disponibles.`;
      return;
    }

    const origen = this.origen!;
    if (!confirm(
      `¿Cambiar ${this.cantidadSeleccionados} estudiante(s) del paralelo ${origen.nombre} al ${destino.nombre}?`,
    )) return;

    this.trasladando = true;
    this.error = '';
    this.exito = '';
    this.matriculasService.cambiarParaleloMasivo({
      paraleloOrigenId: this.origenId,
      paraleloDestinoId: this.destinoId,
      matriculaIds: [...this.seleccionados],
    }).subscribe({
      next: (resultado) => {
        this.exito = `${resultado.message} ${resultado.estudiantesRestantesOrigen === 0 ? 'El paralelo de origen ya puede eliminarse.' : `Quedan ${resultado.estudiantesRestantesOrigen} estudiante(s) en el origen.`}`;
        this.trasladando = false;
        this.origenId = '';
        this.destinoId = '';
        this.estudiantes = [];
        this.seleccionados.clear();
        this.cargarParalelos(true);
      },
      error: (error) => {
        this.error = this.mensajeError(error, 'No se pudo completar el cambio de paralelo.');
        this.trasladando = false;
      },
    });
  }

  etiquetaParalelo(paralelo: ParaleloRedistribucion): string {
    const nivel = paralelo.nivel.nombre || `Nivel ${paralelo.nivel.numero}`;
    return `${paralelo.periodoCarrera.periodo.nombre} · ${paralelo.periodoCarrera.carrera.nombre} · ${nivel} · ${paralelo.periodoCarrera.jornada} · ${paralelo.periodoCarrera.centroEstudio.nombre} · Paralelo ${paralelo.nombre}`;
  }

  private mensajeError(error: any, predeterminado: string): string {
    const mensaje = error?.error?.message;
    return Array.isArray(mensaje) ? mensaje.join(' ') : mensaje ?? predeterminado;
  }
}

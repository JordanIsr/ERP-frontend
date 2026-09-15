import {
  Component,
  OnInit,
  inject,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import {
  EstructuraAcademicaService,
} from '../../core/service/estructura-academica.service';

type TipoPeriodo = '' | 'I' | 'II';

interface FormularioPeriodo {
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  estado?: string;
}

@Component({
  selector: 'app-periodos-flujo',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
  ],
  templateUrl: './periodos-flujo.html',
  styleUrl: './periodos-flujo.scss',
})
export class PeriodosFlujo implements OnInit {
  private readonly service =
    inject(EstructuraAcademicaService);

  periodos: any[] = [];

  nuevoPeriodo: FormularioPeriodo = {
    nombre: '',
    fechaInicio: '',
    fechaFin: '',
  };

  anioNuevo = '';
  tipoNuevo: TipoPeriodo = '';

  editandoPeriodoId = '';

  periodoEdit: FormularioPeriodo = {
    nombre: '',
    fechaInicio: '',
    fechaFin: '',
    estado: 'PLANIFICADO',
  };

  anioEdicion = '';
  tipoEdicion: TipoPeriodo = '';

  cargando = true;
  guardando = false;

  error = '';
  mensaje = '';

  ngOnInit(): void {
    this.cargarPeriodos();
  }

  cargarPeriodos(): void {
    this.cargando = true;
    this.error = '';

    this.service.listarPeriodos().subscribe({
      next: (data: any[]) => {
        this.periodos = data;
        this.cargando = false;
      },

      error: (err) => {
        this.error = this.mensajeError(
          err,
          'No se pudieron cargar los periodos.',
        );

        this.cargando = false;
      },
    });
  }

  soloDigitosAnio(
    evento: Event,
    formulario: 'nuevo' | 'edicion',
  ): void {
    const input =
      evento.target as HTMLInputElement;

    const valor = input.value
      .replace(/\D/g, '')
      .slice(0, 4);

    input.value = valor;

    if (formulario === 'nuevo') {
      this.anioNuevo = valor;
      this.actualizarNuevoPeriodo();
      return;
    }

    this.anioEdicion = valor;
    this.actualizarPeriodoEditado();
  }

  actualizarNuevoPeriodo(): void {
    this.nuevoPeriodo.nombre =
      this.generarNombrePeriodo(
        this.anioNuevo,
        this.tipoNuevo,
      );
  }

  actualizarPeriodoEditado(): void {
    this.periodoEdit.nombre =
      this.generarNombrePeriodo(
        this.anioEdicion,
        this.tipoEdicion,
      );
  }

  crearPeriodo(): void {
    this.error = '';
    this.mensaje = '';

    const errorFormulario =
      this.validarSeleccion(
        this.anioNuevo,
        this.tipoNuevo,
      );

    if (errorFormulario) {
      this.error = errorFormulario;
      return;
    }

    this.actualizarNuevoPeriodo();

    const errorFechas = this.validarFechas(
      this.nuevoPeriodo.fechaInicio,
      this.nuevoPeriodo.fechaFin,
    );

    if (errorFechas) {
      this.error = errorFechas;
      return;
    }

    const errorSolapamiento =
      this.validarSolapamiento(
        this.nuevoPeriodo.fechaInicio,
        this.nuevoPeriodo.fechaFin,
      );

    if (errorSolapamiento) {
      this.error = errorSolapamiento;
      return;
    }

    this.guardando = true;

    this.service
      .crearPeriodo(this.nuevoPeriodo)
      .subscribe({
        next: () => {
          this.guardando = false;

          this.limpiarNuevoPeriodo();

          this.mensaje =
            'Periodo académico creado correctamente.';

          this.cargarPeriodos();
        },

        error: (err) => {
          this.guardando = false;

          this.error = this.mensajeError(
            err,
            'No se pudo crear el periodo.',
          );
        },
      });
  }

  activarEdicionPeriodo(
    periodo: any,
  ): void {
    this.error = '';
    this.mensaje = '';

    this.editandoPeriodoId = periodo.id;

    this.anioEdicion = String(
      periodo.nombre,
    ).substring(0, 4);

    this.tipoEdicion = String(
      periodo.nombre,
    ).endsWith('-II')
      ? 'II'
      : 'I';

    this.periodoEdit = {
      nombre: periodo.nombre,
      fechaInicio: periodo.fechaInicio,
      fechaFin: periodo.fechaFin,
      estado: periodo.estado,
    };
  }

  guardarEdicionPeriodo(
    id: string,
  ): void {
    this.error = '';
    this.mensaje = '';

    const errorFormulario =
      this.validarSeleccion(
        this.anioEdicion,
        this.tipoEdicion,
      );

    if (errorFormulario) {
      this.error = errorFormulario;
      return;
    }

    if (!this.periodoEdit.estado) {
      this.error =
        'Debe seleccionar el estado del periodo.';
      return;
    }

    this.actualizarPeriodoEditado();

    const errorFechas = this.validarFechas(
      this.periodoEdit.fechaInicio,
      this.periodoEdit.fechaFin,
    );

    if (errorFechas) {
      this.error = errorFechas;
      return;
    }

    const errorSolapamiento =
      this.validarSolapamiento(
        this.periodoEdit.fechaInicio,
        this.periodoEdit.fechaFin,
        id,
      );

    if (errorSolapamiento) {
      this.error = errorSolapamiento;
      return;
    }

    this.guardando = true;

    this.service
      .editarPeriodo(
        id,
        this.periodoEdit,
      )
      .subscribe({
        next: () => {
          this.guardando = false;

          this.cancelarEdicion();

          this.mensaje =
            'Periodo académico actualizado correctamente.';

          this.cargarPeriodos();
        },

        error: (err) => {
          this.guardando = false;

          this.error = this.mensajeError(
            err,
            'No se pudo actualizar el periodo.',
          );
        },
      });
  }

  cancelarEdicion(): void {
    this.editandoPeriodoId = '';
    this.anioEdicion = '';
    this.tipoEdicion = '';

    this.periodoEdit = {
      nombre: '',
      fechaInicio: '',
      fechaFin: '',
      estado: 'PLANIFICADO',
    };
  }

  eliminarPeriodo(
    periodo: any,
  ): void {
    this.error = '';
    this.mensaje = '';

    const confirmado = confirm(
      `¿Está seguro de eliminar el periodo "${periodo.nombre}"?`,
    );

    if (!confirmado) {
      return;
    }

    this.service
      .eliminarPeriodo(periodo.id)
      .subscribe({
        next: () => {
          this.mensaje =
            `Periodo "${periodo.nombre}" eliminado correctamente.`;

          this.cargarPeriodos();
        },

        error: (err) => {
          this.error = this.mensajeError(
            err,
            'No se puede eliminar porque tiene información relacionada.',
          );
        },
      });
  }

  private validarSeleccion(
    anioTexto: string,
    tipo: TipoPeriodo,
  ): string {
    if (!anioTexto) {
      return 'El año del periodo académico es obligatorio.';
    }

    if (!/^\d{4}$/.test(anioTexto)) {
      return 'El año debe contener exactamente 4 números.';
    }

    const anio = Number(anioTexto);

    if (anio < 2000 || anio > 2100) {
      return 'El año del periodo debe estar entre 2000 y 2100.';
    }

    if (!tipo) {
      return 'Debe seleccionar el periodo académico I o II.';
    }

    return '';
  }

  private generarNombrePeriodo(
    anioTexto: string,
    tipo: TipoPeriodo,
  ): string {
    if (
      !/^\d{4}$/.test(anioTexto) ||
      !tipo
    ) {
      return '';
    }

    const anio = Number(anioTexto);

    if (anio < 2000 || anio > 2100) {
      return '';
    }

    return `${anio}-${tipo}`;
  }

  private validarFechas(
    fechaInicio: string,
    fechaFin: string,
  ): string {
    if (!fechaInicio) {
      return 'La fecha de inicio del periodo es obligatoria.';
    }

    if (!fechaFin) {
      return 'La fecha de finalización del periodo es obligatoria.';
    }

    if (fechaFin <= fechaInicio) {
      return 'La fecha de finalización debe ser posterior a la fecha de inicio.';
    }

    return '';
  }

  private validarSolapamiento(
    fechaInicio: string,
    fechaFin: string,
    excluirId?: string,
  ): string {
    const conflicto = this.periodos.find(
      (periodo) =>
        periodo.id !== excluirId &&
        fechaInicio <= String(periodo.fechaFin).slice(0, 10) &&
        fechaFin >= String(periodo.fechaInicio).slice(0, 10),
    );

    if (!conflicto) {
      return '';
    }

    return (
      `Las fechas seleccionadas se cruzan con el periodo ` +
      `"${conflicto.nombre}", comprendido entre ` +
      `${conflicto.fechaInicio} y ${conflicto.fechaFin}. ` +
      `El siguiente periodo debe comenzar después de que termine el anterior.`
    );
  }

  private limpiarNuevoPeriodo(): void {
    this.anioNuevo = '';
    this.tipoNuevo = '';

    this.nuevoPeriodo = {
      nombre: '',
      fechaInicio: '',
      fechaFin: '',
    };
  }

  private mensajeError(
    error: any,
    predeterminado: string,
  ): string {
    const mensaje =
      error?.error?.message;

    return Array.isArray(mensaje)
      ? mensaje.join(' ')
      : mensaje ?? predeterminado;
  }
}

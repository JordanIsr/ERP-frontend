import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { MatriculasService } from '../../core/service/matriculas.service';
import {
  OfertaInicialSecretaria,
  ParaleloOfertaInicial,
} from '../../core/service/matriculas.service';

@Component({
  selector: 'app-matriculas',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
  ],
  templateUrl: './matriculas.html',
  styleUrls: ['./matriculas.scss'],
})
export class Matriculas implements OnInit {

  private fb = inject(FormBuilder);
  private matriculasService = inject(MatriculasService);

  guardando = false;
  cargandoOferta = true;
  errorGeneral = '';
  mensajeExito = '';
  ofertas: OfertaInicialSecretaria[] = [];
  paralelos: Array<ParaleloOfertaInicial & { periodoCarreraId: string }> = [];
  carreraId = '';
  periodoId = '';
  mallaId = '';
  nivelId = '';
  jornada = '';
  periodoCarreraId = '';
  paraleloId = '';

  matriculaForm = this.fb.group({

    cedula: [
      '',
      [
        Validators.required,
        Validators.pattern(/^[0-9]{10}$/),
      ],
    ],

    nombres: [
      '',
      [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(60),
        Validators.pattern(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:[ '\-][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/),
      ],
    ],

    apellidos: [
      '',
      [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(60),
        Validators.pattern(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:[ '\-][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/),
      ],
    ],

    correo: [
      '',
      [
        Validators.required,
        Validators.email,
      ],
    ],

    telefono: [
      '',
      [
        Validators.required,
        Validators.pattern(/^[0-9]{10}$/),
      ],
    ],

  });

  ngOnInit(): void {
  this.cargarOfertaInicial();
}

private cargarOfertaInicial(): void {
  this.cargandoOferta = true;

  this.matriculasService
    .obtenerOfertaInicial()
    .subscribe({
      next: (ofertas) => {
        this.ofertas = ofertas;
        this.cargandoOferta = false;

        /*
         * Si la secretaria todavía tiene una jornada seleccionada,
         * también reconstruye la lista de paralelos con los cupos
         * actualizados.
         */
        if (this.jornada) {
          this.cambiarJornada();
        }
      },

      error: (error) => {
        this.cargandoOferta = false;

        this.errorGeneral = this.mensajeError(
          error,
          'No se pudo actualizar la información de cupos.',
        );

        window.alert(
          `NO SE PUDIERON ACTUALIZAR LOS CUPOS\n\n` +
          this.errorGeneral,
        );
      },
    });
}

  get carrerasDisponibles(): Array<{ id: string; nombre: string }> {
    return this.unicos(
      this.ofertas.map((oferta) => oferta.carrera),
      (carrera) => carrera.id,
    );
  }

  get periodosDisponibles(): Array<{ id: string; nombre: string; estado: string }> {
    return this.unicos(
      this.ofertas
        .filter((oferta) => oferta.carrera.id === this.carreraId)
        .map((oferta) => oferta.periodo),
      (periodo) => periodo.id,
    );
  }

  get mallasDisponibles(): Array<{ id: string; codigo: string }> {
    return this.unicos(
      this.ofertas
        .filter((oferta) => oferta.carrera.id === this.carreraId && oferta.periodo.id === this.periodoId)
        .map((oferta) => ({
          id: oferta.mallaGeneral?.id ?? oferta.versionMalla.id,
          codigo: oferta.mallaGeneral?.codigo ?? oferta.versionMalla.version,
        })),
      (malla) => malla.id,
    );
  }

  get nivelesDisponibles(): Array<{ id: string; numero: number; nombre?: string }> {
    return this.unicos(
      this.ofertas
        .filter((oferta) =>
          oferta.carrera.id === this.carreraId
          && oferta.periodo.id === this.periodoId
          && (oferta.mallaGeneral?.id ?? oferta.versionMalla.id) === this.mallaId,
        )
        .flatMap((oferta) => oferta.paralelos.map((paralelo) => paralelo.nivel)),
      (nivel) => nivel.id,
    ).sort((a, b) => a.numero - b.numero);
  }

  get jornadasDisponibles(): Array<{
    nombre: string;
    cupoMaximo: number;
    cuposOcupados: number;
    cuposDisponibles: number;
    disponible: boolean;
    motivos: string[];
  }> {
    const agrupadas = new Map<string, {
      nombre: string;
      cupoMaximo: number;
      cuposOcupados: number;
      cuposDisponibles: number;
      disponible: boolean;
      motivos: string[];
    }>();

    for (const oferta of this.ofertas.filter((item) =>
      item.carrera.id === this.carreraId &&
      item.periodo.id === this.periodoId &&
      (item.mallaGeneral?.id ?? item.versionMalla.id) === this.mallaId &&
      item.paralelos.some((paralelo) => paralelo.nivel.id === this.nivelId),
    )) {
      const actual = agrupadas.get(oferta.jornada) ?? {
        nombre: oferta.jornada,
        cupoMaximo: 0,
        cuposOcupados: 0,
        cuposDisponibles: 0,
        disponible: false,
        motivos: [],
      };
      actual.cupoMaximo += oferta.cupoMaximo;
      actual.cuposOcupados += oferta.cuposOcupados;
      actual.cuposDisponibles += oferta.cuposDisponibles;
      actual.disponible = actual.disponible || oferta.disponible;
      if (oferta.motivoNoDisponible && !actual.motivos.includes(oferta.motivoNoDisponible)) {
        actual.motivos.push(oferta.motivoNoDisponible);
      }
      agrupadas.set(oferta.jornada, actual);
    }

    return [...agrupadas.values()];
  }

  cambiarCarrera(): void {
    this.periodoId = '';
    this.mallaId = '';
    this.nivelId = '';
    this.jornada = '';
    this.periodoCarreraId = '';
    this.paraleloId = '';
    this.paralelos = [];
  }

  cambiarPeriodo(): void {
    this.mallaId = '';
    this.nivelId = '';
    this.jornada = '';
    this.periodoCarreraId = '';
    this.paraleloId = '';
    this.paralelos = [];
  }

  cambiarMalla(): void {
    this.nivelId = '';
    this.jornada = '';
    this.periodoCarreraId = '';
    this.paraleloId = '';
    this.paralelos = [];
  }

  cambiarNivel(): void {
    this.jornada = '';
    this.periodoCarreraId = '';
    this.paraleloId = '';
    this.paralelos = [];
  }

  cambiarJornada(): void {
    this.periodoCarreraId = '';
    this.paraleloId = '';
    this.paralelos = this.ofertas
      .filter((oferta) =>
        oferta.carrera.id === this.carreraId
        && oferta.periodo.id === this.periodoId
        && (oferta.mallaGeneral?.id ?? oferta.versionMalla.id) === this.mallaId
        && oferta.jornada === this.jornada,
      )
      .flatMap((oferta) => oferta.paralelos
        .filter((paralelo) => paralelo.nivel.id === this.nivelId)
        .map((paralelo) => ({ ...paralelo, periodoCarreraId: oferta.periodoCarreraId })));
  }

  cambiarParalelo(): void {
    this.periodoCarreraId = this.paraleloSeleccionado?.periodoCarreraId ?? '';
  }

  get ofertaSeleccionada(): OfertaInicialSecretaria | undefined {
    return this.ofertas.find((oferta) => oferta.periodoCarreraId === this.periodoCarreraId);
  }

  get paraleloSeleccionado(): (ParaleloOfertaInicial & { periodoCarreraId: string }) | undefined {
    return this.paralelos.find((paralelo) => paralelo.id === this.paraleloId);
  }

  get mensajeConfiguracionOferta(): string {
    if (this.cargandoOferta || this.errorGeneral || this.ofertas.length > 0) return '';
    return 'No existe una oferta lista para matrícula nueva. Completa en Mallas: malla ACTIVA con asignaturas y docentes activos → oferta del periodo y jornada → paralelo de Nivel 1 con cupos.';
  }

  private unicos<T>(elementos: T[], clave: (elemento: T) => string): T[] {
    return [...new Map(elementos.map((elemento) => [clave(elemento), elemento])).values()];
  }


  // ==============================
  // SOLO NÚMEROS
  // ==============================

  soloNumeros(event: KeyboardEvent): boolean {

    const charCode =
      event.which
        ? event.which
        : event.keyCode;

    if (
      charCode > 31 &&
      (charCode < 48 || charCode > 57)
    ) {

      event.preventDefault();

      return false;
    }

    return true;
  }


  // ==============================
  // LIMITAR A 10 DÍGITOS
  // ==============================

  validarLongitud(
    event: Event,
    controlName: string,
  ): void {

    const input =
      event.target as HTMLInputElement;

    const valorLimpio =
      input.value
        .replace(/[^0-9]/g, '')
        .slice(0, 10);

    input.value = valorLimpio;

    this.matriculaForm
      .get(controlName)
      ?.setValue(valorLimpio);
  }


  // ==============================
  // REGISTRAR
  // ==============================

  registrar(): void {
  this.errorGeneral = '';
  this.mensajeExito = '';

  this.matriculaForm.markAllAsTouched();

  if (
    this.matriculaForm.invalid ||
    !this.carreraId ||
    !this.periodoId ||
    !this.mallaId ||
    !this.nivelId ||
    !this.jornada ||
    !this.periodoCarreraId ||
    !this.paraleloId
  ) {
    this.errorGeneral =
      this.erroresMatricula().join('\n');

    window.alert(this.errorGeneral);
    return;
  }

  const paralelo =
    this.paraleloSeleccionado;

  if (!paralelo?.disponible) {
    this.errorGeneral =
      paralelo?.motivoNoDisponible
      ?? 'El paralelo seleccionado no está disponible para matrícula.';

    window.alert(this.errorGeneral);
    return;
  }

  const datos = {
    cedula:
      this.matriculaForm.value.cedula!,

    nombres:
      this.matriculaForm.value.nombres!,

    apellidos:
      this.matriculaForm.value.apellidos!,

    correo:
      this.matriculaForm.value.correo!,

    telefono:
      this.matriculaForm.value.telefono!,

    periodoCarreraId:
      this.periodoCarreraId,

    paraleloId:
      this.paraleloId,
  };

  this.guardando = true;

  this.matriculasService
    .crearNuevaConEstudiante(datos)
    .subscribe({
      next: () => {
  this.guardando = false;

  this.mensajeExito =
    `Estudiante ${datos.nombres} ${datos.apellidos} ` +
    'matriculado correctamente. Los cupos fueron actualizados.';

  window.alert(
    `MATRÍCULA REGISTRADA\n\n${this.mensajeExito}`,
  );

  /*
   * Primero limpia la selección anterior y después consulta
   * nuevamente los valores reales del backend.
   */
  this.limpiarFormulario(false);
  this.cargarOfertaInicial();
},

      error: (error) => {
        this.guardando = false;

        console.error(
          'Error al registrar estudiante:',
          error,
        );

        if (error.status === 409) {
          this.errorGeneral =
            this.mensajeError(
              error,
              'El estudiante ya existe o ya posee una matrícula para esta oferta académica.',
            );
        } else if (error.status === 400) {
          this.errorGeneral =
            this.mensajeError(
              error,
              'No se pudo matricular porque los datos enviados no son válidos.',
            );
        } else {
          this.errorGeneral =
            this.mensajeError(
              error,
              'No se pudo registrar al estudiante y su matrícula. No se guardó información incompleta.',
            );
        }

        const esErrorDeCupos =
  this.errorGeneral
    .toLowerCase()
    .includes('cupo');

window.alert(
  esErrorDeCupos
    ? `PARALELO SIN CUPOS DISPONIBLES\n\n${this.errorGeneral}`
    : `NO SE PUDO REGISTRAR LA MATRÍCULA\n\n${this.errorGeneral}`,
);
      },
    });
}

  private erroresMatricula(): string[] {
    if (this.ofertas.length === 0) return [this.mensajeConfiguracionOferta];
    const errores: string[] = [];
    const control = (nombre: string) => this.matriculaForm.get(nombre);
    if (control('cedula')?.hasError('required')) errores.push('La cédula es obligatoria.');
    else if (control('cedula')?.invalid) errores.push('La cédula debe contener exactamente 10 dígitos y no puede incluir letras.');
    if (control('nombres')?.hasError('required')) errores.push('Los nombres son obligatorios.');
    else if (control('nombres')?.invalid) errores.push('Los nombres deben tener entre 2 y 60 caracteres y contener solamente letras, espacios, apóstrofes o guiones.');
    if (control('apellidos')?.hasError('required')) errores.push('Los apellidos son obligatorios.');
    else if (control('apellidos')?.invalid) errores.push('Los apellidos deben tener entre 2 y 60 caracteres y contener solamente letras, espacios, apóstrofes o guiones.');
    if (control('correo')?.hasError('required')) errores.push('El correo electrónico es obligatorio.');
    else if (control('correo')?.invalid) errores.push('Ingrese un correo electrónico válido.');
    if (control('telefono')?.hasError('required')) errores.push('El teléfono es obligatorio.');
    else if (control('telefono')?.invalid) errores.push('El teléfono debe contener exactamente 10 dígitos y no puede incluir letras.');
    if (!this.carreraId) errores.push('Debe seleccionar una carrera.');
    if (!this.periodoId) errores.push('Debe seleccionar un periodo académico.');
    if (!this.mallaId) errores.push('Debe seleccionar una malla curricular.');
    if (!this.nivelId) errores.push('Debe seleccionar un nivel.');
    if (!this.jornada) errores.push('Debe seleccionar una jornada.');
    if (!this.periodoCarreraId) errores.push('El paralelo debe pertenecer a una oferta académica válida.');
    if (!this.paraleloId) errores.push('Debe seleccionar un paralelo.');
    return errores;
  }

  // ==============================
  // LIMPIAR
  // ==============================

  limpiarFormulario(limpiarMensajes = true): void {

    this.matriculaForm.reset();

    this.matriculaForm.markAsPristine();
    this.matriculaForm.markAsUntouched();
    this.periodoCarreraId = '';
    this.carreraId = '';
    this.periodoId = '';
    this.mallaId = '';
    this.nivelId = '';
    this.jornada = '';
    this.paraleloId = '';
    this.paralelos = [];
    if (limpiarMensajes) {
      this.errorGeneral = '';
      this.mensajeExito = '';
    }
  }

  private mensajeError(error: any, predeterminado: string): string {
    const mensaje = error?.error?.message;
    return Array.isArray(mensaje) ? mensaje.join(' ') : mensaje ?? predeterminado;
  }

}

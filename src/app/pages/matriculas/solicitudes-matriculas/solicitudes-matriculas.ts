import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MatriculasService,
  OpcionesMatriculaResponse,
  OpcionMatricula,
  TipoDocumentoMatricula,
} from '../../../core/service/matriculas.service';
import {
  SolicitudMatricula,
  SolicitudesMatriculaService,
} from '../../../core/service/solicitudes-matricula.service';

const TIPOS_DOCUMENTO = {
  CEDULA: 'CEDULA',
  CERTIFICADO_NO_ADEUDAR:
    'CERTIFICADO_NO_ADEUDAR',
  COMPROBANTE_PAGO: 'COMPROBANTE_PAGO',
} as const;

@Component({
  selector: 'app-solicitudes-matriculas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './solicitudes-matriculas.html',
  styleUrls: ['./solicitudes-matriculas.scss'],
})
export class SolicitudesMatriculas implements OnInit {
  private readonly matriculasService =
    inject(MatriculasService);

  private readonly solicitudesService =
    inject(SolicitudesMatriculaService);

  cargando = true;
  enviando = false;

  errorGeneral = '';
  mensajeExito = '';

  informacionOpciones: OpcionesMatriculaResponse | null =
    null;

  solicitudActual: SolicitudMatricula | null = null;

  opcionSeleccionada: OpcionMatricula | null = null;

  archivoCedula: File | null = null;
  archivoRespaldo: File | null = null;

  archivosReenvio: Partial<
    Record<TipoDocumentoMatricula, File>
  > = {};

  erroresArchivo: Partial<
    Record<TipoDocumentoMatricula, string>
  > = {};

  readonly maximoArchivo = 5 * 1024 * 1024;
  readonly TipoDocumentoMatricula =
    TIPOS_DOCUMENTO;

  ngOnInit(): void {
    this.cargarInformacion();
  }

  cargarInformacion(): void {
    this.cargando = true;
    this.errorGeneral = '';

    this.solicitudesService
      .obtenerMisSolicitudes()
      .subscribe({
        next: (solicitudes) => {
          /*
           * Una solicitud APROBADA de un periodo anterior pertenece
           * al historial y no debe bloquear la solicitud del siguiente.
           */
          this.solicitudActual = solicitudes.find(
            (solicitud) =>
              solicitud.estado === 'PENDIENTE' ||
              (solicitud.estado === 'RECHAZADA' &&
                solicitud.puedeReenviar),
          ) ?? null;

          this.cargarOpciones();
        },
        error: () => {
          this.solicitudActual = null;
          this.cargarOpciones();
        },
      });
  }

  private cargarOpciones(): void {
    this.matriculasService
      .obtenerOpcionesPermitidas()
      .subscribe({
        next: (respuesta) => {
          this.informacionOpciones = respuesta;

          if (respuesta.opciones.length === 1) {
            this.opcionSeleccionada =
              respuesta.opciones[0];
          }

          this.cargando = false;
        },
        error: (error) => {
          this.errorGeneral =
            this.obtenerMensajeError(
              error,
              'No se pudo cargar la información de matrícula.',
            );

          this.cargando = false;
        },
      });
  }

  seleccionarOpcion(
    opcion: OpcionMatricula,
  ): void {
    this.opcionSeleccionada = opcion;
    this.errorGeneral = '';
  }

  seleccionarCedula(event: Event): void {
    const archivo =
      this.obtenerArchivoDesdeEvento(event);

    this.erroresArchivo[
      TIPOS_DOCUMENTO.CEDULA
    ] = '';

    if (
      archivo &&
      !this.validarArchivo(
        archivo,
        TIPOS_DOCUMENTO.CEDULA,
      )
    ) {
      this.archivoCedula = null;
      return;
    }

    this.archivoCedula = archivo;
  }

  seleccionarRespaldo(event: Event): void {
    const archivo =
      this.obtenerArchivoDesdeEvento(event);

    const tipo:
      | TipoDocumentoMatricula
      | null
      | undefined =
      this.informacionOpciones
        ?.documentoRequerido;

    if (
      !tipo ||
      tipo === TIPOS_DOCUMENTO.CEDULA
    ) {
      this.errorGeneral =
        'No se pudo determinar el documento de respaldo requerido.';
      return;
    }

    this.erroresArchivo[tipo] = '';

    if (
      archivo &&
      !this.validarArchivo(archivo, tipo)
    ) {
      this.archivoRespaldo = null;
      return;
    }

    this.archivoRespaldo = archivo;
  }

  seleccionarArchivoReenvio(
    event: Event,
    tipo: TipoDocumentoMatricula,
  ): void {
    const archivo =
      this.obtenerArchivoDesdeEvento(event);

    this.erroresArchivo[tipo] = '';

    if (
      archivo &&
      !this.validarArchivo(archivo, tipo)
    ) {
      delete this.archivosReenvio[tipo];
      return;
    }

    if (archivo) {
      this.archivosReenvio[tipo] = archivo;
    } else {
      delete this.archivosReenvio[tipo];
    }
  }

  private obtenerArchivoDesdeEvento(
    event: Event,
  ): File | null {
    const input =
      event.target as HTMLInputElement;

    return input.files?.[0] ?? null;
  }

  private validarArchivo(
    archivo: File,
    tipo: TipoDocumentoMatricula,
  ): boolean {
    const nombre =
      archivo.name.toLowerCase();

    const esPdf =
      archivo.type === 'application/pdf' &&
      nombre.endsWith('.pdf');

    if (!esPdf) {
      this.erroresArchivo[tipo] =
        'El documento debe ser un archivo PDF.';
      return false;
    }

    if (archivo.size > this.maximoArchivo) {
      this.erroresArchivo[tipo] =
        'El documento no puede superar los 5 MB.';
      return false;
    }

    return true;
  }

  enviarSolicitud(): void {
    this.errorGeneral = '';
    this.mensajeExito = '';

    const tipoRespaldo:
      | TipoDocumentoMatricula
      | null
      | undefined =
      this.informacionOpciones
        ?.documentoRequerido;

    if (!this.opcionSeleccionada) {
      this.errorGeneral =
        'Selecciona una opción de matrícula.';
      return;
    }

    if (!this.archivoCedula) {
      this.erroresArchivo[
        TIPOS_DOCUMENTO.CEDULA
      ] = 'Debes subir la copia de cédula.';
      return;
    }

    if (
      !tipoRespaldo ||
      tipoRespaldo === TIPOS_DOCUMENTO.CEDULA
    ) {
      this.errorGeneral =
        'No se pudo determinar el documento de respaldo requerido.';
      return;
    }

    if (!this.archivoRespaldo) {
      this.erroresArchivo[tipoRespaldo] =
        `Debes subir ${this.nombreDocumento(
          tipoRespaldo,
        ).toLowerCase()}.`;

      return;
    }

    this.enviando = true;

    this.solicitudesService
      .crear(
        this.opcionSeleccionada.periodoCarreraId,
        this.opcionSeleccionada.paralelo.id,
        this.archivoCedula,
        this.archivoRespaldo,
        tipoRespaldo,
      )
      .subscribe({
        next: (solicitud) => {
          this.solicitudActual = solicitud;
          this.mensajeExito =
            'La solicitud fue enviada correctamente.';
          this.enviando = false;
        },
        error: (error) => {
          this.errorGeneral =
            this.obtenerMensajeError(
              error,
              'No se pudo enviar la solicitud.',
            );

          this.enviando = false;
        },
      });
  }

  reenviarSolicitud(): void {
    if (!this.solicitudActual) {
      return;
    }

    this.errorGeneral = '';
    this.mensajeExito = '';

    const tiposRechazados =
      this.obtenerTiposRechazados();

    const faltaDocumento =
      tiposRechazados.some(
        (tipo) =>
          !this.archivosReenvio[tipo],
      );

    if (faltaDocumento) {
      this.errorGeneral =
        'Debes reemplazar todos los documentos rechazados.';
      return;
    }

    const cedula =
      this.archivosReenvio[
        TIPOS_DOCUMENTO.CEDULA
      ];

    const certificadoNoAdeudar =
      this.archivosReenvio[
        TIPOS_DOCUMENTO
          .CERTIFICADO_NO_ADEUDAR
      ];

    const comprobantePago =
      this.archivosReenvio[
        TIPOS_DOCUMENTO
          .COMPROBANTE_PAGO
      ];

    this.enviando = true;

    this.solicitudesService
      .reenviar(
        this.solicitudActual.id,
        {
          cedula,
          certificadoNoAdeudar,
          comprobantePago,
        },
      )
      .subscribe({
        next: (solicitud) => {
          this.solicitudActual = solicitud;
          this.archivosReenvio = {};

          this.mensajeExito =
            'Los documentos fueron reenviados correctamente.';

          this.enviando = false;
        },
        error: (error) => {
          this.errorGeneral =
            this.obtenerMensajeError(
              error,
              'No se pudieron reenviar los documentos.',
            );

          this.enviando = false;
        },
      });
  }

  obtenerTiposRechazados():
    TipoDocumentoMatricula[] {
    if (!this.solicitudActual) {
      return [];
    }

    return this.solicitudActual.documentos
      .filter(
        (documento) =>
          documento.estado === 'RECHAZADO',
      )
      .map(
        (documento) =>
          documento.tipo,
      );
  }

  tieneDocumentoRechazado(
    tipo: TipoDocumentoMatricula,
  ): boolean {
    return this.obtenerTiposRechazados()
      .includes(tipo);
  }

  nombreDocumento(
    tipo: TipoDocumentoMatricula | null | undefined,
  ): string {
    if (!tipo) {
      return 'Documento de respaldo';
    }
    const nombres: Record<
      TipoDocumentoMatricula,
      string
    > = {
      CEDULA: 'Copia de cédula',
      CERTIFICADO_NO_ADEUDAR:
        'Certificado de no adeudar',
      COMPROBANTE_PAGO: 'Comprobante de pago',
    };

    return nombres[tipo];
  }

  errorDocumento(
    tipo: TipoDocumentoMatricula | null | undefined,
  ): string {
    return tipo ? this.erroresArchivo[tipo] ?? '' : '';
  }

  nombreEstado(estado: string): string {
    const nombres: Record<string, string> = {
      PENDIENTE: 'Pendiente de revisión',
      APROBADA: 'Aprobada',
      RECHAZADA: 'Rechazada',
    };

    return nombres[estado] ?? estado;
  }

  claseEstado(estado: string): string {
    return estado.toLowerCase();
  }

  formatearFecha(
    fecha?: string,
  ): string {
    if (!fecha) {
      return 'Sin fecha';
    }

    return new Date(fecha).toLocaleString(
      'es-EC',
      {
        dateStyle: 'medium',
        timeStyle: 'short',
      },
    );
  }

  private obtenerMensajeError(
    error: any,
    mensajePredeterminado: string,
  ): string {
    const mensaje = error?.error?.message;

    if (Array.isArray(mensaje)) {
      return mensaje.join(' ');
    }

    return mensaje ?? mensajePredeterminado;
  }
}

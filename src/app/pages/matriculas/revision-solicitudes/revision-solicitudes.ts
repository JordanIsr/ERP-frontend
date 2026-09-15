import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  DocumentoMatricula,
  EstadoSolicitud,
  SolicitudMatricula,
  SolicitudesMatriculaService,
} from '../../../core/service/solicitudes-matricula.service';

@Component({
  selector: 'app-revision-solicitudes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './revision-solicitudes.html',
  styleUrls: ['./revision-solicitudes.scss'],
})
export class RevisionSolicitudes implements OnInit {
  private readonly service = inject(SolicitudesMatriculaService);

  solicitudes: SolicitudMatricula[] = [];
  solicitudSeleccionada: SolicitudMatricula | null = null;
  cargando = false;
  procesandoId = '';
  error = '';
  exito = '';
  busqueda = '';
  estado: EstadoSolicitud | '' = 'PENDIENTE';
  motivos: Record<string, string> = {};

  readonly apiBase = 'http://localhost:3000';

  get esSecretaria(): boolean {
    return localStorage.getItem('user_role') === 'secretaria';
  }

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.error = '';
    this.service.listar({
      estado: this.estado || undefined,
      busqueda: this.busqueda.trim() || undefined,
    }).subscribe({
      next: (solicitudes) => {
        this.solicitudes = solicitudes;
        if (this.solicitudSeleccionada) {
          this.solicitudSeleccionada = solicitudes.find(
            (item) => item.id === this.solicitudSeleccionada?.id,
          ) ?? null;
        }
        this.cargando = false;
      },
      error: (error) => {
        this.error = this.mensajeError(error, 'No se pudieron cargar las solicitudes.');
        this.cargando = false;
      },
    });
  }

  seleccionar(solicitud: SolicitudMatricula): void {
    this.solicitudSeleccionada = solicitud;
    this.error = '';
    this.exito = '';
  }

  urlDocumento(documento: DocumentoMatricula): string {
    if (documento.archivoUrl.startsWith('http')) {
      return documento.archivoUrl;
    }
    return `${this.apiBase}${documento.archivoUrl}`;
  }

  nombreDocumento(tipo: string): string {
    return ({
      CEDULA: 'Copia de cédula',
      CERTIFICADO_NO_ADEUDAR: 'Certificado de no adeudar',
      COMPROBANTE_PAGO: 'Comprobante de pago',
    } as Record<string, string>)[tipo] ?? tipo;
  }

  aprobarDocumento(documento: DocumentoMatricula): void {
    if (!confirm(`¿Aprobar ${this.nombreDocumento(documento.tipo)}?`)) return;
    this.procesandoId = documento.id;
    this.limpiarMensajes();
    this.service.aprobarDocumento(documento.id).subscribe({
      next: () => {
        this.exito = 'Documento aprobado correctamente.';
        this.procesandoId = '';
        this.cargar();
      },
      error: (error) => {
        this.error = this.mensajeError(error, 'No se pudo aprobar el documento.');
        this.procesandoId = '';
      },
    });
  }

  rechazarDocumento(documento: DocumentoMatricula): void {
    const motivo = (this.motivos[documento.id] ?? '').trim();
    if (motivo.length < 5) {
      this.error = 'Escribe un motivo de rechazo de al menos 5 caracteres.';
      return;
    }
    if (!confirm(`¿Rechazar ${this.nombreDocumento(documento.tipo)}?`)) return;
    this.procesandoId = documento.id;
    this.limpiarMensajes();
    this.service.rechazarDocumento(documento.id, motivo).subscribe({
      next: () => {
        this.exito = 'Documento rechazado. El estudiante podrá reemplazarlo.';
        this.procesandoId = '';
        this.solicitudSeleccionada = null;
        this.cargar();
      },
      error: (error) => {
        this.error = this.mensajeError(error, 'No se pudo rechazar el documento.');
        this.procesandoId = '';
      },
    });
  }

  get documentosAprobados(): boolean {
    const documentos = this.solicitudSeleccionada?.documentos ?? [];
    return documentos.length > 0 && documentos.every((item) => item.estado === 'APROBADO');
  }

  aprobarSolicitud(): void {
    const solicitud = this.solicitudSeleccionada;
    if (!solicitud || !this.documentosAprobados) {
      this.error = 'Primero debes aprobar todos los documentos requeridos.';
      return;
    }
    if (!confirm('¿Aprobar la solicitud y crear la matrícula oficial?')) return;
    this.procesandoId = solicitud.id;
    this.limpiarMensajes();
    this.service.aprobar(solicitud.id).subscribe({
      next: () => {
        this.exito = 'Solicitud aprobada y matrícula creada correctamente.';
        this.procesandoId = '';
        this.solicitudSeleccionada = null;
        this.cargar();
      },
      error: (error) => {
        this.error = this.mensajeError(error, 'No se pudo aprobar la matrícula.');
        this.procesandoId = '';
      },
    });
  }

  nombreEstudiante(solicitud: SolicitudMatricula): string {
    return `${solicitud.estudiante?.nombres ?? ''} ${solicitud.estudiante?.apellidos ?? ''}`.trim();
  }

  private limpiarMensajes(): void {
    this.error = '';
    this.exito = '';
  }

  private mensajeError(error: any, predeterminado: string): string {
    const mensaje = error?.error?.message;
    return Array.isArray(mensaje) ? mensaje.join(' ') : mensaje ?? predeterminado;
  }

}

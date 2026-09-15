import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TipoDocumentoMatricula } from './matriculas.service';

export type EstadoSolicitud =
  | 'PENDIENTE'
  | 'APROBADA'
  | 'RECHAZADA';

export type EstadoDocumento =
  | 'PENDIENTE'
  | 'APROBADO'
  | 'RECHAZADO';

export interface DocumentoMatricula {
  id: string;

  tipo: TipoDocumentoMatricula;

  archivoUrl: string;

  estado: EstadoDocumento;

  motivoRechazo?: string | null;

  fechaSubida: string;

  fechaRevision?: string | null;

  revisadoPor?: {
    id: string;
    nombre: string;
  } | null;
}

export interface SolicitudMatricula {
  id: string;
  estudiante: any;
  periodoCarrera: any;
  paralelo: any;

  documentos: DocumentoMatricula[];

  matricula?: any;

  estado: EstadoSolicitud;

  motivoRechazo?: string | null;

  puedeReenviar: boolean;

  fechaEnvio: string;
  fechaActualizacion: string;
}

export interface ArchivosReenvio {
  cedula?: File;
  certificadoNoAdeudar?: File;
  comprobantePago?: File;
}

@Injectable({
  providedIn: 'root',
})
export class SolicitudesMatriculaService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl =
    'http://localhost:3000/api/solicitudes-matricula';

  crear(
    periodoCarreraId: string,
    paraleloId: string,
    cedula: File,
    respaldo: File,
    tipoRespaldo:
      | 'CERTIFICADO_NO_ADEUDAR'
      | 'COMPROBANTE_PAGO',
  ): Observable<SolicitudMatricula> {
    const formData = new FormData();

    formData.append(
      'periodoCarreraId',
      periodoCarreraId,
    );

    formData.append(
      'paraleloId',
      paraleloId,
    );

    formData.append(
      'cedula',
      cedula,
    );

    if (
      tipoRespaldo ===
      'CERTIFICADO_NO_ADEUDAR'
    ) {
      formData.append(
        'certificadoNoAdeudar',
        respaldo,
      );
    } else {
      formData.append(
        'comprobantePago',
        respaldo,
      );
    }

    return this.http.post<SolicitudMatricula>(
      this.apiUrl,
      formData,
    );
  }

  reenviar(
    solicitudId: string,
    archivos: ArchivosReenvio,
  ): Observable<SolicitudMatricula> {
    const formData = new FormData();

    if (archivos.cedula) {
      formData.append(
        'cedula',
        archivos.cedula,
      );
    }

    if (archivos.certificadoNoAdeudar) {
      formData.append(
        'certificadoNoAdeudar',
        archivos.certificadoNoAdeudar,
      );
    }

    if (archivos.comprobantePago) {
      formData.append(
        'comprobantePago',
        archivos.comprobantePago,
      );
    }

    return this.http.patch<SolicitudMatricula>(
      `${this.apiUrl}/${solicitudId}/reenviar`,
      formData,
    );
  }

  obtenerMisSolicitudes():
    Observable<SolicitudMatricula[]> {
    return this.http.get<SolicitudMatricula[]>(
      `${this.apiUrl}/mias`,
    );
  }

  obtenerMiMatricula():
    Observable<SolicitudMatricula> {
    return this.http.get<SolicitudMatricula>(
      `${this.apiUrl}/mi-matricula`,
    );
  }

  listar(
    filtros?: {
      periodoCarreraId?: string;
      carreraId?: string;
      periodoId?: string;
      paraleloId?: string;
      estado?: EstadoSolicitud;
      busqueda?: string;
    },
  ): Observable<SolicitudMatricula[]> {
    let params = new HttpParams();

    if (filtros?.periodoCarreraId) {
      params = params.set(
        'periodoCarreraId',
        filtros.periodoCarreraId,
      );
    }

    if (filtros?.carreraId) {
      params = params.set(
        'carreraId',
        filtros.carreraId,
      );
    }

    if (filtros?.periodoId) {
      params = params.set(
        'periodoId',
        filtros.periodoId,
      );
    }

    if (filtros?.paraleloId) {
      params = params.set(
        'paraleloId',
        filtros.paraleloId,
      );
    }

    if (filtros?.estado) {
      params = params.set(
        'estado',
        filtros.estado,
      );
    }

    if (filtros?.busqueda) {
      params = params.set(
        'busqueda',
        filtros.busqueda,
      );
    }

    return this.http.get<SolicitudMatricula[]>(
      this.apiUrl,
      { params },
    );
  }

  listarPendientes():
    Observable<SolicitudMatricula[]> {
    return this.http.get<SolicitudMatricula[]>(
      `${this.apiUrl}/pendientes`,
    );
  }

  aprobar(
    solicitudId: string,
  ): Observable<any> {
    return this.http.patch(
      `${this.apiUrl}/${solicitudId}/aprobar`,
      {},
    );
  }

  aprobarDocumento(
    documentoId: string,
  ): Observable<DocumentoMatricula> {
    return this.http.patch<DocumentoMatricula>(
      `http://localhost:3000/api/documentos-matricula/${documentoId}/aprobar`,
      {},
    );
  }

  rechazarDocumento(
    documentoId: string,
    motivo: string,
  ): Observable<any> {
    return this.http.patch(
      `http://localhost:3000/api/documentos-matricula/${documentoId}/rechazar`,
      { motivo },
    );
  }
}

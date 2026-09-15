import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type TipoNota = 'PARCIAL_1' | 'PARCIAL_2' | 'RECUPERACION';

export interface AsignacionDocente {
  id: string;
  paralelo: {
    id: string;
    nombre: string;
    nivel: { id: string; numero: number; nombre?: string };
    periodoCarrera: {
      id: string;
      jornada: string;
      periodo: { id: string; nombre: string };
      carrera: { id: string; nombre: string };
      versionMalla: { id: string; nombre: string; version: string };
      centroEstudio?: { id: string; nombre: string };
    };
  };
  detalleMalla: {
    id: string;
    asignatura: { id: string; codigo: string; nombre: string };
  };
}

export interface DetalleCalificacion {
  id: string;
  esRepeticion: boolean;
  notaParcial1: number | null;
  notaParcial2: number | null;
  notaRecuperacion: number | null;
  promedioFinal: number | null;
  estado: 'CURSANDO' | 'APROBADA' | 'REPROBADA';
  matricula: {
    id: string;
    estado: 'ACTIVA' | 'FINALIZADA' | 'ANULADA';
    estudiante: {
      id: string;
      cedula: string;
      nombres: string;
      apellidos: string;
    };
  };
  asignaturaParalelo: AsignacionDocente;
}

export interface CorreccionCalificacion {
  id: string;
  tipoNota: TipoNota;
  valorAnterior: number | null;
  valorNuevo: number;
  motivo: string;
  fechaCorreccion: string;
  corregidoPor?: { nombre: string; email: string };
  matriculaAsignatura?: any;
}

@Injectable({ providedIn: 'root' })
export class CalificacionesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/calificaciones';

  misAsignaturas(): Observable<AsignacionDocente[]> {
    return this.http.get<AsignacionDocente[]>(`${this.apiUrl}/mis-asignaturas`);
  }

  estudiantesPorAsignatura(asignaturaParaleloId: string): Observable<DetalleCalificacion[]> {
    return this.http.get<DetalleCalificacion[]>(
      `${this.apiUrl}/asignaturas/${asignaturaParaleloId}/estudiantes`,
    );
  }

  registrar(detalleId: string, tipoNota: TipoNota, nota: number): Observable<DetalleCalificacion> {
    return this.http.patch<DetalleCalificacion>(`${this.apiUrl}/${detalleId}/registrar`, {
      tipoNota,
      nota,
    });
  }

  corregir(detalleId: string, tipoNota: TipoNota, nota: number, motivo: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${detalleId}/corregir`, {
      tipoNota,
      nota,
      motivo,
    });
  }

  historialCorrecciones(detalleId: string): Observable<CorreccionCalificacion[]> {
    return this.http.get<CorreccionCalificacion[]>(`${this.apiUrl}/${detalleId}/correcciones`);
  }

  reporteCorrecciones(): Observable<CorreccionCalificacion[]> {
    return this.http.get<CorreccionCalificacion[]>(`${this.apiUrl}/correcciones/reporte`);
  }
}

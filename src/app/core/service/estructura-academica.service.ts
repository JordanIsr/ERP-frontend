import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class EstructuraAcademicaService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api';

  private headers(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  // ---------- MALLA GENERAL JERÁRQUICA ----------
  listarMallasGenerales(): Observable<any> {
    return this.http.get(`${this.apiUrl}/mallas-generales`, { headers: this.headers() });
  }
  obtenerMallaGeneral(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/mallas-generales/${id}`, { headers: this.headers() });
  }
  crearMallaGeneral(data: { codigo: string; fechaInicio: string; duracionAnios: number }): Observable<any> {
    return this.http.post(`${this.apiUrl}/mallas-generales`, data, { headers: this.headers() });
  }
  editarMallaGeneral(id: string, data: { codigo?: string; fechaInicio?: string; duracionAnios?: number }): Observable<any> {
    return this.http.patch(`${this.apiUrl}/mallas-generales/${id}`, data, { headers: this.headers() });
  }
  reabrirPlanificacionMalla(
  id: string,
): Observable<any> {
  return this.http.patch(
    `${this.apiUrl}/mallas-generales/${id}/reabrir-planificacion`,
    {},
    {
      headers: this.headers(),
    },
  );
}
  activarMallaGeneral(id: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/mallas-generales/${id}/activar`, {}, { headers: this.headers() });
  }
  eliminarMallaGeneral(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/mallas-generales/${id}`, { headers: this.headers() });
  }
  agregarCarreraMalla(mallaId: string, data: { nombre: string; codigo: string; cantidadNiveles: number }): Observable<any> {
    return this.http.post(`${this.apiUrl}/mallas-generales/${mallaId}/carreras`, data, { headers: this.headers() });
  }
  editarCarreraMalla(mallaId: string, carreraId: string, data: { nombre?: string; codigo?: string; cantidadNiveles?: number }): Observable<any> {
    return this.http.patch(`${this.apiUrl}/mallas-generales/${mallaId}/carreras/${carreraId}`, data, { headers: this.headers() });
  }
  eliminarCarreraMalla(mallaId: string, carreraId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/mallas-generales/${mallaId}/carreras/${carreraId}`, { headers: this.headers() });
  }

  // ---------- CARRERAS ----------
  listarCarreras(): Observable<any> {
    return this.http.get(`${this.apiUrl}/carreras`, { headers: this.headers() });
  }
  crearCarrera(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/carreras`, data, { headers: this.headers() });
  }
  editarCarrera(id: string, data: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/carreras/${id}`, data, { headers: this.headers() });
  }
  eliminarCarrera(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/carreras/${id}`, { headers: this.headers() });
  }
  // En tu EstructuraAcademicaService agrega:
  obtenerDetalleCompletoCarrera(carreraId: string): Observable<any> {
  return this.http.get<any>(`${this.apiUrl}/carreras/${carreraId}/detalle-completo`);
  }

  // ---------- PERIODOS ----------
  listarPeriodos(): Observable<any> {
    return this.http.get(`${this.apiUrl}/periodos`, { headers: this.headers() });
  }
  crearPeriodo(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/periodos`, data, { headers: this.headers() });
  }
  editarPeriodo(id: string, data: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/periodos/${id}`, data, { headers: this.headers() });
  }
  eliminarPeriodo(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/periodos/${id}`, { headers: this.headers() });
  }

  // ---------- DOCENTES ----------
  listarDocentes(filtros?: { buscar?: string; estado?: 'ACTIVO' | 'INACTIVO' | '' }): Observable<any> {
    const params = new URLSearchParams();
    if (filtros?.buscar?.trim()) params.set('buscar', filtros.buscar.trim());
    if (filtros?.estado) params.set('estado', filtros.estado);
    const query = params.toString();
    return this.http.get(`${this.apiUrl}/docentes${query ? `?${query}` : ''}`, { headers: this.headers() });
  }
  crearDocente(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/docentes`, data, { headers: this.headers() });
  }
  editarDocente(id: string, data: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/docentes/${id}`, data, { headers: this.headers() });
  }
  eliminarDocente(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/docentes/${id}`, { headers: this.headers() });
  }

  // ---------- VERSIONES DE MALLA ----------
   crearMallaRapida(data: any): Observable<any> {
  return this.http.post(`${this.apiUrl}/mallas/crear-rapida`, data, { headers: this.headers() });
  }
  listarVersionesMalla(carreraId?: string): Observable<any> {
    const url = carreraId
      ? `${this.apiUrl}/versiones-malla?carreraId=${carreraId}`
      : `${this.apiUrl}/versiones-malla`;
    return this.http.get(url, { headers: this.headers() });
  }
  crearVersionMalla(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/versiones-malla`, data, { headers: this.headers() });
  }
  editarVersionMalla(id: string, data: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/versiones-malla/${id}`, data, { headers: this.headers() });
  }
  activarVersionMalla(id: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/versiones-malla/${id}/activar`, {}, { headers: this.headers() });
  }
  eliminarVersionMalla(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/versiones-malla/${id}`, { headers: this.headers() });
  }

  // ---------- NIVELES ----------
  listarNiveles(versionMallaId?: string): Observable<any> {
    const url = versionMallaId
      ? `${this.apiUrl}/niveles?versionMallaId=${versionMallaId}`
      : `${this.apiUrl}/niveles`;
    return this.http.get(url, { headers: this.headers() });
  }
  crearNivel(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/niveles`, data, { headers: this.headers() });
  }
  editarNivel(id: string, data: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/niveles/${id}`, data, { headers: this.headers() });
  }
  eliminarNivel(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/niveles/${id}`, { headers: this.headers() });
  }

  // ---------- DETALLE MALLA ----------
  listarDetalleMalla(nivelId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/detalle-malla?nivelId=${nivelId}`, { headers: this.headers() });
  }
  agregarAsignaturaANivel(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/detalle-malla`, data, { headers: this.headers() });
  }
  crearAsignaturaEnNivel(data: { nivelId: string; codigo: string; nombre: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/detalle-malla/asignatura`, data, { headers: this.headers() });
  }
  editarAsignaturaEnNivel(detalleId: string, data: { codigo: string; nombre: string }): Observable<any> {
    return this.http.patch(`${this.apiUrl}/detalle-malla/${detalleId}/asignatura`, data, { headers: this.headers() });
  }
  moverAsignaturaDeNivel(detalleId: string, nivelId: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/detalle-malla/${detalleId}/mover`, { nivelId }, { headers: this.headers() });
  }
  quitarAsignaturaDeNivel(detalleId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/detalle-malla/${detalleId}`, { headers: this.headers() });
  }

  // ---------- PERIODO-CARRERA ----------
  listarPeriodoCarrera(filtros?: { periodoId?: string; carreraId?: string; versionMallaId?: string; estado?: string }): Observable<any> {
    const params = new URLSearchParams();
    if (filtros?.periodoId) params.set('periodoId', filtros.periodoId);
    if (filtros?.carreraId) params.set('carreraId', filtros.carreraId);
    if (filtros?.versionMallaId) params.set('versionMallaId', filtros.versionMallaId);
    if (filtros?.estado) params.set('estado', filtros.estado);
    const qs = params.toString();
    return this.http.get(`${this.apiUrl}/periodo-carrera${qs ? '?' + qs : ''}`, { headers: this.headers() });
  }
  crearPeriodoCarrera(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/periodo-carrera`, data, { headers: this.headers() });
  }
  desactivarPeriodoCarrera(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/periodo-carrera/${id}`, { headers: this.headers() });
  }

  // ---------- CENTROS DE ESTUDIO ----------
  listarCentrosEstudio(): Observable<any> {
    return this.http.get(`${this.apiUrl}/centros-estudio`, { headers: this.headers() });
  }
  crearCentroEstudio(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/centros-estudio`, data, { headers: this.headers() });
  }
  editarCentroEstudio(id: string, data: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/centros-estudio/${id}`, data, { headers: this.headers() });
  }
  eliminarCentroEstudio(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/centros-estudio/${id}`, { headers: this.headers() });
  }

  // ---------- PARALELOS ----------
  listarParalelos(periodoCarreraId?: string, nivelId?: string): Observable<any> {
    const params = new URLSearchParams();
    if (periodoCarreraId) params.set('periodoCarreraId', periodoCarreraId);
    if (nivelId) params.set('nivelId', nivelId);
    const query = params.toString();
    const url = `${this.apiUrl}/paralelos${query ? `?${query}` : ''}`;
    return this.http.get(url, { headers: this.headers() });
  }
  crearParalelo(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/paralelos`, data, { headers: this.headers() });
  }
  editarParalelo(id: string, data: { nombre?: string; cupoMinimo?: number; cupoMaximo?: number }): Observable<any> {
    return this.http.patch(`${this.apiUrl}/paralelos/${id}`, data, { headers: this.headers() });
  }
  eliminarParalelo(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/paralelos/${id}`, { headers: this.headers() });
  }

  // ---------- ASIGNATURA-PARALELO ----------
  listarAsignaturaParalelo(paraleloId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/asignatura-paralelo?paraleloId=${paraleloId}`, { headers: this.headers() });
  }
  agregarAsignaturaAParalelo(data: { paraleloId: string; detalleMallaId: string; docenteId: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/asignatura-paralelo`, data, { headers: this.headers() });
  }

  cambiarDocenteAsignaturaParalelo(
  asignaturaParaleloId: string,
  data: {
    docenteId: string;
    motivo: string;
  },
): Observable<any> {
  return this.http.patch(
    `${this.apiUrl}/asignatura-paralelo/${asignaturaParaleloId}/docente`,
    data,
    {
      headers: this.headers(),
    },
  );
}

historialDocentesAsignatura(
  asignaturaParaleloId: string,
): Observable<any> {
  return this.http.get(
    `${this.apiUrl}/asignatura-paralelo/${asignaturaParaleloId}/historial-docentes`,
    {
      headers: this.headers(),
    },
  );
}

  quitarAsignaturaDeParalelo(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/asignatura-paralelo/${id}`, { headers: this.headers() });
  }
}

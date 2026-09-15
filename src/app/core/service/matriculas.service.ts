import { Injectable, inject } from '@angular/core';

import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type TipoMatricula =
  | 'NUEVA'
  | 'REGULAR'
  | 'REPETICION'
  | 'REINICIO_MALLA';

export type TipoDocumentoMatricula =
  | 'CEDULA'
  | 'CERTIFICADO_NO_ADEUDAR'
  | 'COMPROBANTE_PAGO';

export interface MateriaOpcionMatricula {
  asignaturaParaleloId: string;
  asignaturaId: string;
  codigo: string;
  nombre: string;
  docente: string;
  esRepeticion?: boolean;
}

export interface CrearMatriculaSecretaria {
  estudianteId: string;
  periodoCarreraId: string;
  paraleloId: string;
  tipo: 'NUEVA';
}

export interface ParaleloOfertaInicial {
  id: string;
  nombre: string;
  nivel: { id: string; numero: number; nombre?: string };
  cupoMinimo: number;
  cupoMaximo: number;
  cuposOcupados: number;
  cuposDisponibles: number;
  materiasConfiguradas: number;
  materiasRequeridas: number;
  docentesPendientes: number;
  disponible: boolean;
  motivoNoDisponible: string | null;
}

export interface OfertaInicialSecretaria {
  periodoCarreraId: string;
  carrera: { id: string; nombre: string };
  periodo: { id: string; nombre: string; estado: string; fechaInicio?: string };
  versionMalla: { id: string; nombre: string; version: string; estado: string };
  mallaGeneral: { id: string; codigo: string; fechaInicio: string; fechaFin: string; estado: string } | null;
  centroEstudio: { id: string; nombre: string };
  jornada: string;
  paralelos: ParaleloOfertaInicial[];
  cupoMaximo: number;
  cuposOcupados: number;
  cuposDisponibles: number;
  disponible: boolean;
  motivoNoDisponible: string | null;
}

export interface OpcionMatricula {
  periodoCarreraId: string;

  periodo: {
    id: string;
    nombre: string;
  };

  carrera: {
    id: string;
    nombre: string;
  };

  versionMalla: {
    id: string;
    nombre: string;
    version: string;
  };

  mallaGeneral?: {
    id: string;
    codigo: string;
  } | null;

  nivel: {
    id: string;
    numero: number;
    nombre?: string;
  };

  jornada: string;

  centroEstudio: {
    id: string;
    nombre: string;
  };

  paralelo: {
    id: string;
    nombre: string;
    cupoMaximo: number;
    cuposOcupados: number;
    cuposDisponibles: number;
  };

  materias: MateriaOpcionMatricula[];
}

export interface MateriaReprobada {
  id: string;
  codigo: string;
  nombre: string;
  promedio: number | null;
}

export interface OpcionesMatriculaResponse {
  puedeSolicitar: boolean;

  situacion:
    | 'ESTUDIANTE_NUEVO'
    | 'MATRICULA_SIN_FINALIZAR'
    | 'REPETICION_MISMA_MALLA'
    | 'REINICIO_POR_CAMBIO_MALLA'
    | 'SIGUIENTE_NIVEL'
    | 'PARALELO_INCOMPLETO'
    | 'MALLA_COMPLETADA'
    | string;

  motivo: string | null;

  tipoMatricula: TipoMatricula | null;

  documentoRequerido:
    | TipoDocumentoMatricula
    | null;

  matriculaAnterior: {
    id: string;
    periodo: string;
    malla?: string;
    nivel: string;
    numeroNivel?: number;
    estado?: string;
    materiasReprobadas?: MateriaReprobada[];
  } | null;

  opciones: OpcionMatricula[];
}

export interface MatriculaOficial {
  id: string;
  estudiante?: {
    id: string;
    cedula: string;
    nombres: string;
    apellidos: string;
    correo: string;
    telefono: string;
  };
  tipo: TipoMatricula;
  estado:
    | 'ACTIVA'
    | 'FINALIZADA'
    | 'ANULADA';

  periodo: {
    id: string;
    nombre: string;
  };

  periodoCarrera: any;
  paralelo: any;
  versionMalla: any;
  nivel: any;
  asignaturas: any[];
  fechaMatricula: string;
}

export interface ParaleloRedistribucion {
  id: string;
  nombre: string;
  cupoMinimo: number;
  cupoMaximo: number;
  cuposOcupados: number;
  cuposDisponibles: number;
  bajoMinimo: boolean;
  periodoCarrera: {
    id: string;
    jornada: string;
    periodo: { id: string; nombre: string; estado: string };
    carrera: { id: string; nombre: string; codigo: string };
    centroEstudio: { id: string; nombre: string };
  };
  nivel: { id: string; numero: number; nombre?: string };
}

export interface ResultadoRedistribucion {
  message: string;
  trasladados: number;
  paraleloOrigenId: string;
  paraleloDestinoId: string;
  estudiantesRestantesOrigen: number;
  cuposDisponiblesDestino: number;
}

@Injectable({
  providedIn: 'root',
})
export class MatriculasService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl =
    'http://localhost:3000/api/matriculas';

  obtenerOpcionesPermitidas():
    Observable<OpcionesMatriculaResponse> {
    return this.http.get<OpcionesMatriculaResponse>(
      `${this.apiUrl}/opciones-permitidas`,
    );
  }

  obtenerMisMatriculas():
    Observable<MatriculaOficial[]> {
    return this.http.get<MatriculaOficial[]>(
      `${this.apiUrl}/mias`,
    );
  }

  crearDesdeSecretaria(
    datos: CrearMatriculaSecretaria,
  ): Observable<MatriculaOficial> {
    return this.http.post<MatriculaOficial>(
      this.apiUrl,
      datos,
    );
  }

  crearNuevaConEstudiante(datos: {
    cedula: string;
    nombres: string;
    apellidos: string;
    correo: string;
    telefono: string;
    periodoCarreraId: string;
    paraleloId: string;
  }): Observable<MatriculaOficial> {
    return this.http.post<MatriculaOficial>(`${this.apiUrl}/nueva`, datos);
  }

  obtenerOfertaInicial(): Observable<OfertaInicialSecretaria[]> {
    return this.http.get<OfertaInicialSecretaria[]>(
      `${this.apiUrl}/oferta-inicial`,
    );
  }

  obtenerPorEstudiante(
    estudianteId: string,
  ): Observable<MatriculaOficial[]> {
    return this.http.get<MatriculaOficial[]>(
      this.apiUrl,
      { params: { estudianteId } },
    );
  }

  obtenerTodas(): Observable<MatriculaOficial[]> {
    return this.http.get<MatriculaOficial[]>(this.apiUrl);
  }

  anular(matriculaId: string): Observable<MatriculaOficial> {
    return this.http.patch<MatriculaOficial>(
      `${this.apiUrl}/${matriculaId}/anular`,
      {},
    );
  }

  obtenerParalelosParaRedistribucion(): Observable<ParaleloRedistribucion[]> {
    return this.http.get<ParaleloRedistribucion[]>(
      `${this.apiUrl}/redistribucion/paralelos`,
    );
  }

  obtenerEstudiantesPorParalelo(paraleloId: string): Observable<MatriculaOficial[]> {
    return this.http.get<MatriculaOficial[]>(
      `${this.apiUrl}/redistribucion/estudiantes`,
      { params: { paraleloId } },
    );
  }

  cambiarParaleloMasivo(datos: {
    paraleloOrigenId: string;
    paraleloDestinoId: string;
    matriculaIds: string[];
  }): Observable<ResultadoRedistribucion> {
    return this.http.patch<ResultadoRedistribucion>(
      `${this.apiUrl}/redistribucion/cambiar-paralelo`,
      datos,
    );
  }
}

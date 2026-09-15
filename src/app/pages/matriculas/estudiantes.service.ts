import { Injectable, inject } from '@angular/core';
import {HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Estudiante {
  id: string;
  cedula: string;
  nombres: string;
  apellidos: string;
  correo: string;
  telefono?: string;
}

export interface CrearEstudiante {
  cedula: string;
  nombres: string;
  apellidos: string;
  correo: string;
  telefono?: string;
}

@Injectable({
  providedIn: 'root',
})
export class EstudiantesService {

  private http = inject(HttpClient);

  private apiUrl =
    'http://localhost:3000/api/estudiantes';

  private headers(): HttpHeaders {

    const token =
      localStorage.getItem('auth_token') ??
      localStorage.getItem('token');

    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }


  // ==============================
  // CREAR
  // ==============================

  crearEstudiante(
    estudiante: CrearEstudiante,
  ): Observable<Estudiante> {

    return this.http.post<Estudiante>(
      this.apiUrl,
      estudiante,
      {
        headers: this.headers(),
      },
    );
  }


  // ==============================
  // LISTAR
  // ==============================

  obtenerEstudiantes(): Observable<Estudiante[]> {

    return this.http.get<Estudiante[]>(
      this.apiUrl,
      {
        headers: this.headers(),
      },
    );
  }


  listarEstudiantes(): Observable<Estudiante[]> {

    return this.obtenerEstudiantes();
  }


  // ==============================
  // OBTENER UNO
  // ==============================

  obtenerEstudiante(
    id: string,
  ): Observable<Estudiante> {

    return this.http.get<Estudiante>(
      `${this.apiUrl}/${id}`,
      {
        headers: this.headers(),
      },
    );
  }


  // ==============================
  // ACTUALIZAR DATOS PERSONALES
  // ==============================

  actualizarEstudiante(
    id: string,
    estudiante: Partial<CrearEstudiante>,
  ): Observable<Estudiante> {

    return this.http.patch<Estudiante>(
      `${this.apiUrl}/${id}`,
      estudiante,
      {
        headers: this.headers(),
      },
    );
  }


  // ==============================
  // ELIMINAR
  // ==============================

  eliminarEstudiante(
    id: string,
  ): Observable<any> {

    return this.http.delete(
      `${this.apiUrl}/${id}`,
      {
        headers: this.headers(),
      },
    );
  }

}
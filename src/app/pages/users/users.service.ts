import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/users';

  obtenerUsuarios(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  actualizarRol(id: string, role: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}`, { role });
  }

  desactivarUsuario(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
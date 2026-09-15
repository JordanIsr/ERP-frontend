import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { MatriculaOficial, MatriculasService } from '../../core/service/matriculas.service';

@Component({
  selector: 'app-historial-academico',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './historial-academico.html',
  styleUrl: './historial-academico.scss',
})
export class HistorialAcademico implements OnInit {
  private readonly matriculasService = inject(MatriculasService);
  matriculas: MatriculaOficial[] = [];
  cargando = true;
  error = '';

  ngOnInit(): void {
    this.matriculasService.obtenerMisMatriculas().subscribe({
      next: (matriculas) => { this.matriculas = matriculas; this.cargando = false; },
      error: (error) => {
        const mensaje = error?.error?.message;
        this.error = Array.isArray(mensaje) ? mensaje.join(' ') : mensaje ?? 'No se pudo cargar tu historial académico.';
        this.cargando = false;
      },
    });
  }

  nivel(matricula: MatriculaOficial): string {
    return matricula.nivel?.nombre ?? `Nivel ${matricula.nivel?.numero ?? ''}`;
  }
}

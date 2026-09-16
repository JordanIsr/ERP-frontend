import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { RouterModule } from '@angular/router';

import {
  MatriculasService,
  ParaleloRedistribucion,
} from '../../core/service/matriculas.service';

interface Acceso {
  titulo: string;
  descripcion: string;
  ruta: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private readonly matriculasService =
    inject(MatriculasService);

  readonly nombre =
    localStorage.getItem('user_nombre') ??
    'Usuario';

  readonly rol =
    localStorage.getItem('user_role') ??
    'usuario';

  paralelosBajoMinimo:
    ParaleloRedistribucion[] = [];

  paralelosOcultos =
    new Set<string>();

  cargandoAlertas = false;
  errorAlertas = '';

  ngOnInit(): void {
    if (this.rol === 'secretaria') {
      this.cargarParalelosBajoMinimo();
    }
  }

  get mensaje(): string {
    return ({
      admin:
        'Configura la estructura académica y administra las cuentas institucionales.',

      secretaria:
        'Gestiona estudiantes, matrículas, documentos y correcciones académicas.',

      docente:
        'Consulta tus asignaturas y registra las calificaciones de tus estudiantes.',

      estudiante:
        'Consulta tu historial y gestiona tu solicitud de matrícula.',

      usuario:
        'Tu registro fue recibido. Un administrador debe asignarte el rol correspondiente para habilitar los módulos.',
    } as Record<string, string>)[this.rol] ?? '';
  }

  get accesos(): Acceso[] {
    const mapa: Record<string, Acceso[]> = {
      admin: [
        {
          titulo: 'Catálogos base',
          descripcion:
            'Administra docentes activos e inactivos para las asignaturas.',
          ruta: '/catalogos-base',
        },
        {
          titulo: 'Mallas curriculares',
          descripcion:
            'Administra mallas, carreras, niveles, asignaturas y docentes.',
          ruta: '/mallas',
        },
        {
          titulo: 'Usuarios',
          descripcion:
            'Autoriza cuentas y asigna roles.',
          ruta: '/users',
        },
        {
          titulo: 'Buscar estudiantes',
          descripcion:
            'Consulta expedientes y matrículas.',
          ruta:
            '/matriculas/buscar-estudiantes',
        },
      ],

      secretaria: [
        {
          titulo: 'Matricular estudiante',
          descripcion:
            'Registra estudiantes nuevos en ofertas con cupos.',
          ruta: '/matriculas/registrar',
        },
        {
          titulo: 'Solicitudes pendientes',
          descripcion:
            'Revisa documentos y aprueba matrículas.',
          ruta: '/matriculas/solicitudes',
        },
        {
          titulo: 'Redistribuir paralelos',
          descripcion:
            'Traslada estudiantes de paralelos que no cumplen el mínimo.',
          ruta:
            '/matriculas/redistribuir-paralelos',
        },
        {
          titulo: 'Corregir calificaciones',
          descripcion:
            'Corrige errores con motivo y auditoría.',
          ruta: '/corregir-notas',
        },
      ],

      docente: [
        {
          titulo: 'Registro de notas',
          descripcion:
            'Ingresa NP1, NP2 y recuperación.',
          ruta: '/registrar-notas',
        },
      ],

      estudiante: [
        {
          titulo: 'Solicitud de matrícula',
          descripcion:
            'Consulta tus opciones y presenta los documentos.',
          ruta: '/matriculas/solicitud',
        },
        {
          titulo: 'Historial académico',
          descripcion:
            'Consulta tus notas y matrículas.',
          ruta: '/historial-academico',
        },
      ],

      usuario: [],
    };

    return mapa[this.rol] ?? [];
  }

  get paralelosVisibles():
    ParaleloRedistribucion[] {
    return this.paralelosBajoMinimo.filter(
      (paralelo) =>
        !this.paralelosOcultos.has(
          paralelo.id,
        ),
    );
  }

  cargarParalelosBajoMinimo(): void {
    this.cargandoAlertas = true;
    this.errorAlertas = '';

    this.matriculasService
      .obtenerParalelosParaRedistribucion()
      .subscribe({
        next: (paralelos) => {
          this.cargandoAlertas = false;

          this.paralelosBajoMinimo =
            paralelos.filter(
              (paralelo) =>
                paralelo.bajoMinimo,
            );

          if (
            this.paralelosBajoMinimo.length >
            0
          ) {
            const detalle =
              this.paralelosBajoMinimo
                .map(
                  (paralelo) =>
                    `• ${
                      paralelo
                        .periodoCarrera
                        .carrera.nombre
                    } · ${
                      paralelo.nivel.nombre ??
                      `Nivel ${paralelo.nivel.numero}`
                    } · Paralelo ${
                      paralelo.nombre
                    } · ${
                      paralelo.cuposOcupados
                    }/${
                      paralelo.cupoMinimo
                    } estudiantes`,
                )
                .join('\n');

            window.alert(
              `PARALELOS QUE NO CUMPLEN EL CUPO MÍNIMO\n\n` +
              `${detalle}\n\n` +
              'Debe redistribuir los estudiantes y después solicitar la eliminación del paralelo vacío.',
            );
          }
        },

        error: (error) => {
          this.cargandoAlertas = false;

          this.errorAlertas =
            this.mensajeError(
              error,
              'No se pudo consultar el estado de los paralelos.',
            );
        },
      });
  }

  ocultarAlerta(
    paraleloId: string,
  ): void {
    this.paralelosOcultos =
      new Set([
        ...this.paralelosOcultos,
        paraleloId,
      ]);
  }

  accionRequerida(
    paralelo: ParaleloRedistribucion,
  ): string {
    if (paralelo.cuposOcupados === 0) {
      return 'El paralelo está vacío y puede eliminarse.';
    }

    return (
      `Redistribuya sus ${paralelo.cuposOcupados} ` +
      'estudiante(s) a otros paralelos.'
    );
  }

  private mensajeError(
    error: any,
    predeterminado: string,
  ): string {
    const mensaje =
      error?.error?.message;

    return Array.isArray(mensaje)
      ? mensaje.join(' ')
      : mensaje ?? predeterminado;
  }
}
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  CalificacionesService,
  CorreccionCalificacion,
  TipoNota,
} from '../../core/service/calificaciones.service';
import { MatriculasService } from '../../core/service/matriculas.service';

interface FilaCalificacion {
  detalleId: string;
  estudiante: string;
  cedula: string;
  carrera: string;
  periodo: string;
  asignatura: string;
  paralelo: string;
  notaParcial1: number | null;
  notaParcial2: number | null;
  notaRecuperacion: number | null;
  promedioFinal: number | null;
  estado: string;
}

@Component({
  selector: 'app-corregir-notas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './corregir-notas.html',
  styleUrl: './corregir-notas.scss',
})
export class CorregirNotas implements OnInit {
  private readonly matriculasService = inject(MatriculasService);
  private readonly calificacionesService = inject(CalificacionesService);

  filas: FilaCalificacion[] = [];
  seleccionada: FilaCalificacion | null = null;
  historial: CorreccionCalificacion[] = [];
  busqueda = '';
  tipoNota: TipoNota = 'PARCIAL_1';
  notaNueva: number | null = null;
  motivo = '';
  cargando = true;
  guardando = false;
  error = '';
  exito = '';
  generandoReporte = false;

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.matriculasService.obtenerTodas().subscribe({
      next: (matriculas) => {
        this.filas = matriculas.flatMap((matricula: any) =>
          (matricula.asignaturas ?? []).map((detalle: any) => ({
            detalleId: detalle.id,
            estudiante: `${matricula.estudiante?.apellidos ?? ''} ${matricula.estudiante?.nombres ?? ''}`.trim(),
            cedula: matricula.estudiante?.cedula ?? '',
            carrera: matricula.periodoCarrera?.carrera?.nombre ?? '',
            periodo: matricula.periodo?.nombre ?? '',
            asignatura: detalle.asignaturaParalelo?.detalleMalla?.asignatura?.nombre ?? '',
            paralelo: matricula.paralelo?.nombre ?? '',
            notaParcial1: detalle.notaParcial1,
            notaParcial2: detalle.notaParcial2,
            notaRecuperacion: detalle.notaRecuperacion,
            promedioFinal: detalle.promedioFinal,
            estado: detalle.estado,
          })),
        ).filter((fila) =>
          fila.notaParcial1 !== null ||
          fila.notaParcial2 !== null ||
          fila.notaRecuperacion !== null,
        );
        this.cargando = false;
      },
      error: (error) => {
        this.error = this.mensajeError(error, 'No se pudieron cargar las calificaciones.');
        this.cargando = false;
      },
    });
  }

  get filasFiltradas(): FilaCalificacion[] {
    const termino = this.busqueda.trim().toLowerCase();
    if (!termino) return this.filas;
    return this.filas.filter((fila) =>
      [fila.estudiante, fila.cedula, fila.carrera, fila.periodo, fila.asignatura, fila.paralelo]
        .some((valor) => valor.toLowerCase().includes(termino)),
    );
  }

  seleccionar(fila: FilaCalificacion): void {
    this.seleccionada = fila;
    this.tipoNota = fila.notaParcial1 !== null
      ? 'PARCIAL_1'
      : fila.notaParcial2 !== null
        ? 'PARCIAL_2'
        : 'RECUPERACION';
    this.notaNueva = null;
    this.motivo = '';
    this.error = '';
    this.exito = '';
    this.cargarHistorial();
  }

  valorActual(tipo: TipoNota): number | null {
    if (!this.seleccionada) return null;
    if (tipo === 'PARCIAL_1') return this.seleccionada.notaParcial1;
    if (tipo === 'PARCIAL_2') return this.seleccionada.notaParcial2;
    return this.seleccionada.notaRecuperacion;
  }

  corregir(): void {
    if (!this.seleccionada || this.notaNueva === null) {
      this.error = 'Selecciona una calificación e ingresa la nueva nota.';
      return;
    }
    if (this.notaNueva < 0 || this.notaNueva > 10) {
      this.error = 'La nota debe estar entre 0 y 10.';
      return;
    }
    if (!/^\d+(?:\.\d{1,2})?$/.test(String(this.notaNueva))) {
      this.error = 'La nueva nota puede tener como máximo dos decimales.';
      return;
    }
    if (this.motivo.trim().length < 5) {
      this.error = 'El motivo debe tener al menos 5 caracteres.';
      return;
    }
    if (!confirm(`¿Corregir ${this.tipoNota} de ${this.formatoNota(this.valorActual(this.tipoNota))} a ${Number(this.notaNueva).toFixed(2)}?`)) return;

    this.guardando = true;
    this.error = '';
    this.exito = '';
    this.calificacionesService.corregir(
      this.seleccionada.detalleId,
      this.tipoNota,
      Number(this.notaNueva),
      this.motivo.trim(),
    ).subscribe({
      next: () => {
        const detalleId = this.seleccionada!.detalleId;
        this.exito = 'Nota corregida y registrada en el historial de auditoría.';
        this.guardando = false;
        this.notaNueva = null;
        this.motivo = '';
        this.cargar();
        this.calificacionesService.historialCorrecciones(detalleId).subscribe({
          next: (historial) => (this.historial = historial),
        });
      },
      error: (error) => {
        this.error = this.mensajeError(error, 'No se pudo corregir la nota.');
        this.guardando = false;
      },
    });
  }

  cargarHistorial(): void {
    if (!this.seleccionada) return;
    this.calificacionesService.historialCorrecciones(this.seleccionada.detalleId).subscribe({
      next: (historial) => (this.historial = historial),
      error: () => (this.historial = []),
    });
  }

  etiqueta(tipo: TipoNota): string {
    return ({ PARCIAL_1: 'NP1', PARCIAL_2: 'NP2', RECUPERACION: 'Recuperación' } as Record<TipoNota, string>)[tipo];
  }

  generarReportePdf(): void {
    this.limpiarMensajesReporte();
    this.generandoReporte = true;
    this.calificacionesService.reporteCorrecciones().subscribe({
      next: (correcciones) => {
        this.generandoReporte = false;
        if (!correcciones.length) { this.error = 'Todavía no existen correcciones para incluir en el reporte.'; return; }
        const filas = correcciones.map((item) => {
          const detalle = item.matriculaAsignatura;
          const matricula = detalle?.matricula;
          const estudiante = matricula?.estudiante;
          const asignatura = detalle?.asignaturaParalelo?.detalleMalla?.asignatura;
          return `<tr><td>${this.escapar(new Date(item.fechaCorreccion).toLocaleString('es-EC'))}</td><td>${this.escapar(`${estudiante?.apellidos ?? ''} ${estudiante?.nombres ?? ''}`.trim())}</td><td>${this.escapar(estudiante?.cedula ?? '')}</td><td>${this.escapar(matricula?.periodoCarrera?.carrera?.nombre ?? '')}</td><td>${this.escapar(matricula?.periodo?.nombre ?? '')}</td><td>${this.escapar(asignatura?.nombre ?? '')}</td><td>${this.escapar(matricula?.paralelo?.nombre ?? '')}</td><td>${this.escapar(this.etiqueta(item.tipoNota))}</td><td>${this.formatoNota(item.valorAnterior)}</td><td>${this.formatoNota(item.valorNuevo)}</td><td>${this.escapar(item.motivo)}</td><td>${this.escapar(item.corregidoPor?.nombre ?? item.corregidoPor?.email ?? '')}</td></tr>`;
        }).join('');
        const ventana = window.open('', '_blank', 'width=1200,height=800');
        if (!ventana) { this.error = 'El navegador bloqueó la ventana del reporte. Habilita las ventanas emergentes.'; return; }
        ventana.document.write(`<!doctype html><html><head><title>Reporte de correcciones de calificaciones</title><style>@page{size:landscape;margin:12mm}body{font-family:Arial,sans-serif;color:#172033}h1{font-size:20px;margin-bottom:4px}p{font-size:12px;color:#475569}table{width:100%;border-collapse:collapse;font-size:9px}th,td{border:1px solid #94a3b8;padding:5px;vertical-align:top}th{background:#e2e8f0}tbody tr:nth-child(even){background:#f8fafc}</style></head><body><h1>Reporte de correcciones de calificaciones</h1><p>Generado: ${new Date().toLocaleString('es-EC')} · Total: ${correcciones.length}</p><table><thead><tr><th>Fecha</th><th>Estudiante</th><th>Cédula</th><th>Carrera</th><th>Periodo</th><th>Asignatura</th><th>Paralelo</th><th>Nota</th><th>Anterior</th><th>Nueva</th><th>Motivo</th><th>Corregido por</th></tr></thead><tbody>${filas}</tbody></table><script>window.onload=()=>window.print()<\/script></body></html>`);
        ventana.document.close();
      },
      error: (e) => { this.generandoReporte = false; this.error = this.mensajeError(e, 'No se pudo generar el reporte.'); },
    });
  }

  formatoNota(valor: number | null): string { return valor === null || valor === undefined ? '—' : Number(valor).toFixed(2); }
  bloquearCaracterNumericoInvalido(event: KeyboardEvent): void { if (['e', 'E', '+', '-'].includes(event.key)) event.preventDefault(); }
  private escapar(valor: unknown): string { return String(valor ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[c] ?? c); }
  private limpiarMensajesReporte(): void { this.error = ''; this.exito = ''; }

  private mensajeError(error: any, predeterminado: string): string {
    const mensaje = error?.error?.message;
    return Array.isArray(mensaje) ? mensaje.join(' ') : mensaje ?? predeterminado;
  }
}

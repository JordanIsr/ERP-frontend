import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EstructuraAcademicaService } from '../../core/service/estructura-academica.service';

interface DocenteMalla { id: string; cedula: string; nombres: string; apellidos: string; estado: 'ACTIVO' | 'INACTIVO'; }
interface AsignaturaMalla {
  detalleId: string;
  id: string;
  codigo: string;
  nombre: string;
  editable: boolean;
  motivoBloqueo: string | null;
}
interface NivelMalla {
  id: string;
  numero: number;
  nombre: string;
  cantidadAsignaturas: number;
  asignaturas: AsignaturaMalla[];
  editable: boolean;
  motivoBloqueo: string | null;
}
interface CarreraMalla {
  id: string;
  nombre: string;
  codigo: string;
  cantidadNiveles: number;
  estado: string;
  versionMallaId: string;

  editableIdentidad: boolean;
  motivoBloqueoIdentidad: string | null;

  editableCantidadNiveles: boolean;
  motivoBloqueoCantidadNiveles: string | null;

  niveles: NivelMalla[];
}
interface MallaGeneral {
  id: string;
  codigo: string;
  fechaInicio: string;
  fechaFin: string;
  duracionAnios: number;
  estado: string;

  editableDatosGenerales: boolean;
  motivoBloqueoDatosGenerales: string | null;

  permiteAgregarEstructura: boolean;
  motivoBloqueoEstructura: string | null;

  carreras: CarreraMalla[];
}
interface PeriodoConfig { id: string; nombre: string; fechaInicio: string; fechaFin: string; estado: string; }
interface CentroConfig { id: string; nombre: string; estado: string; }
interface OfertaConfig { id: string; periodo: PeriodoConfig; carrera: CarreraMalla; versionMalla: { id: string; version: string }; centroEstudio: CentroConfig; jornada: string; estado: string; }
interface ParaleloConfig { id: string; nombre: string; nivel: NivelMalla; cupoMinimo: number; cupoMaximo: number; cuposOcupados: number; cuposDisponibles: number; }
interface AsignaturaAperturaResumen {
  detalleId: string;
  codigo: string;
  nombre: string;
  docente: DocenteMalla | null;
}
interface AperturaNivelResumen {
  ofertaId: string;
  periodoNombre: string;
  periodoFechaInicio: string;
  periodoFechaFin: string;
  jornada: string;
  centroNombre: string;
  paraleloNombre: string;
  cupoMinimo: number;
  cupoMaximo: number;
  cuposOcupados: number;
  cuposDisponibles: number;
  asignaturas: AsignaturaAperturaResumen[];
}
interface AsignaturaParaleloConfig { id: string; docente: DocenteMalla | null ; detalleMalla: { id: string; asignatura: { id: string; codigo: string; nombre: string;}
  };
}
interface AsignaturaParaleloVista {
  detalleId: string;
  codigo: string;
  nombre: string;
  asignacion: AsignaturaParaleloConfig | null;
  docenteId: string;
}

interface HistorialDocenteConfig {
  id: string;
  motivo: string;
  fechaCambio: string;

  docenteAnterior: DocenteMalla;
  docenteNuevo: DocenteMalla;

  cambiadoPor: {
    id: string;
    nombre: string;
  };
}

@Component({
  selector: 'app-mallas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mallas.html',
  styleUrls: [
    './mallas.scss',
    './mallas-portfolio.scss',
  ],
})
export class Mallas implements OnInit {
  private readonly service = inject(EstructuraAcademicaService);

  @ViewChild('formularioMallaSection')
private formularioMallaSection?: ElementRef<HTMLElement>;

  mallas: MallaGeneral[] = [];
  mallaSeleccionada: MallaGeneral | null = null;
  carreraSeleccionada: CarreraMalla | null = null;
  filtroEstadoMalla = '';
  busquedaMalla = '';
  modoGestionActiva = false;
  aperturasPorNivel: Record<string, AperturaNivelResumen[]> = {};
  cargandoResumenMalla = false;
  private cargaResumenId = 0;
  formularioMalla = { codigo: '', fechaInicio: '', duracionAnios: 1 };
  formularioCarrera = { nombre: '', codigo: '', cantidadNiveles: 1 };
  editandoMalla = false;
  carreraEditandoId = '';
  nuevaAsignatura: Record<string, string> = {};
  nuevoCodigoAsignatura: Record<string, string> = {};
  asignaturaEditandoId = '';
  codigoAsignaturaEdicion = '';
  nombreAsignaturaEdicion = '';
  docentesActivos: DocenteMalla[] = [];
  nivelFiltro = 'TODOS';
  busquedaAsignatura = '';
  periodos: PeriodoConfig[] = [];
  periodoVistaId = '';
  centros: CentroConfig[] = [];
  ofertas: OfertaConfig[] = [];
  ofertaSeleccionadaId = '';
  paralelosConfigurados: ParaleloConfig[] = [];
  formularioOferta = { periodoId: '', jornada: '', centroEstudioId: '' };
  formularioParalelo = { nivelId: '', nombre: '', cupoMinimo: 1, cupoMaximo: 30 };
  paraleloEditandoId = '';
  paraleloAsignaturasSeleccionado:
  ParaleloConfig | null = null;

asignaturasDelParalelo: AsignaturaParaleloVista[] = [];
guardandoAsignacionDetalleId = '';

asignaturaCambioDocenteId = '';
nuevoDocenteCambioId = '';
motivoCambioDocente = '';

historialAsignaturaId = '';
historialDocentes:
  HistorialDocenteConfig[] = [];

cargandoAsignaturasParalelo = false;
cargandoHistorialDocentes = false;
guardandoCambioDocente = false;
  cargando = true;
  guardando = false;
  error = '';
  mensaje = '';

  ngOnInit(): void {
    this.cargarMallas();
    this.cargarDocentesActivos();
    this.cargarConfiguracionOferta();
  }

  get mallasFiltradas(): MallaGeneral[] {
    if (!this.periodoVistaId || !this.filtroEstadoMalla) return [];

    const texto = this.busquedaMalla.trim().toUpperCase();
    const periodo = this.periodoVistaSeleccionado;

    return this.mallas.filter((malla) => {
      const coincideEstado = malla.estado === this.filtroEstadoMalla;
      const coincideTexto = !texto || malla.codigo.toUpperCase().includes(texto);
      const coincideVigencia = !!periodo
        && periodo.fechaInicio >= malla.fechaInicio
        && periodo.fechaFin <= malla.fechaFin;

      return coincideEstado && coincideTexto && coincideVigencia;
    });
  }

  get periodoVistaSeleccionado(): PeriodoConfig | undefined {
    return this.periodos.find(
      (periodo) => periodo.id === this.periodoVistaId,
    );
  }

  get periodoVistaEsHistorico(): boolean {
    return this.periodoVistaSeleccionado?.estado === 'CERRADO';
  }

  get totalCarrerasResumen(): number {
    return this.mallaSeleccionada?.carreras.length ?? 0;
  }

  get totalNivelesResumen(): number {
    return (this.mallaSeleccionada?.carreras ?? [])
      .reduce((total, carrera) => total + carrera.niveles.length, 0);
  }

  get totalAsignaturasResumen(): number {
    return (this.mallaSeleccionada?.carreras ?? [])
      .reduce(
        (totalCarreras, carrera) => totalCarreras
          + carrera.niveles.reduce(
            (totalNiveles, nivel) => totalNiveles + nivel.asignaturas.length,
            0,
          ),
        0,
      );
  }

  get nivelesVisibles(): NivelMalla[] {
    const niveles = this.carreraSeleccionada?.niveles ?? [];
    if (this.nivelFiltro === 'TODOS') return niveles;
    return niveles.filter((nivel) => nivel.id === this.nivelFiltro);
  }

  asignaturasVisibles(nivel: NivelMalla): AsignaturaMalla[] {
    const texto = this.busquedaAsignatura.trim().toUpperCase();
    if (!texto) return nivel.asignaturas;
    return nivel.asignaturas.filter((asignatura) =>
      asignatura.nombre.includes(texto)
      || asignatura.codigo.includes(texto),
    );
  }

  get periodosDisponibles(): PeriodoConfig[] {
  const malla = this.mallaSeleccionada;

  if (!malla) {
    return [];
  }

  const inicioMalla = String(
    malla.fechaInicio,
  ).slice(0, 10);

  const finMalla = String(
    malla.fechaFin,
  ).slice(0, 10);

  return this.periodos.filter((periodo) => {
    const inicioPeriodo = String(
      periodo.fechaInicio,
    ).slice(0, 10);

    const finPeriodo = String(
      periodo.fechaFin,
    ).slice(0, 10);

    const estadoPermitido =
      periodo.estado !== 'CERRADO';

    const iniciaDentroDeLaMalla =
      inicioPeriodo >= inicioMalla;

    const finalizaDentroDeLaMalla =
      finPeriodo <= finMalla;

    return (
      periodo.id === this.periodoVistaId &&
      estadoPermitido &&
      iniciaDentroDeLaMalla &&
      finalizaDentroDeLaMalla
    );
  });
}

  get ofertasDeCarrera(): OfertaConfig[] {
    if (!this.carreraSeleccionada || !this.periodoVistaId) return [];

    return this.ofertas.filter(
      (oferta) =>
        oferta.carrera.id === this.carreraSeleccionada?.id
        && oferta.periodo.id === this.periodoVistaId,
    );
  }

  private cargarDocentesActivos(): void {
    this.service.listarDocentes({ estado: 'ACTIVO' }).subscribe({
      next: (docentes: DocenteMalla[]) => this.docentesActivos = docentes,
      error: (e) => this.error = this.mensajeError(e, 'No se pudieron cargar los docentes activos.'),
    });
  }

  get fechaFinCalculada(): string {
    if (!this.formularioMalla.fechaInicio) return '';
    const fecha = new Date(`${this.formularioMalla.fechaInicio}T00:00:00Z`);
    fecha.setUTCFullYear(fecha.getUTCFullYear() + Number(this.formularioMalla.duracionAnios || 0));
    return fecha.toISOString().slice(0, 10);
  }

  cargarMallas(
  seleccionarMallaId?: string,
  seleccionarCarreraId?: string,
): void {
  /*
   * Guardamos los identificadores antes de realizar
   * la petición para restaurar la selección después.
   */
  const mallaId =
    seleccionarMallaId
    ?? this.mallaSeleccionada?.id
    ?? '';

  const carreraId =
    seleccionarCarreraId
    ?? this.carreraSeleccionada?.id
    ?? '';

  this.cargando = true;

  this.service.listarMallasGenerales().subscribe({
    next: (mallas: MallaGeneral[]) => {
      this.mallas = mallas;

      const mallaActual = mallaId
        ? mallas.find(
            (malla) => malla.id === mallaId,
          ) ?? null
        : null;

      this.mallaSeleccionada = mallaActual;

      this.carreraSeleccionada =
        mallaActual && carreraId
          ? mallaActual.carreras.find(
              (carrera) =>
                carrera.id === carreraId,
            ) ?? null
          : null;

      this.cargando = false;

      if (
        mallaActual &&
        mallaActual.estado !== 'BORRADOR'
      ) {
        this.cargarResumenMalla(mallaActual);
      } else {
        this.aperturasPorNivel = {};
        this.cargandoResumenMalla = false;
      }
    },

    error: (e) => {
      this.cargando = false;

      this.error = this.mensajeError(
        e,
        'No se pudieron cargar las mallas.',
      );
    },
  });
}
  seleccionarMalla(malla: MallaGeneral): void {
    this.mallaSeleccionada = malla;
    this.carreraSeleccionada = null;
    this.cancelarMalla();
    this.cancelarCarrera();
    this.modoGestionActiva = false;
    this.limpiarMensajes();

    if (malla.estado !== 'BORRADOR') {
      this.cargarResumenMalla(malla);
    } else {
      this.aperturasPorNivel = {};
      this.cargandoResumenMalla = false;
    }
  }

  cambiarPeriodoVista(): void {
    this.filtroEstadoMalla = '';
    this.busquedaMalla = '';
    this.mallaSeleccionada = null;
    this.carreraSeleccionada = null;
    this.modoGestionActiva = false;
    this.aperturasPorNivel = {};
    this.ofertaSeleccionadaId = '';
    this.paralelosConfigurados = [];
    this.cerrarAsignaturasParalelo();
    this.cancelarMalla();
    this.cancelarCarrera();
    this.limpiarMensajes();

    this.formularioOferta = {
      periodoId: this.periodoVistaId,
      jornada: '',
      centroEstudioId: '',
    };
  }

  cambiarFiltroEstado(estado: string): void {
    this.filtroEstadoMalla = estado;
    this.busquedaMalla = '';
    this.mallaSeleccionada = null;
    this.carreraSeleccionada = null;
    this.modoGestionActiva = false;
    this.aperturasPorNivel = {};
    this.cancelarMalla();
    this.cancelarCarrera();
    this.limpiarMensajes();
  }

  alternarGestionActiva(): void {
    const malla = this.mallaSeleccionada;
    if (!malla || malla.estado !== 'ACTIVA') return;

    this.modoGestionActiva = !this.modoGestionActiva;
    this.carreraSeleccionada = null;
    this.cancelarCarrera();
    this.cancelarEdicionAsignatura();

    if (!this.modoGestionActiva) {
      this.cargarResumenMalla(malla);
    }
  }

  aperturasDeNivel(nivelId: string): AperturaNivelResumen[] {
    return this.aperturasPorNivel[nivelId] ?? [];
  }

  private cargarResumenMalla(malla: MallaGeneral): void {
    const cargaId = ++this.cargaResumenId;
    this.aperturasPorNivel = {};

    if (malla.estado === 'BORRADOR') {
      this.cargandoResumenMalla = false;
      return;
    }

    const versiones = new Set(
      malla.carreras.map((carrera) => carrera.versionMallaId),
    );

    const ofertasMalla = this.ofertas.filter(
      (oferta) =>
        versiones.has(oferta.versionMalla?.id)
        && oferta.periodo.id === this.periodoVistaId,
    );

    if (ofertasMalla.length === 0) {
      this.cargandoResumenMalla = false;
      return;
    }

    this.cargandoResumenMalla = true;
    let pendientes = ofertasMalla.length;

    const terminarPeticion = (): void => {
      pendientes -= 1;
      if (pendientes > 0 || cargaId !== this.cargaResumenId) return;

      Object.values(this.aperturasPorNivel).forEach((aperturas) => {
        aperturas.sort((a, b) =>
          a.periodoFechaInicio.localeCompare(b.periodoFechaInicio)
          || a.paraleloNombre.localeCompare(b.paraleloNombre),
        );
      });

      this.cargandoResumenMalla = false;
    };

    ofertasMalla.forEach((oferta) => {
      this.service.listarParalelos(oferta.id).subscribe({
        next: (paralelos: ParaleloConfig[]) => {
          if (cargaId !== this.cargaResumenId) {
            terminarPeticion();
            return;
          }

          if (paralelos.length === 0) {
            terminarPeticion();
            return;
          }

          let paralelosPendientes = paralelos.length;

          const terminarParalelo = (): void => {
            paralelosPendientes -= 1;
            if (paralelosPendientes === 0) terminarPeticion();
          };

          paralelos.forEach((paralelo) => {
            this.service.listarAsignaturaParalelo(paralelo.id).subscribe({
              next: (asignaciones: AsignaturaParaleloConfig[]) => {
                if (cargaId !== this.cargaResumenId) return;

                const nivelId = paralelo.nivel.id;
                const nivel = malla.carreras
                  .flatMap((carrera) => carrera.niveles)
                  .find((item) => item.id === nivelId);

                const asignaturas: AsignaturaAperturaResumen[] =
                  (nivel?.asignaturas ?? []).map((asignatura) => {
                    const asignacion = asignaciones.find(
                      (item) => item.detalleMalla.id === asignatura.detalleId,
                    );

                    return {
                      detalleId: asignatura.detalleId,
                      codigo: asignatura.codigo,
                      nombre: asignatura.nombre,
                      docente: asignacion?.docente ?? null,
                    };
                  });

                const apertura: AperturaNivelResumen = {
                  ofertaId: oferta.id,
                  periodoNombre: oferta.periodo.nombre,
                  periodoFechaInicio: oferta.periodo.fechaInicio,
                  periodoFechaFin: oferta.periodo.fechaFin,
                  jornada: oferta.jornada,
                  centroNombre: oferta.centroEstudio.nombre,
                  paraleloNombre: paralelo.nombre,
                  cupoMinimo: paralelo.cupoMinimo,
                  cupoMaximo: paralelo.cupoMaximo,
                  cuposOcupados: paralelo.cuposOcupados,
                  cuposDisponibles: paralelo.cuposDisponibles,
                  asignaturas,
                };

                this.aperturasPorNivel[nivelId] = [
                  ...(this.aperturasPorNivel[nivelId] ?? []),
                  apertura,
                ];
              },
              error: (e) => {
                if (cargaId === this.cargaResumenId) {
                  this.error = this.mensajeError(
                    e,
                    `No se pudieron cargar las asignaturas del paralelo ${paralelo.nombre}.`,
                  );
                }
                terminarParalelo();
              },
              complete: terminarParalelo,
            });
          });
        },
        error: (e) => {
          if (cargaId === this.cargaResumenId) {
            this.error = this.mensajeError(
              e,
              `No se pudieron cargar las aperturas de ${oferta.periodo.nombre}.`,
            );
          }
          terminarPeticion();
        },
      });
    });
  }

  guardarMalla(): void {
    this.limpiarMensajes();
    const codigo = this.formularioMalla.codigo.trim().toUpperCase();
    if (!codigo) { this.error = 'El código de la malla es obligatorio.'; return; }
    if (!/^[A-Z0-9]+(?:-[A-Z0-9]+)*$/.test(codigo)) { this.error = 'El código solo puede contener letras, números y guiones internos.'; return; }
    if (!this.formularioMalla.fechaInicio) { this.error = 'La fecha de inicio es obligatoria.'; return; }
    const errorFecha = this.validarFechaMalla(codigo, this.formularioMalla.fechaInicio);
    if (errorFecha) { this.error = errorFecha; return; }
    if (!Number.isInteger(Number(this.formularioMalla.duracionAnios)) || this.formularioMalla.duracionAnios < 1 || this.formularioMalla.duracionAnios > 5) {
      this.error = 'La vigencia debe ser un número entero entre 1 y 5 años.'; return;
    }
    this.guardando = true;
    const peticion = this.editandoMalla && this.mallaSeleccionada
      ? this.service.editarMallaGeneral(this.mallaSeleccionada.id, { ...this.formularioMalla, codigo })
      : this.service.crearMallaGeneral({ ...this.formularioMalla, codigo });
    peticion.subscribe({
      next: (malla: MallaGeneral) => {
        this.guardando = false;
        this.mensaje = this.editandoMalla ? 'Malla actualizada correctamente.' : 'Malla creada. Ahora agrega sus carreras.';
        this.formularioMalla = { codigo: '', fechaInicio: '', duracionAnios: 1 };
        this.editandoMalla = false;
        this.cargarMallas(malla.id);
      },
      error: (e) => { this.guardando = false; this.error = this.mensajeError(e, 'No se pudo guardar la malla.'); },
    });
  }

  editarMalla(malla: MallaGeneral): void {
  this.limpiarMensajes();
  this.seleccionarMalla(malla);

  if (!malla.editableDatosGenerales) {
    this.error =
      malla.motivoBloqueoDatosGenerales ??
      'Los datos generales de esta malla ya no pueden modificarse.';

    window.alert(this.error);
    return;
  }

  this.prepararEdicionMalla(malla);

  setTimeout(() => {
    const formulario = this.formularioMallaSection?.nativeElement;

    if (!formulario) {
      return;
    }

    formulario.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });

    formulario
      .querySelector<HTMLInputElement>('input')
      ?.focus();
  });
}
  
private prepararEdicionMalla(
  malla: MallaGeneral,
): void {
  this.mallaSeleccionada = malla;

  this.carreraSeleccionada = null;

  this.formularioMalla = {
    codigo: malla.codigo,
    fechaInicio: malla.fechaInicio,
    duracionAnios: malla.duracionAnios,
  };

  this.editandoMalla = true;
}

  cancelarMalla(): void { this.editandoMalla = false; this.formularioMalla = { codigo: '', fechaInicio: '', duracionAnios: 1 }; }

  eliminarMalla(malla: MallaGeneral): void {
    this.limpiarMensajes();

    if (!malla.editableDatosGenerales) {
      this.error =
        malla.motivoBloqueoDatosGenerales
        ?? 'Esta malla contiene información académica y no puede eliminarse.';
      return;
    }

    if (!confirm(`¿Eliminar la malla ${malla.codigo} y toda su estructura que todavía no esté en uso?`)) return;
    this.service.eliminarMallaGeneral(malla.id).subscribe({
      next: () => { this.mallaSeleccionada = null; this.carreraSeleccionada = null; this.mensaje = 'Malla eliminada correctamente.'; this.cargarMallas(); },
      error: (e) => this.error = this.mensajeError(e, 'No se pudo eliminar la malla.'),
    });
  }

  activarMalla(): void {
  this.limpiarMensajes();

  const malla = this.mallaSeleccionada;

  if (!malla) {
    this.error = 'Primero debe seleccionar la malla que desea activar.';
    window.alert(this.error);
    return;
  }

  const errores = this.validarMallaAntesDeActivar(malla);

  if (errores.length > 0) {
    this.error =
      `No se puede activar la malla ${malla.codigo}. ` +
      errores.join(' ');

    window.alert(
      `NO SE PUEDE ACTIVAR LA MALLA ${malla.codigo}\n\n` +
      errores.map((error) => `• ${error}`).join('\n'),
    );

    return;
  }

  const confirmar = window.confirm(
    `¿Activar la malla ${malla.codigo}?\n\n` +
    'Se verificó que todas sus carreras, niveles y asignaturas están completos.',
  );

  if (!confirmar) {
    return;
  }

  this.guardando = true;

  this.service.activarMallaGeneral(malla.id).subscribe({
    next: () => {
      this.guardando = false;
      this.mensaje = `La malla ${malla.codigo} fue activada correctamente.`;

      window.alert(this.mensaje);

      this.cargarMallas(malla.id);
    },

    error: (e) => {
      this.guardando = false;

      this.error = this.mensajeError(
        e,
        `No se pudo activar la malla ${malla.codigo}.`,
      );

      window.alert(
        `NO SE PUDO ACTIVAR LA MALLA\n\n${this.error}`,
      );
    },
  });
}

private validarMallaAntesDeActivar(
  malla: MallaGeneral,
): string[] {
  const errores: string[] = [];

  if (malla.carreras.length === 0) {
    errores.push(
      'La malla debe contener al menos una carrera.',
    );

    return errores;
  }

  for (const carrera of malla.carreras) {
    if (carrera.niveles.length !== carrera.cantidadNiveles) {
      errores.push(
        `${carrera.nombre} debe tener exactamente ` +
        `${carrera.cantidadNiveles} nivel(es), pero actualmente tiene ` +
        `${carrera.niveles.length}.`,
      );
    }

    for (const nivel of carrera.niveles) {
      const cantidadActual = nivel.asignaturas.length;
      const cantidadRequerida = nivel.cantidadAsignaturas;

      if (cantidadActual !== cantidadRequerida) {
        errores.push(
          `${carrera.nombre} · ${nivel.nombre} debe tener exactamente ` +
          `${cantidadRequerida} asignatura(s), pero actualmente tiene ` +
          `${cantidadActual}.`,
        );
      }
    }
  }

  return errores;
}

  guardarCarrera(): void {
    const malla = this.mallaSeleccionada;
    if (!malla) return;
    this.limpiarMensajes();
    const datos = {
      nombre: this.formularioCarrera.nombre.trim(),
      codigo: this.formularioCarrera.codigo.trim().toUpperCase(),
      cantidadNiveles: Number(this.formularioCarrera.cantidadNiveles),
    };
    if (!this.carreraEditandoId && !malla.permiteAgregarEstructura) {
  this.error =
    malla.motivoBloqueoEstructura
    ?? 'No se pueden agregar carreras a esta malla.';
  return;
}
    if (!datos.nombre) { this.error = 'El nombre de la carrera es obligatorio.'; return; }
    if (!datos.codigo) { this.error = 'El código de la carrera es obligatorio.'; return; }
    if (!/^[A-Z0-9]+(?:-[A-Z0-9]+)*$/.test(datos.codigo)) { this.error = 'El código de la carrera tiene un formato incorrecto.'; return; }
    if (!Number.isInteger(datos.cantidadNiveles) || datos.cantidadNiveles < 1 || datos.cantidadNiveles > 20) {
      this.error = 'La cantidad de niveles debe ser un entero entre 1 y 20.'; return;
    }
    this.guardando = true;
    const peticion = this.carreraEditandoId
      ? this.service.editarCarreraMalla(malla.id, this.carreraEditandoId, datos)
      : this.service.agregarCarreraMalla(malla.id, datos);
    peticion.subscribe({
      next: () => {
        this.guardando = false;
        this.mensaje = this.carreraEditandoId ? 'Carrera actualizada correctamente.' : 'Carrera y niveles creados correctamente.';
        this.cancelarCarrera();
        this.cargarMallas(malla.id);
      },
      error: (e) => { this.guardando = false; this.error = this.mensajeError(e, 'No se pudo guardar la carrera.'); },
    });
  }

  editarCarrera(carrera: CarreraMalla): void {
  this.limpiarMensajes();

  if (
    !carrera.editableIdentidad
    && !carrera.editableCantidadNiveles
  ) {
    this.error =
      carrera.motivoBloqueoIdentidad
      ?? carrera.motivoBloqueoCantidadNiveles
      ?? 'Esta carrera ya no puede modificarse.';
    return;
  }

  if (
  this.carreraSeleccionada?.id !== carrera.id
) {
  this.cerrarAsignaturasParalelo();
}

this.carreraSeleccionada = carrera;
this.carreraEditandoId = carrera.id;

  this.formularioCarrera = {
    nombre: carrera.nombre,
    codigo: carrera.codigo,
    cantidadNiveles: carrera.cantidadNiveles,
  };
}

  cancelarCarrera(): void { this.carreraEditandoId = ''; this.formularioCarrera = { nombre: '', codigo: '', cantidadNiveles: 1 }; }

  seleccionarCarrera(carrera: CarreraMalla): void {

    if (
    this.carreraSeleccionada?.id !== carrera.id
  ) {
    this.cerrarAsignaturasParalelo();
  }

    this.carreraSeleccionada = carrera;
    this.nivelFiltro = 'TODOS';
    this.busquedaAsignatura = '';
    this.ofertaSeleccionadaId = '';
    this.paralelosConfigurados = [];
    this.formularioParalelo = { nivelId: '', nombre: '', cupoMinimo: 1, cupoMaximo: 30 };
    this.limpiarMensajes();
  }

  eliminarCarrera(carrera: CarreraMalla): void {
    if (!carrera.editableIdentidad) {
  this.error =
    carrera.motivoBloqueoIdentidad
    ?? 'Esta carrera contiene información académica y no puede eliminarse.';
  return;
}
    const malla = this.mallaSeleccionada;
    if (!malla || !confirm(`¿Eliminar la carrera ${carrera.nombre} de esta malla?`)) return;
    this.service.eliminarCarreraMalla(malla.id, carrera.id).subscribe({
      next: () => { this.carreraSeleccionada = null; this.mensaje = 'Carrera eliminada correctamente.'; this.cargarMallas(malla.id); },
      error: (e) => this.error = this.mensajeError(e, 'No se pudo eliminar la carrera.'),
    });
  }

  guardarLimite(nivel: NivelMalla): void {
    if (!nivel.editable) {
  this.error =
    nivel.motivoBloqueo
    ?? 'Este nivel contiene información académica y no puede modificarse.';
  return;
}
    const cantidad = Number(nivel.cantidadAsignaturas);
    if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 50) { this.error = 'La cantidad de asignaturas debe ser un entero entre 1 y 50.'; return; }
    this.service.editarNivel(nivel.id, { cantidadAsignaturas: cantidad }).subscribe({
      next: () => { this.mensaje = `Límite guardado para ${nivel.nombre}.`; this.recargarSeleccion(); },
      error: (e) => this.error = this.mensajeError(e, 'No se pudo guardar el límite de asignaturas.'),
    });
  }

  crearAsignatura(nivel: NivelMalla): void {
  this.limpiarMensajes();

  if (!nivel.editable) {
    this.mostrarError(
      nivel.motivoBloqueo ??
      'No se pueden agregar asignaturas a este nivel.',
    );

    return;
  }

  const codigo = String(
    this.nuevoCodigoAsignatura[nivel.id] ?? '',
  )
    .trim()
    .toUpperCase();

  const nombre = String(
    this.nuevaAsignatura[nivel.id] ?? '',
  )
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase();

  if (!codigo) {
    this.mostrarError(
      `Debe ingresar el código de la asignatura para ${nivel.nombre}.`,
    );

    return;
  }

  // Se conserva la validación actual del código.
  if (!/^[A-Z0-9]+(?:-[A-Z0-9]+)*$/.test(codigo)) {
    this.mostrarError(
      'El código de la asignatura solo puede contener letras, ' +
      'números y guiones internos.',
    );

    return;
  }

  if (!nombre) {
    this.mostrarError(
      `Debe ingresar el nombre de la asignatura para ${nivel.nombre}.`,
    );

    return;
  }

  if (nombre.length < 2) {
    this.mostrarError(
      'El nombre de la asignatura debe tener al menos 2 caracteres.',
    );

    return;
  }

  if (
    nivel.asignaturas.length >=
    nivel.cantidadAsignaturas
  ) {
    this.mostrarError(
      `${nivel.nombre} ya alcanzó el límite de ` +
      `${nivel.cantidadAsignaturas} asignatura(s).`,
    );

    return;
  }

  this.guardando = true;

  this.service.crearAsignaturaEnNivel({
    nivelId: nivel.id,
    codigo,
    nombre,
  }).subscribe({
    next: () => {
      this.guardando = false;
      this.nuevaAsignatura[nivel.id] = '';
      this.nuevoCodigoAsignatura[nivel.id] = '';

      this.mensaje =
        `La asignatura ${nombre} fue creada correctamente. ` +
        'El docente se asignará dentro de cada paralelo.';

      this.recargarSeleccion();
    },

    error: (e) => {
      this.guardando = false;

      const mensaje = this.mensajeError(
        e,
        `No se pudo crear la asignatura ${nombre}.`,
      );

      this.mostrarError(mensaje);
    },
  });
}

  comenzarEdicionAsignatura(
  asignatura: AsignaturaMalla,
): void {
  this.limpiarMensajes();

  if (!asignatura.editable) {
    this.error =
      asignatura.motivoBloqueo
      ?? 'Esta asignatura contiene información académica y no puede modificarse.';
    return;
  }

  this.asignaturaEditandoId =
    asignatura.detalleId;

  this.codigoAsignaturaEdicion =
    asignatura.codigo;

  this.nombreAsignaturaEdicion =
    asignatura.nombre;

}

  guardarAsignatura(): void {
    const codigo = this.codigoAsignaturaEdicion.trim().toUpperCase();
    const nombre = this.nombreAsignaturaEdicion.trim().replace(/\s+/g, ' ').toUpperCase();
    if (!codigo || !/^[A-Z0-9]+(?:-[A-Z0-9]+)*$/.test(codigo)) { this.error = 'Ingrese un código de asignatura válido.'; return; }
    if (!this.asignaturaEditandoId || nombre.length < 2) { this.error = 'Ingrese un nombre de asignatura válido.'; return; }
    this.service.editarAsignaturaEnNivel(this.asignaturaEditandoId, {
      codigo,
      nombre,
    }).subscribe({
      next: () => {
        this.asignaturaEditandoId = '';
        this.codigoAsignaturaEdicion = '';
        this.nombreAsignaturaEdicion = '';
        this.mensaje = 'Asignatura actualizada. Las asignaciones docentes de cada paralelo se conservan.';
        this.recargarSeleccion();
      },
      error: (e) => this.error = this.mensajeError(e, 'No se pudo editar la asignatura.'),
    });
  }

  eliminarAsignatura(asignatura: AsignaturaMalla): void {
    if (!asignatura.editable) {
  this.error =
    asignatura.motivoBloqueo
    ?? 'Esta asignatura contiene información académica y no puede eliminarse.';
  return;
}
    if (!confirm(`¿Eliminar ${asignatura.nombre} de este nivel?`)) return;
    this.service.quitarAsignaturaDeNivel(asignatura.detalleId).subscribe({
      next: () => { this.mensaje = 'Asignatura eliminada del nivel.'; this.recargarSeleccion(); },
      error: (e) => this.error = this.mensajeError(e, 'No se pudo eliminar la asignatura.'),
    });
  }

  crearOferta(): void {
    const carrera = this.carreraSeleccionada;
    if (!this.mallaSeleccionada || !carrera) { this.error = 'Seleccione una malla y una carrera.'; return; }
    if (!this.periodoVistaId) { this.error = 'Seleccione primero el periodo académico que desea administrar.'; return; }
    if (this.periodoVistaEsHistorico) { this.error = 'El periodo seleccionado está cerrado y permanece únicamente como historial.'; return; }
    this.formularioOferta.periodoId = this.periodoVistaId;
    if (this.mallaSeleccionada.estado === 'BORRADOR') { this.error = 'Primero complete y active la malla antes de ofertarla en un periodo.'; return; }
    if (!this.formularioOferta.periodoId) { this.error = 'Seleccione el periodo académico de la oferta.'; return; }
    const periodoSeleccionado =
  this.periodos.find(
    (periodo) =>
      periodo.id ===
      this.formularioOferta.periodoId,
  );

if (!periodoSeleccionado) {
  this.error =
    'El periodo académico seleccionado no existe.';
  return;
}

const inicioMalla = String(
  this.mallaSeleccionada.fechaInicio,
).slice(0, 10);

const finMalla = String(
  this.mallaSeleccionada.fechaFin,
).slice(0, 10);

const inicioPeriodo = String(
  periodoSeleccionado.fechaInicio,
).slice(0, 10);

const finPeriodo = String(
  periodoSeleccionado.fechaFin,
).slice(0, 10);

if (
  inicioPeriodo < inicioMalla ||
  finPeriodo > finMalla
) {
  this.error =
    `El periodo ${periodoSeleccionado.nombre} ` +
    `comprende desde ${inicioPeriodo} hasta ${finPeriodo} ` +
    `y está fuera de la vigencia de la malla, ` +
    `que va desde ${inicioMalla} hasta ${finMalla}.`;

  this.formularioOferta.periodoId = '';
  return;
}

if (periodoSeleccionado.estado === 'CERRADO') {
  this.error =
    `El periodo ${periodoSeleccionado.nombre} está cerrado y no puede utilizarse para una nueva oferta.`;

  this.formularioOferta.periodoId = '';
  return;
}
    if (!this.formularioOferta.jornada) { this.error = 'Seleccione la jornada de la oferta.'; return; }
    if (!this.formularioOferta.centroEstudioId) { this.error = 'Seleccione el centro de estudio de la oferta.'; return; }
    this.guardando = true;
    this.service.crearPeriodoCarrera({
      periodoId: this.formularioOferta.periodoId,
      carreraId: carrera.id,
      versionMallaId: carrera.versionMallaId,
      centroEstudioId: this.formularioOferta.centroEstudioId,
      jornada: this.formularioOferta.jornada,
    }).subscribe({
      next: (oferta: OfertaConfig) => {
        this.guardando = false;
        this.mensaje = 'Oferta académica creada. Ahora agregue sus paralelos por nivel.';
        this.formularioOferta = { periodoId: '', jornada: '', centroEstudioId: '' };
        this.cargarOfertas(oferta.id);
      },
      error: (e) => { this.guardando = false; this.error = this.mensajeError(e, 'No se pudo crear la oferta académica.'); },
    });
  }

  seleccionarOferta(ofertaId: string): void {
    this.cerrarAsignaturasParalelo();
    this.ofertaSeleccionadaId = ofertaId;
    this.paraleloEditandoId = '';
    this.formularioParalelo = { nivelId: '', nombre: '', cupoMinimo: 1, cupoMaximo: 30 };
    if (!ofertaId) { this.paralelosConfigurados = []; return; }
    this.service.listarParalelos(ofertaId).subscribe({
      next: (paralelos: ParaleloConfig[]) => this.paralelosConfigurados = paralelos,
      error: (e) => this.error = this.mensajeError(e, 'No se pudieron cargar los paralelos.'),
    });
  }

  normalizarLetraParalelo(valor: string): string {
  return String(valor ?? '')
    .replace(/[^A-Za-z]/g, '')
    .slice(0, 1)
    .toUpperCase();
}

  guardarParalelo(): void {
    const datos = {
      nivelId: this.formularioParalelo.nivelId,
      nombre: this.formularioParalelo.nombre.trim().toUpperCase(),
      cupoMinimo: Number(this.formularioParalelo.cupoMinimo),
      cupoMaximo: Number(this.formularioParalelo.cupoMaximo),
    };
    if (!this.ofertaSeleccionadaId) { this.error = 'Seleccione una oferta académica.'; return; }
    if (!datos.nivelId) { this.error = 'Seleccione el nivel del paralelo.'; return; }
    if (!datos.nombre) {
  this.mostrarError(
    'Debe ingresar la letra del paralelo.',
  );

  return;
}

if (!/^[A-Z]$/.test(datos.nombre)) {
  this.mostrarError(
    'El paralelo debe contener exactamente una letra entre la A y la Z. ' +
    'No se permiten números, espacios ni símbolos.',
  );

  return;
}
    if (!Number.isInteger(datos.cupoMinimo) || datos.cupoMinimo < 1 || datos.cupoMinimo > 500) { this.error = 'El cupo mínimo debe ser un entero entre 1 y 500.'; return; }
    if (!Number.isInteger(datos.cupoMaximo) || datos.cupoMaximo < 1 || datos.cupoMaximo > 500) { this.error = 'El cupo máximo debe ser un entero entre 1 y 500.'; return; }
    if (datos.cupoMinimo > datos.cupoMaximo) { this.error = 'El cupo mínimo no puede superar al cupo máximo.'; return; }
    this.guardando = true;
    const peticion = this.paraleloEditandoId
      ? this.service.editarParalelo(this.paraleloEditandoId, { nombre: datos.nombre, cupoMinimo: datos.cupoMinimo, cupoMaximo: datos.cupoMaximo })
      : this.service.crearParalelo({ periodoCarreraId: this.ofertaSeleccionadaId, ...datos });
    peticion.subscribe({
      next: () => {
        this.guardando = false;
        this.mensaje = this.paraleloEditandoId
          ? 'Paralelo actualizado correctamente.'
          : 'Paralelo creado correctamente. Los docentes pueden asignarse antes o después de matricular estudiantes.';
        const ofertaId =
  this.ofertaSeleccionadaId;

this.cancelarEdicionParalelo();

/*
 * Vuelve a consultar las ofertas, los paralelos
 * y actualiza la vista integral de la malla.
 */
this.cargarOfertas(ofertaId);
      },
      error: (e) => { this.guardando = false; this.error = this.mensajeError(e, 'No se pudo guardar el paralelo.'); },
    });
  }

  editarParalelo(paralelo: ParaleloConfig): void {
    this.paraleloEditandoId = paralelo.id;
    this.formularioParalelo = { nivelId: paralelo.nivel.id, nombre: paralelo.nombre, cupoMinimo: paralelo.cupoMinimo, cupoMaximo: paralelo.cupoMaximo };
  }

  cancelarEdicionParalelo(): void {
    this.paraleloEditandoId = '';
    this.formularioParalelo = { nivelId: '', nombre: '', cupoMinimo: 1, cupoMaximo: 30 };
  }

  administrarAsignaturasParalelo(
  paralelo: ParaleloConfig,
): void {
  this.limpiarMensajes();

  if (
    this.paraleloAsignaturasSeleccionado?.id ===
    paralelo.id
  ) {
    this.cerrarAsignaturasParalelo();
    return;
  }

  this.paraleloAsignaturasSeleccionado = paralelo;
  this.cancelarCambioDocente();
  this.historialAsignaturaId = '';
  this.historialDocentes = [];

  this.cargarAsignaturasDelParalelo();
}

cargarAsignaturasDelParalelo(): void {
  const paralelo =
    this.paraleloAsignaturasSeleccionado;

  if (!paralelo) {
    this.asignaturasDelParalelo = [];
    return;
  }

  this.cargandoAsignaturasParalelo = true;

  this.service
    .listarAsignaturaParalelo(paralelo.id)
    .subscribe({
      next: (
        asignaciones: AsignaturaParaleloConfig[],
      ) => {
        const nivel = this.carreraSeleccionada?.niveles.find(
          (item) => item.id === paralelo.nivel.id,
        );

        this.asignaturasDelParalelo = (nivel?.asignaturas ?? []).map(
          (asignatura) => {
            const asignacion = asignaciones.find(
              (item) => item.detalleMalla.id === asignatura.detalleId,
            ) ?? null;

            return {
              detalleId: asignatura.detalleId,
              codigo: asignatura.codigo,
              nombre: asignatura.nombre,
              asignacion,
              docenteId: asignacion?.docente?.id ?? '',
            };
          },
        );

        this.cargandoAsignaturasParalelo =
          false;
      },

      error: (e) => {
        this.cargandoAsignaturasParalelo =
          false;

        this.error = this.mensajeError(
          e,
          'No se pudieron cargar las asignaturas del paralelo.',
        );
      },
    });
}

asignarDocenteInicial(item: AsignaturaParaleloVista): void {
  const paralelo = this.paraleloAsignaturasSeleccionado;

  if (!paralelo || item.asignacion?.docente) {
  return;
}

  if (!item.docenteId) {
    this.error = `Seleccione el docente de ${item.nombre}.`;
    return;
  }

  this.limpiarMensajes();
  this.guardandoAsignacionDetalleId = item.detalleId;

  this.service.agregarAsignaturaAParalelo({
    paraleloId: paralelo.id,
    detalleMallaId: item.detalleId,
    docenteId: item.docenteId,
  }).subscribe({
    next: () => {
      this.guardandoAsignacionDetalleId = '';
      this.mensaje = `Docente asignado a ${item.nombre} únicamente en el paralelo ${paralelo.nombre}.`;
      this.cargarAsignaturasDelParalelo();
      const malla = this.mallaSeleccionada;

if (malla && malla.estado !== 'BORRADOR') {
  this.cargarResumenMalla(malla);
}
    },
    error: (e) => {
      this.guardandoAsignacionDetalleId = '';
      this.error = this.mensajeError(
        e,
        'No se pudo asignar el docente a la asignatura del paralelo.',
      );
    },
  });
}

iniciarCambioDocente(
  item: AsignaturaParaleloVista,
): void {
  const asignacion = item.asignacion;
  if (!asignacion) return;

  this.limpiarMensajes();

  this.asignaturaCambioDocenteId =
    asignacion.id;

  this.nuevoDocenteCambioId = '';
  this.motivoCambioDocente = '';
}

cancelarCambioDocente(): void {
  this.asignaturaCambioDocenteId = '';
  this.nuevoDocenteCambioId = '';
  this.motivoCambioDocente = '';
}

guardarCambioDocente(): void {
  this.limpiarMensajes();

  const asignacion =
    this.asignaturasDelParalelo.find(
      (item) =>
        item.asignacion?.id ===
        this.asignaturaCambioDocenteId,
    )?.asignacion;

  if (!asignacion || !asignacion.docente) {
    this.error =
      'La asignatura todavía no tiene un docente que pueda ser reemplazado.';
    return;
  }

  if (!this.nuevoDocenteCambioId) {
    this.error =
      'Seleccione el nuevo docente de la asignatura.';
    return;
  }

  if (
    asignacion.docente.id ===
    this.nuevoDocenteCambioId
  ) {
    this.error =
      'El docente seleccionado ya está asignado a esta asignatura.';
    return;
  }

  const motivo = this.motivoCambioDocente
    .trim()
    .replace(/\s+/g, ' ');

  if (!motivo) {
    this.error =
      'El motivo del cambio de docente es obligatorio.';
    return;
  }

  if (motivo.length < 5) {
    this.error =
      'El motivo del cambio debe contener al menos 5 caracteres.';
    return;
  }

  if (motivo.length > 300) {
    this.error =
      'El motivo del cambio no puede superar los 300 caracteres.';
    return;
  }

  const docenteNuevo =
    this.docentesActivos.find(
      (docente) =>
        docente.id ===
        this.nuevoDocenteCambioId,
    );

  if (!docenteNuevo) {
    this.error =
      'El docente seleccionado no existe o está inactivo.';
    return;
  }

  const asignatura =
    asignacion.detalleMalla.asignatura;

  const confirmar = confirm(
    `¿Cambiar el docente de ${asignatura.nombre} a ${docenteNuevo.apellidos} ${docenteNuevo.nombres}?`,
  );

  if (!confirmar) {
    return;
  }

  const asignaturaId = asignacion.id;

  this.guardandoCambioDocente = true;

  this.service
    .cambiarDocenteAsignaturaParalelo(
      asignaturaId,
      {
        docenteId:
          this.nuevoDocenteCambioId,
        motivo,
      },
    )
    .subscribe({
      next: () => {
        this.guardandoCambioDocente =
          false;

        this.mensaje =
          'El docente fue cambiado únicamente en esta asignatura y paralelo. El cambio quedó registrado en el historial.';

        this.cancelarCambioDocente();
        this.cargarAsignaturasDelParalelo();

        const mallaActual =
  this.mallaSeleccionada;

if (
  mallaActual &&
  mallaActual.estado !== 'BORRADOR'
) {
  this.cargarResumenMalla(
    mallaActual,
  );
}

        if (
          this.historialAsignaturaId ===
          asignaturaId
        ) {
          this.cargarHistorialDocentes(
            asignaturaId,
          );
        }
      },

      error: (e) => {
        this.guardandoCambioDocente =
          false;

        this.error = this.mensajeError(
          e,
          'No se pudo cambiar el docente de la asignatura.',
        );
      },
    });
}

mostrarHistorialDocentes(
  item: AsignaturaParaleloVista,
): void {
  const asignacion = item.asignacion;
  if (!asignacion) return;

  if (
    this.historialAsignaturaId ===
    asignacion.id
  ) {
    this.historialAsignaturaId = '';
    this.historialDocentes = [];
    return;
  }

  this.historialAsignaturaId =
    asignacion.id;

  this.cargarHistorialDocentes(
    asignacion.id,
  );
}

cargarHistorialDocentes(
  asignaturaParaleloId: string,
): void {
  this.cargandoHistorialDocentes = true;

  this.service
    .historialDocentesAsignatura(
      asignaturaParaleloId,
    )
    .subscribe({
      next: (
        historial: HistorialDocenteConfig[],
      ) => {
        this.historialDocentes = historial;

        this.cargandoHistorialDocentes =
          false;
      },

      error: (e) => {
        this.cargandoHistorialDocentes =
          false;

        this.error = this.mensajeError(
          e,
          'No se pudo cargar el historial de docentes.',
        );
      },
    });
}

cerrarAsignaturasParalelo(): void {
  this.paraleloAsignaturasSeleccionado = null;
  this.asignaturasDelParalelo = [];

  this.guardandoAsignacionDetalleId = '';
  this.historialAsignaturaId = '';
  this.historialDocentes = [];

  this.cargandoAsignaturasParalelo = false;
  this.cargandoHistorialDocentes = false;
  this.guardandoCambioDocente = false;

  this.cancelarCambioDocente();
}

  eliminarParalelo(
  paralelo: ParaleloConfig,
): void {
  const confirmado = confirm(
    `¿Eliminar el paralelo ${paralelo.nombre}? Si ya tiene matrículas el sistema lo impedirá.`,
  );

  if (!confirmado) {
    return;
  }

  const ofertaId =
    this.ofertaSeleccionadaId;

  this.service
    .eliminarParalelo(paralelo.id)
    .subscribe({
      next: () => {
        this.mensaje =
          'Paralelo eliminado correctamente.';

        this.cerrarAsignaturasParalelo();
        this.cargarOfertas(ofertaId);
      },

      error: (e) => {
        this.error = this.mensajeError(
          e,
          'No se pudo eliminar el paralelo.',
        );
      },
    });
}
  private cargarConfiguracionOferta(): void {
    this.service.listarPeriodos().subscribe({ next: (periodos: PeriodoConfig[]) => this.periodos = periodos });
    this.service.listarCentrosEstudio().subscribe({
      next: (centros: CentroConfig[]) => this.centros = centros.filter((centro) => centro.estado === 'ACTIVO'),
    });
    this.cargarOfertas();
  }

  private cargarOfertas(seleccionarId?: string): void {
    this.service.listarPeriodoCarrera().subscribe({
      next: (ofertas: OfertaConfig[]) => {
        this.ofertas = ofertas;
        const mallaActual = this.mallaSeleccionada;
        if (mallaActual && mallaActual.estado !== 'BORRADOR') {
          this.cargarResumenMalla(mallaActual);
        }
        if (seleccionarId) {
          this.ofertaSeleccionadaId = seleccionarId;
          this.seleccionarOferta(seleccionarId);
        }
      },
      error: (e) => this.error = this.mensajeError(e, 'No se pudieron cargar las ofertas académicas.'),
    });
  }

  bloquearNoEnteros(event: KeyboardEvent): void { if (['e', 'E', '+', '-', '.', ','].includes(event.key)) event.preventDefault(); }
  cancelarEdicionAsignatura(): void {
    this.asignaturaEditandoId = '';
    this.codigoAsignaturaEdicion = '';
    this.nombreAsignaturaEdicion = '';
  }
  private validarFechaMalla(
  codigo: string,
  fechaInicio: string,
): string {
  const coincidencia = codigo.match(
    /(?:^|-)(\d{4})-(I|II)$/,
  );

  if (!coincidencia) {
    return '';
  }

  const anioCodigo = Number(coincidencia[1]);
  const fecha = new Date(
    `${fechaInicio}T00:00:00Z`,
  );

  if (fecha.getUTCFullYear() !== anioCodigo) {
    return `La fecha de inicio debe pertenecer al año ${anioCodigo} indicado en el código.`;
  }

  return '';
}
  private recargarSeleccion(): void {
  const mallaId =
    this.mallaSeleccionada?.id;

  const carreraId =
    this.carreraSeleccionada?.id;

  if (!mallaId) {
    this.cargarMallas();
    return;
  }

  this.cargarMallas(
    mallaId,
    carreraId,
  );
}

private mostrarError(mensaje: string): void {
  this.error = mensaje;
  this.mensaje = '';

  window.alert(
    `NO SE PUDO COMPLETAR LA OPERACIÓN\n\n${mensaje}`,
  );
}

  private limpiarMensajes(): void { this.error = ''; this.mensaje = ''; }
  private mensajeError(e: any, defecto: string): string { const m = e?.error?.message; return Array.isArray(m) ? m.join(' ') : m ?? defecto; }
}

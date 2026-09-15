import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EstructuraAcademicaService } from '../../core/service/estructura-academica.service';

interface Docente {
  id: string;
  cedula: string;
  nombres: string;
  apellidos: string;
  correo: string;
  estado: 'ACTIVO' | 'INACTIVO';
}

interface CentroEstudio {
  id: string;
  nombre: string;
  codigo: string;
  estado: 'ACTIVO' | 'INACTIVO';
}

@Component({
  selector: 'app-catalogos-base',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './catalogos-base.html',
  styleUrl: './catalogos-base.scss',
})
export class CatalogosBase implements OnInit {
  private readonly service = inject(EstructuraAcademicaService);

  docentes: Docente[] = [];
  filtro = '';
  estadoFiltro: '' | 'ACTIVO' | 'INACTIVO' = '';
  formulario: Omit<Docente, 'id'> = this.formularioVacio();
  editandoId = '';
  cargando = false;
  guardando = false;
  error = '';
  mensaje = '';

  ngOnInit(): void {
  this.cargarDocentes();
  this.cargarCentros();
}

  catalogoActivo: 'DOCENTES' | 'CENTROS' = 'DOCENTES';

centros: CentroEstudio[] = [];
filtroCentro = '';
estadoCentroFiltro: '' | 'ACTIVO' | 'INACTIVO' = '';

formularioCentro: Omit<CentroEstudio, 'id'> = {
  nombre: '',
  codigo: '',
  estado: 'ACTIVO',
};

centroEditandoId = '';
guardandoCentro = false;

  cargarDocentes(): void {
    this.cargando = true;
    this.limpiarMensajes();
    this.service.listarDocentes({ buscar: this.filtro, estado: this.estadoFiltro }).subscribe({
      next: (docentes: Docente[]) => { this.docentes = docentes; this.cargando = false; },
      error: (e) => { this.cargando = false; this.error = this.mensajeError(e, 'No se pudieron cargar los docentes.'); },
    });
  }

  limpiarFiltro(): void {
    this.filtro = '';
    this.estadoFiltro = '';
    this.cargarDocentes();
  }

  guardar(): void {
    this.limpiarMensajes();
    const datos = {
      cedula: this.formulario.cedula.trim(),
      nombres: this.formulario.nombres.trim().replace(/\s+/g, ' '),
      apellidos: this.formulario.apellidos.trim().replace(/\s+/g, ' '),
      correo: this.formulario.correo.trim().toLowerCase(),
      estado: this.formulario.estado,
    };
    if (!/^\d{10}$/.test(datos.cedula)) { this.error = 'La cédula del docente debe contener exactamente 10 dígitos.'; return; }
    if (!/^[\p{L}]+(?:[ '\-][\p{L}]+)*$/u.test(datos.nombres) || datos.nombres.length < 2) { this.error = 'Los nombres son obligatorios y solo pueden contener letras, espacios, apóstrofes o guiones.'; return; }
    if (!/^[\p{L}]+(?:[ '\-][\p{L}]+)*$/u.test(datos.apellidos) || datos.apellidos.length < 2) { this.error = 'Los apellidos son obligatorios y solo pueden contener letras, espacios, apóstrofes o guiones.'; return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.correo)) { this.error = 'Ingrese un correo electrónico válido para el docente.'; return; }
    this.guardando = true;
    const peticion = this.editandoId
      ? this.service.editarDocente(this.editandoId, datos)
      : this.service.crearDocente(datos);
    peticion.subscribe({
      next: () => {
        this.guardando = false;
        this.mensaje = this.editandoId ? 'Docente actualizado correctamente.' : 'Docente creado correctamente.';
        this.cancelarEdicion(false);
        this.cargarDocentesConMensaje();
      },
      error: (e) => { this.guardando = false; this.error = this.mensajeError(e, 'No se pudo guardar el docente.'); },
    });
  }

  editar(docente: Docente): void {
    this.editandoId = docente.id;
    this.formulario = {
      cedula: docente.cedula,
      nombres: docente.nombres,
      apellidos: docente.apellidos,
      correo: docente.correo,
      estado: docente.estado,
    };
    this.limpiarMensajes();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cambiarEstado(docente: Docente): void {
    const estado = docente.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    const aviso = estado === 'INACTIVO'
      ? 'El docente dejará de aparecer al asignar materias nuevas.'
      : 'El docente volverá a estar disponible para asignaciones.';
    if (!confirm(`¿Cambiar a ${estado} a ${docente.nombres} ${docente.apellidos}? ${aviso}`)) return;
    this.service.editarDocente(docente.id, { estado }).subscribe({
      next: () => { this.mensaje = `Docente cambiado a ${estado}.`; this.cargarDocentesConMensaje(); },
      error: (e) => this.error = this.mensajeError(e, 'No se pudo cambiar el estado del docente.'),
    });
  }

  eliminar(docente: Docente): void {
    if (!confirm(`¿Eliminar al docente ${docente.nombres} ${docente.apellidos}? Si tiene información académica, el sistema impedirá la eliminación.`)) return;
    this.service.eliminarDocente(docente.id).subscribe({
      next: () => { this.mensaje = 'Docente eliminado correctamente.'; this.cargarDocentesConMensaje(); },
      error: (e) => this.error = this.mensajeError(e, 'No se pudo eliminar el docente.'),
    });
  }

  cancelarEdicion(limpiarMensajes = true): void {
    this.editandoId = '';
    this.formulario = this.formularioVacio();
    if (limpiarMensajes) this.limpiarMensajes();
  }

  soloDigitos(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.formulario.cedula = input.value.replace(/\D/g, '').slice(0, 10);
    input.value = this.formulario.cedula;
  }

  get centrosFiltrados(): CentroEstudio[] {
  const texto = this.filtroCentro.trim().toUpperCase();

  return this.centros.filter((centro) => {
    const coincideTexto =
      !texto ||
      centro.nombre.toUpperCase().includes(texto) ||
      centro.codigo.toUpperCase().includes(texto);

    const coincideEstado =
      !this.estadoCentroFiltro ||
      centro.estado === this.estadoCentroFiltro;

    return coincideTexto && coincideEstado;
  });
}

cargarCentros(): void {
  this.service.listarCentrosEstudio().subscribe({
    next: (centros: CentroEstudio[]) => {
      this.centros = centros;
    },
    error: (e) => {
      this.error = this.mensajeError(
        e,
        'No se pudieron cargar los centros de estudio.',
      );
    },
  });
}

guardarCentro(): void {
  this.limpiarMensajes();

  const nombre = this.formularioCentro.nombre
    .trim()
    .replace(/\s+/g, ' ');

  const codigo = this.formularioCentro.codigo
    .trim()
    .toUpperCase();

  if (!nombre) {
    this.error = 'El nombre del centro de estudio es obligatorio.';
    return;
  }

  if (nombre.length < 3 || nombre.length > 100) {
    this.error =
      'El nombre del centro debe tener entre 3 y 100 caracteres.';
    return;
  }

  if (!codigo) {
    this.error = 'El código del centro de estudio es obligatorio.';
    return;
  }

  if (!/^[A-Z0-9]+(?:-[A-Z0-9]+)*$/.test(codigo)) {
    this.error =
      'El código solo puede contener letras, números y guiones internos.';
    return;
  }

  if (codigo.length < 2 || codigo.length > 15) {
    this.error =
      'El código debe tener entre 2 y 15 caracteres.';
    return;
  }

  this.guardandoCentro = true;

  const datosBase = {
    nombre,
    codigo,
  };

  const peticion = this.centroEditandoId
    ? this.service.editarCentroEstudio(this.centroEditandoId, {
        ...datosBase,
        estado: this.formularioCentro.estado,
      })
    : this.service.crearCentroEstudio(datosBase);

  peticion.subscribe({
    next: () => {
      this.guardandoCentro = false;

      this.mensaje = this.centroEditandoId
        ? 'Centro de estudio actualizado correctamente.'
        : 'Centro de estudio creado correctamente.';

      this.cancelarEdicionCentro(false);
      this.cargarCentros();
    },
    error: (e) => {
      this.guardandoCentro = false;
      this.error = this.mensajeError(
        e,
        'No se pudo guardar el centro de estudio.',
      );
    },
  });
}

editarCentro(centro: CentroEstudio): void {
  this.centroEditandoId = centro.id;

  this.formularioCentro = {
    nombre: centro.nombre,
    codigo: centro.codigo,
    estado: centro.estado,
  };

  this.limpiarMensajes();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

cambiarEstadoCentro(centro: CentroEstudio): void {
  const estado =
    centro.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';

  const mensaje =
    estado === 'INACTIVO'
      ? 'El centro dejará de aparecer al crear nuevas ofertas académicas.'
      : 'El centro volverá a estar disponible para nuevas ofertas.';

  if (
    !confirm(
      `¿Cambiar el centro ${centro.nombre} a ${estado}? ${mensaje}`,
    )
  ) {
    return;
  }

  this.service
    .editarCentroEstudio(centro.id, { estado })
    .subscribe({
      next: () => {
        this.mensaje = `Centro de estudio cambiado a ${estado}.`;
        this.cargarCentros();
      },
      error: (e) => {
        this.error = this.mensajeError(
          e,
          'No se pudo cambiar el estado del centro.',
        );
      },
    });
}

eliminarCentro(centro: CentroEstudio): void {
  if (
    !confirm(
      `¿Eliminar el centro de estudio ${centro.nombre}? Si está relacionado con una oferta o matrícula, el sistema impedirá la eliminación.`,
    )
  ) {
    return;
  }

  this.service.eliminarCentroEstudio(centro.id).subscribe({
    next: () => {
      this.mensaje = 'Centro de estudio eliminado correctamente.';
      this.cargarCentros();
    },
    error: (e) => {
      this.error = this.mensajeError(
        e,
        'No se puede eliminar el centro porque tiene información académica relacionada. Cámbielo a INACTIVO.',
      );
    },
  });
}

cancelarEdicionCentro(limpiarMensajes = true): void {
  this.centroEditandoId = '';

  this.formularioCentro = {
    nombre: '',
    codigo: '',
    estado: 'ACTIVO',
  };

  if (limpiarMensajes) {
    this.limpiarMensajes();
  }
}

limpiarFiltroCentro(): void {
  this.filtroCentro = '';
  this.estadoCentroFiltro = '';
}

  private formularioVacio(): Omit<Docente, 'id'> {
    return { cedula: '', nombres: '', apellidos: '', correo: '', estado: 'ACTIVO' };
  }
  private cargarDocentesConMensaje(): void {
    const mensaje = this.mensaje;
    this.cargarDocentes();
    this.mensaje = mensaje;
  }
  private limpiarMensajes(): void { this.error = ''; this.mensaje = ''; }
  private mensajeError(e: any, defecto: string): string {
    const mensaje = e?.error?.message;
    return Array.isArray(mensaje) ? mensaje.join(' ') : mensaje ?? defecto;
  }
}

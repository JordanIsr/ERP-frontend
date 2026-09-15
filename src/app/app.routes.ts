import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Dashboard } from './pages/dashboard/dashboard';
import { Register } from './pages/register/register';
import { Layout } from './pages/layout/layout';
import { authGuard } from './core/guards/auth.guard';
import { Users } from './pages/users/users';
import { Matriculas } from './pages/matriculas/matriculas';
import { BuscarEstudiantes } from './pages/matriculas/buscar-estudiantes/buscar-estudiantes';
import { HistorialAcademico } from './pages/historial-academico/historial-academico';
import { PeriodosFlujo } from './pages/periodos-flujo/periodos-flujo';
import { SolicitudesMatriculas } from './pages/matriculas/solicitudes-matriculas/solicitudes-matriculas';
import { RevisionSolicitudes } from './pages/matriculas/revision-solicitudes/revision-solicitudes';
import { RegistarNotas } from './pages/registrar-notas/registrar-notas';
import { CorregirNotas } from './pages/corregir-notas/corregir-notas';
import { Mallas } from './pages/mallas/mallas';
import { CatalogosBase } from './pages/catalogos-base/catalogos-base';
import { RedistribuirParalelos } from './pages/matriculas/redistribuir-paralelos/redistribuir-paralelos';

export const routes: Routes = [
  // 1. Redirigir la ruta raíz por defecto al login (o al dashboard, si el guard lo permite)
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  
  // 2. Ruta pública
  { path: 'login', component: Login },

  // 3. Ruta protegida (El 'Home' de tu ERP)
  {path: 'register', component: Register},

  {path: '', component: Layout,children: [

  { 
    path: 'dashboard', 
    component: Dashboard,
    canActivate: [authGuard],
    data: { roles: ['admin', 'secretaria', 'estudiante', 'docente', 'usuario'] }
    // Más adelante aquí agregarás: canActivate: [tuAuthGuard] para verificar el JWT
  },

  {
  path: 'users',
  component: Users,
  canActivate: [authGuard],
  data: { roles: ['admin'] }
},

{ path: 'comprobantes-pendientes', redirectTo: 'matriculas/solicitudes', pathMatch: 'full' },

{
  path: 'matriculas/registrar',//Matriculas/registrar es la ruta de todo mi modulo de matriculas/matriculas
  component: Matriculas,
  canActivate: [authGuard],
  data: { roles: ['secretaria'] }
},
{
  path: 'matriculas/buscar-estudiantes',
  component: BuscarEstudiantes,
  canActivate: [authGuard],
  data: { roles: ['admin', 'secretaria'] }
},
{
  path: 'matriculas/redistribuir-paralelos',
  component: RedistribuirParalelos,
  canActivate: [authGuard],
  data: { roles: ['secretaria'] }
},
{
  path: 'matriculas/solicitudes',
  component: RevisionSolicitudes,
  canActivate: [authGuard],
  data: { roles: ['admin', 'secretaria'] }
},
{
  path: 'historial-academico',
  component: HistorialAcademico,
  canActivate: [authGuard],
  data: { roles: ['estudiante'] }
},

{ path: 'gestion-academica', redirectTo: 'dashboard', pathMatch: 'full' },
{ path: 'settings', redirectTo: 'dashboard', pathMatch: 'full' },

{ path: 'configuracion-academica', redirectTo: 'mallas', pathMatch: 'full' },

{
  path: 'periodos-flujo',
  component: PeriodosFlujo,
  canActivate: [authGuard],
  data: { roles: ['admin'] }
},

{
  path: 'catalogos-base',
  component: CatalogosBase,
  canActivate: [authGuard],
  data: { roles: ['admin'] }
},
{
  path: 'mallas',
  component: Mallas,
  canActivate:[authGuard],
  data: {roles:['admin']}
},
{ path: 'crear-malla', redirectTo: 'mallas', pathMatch: 'full' },
{ path: 'carreras-periodo', redirectTo: 'mallas', pathMatch: 'full' },
{ path: 'estructura-curricular', redirectTo: 'mallas', pathMatch: 'full' },
{ path: 'paralelos', redirectTo: 'mallas', pathMatch: 'full' },
{ path: 'catalogos', redirectTo: 'catalogos-base', pathMatch: 'full' },

{
  path: 'registrar-notas',
  component: RegistarNotas,
  canActivate: [authGuard],
  data: {roles:['docente']}
},

{
  path: 'corregir-notas',
  component: CorregirNotas,
  canActivate: [authGuard],
  data: {roles:['secretaria']}
},

{
  path: 'matriculas/solicitud',
  component: SolicitudesMatriculas,
  canActivate: [authGuard],
  data: {roles: ['estudiante'],}
},

{ path: '**', redirectTo: 'dashboard' },

  ]

 }

];

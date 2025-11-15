import { createBrowserRouter, Navigate } from 'react-router-dom'
import { SessionProvider } from '../context/SessionContext'
import { NivelFormacionProvider } from '../context/NivelFormacionContext'
import { ThemeProvider } from '../context/ThemeContext'
import Login from '../pages/Login'
import Registro from '../pages/Registro'
import Dashboard from '../pages/Dashboard'
import Solicitar from '../pages/Solicitar'
import Solicitudes from '../pages/Solicitudes'
import SolicitudRotacion from '../pages/SolicitudRotacion'
import GestionDocumental from '../pages/GestionDocumental'
import SeguimientoEstudiantes from '../pages/SeguimientoEstudiantes'
import SolicitudesRotacion from '../pages/SolicitudesRotacion'

function Providers({ children }) {
  return (
    <ThemeProvider>
      <SessionProvider>
        <NivelFormacionProvider>
          {children}
        </NivelFormacionProvider>
      </SessionProvider>
    </ThemeProvider>
  )
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />
  },
  {
    path: '/login',
    element: (
      <Providers>
        <Login />
      </Providers>
    )
  },
  {
    path: '/registro',
    element: (
      <Providers>
        <Registro />
      </Providers>
    )
  },
  {
    path: '/dashboard',
    element: (
      <Providers>
        <Dashboard />
      </Providers>
    )
  },
  {
    path: '/solicitar',
    element: (
      <Providers>
        <Solicitar />
      </Providers>
    )
  },
  {
    path: '/solicitudes',
    element: (
      <Providers>
        <Solicitudes />
      </Providers>
    )
  },
  {
    path: '/solicitud-rotacion',
    element: (
      <Providers>
        <SolicitudRotacion />
      </Providers>
    )
  },
  {
    path: '/gestion-documental',
    element: (
      <Providers>
        <GestionDocumental />
      </Providers>
    )
  },
  {
    path: '/seguimiento-estudiantes',
    element: (
      <Providers>
        <SeguimientoEstudiantes />
      </Providers>
    )
  },
  {
    path: '/solicitudes-rotacion',
    element: (
      <Providers>
        <SolicitudesRotacion />
      </Providers>
    )
  }
])

export default router

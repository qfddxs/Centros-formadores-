import { createBrowserRouter, Navigate } from 'react-router-dom'
import { SessionProvider } from '../context/SessionContext'
import { NivelFormacionProvider } from '../context/NivelFormacionContext'
import Login from '../pages/Login'
import Registro from '../pages/Registro'
import Dashboard from '../pages/Dashboard'
import Solicitar from '../pages/Solicitar'
import Solicitudes from '../pages/Solicitudes'

function Providers({ children }) {
  return (
    <SessionProvider>
      <NivelFormacionProvider>
        {children}
      </NivelFormacionProvider>
    </SessionProvider>
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
  }
])

export default router

import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

const NivelFormacionContext = createContext({})

export const useNivelFormacion = () => {
  const context = useContext(NivelFormacionContext)
  if (!context) {
    throw new Error('useNivelFormacion debe ser usado dentro de NivelFormacionProvider')
  }
  return context
}

export const NivelFormacionProvider = ({ children }) => {
  const [nivelFormacion, setNivelFormacion] = useState('pregrado')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNivelFormacion()
  }, [])

  const fetchNivelFormacion = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data } = await supabase
          .from('usuarios_centros')
          .select('centro_formador:centros_formadores(nivel_formacion)')
          .eq('user_id', user.id)
          .single()

        if (data?.centro_formador?.nivel_formacion) {
          setNivelFormacion(data.centro_formador.nivel_formacion)
        }
      }
    } catch (error) {
      console.error('Error obteniendo nivel de formación:', error)
    } finally {
      setLoading(false)
    }
  }

  const value = {
    nivelFormacion,
    loading,
    setNivelFormacion
  }

  return (
    <NivelFormacionContext.Provider value={value}>
      {children}
    </NivelFormacionContext.Provider>
  )
}

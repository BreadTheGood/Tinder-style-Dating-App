import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { ManagerLoginScreen } from './screens/manager/ManagerLoginScreen'
import { ManagerDashboard } from './screens/manager/ManagerDashboard'

export function ManagerApp() {
  const [session, setSession] = useState<any>(null)
  const [managerData, setManagerData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchManagerData(session.user.id)
      else setLoading(false)
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
         fetchManagerData(session.user.id)
      } else {
         setManagerData(null)
         setLoading(false)
      }
    })
  }, [])

  const fetchManagerData = async (userId: string) => {
     setLoading(true)
     const { data, error } = await supabase.from('Managers').select('*').eq('id', userId).maybeSingle()
     if (data) {
        setManagerData(data)
     } else {
        // Log them out if they are not in the Managers table
        console.error('Not a manager', error)
        await supabase.auth.signOut()
        setTimeout(() => {
           window.dispatchEvent(new CustomEvent('app-toast', { detail: { title: 'Acceso Denegado', body: 'Esta cuenta no tiene permisos de Manager.' } }))
        }, 500)
     }
     setLoading(false)
  }

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-gray-900 text-white font-bold">Cargando...</div>
  }

  if (!session || !managerData) {
    return <ManagerLoginScreen />
  }

  return <ManagerDashboard manager={managerData} />
}

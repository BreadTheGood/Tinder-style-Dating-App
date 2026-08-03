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

  const [toastMessage, setToastMessage] = useState<{title: string; body: string} | null>(null)

  useEffect(() => {
    const handleToast = (e: any) => {
       setToastMessage(e.detail)
       setTimeout(() => setToastMessage(null), 4000)
    }
    window.addEventListener('app-toast', handleToast)
    return () => window.removeEventListener('app-toast', handleToast)
  }, [])

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-gray-900 text-white font-bold">Cargando...</div>
  }

  const renderContent = () => {
     if (!session || !managerData) return <ManagerLoginScreen />
     return <ManagerDashboard manager={managerData} />
  }

  return (
    <>
      <div className={`fixed top-6 right-6 z-[9999] max-w-sm transition-all duration-500 ease-in-out ${toastMessage ? 'translate-y-0 opacity-100' : '-translate-y-24 opacity-0 pointer-events-none'}`}>
        {toastMessage && (
          <div className="bg-gray-800 border border-gray-700 p-4 rounded-xl shadow-2xl flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#f304eb] to-[#ff7043] flex items-center justify-center shadow-lg flex-shrink-0">
                <span className="text-white font-extrabold text-lg">!</span>
             </div>
             <div>
                <p className="text-white font-bold text-sm">{toastMessage.title}</p>
                <p className="text-gray-400 text-xs">{toastMessage.body}</p>
             </div>
          </div>
        )}
      </div>
      {renderContent()}
    </>
  )
}

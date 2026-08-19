import { useState, useEffect, useRef } from 'react'
import { managerSupabase as supabase } from './lib/managerSupabase'
import { ManagerLoginScreen } from './screens/manager/ManagerLoginScreen'
import { ManagerDashboard } from './screens/manager/ManagerDashboard'

export function ManagerApp() {
  const [session, setSession] = useState<any>(null)
  const [managerData, setManagerData] = useState<any>(null)
  const managerDataRef = useRef<any>(null)
  const [loading, setLoading] = useState(true)

  const isFetching = useRef(false)

  useEffect(() => {
    managerDataRef.current = managerData
  }, [managerData])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchManagerData(session)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
         if (_event === 'INITIAL_SESSION' || !managerDataRef.current) {
            fetchManagerData(session)
         }
      } else {
         localStorage.removeItem('manager_login_time')
         setManagerData(null)
         setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchManagerData = async (currSession: any) => {
     if (!currSession?.user) {
        setManagerData(null)
        setLoading(false)
        return
     }

     const loginTime = localStorage.getItem('manager_login_time')
     if (loginTime) {
        const timePassed = Date.now() - parseInt(loginTime, 10)
        if (timePassed > 60 * 60 * 1000) {
           console.log('Sesión expirada tras 1 hora de uso continuo.')
           localStorage.removeItem('manager_login_time')
           await supabase.auth.signOut()
           setManagerData(null)
           setSession(null)
           setLoading(false)
           window.dispatchEvent(new CustomEvent('app-toast', { 
             detail: { title: 'Sesión Expirada', body: 'Por seguridad, debes volver a iniciar sesión tras 1 hora.' } 
           }))
           return
        }
     } else {
        localStorage.setItem('manager_login_time', Date.now().toString())
     }
     
     if (isFetching.current) return
     isFetching.current = true
     if (!managerDataRef.current) setLoading(true)

     try {
       const userId = currSession.user.id
       const userEmail = currSession.user.email

       // 1. Buscar por ID en tabla Managers
       let { data, error } = await supabase.from('Managers').select('*').eq('id', userId).maybeSingle()

       // 2. Fallback por Email si no se encontró por ID
       if (!data && userEmail) {
          const { data: dataByEmail } = await supabase.from('Managers').select('*').eq('email', userEmail).maybeSingle()
          if (dataByEmail) {
             data = dataByEmail
             // Vincular el ID correcto de auth
             await supabase.from('Managers').update({ id: userId }).eq('email', userEmail)
          }
       }

       if (data) {
          setManagerData(data)
       } else {
          console.error('Cuenta sin permisos de manager:', userEmail, error)
          setManagerData(null)
          window.dispatchEvent(new CustomEvent('app-toast', { 
            detail: { title: 'Acceso Denegado', body: `La cuenta ${userEmail} no está registrada en el sistema de Managers.` } 
          }))
       }
     } catch (err) {
       console.error('Error cargando manager:', err)
     } finally {
       isFetching.current = false
       setLoading(false)
     }
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
             <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[var(--theme-color-1)] to-[var(--theme-color-2)] flex items-center justify-center shadow-lg flex-shrink-0">
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

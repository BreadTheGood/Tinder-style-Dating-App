import { supabase } from '../../lib/supabase'

export function ManagerDashboard({ manager }: { manager: any }) {
  const isAdmin = manager.role === 'system_admin'
  const isActive = manager.is_active

  if (!isActive) {
     return (
       <div className="flex h-screen flex-col items-center justify-center bg-gray-900 p-6 text-center">
         <h1 className="text-3xl text-red-500 mb-4 font-bold">Cuenta Desactivada</h1>
         <p className="text-gray-400 mb-8">Tu cuenta de manager ha sido suspendida por un administrador del sistema.</p>
         <button onClick={() => supabase.auth.signOut()} className="px-6 py-2 bg-gray-800 text-white rounded-lg">Cerrar Sesión</button>
       </div>
     )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white p-6 flex flex-col">
         <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#f304eb] to-[#ff7043] mb-8">
           Manager Portal
         </h2>

         <nav className="flex-1 space-y-2">
            <a href="#" className="block px-4 py-3 bg-gray-800 rounded-lg font-medium text-white">Eventos</a>
            {isAdmin && (
              <a href="#" className="block px-4 py-3 hover:bg-gray-800 rounded-lg font-medium text-gray-400 transition-colors">Managers</a>
            )}
         </nav>

         <div className="pt-6 border-t border-gray-800 mt-auto">
            <p className="text-sm text-gray-400 mb-4 truncate">{manager.email}</p>
            <button onClick={() => supabase.auth.signOut()} className="w-full py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-sm font-bold transition-colors">
              Cerrar Sesión
            </button>
         </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-10 overflow-y-auto">
         <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Eventos</h1>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm transition-colors">
               + Crear Evento
            </button>
         </div>

         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-500">
            Aquí pronto podrás visualizar, editar y crear eventos.
         </div>
      </div>
    </div>
  )
}

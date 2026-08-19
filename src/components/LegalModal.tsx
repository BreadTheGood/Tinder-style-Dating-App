import { XIcon } from './icons'

export function LegalModal({ type, onClose }: { type: 'terms' | 'privacy'; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-lg h-[80vh] flex flex-col rounded-3xl overflow-hidden relative border border-white/10" style={{ background: '#18181f' }}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <h2 className="text-xl font-bold text-white">
            {type === 'terms' ? 'Términos de Uso' : 'Política de Privacidad'}
          </h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <XIcon size={16} className="text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 text-sm text-white/70 space-y-6 custom-scrollbar">
          {type === 'terms' ? (
            <>
              <section>
                <h3 className="text-white font-bold text-base mb-2">1. Aceptación de los Términos</h3>
                <p>Al acceder y utilizar nuestra aplicación Gira, aceptas estar sujeto a estos Términos de Uso. Si no estás de acuerdo con alguna parte de los términos, no debes usar la aplicación.</p>
              </section>

              <section>
                <h3 className="text-white font-bold text-base mb-2">2. Uso de la Aplicación</h3>
                <p className="mb-2">Gira es una aplicación diseñada para interactuar dentro de eventos específicos. Los usuarios deben:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Tener al menos 18 años de edad o la mayoría de edad legal en su jurisdicción.</li>
                  <li>Proporcionar información verdadera, exacta y completa al registrarse.</li>
                  <li>No utilizar la app para ningún propósito ilegal o no autorizado.</li>
                  <li>Mantener un comportamiento respetuoso con otros usuarios de la plataforma.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-white font-bold text-base mb-2">3. Interacciones y Bebidas Virtuales</h3>
                <p>La aplicación permite la compra e invitación de "tragos" (bebidas reales en el evento). Estas compras se gestionan a través de la pasarela de pagos integrada. Una vez enviado un trago a otro usuario, la transacción no es reembolsable. Las bebidas deben reclamarse en las barras designadas del evento físico.</p>
              </section>

              <section>
                <h3 className="text-white font-bold text-base mb-2">4. Seguridad y Moderación</h3>
                <p>Nos reservamos el derecho, pero no la obligación, de monitorear y moderar el contenido generado por los usuarios. Los usuarios pueden bloquear a otros si se sienten incómodos. Cualquier abuso, acoso o violación de estos términos resultará en la suspensión inmediata de la cuenta.</p>
              </section>

              <section>
                <h3 className="text-white font-bold text-base mb-2">5. Limitación de Responsabilidad</h3>
                <p>Gira no se hace responsable por las interacciones físicas entre usuarios que decidan encontrarse en el evento. El uso de la aplicación y cualquier encuentro en persona es bajo el propio riesgo del usuario.</p>
              </section>

              <section>
                <h3 className="text-white font-bold text-base mb-2">6. Modificaciones</h3>
                <p>Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios entrarán en vigencia inmediatamente después de su publicación en la aplicación.</p>
              </section>
            </>
          ) : (
            <>
              <section>
                <h3 className="text-white font-bold text-base mb-2">1. Información que Recopilamos</h3>
                <p className="mb-2">Para ofrecerte la mejor experiencia en tus eventos, recopilamos:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Información de Perfil:</strong> Nombre, edad, fotografías, pronombres e intereses.</li>
                  <li><strong>Datos de Cuenta:</strong> Correo electrónico y contraseña (encriptada).</li>
                  <li><strong>Actividad en la App:</strong> Tus interacciones, likes, matches, mensajes y compras de tragos.</li>
                  <li><strong>Datos Técnicos:</strong> Información sobre tu dispositivo y conexión.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-white font-bold text-base mb-2">2. Uso de tu Información</h3>
                <p className="mb-2">Utilizamos tus datos exclusivamente para:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Crear y gestionar tu cuenta de usuario.</li>
                  <li>Mostrar tu perfil a otros asistentes del mismo evento.</li>
                  <li>Procesar las transacciones y pagos en las barras del evento.</li>
                  <li>Mejorar nuestros algoritmos de coincidencia y experiencia general de la app.</li>
                  <li>Mantener la seguridad de la plataforma y prevenir fraudes.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-white font-bold text-base mb-2">3. Compartir tu Información</h3>
                <p>Tu perfil (nombre, edad, fotos, bio, intereses) será visible para otros usuarios que asistan al mismo evento. No vendemos tus datos personales a terceros. Podemos compartir información con proveedores de servicios de pago y servicios de infraestructura técnica bajo estrictos acuerdos de confidencialidad.</p>
              </section>

              <section>
                <h3 className="text-white font-bold text-base mb-2">4. Privacidad de Mensajes</h3>
                <p>Tus mensajes privados están almacenados de forma segura. Implementamos un sistema de bloqueo que permite a cualquier usuario cesar de inmediato la recepción de mensajes de otro perfil. Los chats eliminados se ocultan localmente.</p>
              </section>

              <section>
                <h3 className="text-white font-bold text-base mb-2">5. Tus Derechos</h3>
                <p>Tienes derecho a acceder, corregir o solicitar la eliminación completa de tus datos y cuenta en cualquier momento. Puedes ejercer este derecho contactándonos directamente a través del soporte de la aplicación.</p>
              </section>

              <section>
                <h3 className="text-white font-bold text-base mb-2">6. Seguridad de Datos</h3>
                <p>Implementamos medidas de seguridad de la industria (encriptación, RLS en base de datos) para proteger tu información. Sin embargo, ningún sistema es 100% invulnerable, por lo que te instamos a usar contraseñas seguras.</p>
              </section>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 bg-black/20">
          <button 
            onClick={onClose}
            className="w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all active:scale-95 gradient-brand shadow-lg"
          >
            Entendido
          </button>
        </div>

      </div>
    </div>
  )
}


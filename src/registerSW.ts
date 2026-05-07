export function registerSW(){
  if(import.meta.env.DEV){
    // En dev, desregistrar cualquier SW anterior para evitar conflictos
    if('serviceWorker' in navigator){
      navigator.serviceWorker.getRegistrations().then(regs => {
        regs.forEach(r => r.unregister())
      })
    }
    return
  }
  if('serviceWorker' in navigator){
    window.addEventListener('load', ()=>{
      // BASE_URL es '/agenda_ios/' en producción y '/' en dev
      navigator.serviceWorker.register(import.meta.env.BASE_URL + 'sw.js').then(reg => {
        // Guardar referencia en window para acceso desde App.tsx
        (window as any).swRegistration = reg
        
        // Escuchar cuando hay un nuevo SW waiting — el navegador detecta esto automáticamente
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Hay un nuevo SW listo y uno anterior activo = hay actualización
                console.log('✓ SW Update detected - Banner will show')
                window.dispatchEvent(new Event('swUpdated'))
              }
            })
          }
        })
        
        // Escuchar mensajes del SW
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data?.type === 'SW_UPDATED') {
            console.log('✓ SW sent update notification')
            window.dispatchEvent(new Event('swUpdated'))
          }
        })
        
        // Verificar actualizaciones solo al cargar y cuando recupera foco
        const checkForUpdates = () => {
          reg.update().then(() => {
            console.log('✓ Checked for SW updates')
          }).catch(e => {
            console.warn('Update check failed:', e)
          })
        }
        
        // Verificar una sola vez al cargar
        checkForUpdates()
        
        // Verificar cuando la app vuelve a tener foco (usuario abre la app)
        window.addEventListener('focus', checkForUpdates)
      }).catch((err)=>{
        console.warn('SW registration failed:', err)
      })
    })
  }
}

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
      // BASE_URL es '/agenda_ios/' en producción
      navigator.serviceWorker.register(import.meta.env.BASE_URL + 'sw.js').then(reg => {
        // Guardar referencia en window para acceso desde App.tsx
        (window as any).swRegistration = reg
        
        // Estado inicial
        let isNewWorker = false
        
        // Escuchar cuando hay un nuevo SW waiting
        reg.addEventListener('updatefound', () => {
          console.log('✓ updatefound: hay un nuevo SW instalándose')
          const newWorker = reg.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              console.log('SW statechange:', newWorker.state)
              if (newWorker.state === 'installed') {
                isNewWorker = true
                console.log('✓ New SW installed - checking controller')
                // Disparar evento si hay un SW anterior activo
                if (navigator.serviceWorker.controller) {
                  console.log('✓ SW Update detected - Banner will show')
                  window.dispatchEvent(new Event('swUpdated'))
                } else {
                  console.log('ℹ No controller (first install)')
                }
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
        
        // Si hay un SW en estado waiting, mostrar banner
        if (reg.waiting) {
          console.log('✓ Found waiting SW on init')
          window.dispatchEvent(new Event('swUpdated'))
        }
        
        // Verificar actualizaciones solo al cargar y cuando recupera foco
        const checkForUpdates = () => {
          console.log('Checking for updates...')
          reg.update().then(() => {
            console.log('✓ Checked for SW updates')
          }).catch(e => {
            console.warn('Update check failed:', e)
          })
        }
        
        // Verificar una sola vez al cargar
        checkForUpdates()
        
        // Verificar cuando la app vuelve a tener foco
        window.addEventListener('focus', checkForUpdates)
      }).catch((err)=>{
        console.warn('SW registration failed:', err)
      })
    })
  }
}

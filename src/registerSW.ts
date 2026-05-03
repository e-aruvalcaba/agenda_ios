export function registerSW(){
  if('serviceWorker' in navigator){
    window.addEventListener('load', ()=>{
      // BASE_URL es '/agenda_ios/' en producción y '/' en dev
      navigator.serviceWorker.register(import.meta.env.BASE_URL + 'sw.js').then(reg => {
        // Escuchar cuando hay un nuevo SW waiting
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Hay un nuevo SW listo y uno anterior activo = hay actualizacion
                window.dispatchEvent(new Event('swUpdated'))
              }
            })
          }
        })
        
        // Escuchar mensajes del SW (p.ej. actualizaciones)
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data?.type === 'SW_UPDATED') {
            window.dispatchEvent(new Event('swUpdated'))
          }
        })
        
        // Verificar actualización cada vez que la app obtiene foco
        window.addEventListener('focus', () => {
          reg.update()
        })
        
        // Verificar también al cargar
        reg.update()
      }).catch(()=>{
        console.warn('SW registration failed')
      })
    })
  }
}

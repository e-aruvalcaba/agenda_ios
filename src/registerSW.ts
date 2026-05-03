export function registerSW(){
  if('serviceWorker' in navigator){
    window.addEventListener('load', ()=>{
      // BASE_URL es '/agenda_ios/' en producción y '/' en dev
      navigator.serviceWorker.register(import.meta.env.BASE_URL + 'sw.js').then(reg => {
        // Escuchar mensajes del SW (p.ej. actualizaciones)
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data?.type === 'SW_UPDATED') {
            // Disparar evento global para que la app muestre el prompt
            window.dispatchEvent(new Event('swUpdated'))
          }
        })
      }).catch(()=>{
        console.warn('SW registration failed')
      })
    })
  }
}

export function registerSW(){
  if('serviceWorker' in navigator){
    window.addEventListener('load', ()=>{
      // BASE_URL es '/agenda_ios/' en producción y '/' en dev
      navigator.serviceWorker.register(import.meta.env.BASE_URL + 'sw.js').catch(()=>{
        console.warn('SW registration failed')
      })
    })
  }
}

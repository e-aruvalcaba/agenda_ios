import React, { useEffect, useState } from 'react'

export default function InstallPrompt(){
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [show, setShow] = useState(false)
  const [isIos, setIsIos] = useState(false)

  useEffect(()=>{
    if(typeof window === 'undefined') return
    const ua = navigator.userAgent.toLowerCase()
    const ios = /iphone|ipad|ipod/.test(ua)
    setIsIos(ios)

    const installed = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches
      || (navigator as any).standalone === true
    const dismissed = localStorage.getItem('install_prompt_dismissed') === '1'
    if(installed || dismissed) return

    const handler = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', handler as any)

    // For browsers that support prompt-less install (Android), show a gentle hint
    // For iOS we also show instructions when not installed
    // If no beforeinstallprompt fired, still show slight hint after short delay
    const timeout = setTimeout(()=>{
      if(!deferredPrompt && !installed) setShow(true)
    }, 1500)

    return ()=>{
      window.removeEventListener('beforeinstallprompt', handler as any)
      clearTimeout(timeout)
    }
  },[deferredPrompt])

  const onInstallClick = async ()=>{
    if(deferredPrompt){
      try{
        await deferredPrompt.prompt()
        const choice = await deferredPrompt.userChoice
        if(choice && choice.outcome === 'accepted'){
          localStorage.setItem('install_prompt_dismissed','1')
        }
      }catch(e){
        // ignore
      }
    }
    setShow(false)
  }

  const onDismiss = ()=>{
    localStorage.setItem('install_prompt_dismissed','1')
    setShow(false)
  }

  if(!show) return null

  return (
    <div style={{position:'fixed',left:12,right:12,bottom:20,zIndex:1200,display:'flex',justifyContent:'center'}}>
      <div style={{maxWidth:720,background:'#fff',padding:12,borderRadius:10,boxShadow:'0 6px 20px rgba(0,0,0,0.12)',display:'flex',alignItems:'center',gap:12}}>
        <div style={{flex:1}}>
          <div style={{fontWeight:700,fontSize:14}}>Instala la app en tu dispositivo</div>
          <div style={{fontSize:13,color:'#666',marginTop:6}}>
            {isIos ? (
              <>Para guardar la app en iOS: toca <strong>Compartir</strong> y luego <strong>Agregar a pantalla de inicio</strong>.</>
            ) : (
              <>Instálala para un acceso más rápido y mejor experiencia. Toca <strong>Instalar</strong> para continuar.</>
            )}
          </div>
        </div>
        <div style={{display:'flex',gap:8}}>
          {!isIos && <button onClick={onInstallClick} style={{padding:'8px 12px',background:'var(--primary)',color:'#fff',border:'none',borderRadius:8,cursor:'pointer'}}>Instalar</button>}
          <button onClick={onDismiss} style={{padding:'8px 12px',background:'rgba(0,0,0,0.06)',border:'none',borderRadius:8,cursor:'pointer'}}>Cerrar</button>
        </div>
      </div>
    </div>
  )
}

import React from 'react'

export default function Loader(){
  return (
    <div style={{
      position:'fixed',
      inset:0,
      background:'rgba(0,0,0,0.6)',
      display:'flex',
      alignItems:'center',
      justifyContent:'center',
      zIndex:999,
      animation:'fadeIn 200ms ease-out'
    }}>
      <div style={{
        display:'flex',
        flexDirection:'column',
        alignItems:'center',
        gap:16
      }}>
        <div style={{
          width:50,
          height:50,
          border:'3px solid rgba(255,255,255,0.2)',
          borderTop:'3px solid #fff',
          borderRadius:'50%',
          animation:'spin 1s linear infinite'
        }} />
        <p style={{color:'#fff',fontSize:14,margin:0,fontWeight:500}}>Cargando...</p>
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  )
}

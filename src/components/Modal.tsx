import React from 'react'

export default function Modal({children, onClose}:{children:React.ReactNode,onClose?:()=>void}){
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Diálogo">
        <div style={{display:'flex',justifyContent:'flex-end'}}>
          <button onClick={onClose} style={{background:'transparent',color:'#666',padding:6,borderRadius:6}} aria-label="Cerrar">✕</button>
        </div>
        <div>
          {children}
        </div>
      </div>
    </div>
  )
}

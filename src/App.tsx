import React, { useEffect, useState } from 'react'
import TodayList from './components/TodayList'
import AppointmentForm from './components/AppointmentForm'
import Payments from './components/Payments'
import Analytics from './components/Analytics'
import Modal from './components/Modal'
import History from './components/History'
import { db } from './db'

type Tab = 'citas' | 'pagos' | 'analitica' | 'historial'

export default function App(){
  const [tab, setTab] = useState<Tab>('citas')
  const [showModal, setShowModal] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(()=>{
    if(navigator.storage && (navigator as any).storage.persist){
      ;(navigator as any).storage.persist()
    }
  },[])

  const handleExport = async ()=>{
    const data = await db.exportAll()
    const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'agenda-backup.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = async (file:File | null)=>{
    if(!file) return
    const text = await file.text()
    try{
      const parsed = JSON.parse(text)
      await db.importAll(parsed)
      alert('Importado correctamente')
      setRefreshKey(k=>k+1)
    }catch(e){
      alert('Archivo inválido')
    }
  }

  const handleSaved = ()=>{
    setRefreshKey(k=>k+1)
  }

  return (
    <div className="app">
      <div className="topbar">
        <h1>📋 Agenda</h1>
        <div className="topbar-controls">
          <button onClick={handleExport} style={{padding:'8px 12px',fontSize:13}}>📥 Respaldar</button>
          <label style={{display:'flex',alignItems:'center',gap:6,cursor:'pointer',padding:'8px 12px',background:'#6c757d',borderRadius:6,color:'#fff',fontSize:13,fontWeight:500,textDecoration:'none'}}>
            <input type="file" accept="application/json" style={{display:'none'}} onChange={e=>handleImport(e.target.files?.[0]||null)} />
            <span>📤 Restaurar</span>
          </label>
        </div>
      </div>

      <div style={{marginTop:12}}>
        {tab === 'citas' && (
          <div className="grid">
            <div>
              <div className="card">
                <TodayList key={refreshKey} />
              </div>
            </div>
          </div>
        )}

        {tab === 'pagos' && (
          <div className="card">
            <Payments />
          </div>
        )}

        {tab === 'analitica' && (
          <div className="card">
            <Analytics />
          </div>
        )}

        {tab === 'historial' && (
          <div className="card">
            <History />
          </div>
        )}
      </div>

      {/* floating action button */}
      <button className="fab" aria-label="Nueva cita" onClick={()=>setShowModal(true)}>+</button>

      {/* bottom navigation (mobile-first) */}
      <div className="bottom-nav" role="navigation" aria-label="Navegación">
        <button className={tab==='citas' ? 'tab active' : 'tab'} onClick={()=>setTab('citas')}>Citas</button>
        <button className={tab==='pagos' ? 'tab active' : 'tab'} onClick={()=>setTab('pagos')}>Pagos</button>
        <button className={tab==='analitica' ? 'tab active' : 'tab'} onClick={()=>setTab('analitica')}>Analítica</button>
        <button className={tab==='historial' ? 'tab active' : 'tab'} onClick={()=>setTab('historial')}>Historial</button>
      </div>

      {showModal && (
        <Modal onClose={()=>setShowModal(false)}>
          <AppointmentForm onClose={()=>setShowModal(false)} onSaved={()=>{handleSaved(); setShowModal(false)}} />
        </Modal>
      )}
    </div>
  )
}

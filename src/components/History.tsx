import React, { useEffect, useState } from 'react'
import { db, Appointment } from '../db'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import Loader from './Loader'

export default function History(){
  const [date, setDate] = useState<string>(format(new Date(),'yyyy-MM-dd'))
  const [items, setItems] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(()=>{ load() },[date])
  const load = async ()=>{
    setLoading(true)
    const d = date
    const list = await db.appointments.where('datetime').startsWith(d).sortBy('datetime')
    setItems(list)
    setLoading(false)
  }

  return (
    <>
      {loading && <Loader />}
      <div>
        <h2 style={{margin:'0 0 16px 0',fontSize:20,fontWeight:700}}>📜 Historial de citas</h2>
        <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:12,flexWrap:'wrap'}}>
          <label style={{fontSize:14,fontWeight:500}}>Seleccionar fecha:</label>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)} />
          <button onClick={load} style={{fontSize:13}}>🔍 Buscar</button>
        </div>

        {items.length===0 ? (
          <div className="card small" style={{padding:16,textAlign:'center'}}>📭 No hay citas para {format(parseISO(date),'PPP',{locale:es})}</div>
        ) : (
          <ul style={{paddingLeft:0,listStyle:'none'}}>
            {items.map(it=> (
              <li key={it.id} className="card" style={{marginBottom:12}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
                  <div>
                    <div style={{fontSize:12,color:'var(--text-light)',marginBottom:2}}>Cliente</div>
                    <div style={{fontWeight:700,fontSize:16}}>{it.clientName}</div>
                  </div>
                  <div style={{textAlign:'right',background:'rgba(13,110,253,0.1)',padding:'6px 10px',borderRadius:6}}>
                    <div style={{fontSize:12,color:'var(--text-light)',marginBottom:2}}>Hora</div>
                    <div style={{fontWeight:600,fontSize:15,color:'var(--primary)'}}>{format(new Date(it.datetime),'h:mm a',{locale:es})}</div>
                  </div>
                </div>
                {it.description && (
                  <div style={{marginBottom:0}}>
                    <div style={{fontSize:12,color:'var(--text-light)',marginBottom:4}}>Notas</div>
                    <div style={{fontSize:14,lineHeight:1.4}}>{it.description}</div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}

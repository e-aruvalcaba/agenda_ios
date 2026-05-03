import React, { useEffect, useState } from 'react'
import { db, Appointment } from '../db'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

export default function History(){
  const [date, setDate] = useState<string>(format(new Date(),'yyyy-MM-dd'))
  const [items, setItems] = useState<Appointment[]>([])

  useEffect(()=>{ load() },[date])
  const load = async ()=>{
    const d = date
    const list = await db.appointments.where('datetime').startsWith(d).sortBy('datetime')
    setItems(list)
  }

  return (
    <div>
      <h2>Historial de citas</h2>
      <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:12}}>
        <label className="small">Seleccionar fecha</label>
        <input type="date" value={date} onChange={e=>setDate(e.target.value)} />
        <button onClick={load}>Buscar</button>
      </div>

      {items.length===0 ? (
        <div className="card small">No hay citas para {format(parseISO(date),'PPP',{locale:es})}</div>
      ) : (
        <ul style={{paddingLeft:0,listStyle:'none'}}>
          {items.map(it=> (
            <li key={it.id} className="card" style={{marginBottom:8}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                <div>
                  <div style={{fontSize:12,color:'#666'}}>Nombre:</div>
                  <div style={{fontWeight:700}}>{it.clientName}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:12,color:'#666'}}>Hora:</div>
                  <div className="small">{format(new Date(it.datetime),'h:mm a',{locale:es})}</div>
                </div>
              </div>
              <div>
                <div style={{fontSize:12,color:'#666',marginBottom:4}}>Descripción:</div>
                <div>{it.description || '-'}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

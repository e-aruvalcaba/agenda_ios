import React, { useState } from 'react'
import { db } from '../db'
import { formatISO } from 'date-fns'

export default function AppointmentForm({onClose, initialDate, onSaved}:{onClose?:()=>void, initialDate?:Date, onSaved?:()=>void}){
  const [clientName,setClientName] = useState('')
  const [datetime,setDatetime] = useState<string>((initialDate ? formatISO(initialDate) : formatISO(new Date())).slice(0,16))
  const [description,setDescription] = useState('')

  const submit = async (e:React.FormEvent)=>{
    e.preventDefault()
    // Parse datetime-local string and create Date in local timezone, then convert to ISO
    const [datePart, timePart] = datetime.split('T')
    const [year, month, day] = datePart.split('-').map(Number)
    const [hour, minute] = timePart.split(':').map(Number)
    const dt = new Date(year, month - 1, day, hour, minute, 0)
    const iso = dt.toISOString()
    await db.appointments.add({clientName, datetime: iso, description})
    if(onSaved) onSaved()
    else alert('Cita creada')
    if(onClose) onClose()
  }

  return (
    <form onSubmit={submit}>
      <h3>Nueva cita</h3>
      <div style={{marginBottom:8}}>
        <label>Nombre del cliente</label>
        <input value={clientName} onChange={e=>setClientName(e.target.value)} required />
      </div>
      <div style={{marginBottom:8}}>
        <label>Fecha y hora</label>
        <input type="datetime-local" value={datetime} onChange={e=>setDatetime(e.target.value)} required />
      </div>
      <div style={{marginBottom:8}}>
        <label>Descripción</label>
        <textarea value={description} onChange={e=>setDescription(e.target.value)} />
      </div>
      <div className="actions">
        <button type="submit">Guardar</button>
        <button type="button" onClick={onClose as any} style={{background:'#6c757d'}}>Cerrar</button>
      </div>
    </form>
  )
}

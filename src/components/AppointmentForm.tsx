import React, { useState, useEffect } from 'react'
import { db, Appointment } from '../db'
import { formatISO } from 'date-fns'
import Swal from 'sweetalert2'

export default function AppointmentForm({onClose, initialDate, onSaved, initialAppointment}:{onClose?:()=>void, initialDate?:Date, onSaved?:()=>void, initialAppointment?:Appointment}){
  const [clientName,setClientName] = useState('')
  const [datetime,setDatetime] = useState<string>('')
  const [description,setDescription] = useState('')

  useEffect(() => {
    if (initialAppointment) {
      // Editar cita existente
      setClientName(initialAppointment.clientName)
      setDescription(initialAppointment.description || '')
      // Convertir ISO a datetime-local format
      const dt = new Date(initialAppointment.datetime)
      const year = dt.getFullYear()
      const month = String(dt.getMonth() + 1).padStart(2, '0')
      const day = String(dt.getDate()).padStart(2, '0')
      const hours = String(dt.getHours()).padStart(2, '0')
      const minutes = String(dt.getMinutes()).padStart(2, '0')
      setDatetime(`${year}-${month}-${day}T${hours}:${minutes}`)
    } else {
      // Nueva cita
      setDatetime((initialDate ? formatISO(initialDate) : formatISO(new Date())).slice(0,16))
    }
  }, [initialAppointment, initialDate])

  const submit = async (e:React.FormEvent)=>{
    e.preventDefault()
    // Parse datetime-local string and create Date in local timezone, then convert to ISO
    const [datePart, timePart] = datetime.split('T')
    const [year, month, day] = datePart.split('-').map(Number)
    const [hour, minute] = timePart.split(':').map(Number)
    const dt = new Date(year, month - 1, day, hour, minute, 0)
    const iso = dt.toISOString()
    
    if (initialAppointment && initialAppointment.id) {
      // Actualizar cita existente
      await db.appointments.update(initialAppointment.id, {clientName, datetime: iso, description})
      await Swal.fire('Éxito', 'Cita actualizada correctamente', 'success')
      if(onSaved) onSaved()
    } else {
      // Crear nueva cita
      await db.appointments.add({clientName, datetime: iso, description})
      await Swal.fire('Éxito', 'Cita creada correctamente', 'success')
      if(onSaved) onSaved()
    }
    if(onClose) onClose()
  }

  return (
    <form onSubmit={submit}>
      <h3>{initialAppointment ? 'Editar cita' : 'Nueva cita'}</h3>
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

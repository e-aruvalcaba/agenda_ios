import React, { useEffect, useState } from 'react'
import { db, Appointment } from '../db'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import Loader from './Loader'
import Modal from './Modal'
import AppointmentForm from './AppointmentForm'
import Swal from 'sweetalert2'

export default function History(){
  const [date, setDate] = useState<string>(format(new Date(),'yyyy-MM-dd'))
  const [items, setItems] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(()=>{ load() },[date])
  const load = async ()=>{
    setLoading(true)
    // Construir límites del día en hora LOCAL para comparar correctamente con ISOs guardados en UTC
    const [y, m, d] = date.split('-').map(Number)
    const startUTC = new Date(y, m - 1, d, 0, 0, 0, 0).toISOString()
    const endUTC   = new Date(y, m - 1, d, 23, 59, 59, 999).toISOString()
    const list = await db.appointments
      .where('datetime')
      .between(startUTC, endUTC, true, true)
      .toArray()
    list.sort((a, b) => a.datetime.localeCompare(b.datetime))
    setItems(list)
    setLoading(false)
  }

  const exportToCSV = () => {
    if (!items || items.length === 0) {
      Swal.fire('Advertencia', 'No hay citas para exportar en este filtro', 'warning')
      return
    }

    const headers = ['Fecha', 'Hora', 'Cliente', 'Descripción']
    const rows = items.map(it => {
      const dt = new Date(it.datetime)
      const fecha = format(dt, 'yyyy-MM-dd', { locale: es })
      const hora = format(dt, 'HH:mm', { locale: es })
      return [fecha, hora, it.clientName || '-', it.description || '-']
    })

    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `citas_${date}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleEdit = (appointment: Appointment) => {
    setEditingAppointment(appointment)
    setShowEditModal(true)
  }

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: '¿Eliminar cita?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    })
    if (result.isConfirmed) {
      await db.deleteAppointment(id)
      await Swal.fire('Eliminado', 'La cita ha sido eliminada', 'success')
      load()
    }
  }

  const handleEditClose = () => {
    setShowEditModal(false)
    setEditingAppointment(null)
  }

  const handleEditSaved = () => {
    load()
    handleEditClose()
  }

  return (
    <>
      {loading && <Loader />}
      <div>
        <h2 style={{margin:'0 0 16px 0',fontSize:20,fontWeight:700}}>📜 Historial de citas</h2>
        <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:12,flexWrap:'wrap', width: '100%'}}>
          <label style={{fontSize:14,fontWeight:500}}>Seleccionar fecha:</label>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)} />
          {/* <button onClick={load} style={{fontSize:13}}>🔍 Buscar</button> */}

        </div>
          <div style={{display: 'flex', justifyContent: 'flex-end'}}>
          <button onClick={exportToCSV} style={{fontSize:13}}>📥 Descargar CSV</button>

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
                  <div style={{marginBottom:10}}>
                    <div style={{fontSize:12,color:'var(--text-light)',marginBottom:4}}>Notas</div>
                    <div style={{fontSize:14,lineHeight:1.4}}>{it.description}</div>
                  </div>
                )}
                <div className="btn-group" style={{marginTop:8, display: 'flex', justifyContent: 'space-between'}}>
                  <button onClick={() => handleEdit(it)} style={{fontSize:13}}>✏️ Editar</button>
                  <button onClick={() => handleDelete(it.id!)} style={{fontSize:13,background:'#dc3545'}}>🗑️ Eliminar</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      {showEditModal && editingAppointment && (
        <Modal onClose={handleEditClose}>
          <AppointmentForm
            onClose={handleEditClose}
            onSaved={handleEditSaved}
            initialAppointment={editingAppointment}
          />
        </Modal>
      )}
    </>
  )
}

import React, { useEffect, useState, useRef } from 'react'
import { db, Appointment } from '../db'
import { format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfDay, endOfDay, addWeeks } from 'date-fns'
import { es } from 'date-fns/locale'
import Loader from './Loader'
import Modal from './Modal'
import AppointmentForm from './AppointmentForm'
import Swal from 'sweetalert2'

type Range = 'day' | 'week' | 'nextWeek' | 'month' | 'custom'

function filterByRange(appointments: Appointment[], range: Range, customStart?: string, customEnd?: string): Appointment[] {
  const now = new Date()
  return appointments.filter(a => {
    const d = new Date(a.datetime)
    if (range === 'day') {
      return d >= startOfDay(now) && d <= endOfDay(now)
    }
    if (range === 'week') {
      return d >= startOfWeek(now, { weekStartsOn: 1 }) && d <= endOfWeek(now, { weekStartsOn: 1 })
    }
    if (range === 'nextWeek') {
      const next = addWeeks(now, 1)
      return d >= startOfWeek(next, { weekStartsOn: 1 }) && d <= endOfWeek(next, { weekStartsOn: 1 })
    }
    if (range === 'month') {
      return d >= startOfMonth(now) && d <= endOfMonth(now)
    }
    if (range === 'custom' && customStart && customEnd) {
      const [sy, sm, sd] = customStart.split('-').map(Number)
      const [ey, em, ed] = customEnd.split('-').map(Number)
      const start = new Date(sy, sm - 1, sd, 0, 0, 0, 0)
      const end   = new Date(ey, em - 1, ed, 23, 59, 59, 999)
      return d >= start && d <= end
    }
    return true
  })
}

const RANGE_LABELS: Record<Range, string> = {
  day: 'Hoy',
  week: 'Esta semana',
  nextWeek: 'Próxima semana',
  month: 'Este mes',
  custom: 'Personalizado',
}

export default function History(){
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([])
  const [range, setRange] = useState<Range>('day')
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(()=>{ load() },[])
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  const load = async ()=>{
    setLoading(true)
    const list = await db.appointments.orderBy('datetime').toArray()
    setAllAppointments(list)
    setLoading(false)
  }

  const exportToCSV = () => {
    const items = range === 'custom' ? filterByRange(allAppointments, 'custom', customStartDate, customEndDate) : filterByRange(allAppointments, range)
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
    a.download = `citas_${format(new Date(),'yyyy-MM-dd_HHmmss')}.csv`
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

  const items = range === 'custom' ? filterByRange(allAppointments, 'custom', customStartDate, customEndDate) : filterByRange(allAppointments, range)

  return (
    <>
      {loading && <Loader />}
      <div>
        <h2 style={{margin:'0 0 16px 0',fontSize:20,fontWeight:700}}>📜 Historial de citas</h2>

        {/* Range filter (dropdown) */}
        <div style={{ marginBottom: 16, position: 'relative', display: 'flex', justifyContent: 'flex-end' }} ref={menuRef}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'flex-end', color: 'black' }}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                fontSize: 13,
                padding: '6px 12px',
                background: 'rgba(0,0,0,0.06)',
                border: 'none',
                borderRadius: 20,
                cursor: 'pointer',
                fontWeight: 500,
                color: 'black'
              }}
            >
              Filtro de citas ▾
            </button>
            <div style={{ fontSize: 13, color: 'var(--text-light)' }}>
              <span style={{ marginLeft: 4 }}>{/* space for layout */}</span>
            </div>
          </div>

          {menuOpen && (
            <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 8, background: '#fff', boxShadow: '0 6px 18px rgba(0,0,0,0.08)', borderRadius: 8, padding: 8, zIndex: 50, minWidth: 160 }}>
              {(['day', 'week', 'nextWeek', 'month', 'custom'] as Range[]).map(r => (
                <div
                  key={r}
                  onClick={() => { setRange(r); setMenuOpen(false) }}
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    borderRadius: 6,
                    background: range === r ? 'rgba(0,0,0,0.06)' : 'transparent',
                    fontWeight: range === r ? 700 : 500,
                  }}
                >
                  {RANGE_LABELS[r]}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Custom date range picker */}
        {range === 'custom' && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div>
              <label style={{ fontSize: 13, color: 'var(--text-light)', display: 'block', marginBottom: 4 }}>Desde</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #dee2e6', fontSize: 13 }}
              />
            </div>
            <div>
              <label style={{ fontSize: 13, color: 'var(--text-light)', display: 'block', marginBottom: 4 }}>Hasta</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #dee2e6', fontSize: 13 }}
              />
            </div>
            {(customStartDate || customEndDate) && (
              <button
                onClick={() => {
                  setCustomStartDate('')
                  setCustomEndDate('')
                }}
                style={{ fontSize: 13, padding: '6px 12px', background: 'rgba(0,0,0,0.06)', border: 'none', borderRadius: 6, cursor: 'pointer' }}
              >
                Limpiar
              </button>
            )}
          </div>
        )}

        {/* Summary + export */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>
            {range === 'custom' && customStartDate && customEndDate ? (() => {
              const [sy, sm, sd] = customStartDate.split('-').map(Number)
              const [ey, em, ed] = customEndDate.split('-').map(Number)
              return `${format(new Date(sy, sm - 1, sd), 'dd MMM', { locale: es })} - ${format(new Date(ey, em - 1, ed), 'dd MMM yyyy', { locale: es })}`
            })() : RANGE_LABELS[range]}
            <span style={{ fontWeight: 400, color: 'var(--text-light)', fontSize: 13, marginLeft: 8 }}>
              ({items.length} cita{items.length !== 1 ? 's' : ''})
            </span>
          </div>
          <button onClick={exportToCSV} style={{fontSize:13}}>📥 Descargar CSV</button>
        </div>

        {items.length===0 ? (
          <div className="card small" style={{padding:16,textAlign:'center'}}>📭 No hay citas en este período</div>
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
                    <div style={{fontSize:12,color:'var(--text-light)',marginBottom:2}}>Fecha y hora</div>
                    <div style={{fontWeight:600,fontSize:15,color:'var(--primary)', display: 'flex', flexDirection: 'column', alignItems: 'flex-end'}}>
                      <div style={{fontSize:14, marginBottom:6}}>{(() => {
                        const day = format(new Date(it.datetime), 'EEEE', { locale: es })
                        return day.charAt(0).toUpperCase() + day.slice(1)
                      })()}</div>
                      <div style={{fontSize:13}}>{format(new Date(it.datetime),"d 'de' MMM, HH:mm",{locale:es})}</div>
                    </div>
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

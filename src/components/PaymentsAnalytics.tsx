import React, { useEffect, useState } from 'react'
import { db, Payment } from '../db'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import Loader from './Loader'
import Modal from './Modal'
import PaymentForm from './PaymentForm'
import { formatISO } from 'date-fns'
import Swal from 'sweetalert2'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

type Range = 'day' | 'week' | 'month' | 'all' | 'custom'

function filterByRange(payments: Payment[], range: Range, customStart?: string, customEnd?: string): Payment[] {
  const now = new Date()
  return payments.filter(p => {
    const d = new Date(p.date)
    if (range === 'day') {
      return d >= startOfDay(now) && d <= endOfDay(now)
    }
    if (range === 'week') {
      return d >= startOfWeek(now, { weekStartsOn: 1 }) && d <= endOfWeek(now, { weekStartsOn: 1 })
    }
    if (range === 'month') {
      return d >= startOfMonth(now) && d <= endOfMonth(now)
    }
    if (range === 'custom' && customStart && customEnd) {
      // Parsear como fecha LOCAL para evitar desfase UTC
      const [sy, sm, sd] = customStart.split('-').map(Number)
      const [ey, em, ed] = customEnd.split('-').map(Number)
      const start = new Date(sy, sm - 1, sd, 0, 0, 0, 0)
      const end   = new Date(ey, em - 1, ed, 23, 59, 59, 999)
      return d >= start && d <= end
    }
    return true
  })
}

function buildChartData(filtered: Payment[], range: Range) {
  if (filtered.length === 0) return { labels: [], data: [] }

  const map = new Map<string, number>()

  filtered.forEach(p => {
    const d = new Date(p.date)
    let key: string
    if (range === 'day') {
      key = format(d, 'HH:00')
    } 
    else if (range === 'week') {
      key = format(d, 'EEE dd/MM', { locale: es })
    }
    else if (range === 'month') {
      key = format(d, 'dd MMM', { locale: es })
    } else {
      key = format(d, 'dd MMM', { locale: es })
    }
    map.set(key, (map.get(key) || 0) + p.amount)
  })

  // For day/week/month sort chronologically via original date
  const entries = Array.from(map.entries())
  return { labels: entries.map(e => e[0]), data: entries.map(e => e[1]) }
}

const RANGE_LABELS: Record<Range, string> = {
  day: 'Hoy',
  week: 'Esta semana',
  month: 'Este mes',
  all: 'Todo',
  custom: 'Personalizado',
}

export default function PaymentsAnalytics() {
  const [allPayments, setAllPayments] = useState<Payment[]>([])
  const [range, setRange] = useState<Range>('month')
  const [showChart, setShowChart] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  // form state
  const [amount, setAmount] = useState<number | ''>('')
  const [concept, setConcept] = useState('')
  const [method, setMethod] = useState<'efectivo' | 'tarjeta' | 'transferencia'>('efectivo')
  const [datetime, setDatetime] = useState<string>(formatISO(new Date()).slice(0, 16))

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    setAllPayments(await db.payments.orderBy('date').reverse().toArray())
    setLoading(false)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amt = typeof amount === 'number' ? amount : parseFloat(String(amount))
    if (isNaN(amt)) {
      await Swal.fire('Error', 'Cantidad inválida', 'error')
      return
    }
    
    // Parse datetime-local string and create Date in local timezone, then convert to ISO
    const [datePart, timePart] = datetime.split('T')
    const [year, month, day] = datePart.split('-').map(Number)
    const [hour, minute] = timePart.split(':').map(Number)
    const dt = new Date(year, month - 1, day, hour, minute, 0)
    const iso = dt.toISOString()
    
    await db.payments.add({
      date: iso,
      amount: amt,
      concept,
      method,
    })
    await Swal.fire('Éxito', 'Pago registrado correctamente', 'success')
    setAmount('')
    setConcept('')
    setMethod('efectivo')
    setDatetime(formatISO(new Date()).slice(0, 16))
    setShowForm(false)
    load()
  }

  const exportToCSV = async () => {
    if (filtered.length === 0) {
      await Swal.fire('Advertencia', 'No hay pagos para exportar en este período', 'warning')
      return
    }

    // CSV headers
    const headers = ['Fecha', 'Concepto', 'Monto', 'Método']
    
    // CSV rows
    const rows = filtered.map(p => [
      format(new Date(p.date), 'dd/MM/yyyy HH:mm', { locale: es }),
      p.concept || '-',
      p.amount.toString().replace('.', ','),
      p.method === 'efectivo' ? 'Efectivo' : p.method === 'tarjeta' ? 'Tarjeta' : 'Transferencia',
    ])

    // Add total row
    rows.push(['', 'TOTAL', total.toLocaleString('es-MX', { minimumFractionDigits: 2 }).replace('.', ','), ''])

    // Combine headers and rows
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')

    // Create blob and download
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }) // UTF-8 BOM for Excel
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `pagos_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleEdit = (payment: Payment) => {
    setEditingPayment(payment)
    setShowEditModal(true)
  }

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: '¿Eliminar pago?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    })
    if (result.isConfirmed) {
      await db.deletePayment(id)
      await Swal.fire('Eliminado', 'El pago ha sido eliminado', 'success')
      load()
    }
  }

  const handleEditClose = () => {
    setShowEditModal(false)
    setEditingPayment(null)
  }

  const handleEditSaved = () => {
    load()
    handleEditClose()
  }

  const filtered = range === 'custom' ? filterByRange(allPayments, 'custom', customStartDate, customEndDate) : filterByRange(allPayments, range)
  const total = filtered.reduce((s, p) => s + p.amount, 0)
  const chartData = buildChartData(filtered, range)

  const barData = {
    labels: chartData.labels,
    datasets: [
      {
        label: 'Ingresos ($)',
        data: chartData.data,
        backgroundColor: 'rgba(13,110,253,0.7)',
        borderRadius: 6,
      },
    ],
  }

  const barOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: false },
    },
    scales: {
      y: { beginAtZero: true },
    },
  }

  return (
    <>
      {loading && <Loader />}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>💰 Pagos</h2>
        <button
          onClick={() => setShowForm(true)}
          style={{ fontSize: 14, padding: '8px 14px', fontWeight: 600 }}
        >
          + Registrar Pago
        </button>
      </div>

      {/* Range filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {(['day', 'week', 'month', 'all'] as Range[]).map(r => (
          <button
            key={r}
            onClick={() => setRange(r)}
            style={{
              fontSize: 13,
              padding: '6px 12px',
              background: range === r ? 'var(--primary)' : 'rgba(0,0,0,0.06)',
              color: range === r ? '#fff' : 'inherit',
              border: 'none',
              borderRadius: 20,
              cursor: 'pointer',
              fontWeight: range === r ? 700 : 400,
              transition: 'background 0.2s',
            }}
          >
            {RANGE_LABELS[r]}
          </button>
        ))}
        <button
          onClick={() => setRange('custom')}
          style={{
            fontSize: 13,
            padding: '6px 12px',
            background: range === 'custom' ? 'var(--primary)' : 'rgba(0,0,0,0.06)',
            color: range === 'custom' ? '#fff' : 'inherit',
            border: 'none',
            borderRadius: 20,
            cursor: 'pointer',
            fontWeight: range === 'custom' ? 700 : 400,
            transition: 'background 0.2s',
          }}
        >
          📅 Personalizado
        </button>
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

      {/* Summary + chart toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ fontSize: 15, fontWeight: 600 }}>
          Total: <span style={{ color: 'var(--primary)' }}>${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
          <span style={{ fontWeight: 400, color: 'var(--text-light)', fontSize: 13, marginLeft: 8 }}>
            ({filtered.length} pago{filtered.length !== 1 ? 's' : ''})
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flexDirection: 'column' }}>
          <button
            onClick={() => setShowChart(v => !v)}
            style={{ fontSize: 13, padding: '6px 12px', background: 'rgba(0,0,0,0.06)', border: 'none', borderRadius: 20, cursor: 'pointer', color: 'black'}}
          >
            {showChart ? '🙈 Ocultar gráfica' : '📊 Ver gráfica'}
          </button>
          <button
            onClick={exportToCSV}
            style={{ fontSize: 13, padding: '6px 12px', background: 'rgba(0,0,0,0.06)', border: 'none', borderRadius: 20, cursor: 'pointer', color: 'black' }}
          >
            📥 Descargar CSV
          </button>
        </div>
      </div>

      {/* Chart */}
      {showChart && (
        <div style={{ background: '#fff', padding: 12, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: 16 }}>
          {chartData.labels.length > 0 ? (
            <Bar data={barData} options={barOptions} />
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-light)', padding: 24, fontSize: 14 }}>
              Sin datos para este período
            </div>
          )}
        </div>
      )}

      {/* Payments list */}
      <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 0, marginBottom: 12 }}>
        📋 {range === 'custom' && customStartDate && customEndDate ? (() => {
          const [sy, sm, sd] = customStartDate.split('-').map(Number)
          const [ey, em, ed] = customEndDate.split('-').map(Number)
          return `${format(new Date(sy, sm - 1, sd), 'dd MMM', { locale: es })} - ${format(new Date(ey, em - 1, ed), 'dd MMM yyyy', { locale: es })}`
        })() : RANGE_LABELS[range]} — {filtered.length} pago{filtered.length !== 1 ? 's' : ''}
      </h3>

      {filtered.length === 0 ? (
        <div className="small" style={{ padding: 12, background: 'rgba(0,0,0,0.02)', borderRadius: 8 }}>
          No hay pagos en este período
        </div>
      ) : (
        <ul style={{ paddingLeft: 0, listStyle: 'none', margin: 0 }}>
          {filtered.map(p => (
            <li key={p.id} className="card" style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 2 }}>Concepto</div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{p.concept || '-'}</div>
                </div>
                <div style={{ textAlign: 'right', background: 'rgba(13,110,253,0.1)', padding: '8px 12px', borderRadius: 6 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 2 }}>Cantidad</div>
                  <div style={{ fontWeight: 600, fontSize: 18, color: 'var(--primary)' }}>
                    ${p.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 13, color: 'var(--text-light)' }}>
                  📅 {format(new Date(p.date), "dd MMM yyyy, h:mm a", { locale: es })}
                </div>
                <div style={{ fontSize: 13, background: 'rgba(108,117,125,0.1)', padding: '4px 8px', borderRadius: 6, color: '#6c757d', fontWeight: 500 }}>
                  {p.method === 'efectivo' ? '💵 Efectivo' : p.method === 'tarjeta' ? '🏧 Tarjeta' : '🏦 Transferencia'}
                </div>
              </div>
              <div className="btn-group" style={{marginTop:8, display: 'flex', justifyContent: 'space-between'}}>
                <button onClick={() => handleEdit(p)} style={{fontSize:13}}>✏️ Editar</button>
                <button onClick={() => handleDelete(p.id!)} style={{fontSize:13,background:'#dc3545'}}>🗑️ Eliminar</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Register Payment Modal */}
      {showForm && (
        <Modal onClose={() => setShowForm(false)}>
          <h2 style={{ margin: '0 0 16px 0', fontSize: 20, fontWeight: 700 }}>💰 Registrar Pago</h2>
          <form onSubmit={submit}>
            <div style={{ marginBottom: 12 }}>
              <label>Fecha y hora</label>
              <input type="datetime-local" value={datetime} onChange={e => setDatetime(e.target.value)} required />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label>Cantidad</label>
              <input
                type="number"
                value={amount as any}
                onChange={e => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                required
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label>Concepto</label>
              <input value={concept} onChange={e => setConcept(e.target.value)} placeholder="Servicio, producto…" />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label>Método de pago</label>
              <select value={method} onChange={e => setMethod(e.target.value as any)}>
                <option value="efectivo">💵 Efectivo</option>
                <option value="tarjeta">🏧 Tarjeta</option>
                <option value="transferencia">🏦 Transferencia</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" style={{ flex: 1 }}>✅ Guardar</button>
              <button type="button" onClick={() => setShowForm(false)} style={{ flex: 1, background: 'rgba(0,0,0,0.06)', color: 'inherit' }}>
                Cancelar
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showEditModal && editingPayment && (
        <Modal onClose={handleEditClose}>
          <PaymentForm
            onClose={handleEditClose}
            onSaved={handleEditSaved}
            initialPayment={editingPayment}
          />
        </Modal>
      )}
    </>
  )
}

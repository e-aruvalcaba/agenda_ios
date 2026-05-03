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
import { formatISO } from 'date-fns'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

type Range = 'day' | 'week' | 'month' | 'all'

function filterByRange(payments: Payment[], range: Range): Payment[] {
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
    } else if (range === 'week') {
      key = format(d, 'EEE dd/MM', { locale: es })
    } else if (range === 'month') {
      key = format(d, 'dd MMM', { locale: es })
    } else {
      key = format(d, 'MMM yyyy', { locale: es })
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
}

export default function PaymentsAnalytics() {
  const [allPayments, setAllPayments] = useState<Payment[]>([])
  const [range, setRange] = useState<Range>('month')
  const [showChart, setShowChart] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)

  // form state
  const [amount, setAmount] = useState<number | ''>('')
  const [concept, setConcept] = useState('')
  const [method, setMethod] = useState<'efectivo' | 'tarjeta' | 'transferencia'>('efectivo')
  const [date, setDate] = useState<string>(formatISO(new Date()).slice(0, 10))

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    setAllPayments(await db.payments.orderBy('date').reverse().toArray())
    setLoading(false)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amt = typeof amount === 'number' ? amount : parseFloat(String(amount))
    if (isNaN(amt)) return alert('Cantidad inválida')
    await db.payments.add({
      date: new Date(date).toISOString(),
      amount: amt,
      concept,
      method,
    })
    setAmount('')
    setConcept('')
    setMethod('efectivo')
    setDate(formatISO(new Date()).slice(0, 10))
    setShowForm(false)
    load()
  }

  const filtered = filterByRange(allPayments, range)
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
      </div>

      {/* Summary + chart toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 15, fontWeight: 600 }}>
          Total: <span style={{ color: 'var(--primary)' }}>${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
          <span style={{ fontWeight: 400, color: 'var(--text-light)', fontSize: 13, marginLeft: 8 }}>
            ({filtered.length} pago{filtered.length !== 1 ? 's' : ''})
          </span>
        </div>
        <button
          onClick={() => setShowChart(v => !v)}
          style={{ fontSize: 13, padding: '6px 12px', background: 'rgba(0,0,0,0.06)', border: 'none', borderRadius: 20, cursor: 'pointer' }}
        >
          {showChart ? '🙈 Ocultar gráfica' : '📊 Ver gráfica'}
        </button>
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
        📋 {RANGE_LABELS[range]} — {filtered.length} pago{filtered.length !== 1 ? 's' : ''}
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
              <label>Fecha</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} />
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
    </>
  )
}

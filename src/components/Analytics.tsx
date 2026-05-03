import React, { useEffect, useState } from 'react'
import { db, Payment } from '../db'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

export default function Analytics(){
  const [payments, setPayments] = useState<Payment[]>([])
  const [range, setRange] = useState<'week'|'month'|'day'|'all'>('month')

  useEffect(()=>{ load() },[])
  const load = async ()=> setPayments(await db.payments.toArray())

  const grouped = () => {
    if(range==='all'){
      const total = payments.reduce((s,p)=>s+p.amount,0)
      return {labels:['Total'],data:[total]}
    }
    const map = new Map<string, number>()
    payments.forEach(p=>{
      const d = parseISO(p.date)
      const key = range==='day' ? format(d,'yyyy-MM-dd') : range==='week' ? format(d,'yyyy-ww') : format(d,'yyyy-MM')
      map.set(key,(map.get(key)||0)+p.amount)
    })
    const entries = Array.from(map.entries()).sort((a,b)=>a[0].localeCompare(b[0]))
    // create human readable labels using locale
    const labels = entries.map(([k])=>{
      if(range==='day') return format(parseISO(k),'dd MMM','es')
      if(range==='week') return k // keep week code (could be improved)
      return k // month code
    })
    return {labels, data: entries.map(e=>e[1])}
  }

  const g = grouped()
  const data = {labels: g.labels, datasets: [{label:'Ganancias', data: g.data, backgroundColor: 'rgba(13,110,253,0.7)'}]}

  return (
    <div>
      <h3>Analítica de ganancias</h3>
      <div style={{display:'flex',gap:8,marginBottom:8}}>
        <select value={range} onChange={e=>setRange(e.target.value as any)}>
          <option value="day">Por día</option>
          <option value="week">Por semana</option>
          <option value="month">Por mes</option>
          <option value="all">Total</option>
        </select>
        <button onClick={load}>Refrescar</button>
      </div>
      <div>
        <Bar data={data} />
      </div>
    </div>
  )
}

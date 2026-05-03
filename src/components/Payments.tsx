import React, { useEffect, useState } from 'react'
import { db, Payment } from '../db'
import { formatISO, format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import Loader from './Loader'

export default function Payments(){
  const [amount,setAmount] = useState<number | ''>('')
  const [concept,setConcept] = useState('')
  const [method,setMethod] = useState<'efectivo'|'tarjeta'|'transferencia'>('efectivo')
  const [date,setDate] = useState<string>(formatISO(new Date()).slice(0,10))
  const [list,setList] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(()=>{ load() },[])
  const load = async ()=>{
    setLoading(true)
    setList(await db.payments.orderBy('date').reverse().toArray())
    setLoading(false)
  }

  const submit = async (e:React.FormEvent)=>{
    e.preventDefault()
    const amt = typeof amount==='number' ? amount : parseFloat(String(amount))
    if(isNaN(amt)) return alert('Cantidad inválida')
    await db.payments.add({date: new Date(date).toISOString(), amount: amt, concept, method})
    setAmount('')
    setConcept('')
    load()
  }

  return (
    <>
      {loading && <Loader />}
      <div>
      <h2 style={{margin:'0 0 16px 0',fontSize:20,fontWeight:700}}>💰 Registrar pago</h2>
      <form onSubmit={submit} style={{marginBottom:20}}>
        <div style={{marginBottom:12}}>
          <label>Fecha</label>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)} />
        </div>
        <div style={{marginBottom:12}}>
          <label>Cantidad</label>
          <input type="number" value={amount as any} onChange={e=>setAmount(e.target.value === '' ? '' : Number(e.target.value))} required />
        </div>
        <div style={{marginBottom:12}}>
          <label>Concepto</label>
          <input value={concept} onChange={e=>setConcept(e.target.value)} />
        </div>
        <div style={{marginBottom:12}}>
          <label>Método de pago</label>
          <select value={method} onChange={e=>setMethod(e.target.value as any)}>
            <option value="efectivo">💵 Efectivo</option>
            <option value="tarjeta">🏧 Tarjeta</option>
            <option value="transferencia">🏦 Transferencia</option>
          </select>
        </div>
        <button type="submit" style={{width:'100%'}}>✅ Agregar pago</button>
      </form>

      <h3 style={{fontSize:18,fontWeight:600,marginTop:0}}>📋 Últimos pagos ({list.length})</h3>
      {list.length === 0 ? (
        <div className="small" style={{padding:12,background:'rgba(0,0,0,0.02)',borderRadius:8}}>No hay pagos registrados</div>
      ) : (
        <ul style={{paddingLeft:0,listStyle:'none'}}>
          {list.map(p=> (
            <li key={p.id} className="card" style={{marginBottom:12}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
                <div>
                  <div style={{fontSize:12,color:'var(--text-light)',marginBottom:2}}>Concepto</div>
                  <div style={{fontWeight:700,fontSize:16}}>{p.concept || '-'}</div>
                </div>
                <div style={{textAlign:'right',background:'rgba(13,110,253,0.1)',padding:'8px 12px',borderRadius:6}}>
                  <div style={{fontSize:12,color:'var(--text-light)',marginBottom:2}}>Cantidad</div>
                  <div style={{fontWeight:600,fontSize:18,color:'var(--primary)'}}>💵 {p.amount}</div>
                </div>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div style={{fontSize:13,color:'var(--text-light)'}}>
                  📅 {format(new Date(p.date),'P h:mm a',{locale:es})}
                </div>
                <div style={{fontSize:13,background:'rgba(108,117,125,0.1)',padding:'4px 8px',borderRadius:6,color:'#6c757d',fontWeight:500}}>
                  {p.method === 'efectivo' ? '💵 Efectivo' : p.method === 'tarjeta' ? '🏧 Tarjeta' : '🏦 Transferencia'}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      </div>
    </>
  )
}

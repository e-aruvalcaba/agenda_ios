import React, { useState, useEffect } from 'react'
import { db, Payment } from '../db'
import { formatISO } from 'date-fns'
import Swal from 'sweetalert2'

export default function PaymentForm({onClose, onSaved, initialPayment}:{onClose?:()=>void, onSaved?:()=>void, initialPayment?:Payment}){
  const [amount,setAmount] = useState<number | ''>('')
  const [concept,setConcept] = useState('')
  const [method,setMethod] = useState<'efectivo'|'tarjeta'|'transferencia'>('efectivo')
  const [datetime,setDatetime] = useState<string>('')

  useEffect(() => {
    if (initialPayment) {
      // Editar pago existente
      setAmount(initialPayment.amount)
      setConcept(initialPayment.concept || '')
      setMethod(initialPayment.method)
      // Convertir ISO a datetime-local format
      const dt = new Date(initialPayment.date)
      const year = dt.getFullYear()
      const month = String(dt.getMonth() + 1).padStart(2, '0')
      const day = String(dt.getDate()).padStart(2, '0')
      const hours = String(dt.getHours()).padStart(2, '0')
      const minutes = String(dt.getMinutes()).padStart(2, '0')
      setDatetime(`${year}-${month}-${day}T${hours}:${minutes}`)
    } else {
      // Nuevo pago
      setDatetime(formatISO(new Date()).slice(0,16))
    }
  }, [initialPayment])

  const submit = async (e:React.FormEvent)=>{
    e.preventDefault()
    const amt = typeof amount==='number' ? amount : parseFloat(String(amount))
    if(isNaN(amt)) {
      await Swal.fire('Error', 'Cantidad inválida', 'error')
      return
    }
    
    // Parse datetime-local string and create Date in local timezone, then convert to ISO
    const [datePart, timePart] = datetime.split('T')
    const [year, month, day] = datePart.split('-').map(Number)
    const [hour, minute] = timePart.split(':').map(Number)
    const dt = new Date(year, month - 1, day, hour, minute, 0)
    const iso = dt.toISOString()
    
    if (initialPayment && initialPayment.id) {
      // Actualizar pago existente
      await db.payments.update(initialPayment.id, {date: iso, amount: amt, concept, method})
      await Swal.fire('Éxito', 'Pago actualizado correctamente', 'success')
      if(onSaved) onSaved()
    } else {
      // Crear nuevo pago
      await db.payments.add({date: iso, amount: amt, concept, method})
      await Swal.fire('Éxito', 'Pago registrado correctamente', 'success')
      if(onSaved) onSaved()
    }
    if(onClose) onClose()
  }

  return (
    <form onSubmit={submit}>
      <h3>{initialPayment ? 'Editar pago' : 'Registrar pago'}</h3>
      <div style={{marginBottom:12}}>
        <label>Fecha y hora</label>
        <input type="datetime-local" value={datetime} onChange={e=>setDatetime(e.target.value)} required />
      </div>
      <div style={{marginBottom:12}}>
        <label>Cantidad</label>
        <input 
          type="number" 
          value={amount as any} 
          onChange={e=>setAmount(e.target.value === '' ? '' : Number(e.target.value))} 
          required 
          placeholder="0.00"
          step="0.01"
          min="0"
        />
      </div>
      <div style={{marginBottom:12}}>
        <label>Concepto</label>
        <input value={concept} onChange={e=>setConcept(e.target.value)} placeholder="Servicio, producto…" />
      </div>
      <div style={{marginBottom:16}}>
        <label>Método de pago</label>
        <select value={method} onChange={e=>setMethod(e.target.value as any)}>
          <option value="efectivo">💵 Efectivo</option>
          <option value="tarjeta">🏧 Tarjeta</option>
          <option value="transferencia">🏦 Transferencia</option>
        </select>
      </div>
      <div className="actions">
        <button type="submit">Guardar</button>
        <button type="button" onClick={onClose as any} style={{background:'#6c757d'}}>Cerrar</button>
      </div>
    </form>
  )
}

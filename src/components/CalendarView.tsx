import React, { useEffect, useState } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { db, Appointment } from '../db'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function CalendarView(){
  const [value, setValue] = useState(new Date())
  const [events, setEvents] = useState<Appointment[]>([])

  useEffect(()=>{
    const load = async ()=>{
      const all = await db.appointments.toArray()
      setEvents(all)
    }
    load()
    const sync = () => load()
    // no live subscriptions: refresh on focus
    window.addEventListener('focus', sync)
    return ()=>window.removeEventListener('focus', sync)
  },[])

  const tileContent = ({date, view}:{date:Date,view:string})=>{
    if(view !== 'month') return null
    const day = format(date,'yyyy-MM-dd')
    const dayEvents = events.filter(e=>e.datetime.startsWith(day))
    if(!dayEvents.length) return null
    return <div style={{marginTop:6,fontSize:12,color:'#0d6efd'}}>{dayEvents.length} cita(s)</div>
  }

  return (
    <div>
      <h2>Calendario</h2>
      <Calendar onChange={setValue} value={value} tileContent={tileContent} />
      <h3 style={{marginTop:12}}>Citas en {format(value,'PPP',{locale:es})}</h3>
      <ul style={{paddingLeft:0,listStyle:'none'}}>
        {events.filter(e=>e.datetime.startsWith(format(value,'yyyy-MM-dd'))).map(e=>(
          <li key={e.id} className="card" style={{marginBottom:8}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
              <div>
                <div style={{fontSize:12,color:'#666'}}>Nombre:</div>
                <div style={{fontWeight:700}}>{e.clientName}</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:12,color:'#666'}}>Hora:</div>
                <div className="small">{format(new Date(e.datetime),'h:mm a',{locale:es})}</div>
              </div>
            </div>
            <div>
              <div style={{fontSize:12,color:'#666',marginBottom:4}}>Descripción:</div>
              <div>{e.description || '-'}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

import React from 'react'
import Modal from './Modal'
import { ICS_Event, generateICS } from '../utils/ics'

export default function ExportModal({events, onClose}:{events:Array<{id?:number,title:string,description?:string,start:Date,end:Date}>, onClose?:()=>void}){
  const onDownloadICS = ()=>{
    const evs:ICS_Event[] = events.map(e=>({
      title: e.title,
      description: e.description,
      start: e.start,
      end: e.end
    }))
    const text = generateICS(evs, 'Agenda PWA')
    const blob = new Blob([text], {type:'text/calendar;charset=utf-8'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'agenda.ics'
    a.click()
    URL.revokeObjectURL(url)
  }

  const onDownloadSingle = (ev:{id?:number,title:string,description?:string,start:Date,end:Date})=>{
    const text = generateICS([{title:ev.title,description:ev.description,start:ev.start,end:ev.end}], 'Agenda PWA')
    const blob = new Blob([text], {type:'text/calendar;charset=utf-8'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${ev.title.replace(/[^a-z0-9]/gi,'_') || 'evento'}.ics`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Modal onClose={onClose}>
      <h3>Exportar a calendario</h3>
      <p className="small">Selecciona cómo quieres agregar las citas al calendario.</p>
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        <button onClick={onDownloadICS}>Descargar .ics (Agregar a Calendario del sistema / iOS)</button>
        <div style={{borderTop:'1px solid #eee',paddingTop:8}}>
          <h4>Exportar por cita</h4>
          {events.map((ev,idx)=> (
            <div key={idx} style={{display:'flex',gap:8,alignItems:'center',justifyContent:'space-between',padding:'6px 0'}}>
              <div style={{flex:1}}>
                <div style={{fontWeight:700}}>{ev.title}</div>
                <div className="small">{ev.start.toLocaleString()}</div>
              </div>
              <div style={{display:'flex',gap:8}}>
                <button onClick={()=>onDownloadSingle(ev)}>Descargar .ics</button>
                <a href={toGoogleLink(ev.title, ev.start, ev.end, ev.description)} target="_blank" rel="noreferrer"><button>Google</button></a>
                <a href={toOutlookLink(ev.title, ev.start, ev.end, ev.description)} target="_blank" rel="noreferrer"><button>Outlook</button></a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}

// export helper links for other components
export function toGoogleLink(title:string, start:Date, end:Date, details?:string){
  const fmt = (d:Date)=>{
    return d.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'')
  }
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: details || ''
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export function toOutlookLink(title:string, start:Date, end:Date, details?:string){
  const params = new URLSearchParams({
    subject: title,
    body: details || '',
    startdt: start.toISOString(),
    enddt: end.toISOString()
  })
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`
}

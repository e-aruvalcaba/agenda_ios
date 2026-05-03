import React, { useEffect, useState } from 'react'
import { db, Appointment } from '../db'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { generateICS } from '../utils/ics'
import { toGoogleLink, toOutlookLink } from './ExportModal'
//import React from 'react'

export default function TodayList({date}:{date?:Date}){
  const [items, setItems] = useState<Appointment[]>([])
  const [showCategorized, setShowCategorized] = useState(false)
  const [nowMarker, setNowMarker] = useState<number>(Date.now())
  const target = date || new Date()
  const dayKey = format(target,'yyyy-MM-dd')

  useEffect(()=>{ load() },[dayKey, nowMarker])
  const load = async ()=>{
    const all = await db.appointments.where('datetime').startsWith(dayKey).sortBy('datetime')
    setItems(all)
  }

  const refreshOrdering = ()=>{
    // update now marker to force recalculation
    setNowMarker(Date.now())
  }

  return (
    <div>
      <div style={{marginBottom:16}}>
        <h2 style={{margin:'0 0 12px 0',fontSize:20,fontWeight:700}}>📅 {format(target,'PPP',{locale:es})}</h2>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',padding:8,background:'rgba(13,110,253,0.05)',borderRadius:8}}>
            <input type="checkbox" checked={showCategorized} onChange={e=>setShowCategorized(e.target.checked)} style={{width:18,height:18,cursor:'pointer'}} />
            <span style={{fontSize:14,fontWeight:500}}>Agrupar próximas/anteriores</span>
          </label>
          <div className="btn-group" style={{marginTop:4}}>
            {showCategorized && (
              <button onClick={refreshOrdering} style={{fontSize:13}}>🔄 Actualizar</button>
            )}
          </div>
        </div>
      </div>
      {items.length===0 ? (
        <div className="card small">📭 No hay citas para hoy</div>
      ) : (
        <div>
          {showCategorized ? (
            (()=>{
              const now = new Date(nowMarker)
              const upcoming = items.filter(it => new Date(it.datetime) > now).sort((a,b)=> new Date(a.datetime).getTime() - new Date(b.datetime).getTime())
              const past = items.filter(it => new Date(it.datetime) <= now).sort((a,b)=> new Date(b.datetime).getTime() - new Date(a.datetime).getTime())
              return (
                <div>
                  <h3 style={{fontSize:18,fontWeight:600,marginTop:0}}>⏱️ Próximas citas ({upcoming.length})</h3>
                  {upcoming.length===0 ? <div className="small">No hay próximas citas</div> : (
                    <ul style={{paddingLeft:0,listStyle:'none'}}>
                      {upcoming.map(it=> (
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
                            <div style={{marginBottom:10,paddingBottom:10,borderBottom:'1px solid var(--border)'}}>
                              <div style={{fontSize:12,color:'var(--text-light)',marginBottom:4}}>Notas</div>
                              <div style={{fontSize:14,lineHeight:1.4}}>{it.description}</div>
                            </div>
                          )}
                          <div className="btn-group" style={{marginTop:8}}>
                            <button onClick={()=>{const ev={id:it.id,title:it.clientName,description:it.description,start:new Date(it.datetime),end:new Date(new Date(it.datetime).getTime()+30*60000)}; const text=generateICS([{title:ev.title,description:ev.description,start:ev.start,end:ev.end}],'Agenda PWA'); const blob=new Blob([text],{type:'text/calendar;charset=utf-8'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`${ev.title.replace(/[^a-z0-9]/gi,'_')||'evento'}.ics`; a.click(); URL.revokeObjectURL(url);}} style={{fontSize:13}}>📥 .ics</button>
                            <a href={toGoogleLink(it.clientName,new Date(it.datetime), new Date(new Date(it.datetime).getTime()+30*60000), it.description)} target="_blank" rel="noreferrer"><button style={{fontSize:13}}>🔵 Google</button></a>
                            <a href={toOutlookLink(it.clientName,new Date(it.datetime), new Date(new Date(it.datetime).getTime()+30*60000), it.description)} target="_blank" rel="noreferrer"><button style={{fontSize:13}}>📧 Outlook</button></a>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}

                  <h3 style={{marginTop:20,fontSize:18,fontWeight:600}}>📋 Citas anteriores ({past.length})</h3>
                  {past.length===0 ? <div className="small">No hay citas anteriores</div> : (
                    <ul style={{paddingLeft:0,listStyle:'none',marginTop:8}}>
                      {past.map(it=> (
                        <li key={it.id} className="card" style={{marginBottom:12,opacity:0.75}}>
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
                            <div>
                              <div style={{fontSize:12,color:'var(--text-light)',marginBottom:2}}>Cliente</div>
                              <div style={{fontWeight:700,fontSize:16}}>{it.clientName}</div>
                            </div>
                            <div style={{textAlign:'right',background:'rgba(108,117,125,0.1)',padding:'6px 10px',borderRadius:6}}>
                              <div style={{fontSize:12,color:'var(--text-light)',marginBottom:2}}>Hora</div>
                              <div style={{fontWeight:600,fontSize:15,color:'#6c757d'}}>{format(new Date(it.datetime),'h:mm a',{locale:es})}</div>
                            </div>
                          </div>
                          {it.description && (
                            <div style={{marginBottom:0}}>
                              <div style={{fontSize:12,color:'var(--text-light)',marginBottom:4}}>Notas</div>
                              <div style={{fontSize:14,lineHeight:1.4}}>{it.description}</div>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )
            })()
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
                    <div style={{marginBottom:10,paddingBottom:10,borderBottom:'1px solid var(--border)'}}>
                      <div style={{fontSize:12,color:'var(--text-light)',marginBottom:4}}>Notas</div>
                      <div style={{fontSize:14,lineHeight:1.4}}>{it.description}</div>
                    </div>
                  )}
                  <div className="btn-group" style={{marginTop:8}}>
                    <button onClick={()=>{const ev={id:it.id,title:it.clientName,description:it.description,start:new Date(it.datetime),end:new Date(new Date(it.datetime).getTime()+30*60000)}; const text=generateICS([{title:ev.title,description:ev.description,start:ev.start,end:ev.end}],'Agenda PWA'); const blob=new Blob([text],{type:'text/calendar;charset=utf-8'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`${ev.title.replace(/[^a-z0-9]/gi,'_')||'evento'}.ics`; a.click(); URL.revokeObjectURL(url);}} style={{fontSize:13}}>📥 .ics</button>
                    <a href={toGoogleLink(it.clientName,new Date(it.datetime), new Date(new Date(it.datetime).getTime()+30*60000), it.description)} target="_blank" rel="noreferrer"><button style={{fontSize:13}}>🔵 Google</button></a>
                    <a href={toOutlookLink(it.clientName,new Date(it.datetime), new Date(new Date(it.datetime).getTime()+30*60000), it.description)} target="_blank" rel="noreferrer"><button style={{fontSize:13}}>📧 Outlook</button></a>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

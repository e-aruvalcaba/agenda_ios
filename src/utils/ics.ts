import { formatISO } from 'date-fns'

export type ICS_Event = {
  uid?: string
  title: string
  description?: string
  start: Date
  end: Date
  location?: string
}

function formatDateForICS(d: Date){
  // UTC format YYYYMMDDTHHMMSSZ
  const s = formatISO(d, {representation: 'complete'})
  // formatISO returns like 2026-05-05T09:17:00.000Z -> remove punctuation
  return s.replace(/[-:]/g,'').replace(/\.\d{3}/,'')
}

function formatLocalForICS(d: Date){
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth()+1).padStart(2,'0')
  const dd = String(d.getDate()).padStart(2,'0')
  const hh = String(d.getHours()).padStart(2,'0')
  const mi = String(d.getMinutes()).padStart(2,'0')
  const ss = String(d.getSeconds()).padStart(2,'0')
  return `${yyyy}${mm}${dd}T${hh}${mi}${ss}`
}

function tzOffsetString(d: Date){
  const off = -d.getTimezoneOffset() // minutes
  const sign = off >= 0 ? '+' : '-'
  const abs = Math.abs(off)
  const hh = String(Math.floor(abs/60)).padStart(2,'0')
  const mm = String(abs%60).padStart(2,'0')
  return `${sign}${hh}${mm}`
}

function generateVTimezone(tzid: string){
  // minimal VTIMEZONE using current offset (no DST rules)
  const now = new Date()
  const offset = tzOffsetString(now)
  const name = tzid.split('/').pop() || tzid
  return [
    'BEGIN:VTIMEZONE',
    `TZID:${tzid}`,
    'BEGIN:STANDARD',
    `DTSTART:19700101T000000`,
    `TZOFFSETFROM:${offset}`,
    `TZOFFSETTO:${offset}`,
    `TZNAME:${name}`,
    'END:STANDARD',
    'END:VTIMEZONE'
  ].join('\r\n')
}

export function generateICS(events: ICS_Event[], calendarName = 'Agenda'){
  const tzid = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  const headerLines = [
    'BEGIN:VCALENDAR',
    'PRODID:-//Agenda PWA//EN',
    'VERSION:2.0',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${calendarName}`,
    `NAME:${calendarName}`
  ]

  const vtz = generateVTimezone(tzid)

  const lines: string[] = []
  lines.push(...headerLines)
  lines.push(vtz)

  for(const ev of events){
    const uid = ev.uid || `${Date.now()}-${Math.random().toString(36).slice(2,9)}`
    const dtstart = formatLocalForICS(ev.start)
    const dtend = formatLocalForICS(ev.end)
    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${uid}`)
    lines.push(`DTSTAMP:${formatDateForICS(new Date())}`)
    lines.push(`DTSTART;TZID=${tzid}:${dtstart}`)
    lines.push(`DTEND;TZID=${tzid}:${dtend}`)
    lines.push(`SUMMARY:${(ev.title||'Evento').replace(/\n/g,'\\n')}`)
    if(ev.description) lines.push(`DESCRIPTION:${ev.description.replace(/\n/g,'\\n')}`)
    if(ev.location) lines.push(`LOCATION:${ev.location}`)
    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')

  // ensure lines are folded to 75 chars per RFC5545 (simple implementation)
  const text = lines.join('\r\n')
  const folded = text.split('\r\n').map(line => {
    if(line.length <= 75) return line
    const parts: string[] = []
    let i = 0
    while(i < line.length){
      parts.push(line.slice(i, i+75))
      i += 75
    }
    return parts.join('\r\n' + ' ')
  }).join('\r\n')
  return folded
}

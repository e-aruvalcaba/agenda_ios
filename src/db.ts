import Dexie, { Table } from 'dexie'

export interface Appointment {
  id?: number
  clientName: string
  datetime: string // ISO
  description?: string
}

export interface Payment {
  id?: number
  date: string // ISO
  amount: number
  concept?: string
  method: 'efectivo' | 'tarjeta' | 'transferencia'
}

class AgendaDB extends Dexie {
  appointments!: Table<Appointment, number>
  payments!: Table<Payment, number>

  constructor(){
    super('AgendaDB')
    this.version(1).stores({
      appointments: '++id, datetime, clientName',
      payments: '++id, date, amount'
    })
  }

  async exportAll(){
    const appts = await this.appointments.toArray()
    const pays = await this.payments.toArray()
    return { appointments: appts, payments: pays }
  }

  async importAll(data:{appointments?:Appointment[],payments?:Payment[]}, mode: 'replace' | 'merge' = 'replace'){
    if(mode === 'replace'){
      // Always clear both tables in replace mode
      await this.appointments.clear()
      await this.payments.clear()
    }

    if(data.appointments && data.appointments.length){
      if(mode === 'replace'){
        await this.appointments.bulkAdd(data.appointments)
      } else {
        // Strip IDs so Dexie auto-increments new unique ones
        const toAdd = data.appointments.map(({id:_,...rest})=>rest)
        await this.appointments.bulkAdd(toAdd as Appointment[])
      }
    }
    if(data.payments && data.payments.length){
      if(mode === 'replace'){
        await this.payments.bulkAdd(data.payments)
      } else {
        const toAdd = data.payments.map(({id:_,...rest})=>rest)
        await this.payments.bulkAdd(toAdd as Payment[])
      }
    }
  }
}

export const db = new AgendaDB()

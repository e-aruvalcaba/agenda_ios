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

  async importAll(data:{appointments?:Appointment[],payments?:Payment[]}){
    if(data.appointments && data.appointments.length){
      await this.appointments.clear()
      await this.appointments.bulkAdd(data.appointments)
    }
    if(data.payments && data.payments.length){
      await this.payments.clear()
      await this.payments.bulkAdd(data.payments)
    }
  }
}

export const db = new AgendaDB()

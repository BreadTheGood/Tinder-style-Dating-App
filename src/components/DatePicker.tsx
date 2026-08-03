import { useState, useEffect } from 'react'

export function DatePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [day, setDay] = useState('')
  const [month, setMonth] = useState('')
  const [year, setYear] = useState('')

  useEffect(() => {
    if (value) {
      const parts = value.split('-')
      if (parts.length === 3) {
        setYear(parts[0])
        setMonth(parseInt(parts[1], 10).toString())
        setDay(parseInt(parts[2], 10).toString())
      }
    }
  }, [value])

  const handleUpdate = (d: string, m: string, y: string) => {
    if (d && m && y) {
       onChange(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`)
    } else {
       onChange('')
    }
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 100 }, (_, i) => currentYear - 18 - i)
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  
  const getDaysInMonth = (m: number, y: number) => {
    return new Date(y, m, 0).getDate()
  }
  
  const daysInMonth = (month && year) ? getDaysInMonth(parseInt(month), parseInt(year)) : 31
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  return (
    <div className="flex gap-2 relative">
      <select 
        value={day} 
        onChange={e => { setDay(e.target.value); handleUpdate(e.target.value, month, year) }}
        className="flex-1 bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-[#f304eb] appearance-none text-center cursor-pointer"
        style={{ colorScheme: 'dark' }}
      >
        <option value="" disabled className="text-white/40">Día</option>
        {days.map(d => <option key={d} value={d} className="bg-[#1a1a1c]">{d}</option>)}
      </select>
      
      <select 
        value={month} 
        onChange={e => { 
          const newMonth = e.target.value; 
          setMonth(newMonth); 
          let newDay = day;
          if (day && year) {
            const maxDays = getDaysInMonth(parseInt(newMonth), parseInt(year));
            if (parseInt(day) > maxDays) {
              newDay = maxDays.toString();
              setDay(newDay);
            }
          }
          handleUpdate(newDay, newMonth, year) 
        }}
        className="flex-1 bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-[#f304eb] appearance-none text-center cursor-pointer"
        style={{ colorScheme: 'dark' }}
      >
        <option value="" disabled className="text-white/40">Mes</option>
        {months.map((m, i) => <option key={i+1} value={i+1} className="bg-[#1a1a1c]">{m}</option>)}
      </select>
      
      <select 
        value={year} 
        onChange={e => { 
          const newYear = e.target.value; 
          setYear(newYear);
          let newDay = day;
          if (day && month) {
            const maxDays = getDaysInMonth(parseInt(month), parseInt(newYear));
            if (parseInt(day) > maxDays) {
              newDay = maxDays.toString();
              setDay(newDay);
            }
          }
          handleUpdate(newDay, month, newYear) 
        }}
        className="flex-1 bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-[#f304eb] appearance-none text-center cursor-pointer"
        style={{ colorScheme: 'dark' }}
      >
        <option value="" disabled className="text-white/40">Año</option>
        {years.map(y => <option key={y} value={y} className="bg-[#1a1a1c]">{y}</option>)}
      </select>
    </div>
  )
}

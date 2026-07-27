export function calculateAge(dobStr: string | null | undefined): string {
  if (!dobStr) return 'Age Unknown'
  
  const dob = new Date(dobStr)
  if (isNaN(dob.getTime())) return 'Age Unknown'

  const today = new Date()
  if (dob > today) return 'Newborn'

  let years = today.getFullYear() - dob.getFullYear()
  let months = today.getMonth() - dob.getMonth()
  let days = today.getDate() - dob.getDate()

  if (days < 0) {
    months -= 1
    const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0)
    days += prevMonth.getDate()
  }

  if (months < 0) {
    years -= 1
    months += 12
  }

  if (years === 0 && months === 0) {
    if (days === 0) return 'Born Today 🍼'
    return `${days} Day${days > 1 ? 's' : ''} old 🍼`
  }

  if (years === 0) {
    return `${months} Mon${months > 1 ? 's' : ''} ${days > 0 ? days + 'd' : ''}`
  }

  return `${years} Yr${years > 1 ? 's' : ''} ${months > 0 ? months + ' Mon' : ''}`
}

export function calculateNextDueDate(vaccineName: string, dateGivenStr: string): string {
  const d = new Date(dateGivenStr)
  if (isNaN(d.getTime())) return dateGivenStr

  const nameUpper = vaccineName.toUpperCase()

  if (nameUpper.includes('FMD') || nameUpper.includes('HS') || nameUpper.includes('HEMORRHAGIC') || nameUpper.includes('FOOT')) {
    d.setMonth(d.getMonth() + 6)
  } else if (nameUpper.includes('BQ') || nameUpper.includes('BLACK') || nameUpper.includes('BRUCELLOSIS') || nameUpper.includes('LSD') || nameUpper.includes('LUMPY')) {
    d.setFullYear(d.getFullYear() + 1)
  } else {
    d.setMonth(d.getMonth() + 6) // default fallback 6 months
  }

  return d.toISOString().split('T')[0]
}

export function computeVaccineStatus(nextDueDateStr: string): 'Overdue' | 'Upcoming' | 'Given' {
  if (!nextDueDateStr) return 'Given'
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const dueDate = new Date(nextDueDateStr)
  dueDate.setHours(0, 0, 0, 0)

  if (isNaN(dueDate.getTime())) return 'Given'

  if (dueDate < today) {
    return 'Overdue'
  }

  const diffMs = dueDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays <= 14) {
    return 'Upcoming'
  }

  return 'Given'
}

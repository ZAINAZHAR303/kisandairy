/** The farm's wall-clock time zone. Servers run in UTC, so "today" must be computed explicitly. */
export const FARM_TIME_ZONE = 'Asia/Karachi'

/**
 * Formats a Date as YYYY-MM-DD in the given time zone.
 * Without a time zone it uses the device's local time (correct in the browser).
 * Never use toISOString() for this: it returns the UTC date, which is
 * yesterday in Pakistan between midnight and 5am.
 */
export function toDateString(d: Date, timeZone?: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d)
  const get = (type: string) => parts.find(p => p.type === type)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')}`
}

/** Today's date as YYYY-MM-DD. Pass FARM_TIME_ZONE on the server; omit in the browser. */
export function todayDateString(timeZone?: string): string {
  return toDateString(new Date(), timeZone)
}

/** Adds days to a YYYY-MM-DD string using pure calendar maths (no time zone involved). */
export function addDaysToDateString(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('T')[0].split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().split('T')[0]
}

/** Whole calendar days from one YYYY-MM-DD string to another (negative if `to` is earlier). */
export function daysBetweenDateStrings(from: string, to: string): number {
  const toUtc = (s: string) => {
    const [y, m, d] = s.split('T')[0].split('-').map(Number)
    return Date.UTC(y, m - 1, d)
  }
  return Math.round((toUtc(to) - toUtc(from)) / 86_400_000)
}

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

/**
 * Formats any date string or Date object to DD/MM/YYYY numeric format (e.g. 27/07/2026).
 * Eliminates month names (Jul, May, etc.) per farmer preference.
 */
export function formatNumericDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return 'N/A'
  
  let d: Date
  if (typeof dateInput === 'string') {
    // If string is already in YYYY-MM-DD or ISO format
    const parts = dateInput.split('T')[0].split('-')
    if (parts.length === 3 && parts[0].length === 4) {
      // YYYY-MM-DD format
      return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`
    }
    d = new Date(dateInput)
  } else {
    d = dateInput
  }

  if (isNaN(d.getTime())) return 'N/A'

  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
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

  const dueDate = nextDueDateStr.split('T')[0]
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) return 'Given'

  // This runs both in server actions (UTC machines) and in the browser.
  const today = todayDateString(typeof window === 'undefined' ? FARM_TIME_ZONE : undefined)
  const diffDays = daysBetweenDateStrings(today, dueDate)

  if (diffDays < 0) return 'Overdue'
  if (diffDays <= 14) return 'Upcoming'
  return 'Given'
}

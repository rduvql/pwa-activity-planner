export const getMonthsBetween = (startDate: Date, endDate: Date): Date[] => {
  const months: Date[] = []
  const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1)

  while (current <= end) {
    months.push(new Date(current))
    current.setMonth(current.getMonth() + 1)
  }

  return months
}

export const formatMonthYear = (date: Date): string => {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

export const isSameMonth = (date1: Date, date2: Date): boolean => {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth()
}

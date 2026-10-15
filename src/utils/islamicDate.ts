/** Live Gregorian + Hijri date labels for the home header */

export interface AppDateLabels {
  hijri: string
  gregorian: string
}

/** Compact Hijri for notification widget (beside إيلاف) */
export function getWidgetHijriDate(now = new Date()): string {
  try {
    return new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(now)
  } catch {
    try {
      return new Intl.DateTimeFormat('ar-SA', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(now)
    } catch {
      return ''
    }
  }
}

export function getAppDateLabels(now = new Date()): AppDateLabels {
  let hijri = ''
  try {
    hijri = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(now)
  } catch {
    hijri = new Intl.DateTimeFormat('ar-SA', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(now)
  }

  const gregorian = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(now)

  return { hijri, gregorian }
}

export const BIRTHDAY_PROMO_DAYS = 7
export const MEXICO_CITY_TIME_ZONE = 'America/Mexico_City'

export type LocalDate = {
  day: number
  month: number
  year: number
}

/**
 * Returns the calendar date in Central Mexico independently of server locale.
 *
 * @param instant - Absolute instant to convert.
 */
export function getMexicoCityDate(instant: Date): LocalDate {
  const parts = new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'numeric',
    timeZone: MEXICO_CITY_TIME_ZONE,
    year: 'numeric',
  }).formatToParts(instant)
  return {
    day: numberPart(parts, 'day'),
    month: numberPart(parts, 'month'),
    year: numberPart(parts, 'year'),
  }
}

/**
 * Returns the observed birthday date for a calendar year.
 *
 * @param birthday - Stored ISO birthday.
 * @param year - Calendar year to observe.
 */
export function observedBirthday(birthday: string, year: number): LocalDate {
  const [, monthText, dayText] = birthday.split('-')
  const month = Number(monthText)
  const day = Number(dayText)
  if (month === 2 && day === 29 && !isLeapYear(year)) {
    return { day: 28, month: 2, year }
  }
  return { day, month, year }
}

/**
 * Reports whether a birthday is observed on the given local date.
 *
 * @param birthday - Stored ISO birthday.
 * @param date - Current local date.
 */
export function isBirthdayOnDate(birthday: string, date: LocalDate): boolean {
  const observed = observedBirthday(birthday, date.year)
  return observed.month === date.month && observed.day === date.day
}

/**
 * Reports whether a reserved birthday promotion remains visible.
 *
 * @param birthday - Stored ISO birthday.
 * @param notificationYear - Reserved notification year.
 * @param date - Current local date.
 */
export function isBirthdayPromotionActive(
  birthday: string,
  notificationYear: number,
  date: LocalDate
): boolean {
  const elapsed = differenceInDays(
    observedBirthday(birthday, notificationYear),
    date
  )
  return elapsed >= 0 && elapsed < BIRTHDAY_PROMO_DAYS
}

/**
 * Reports whether the birthday promotion window has ended.
 *
 * @param birthday - Stored ISO birthday.
 * @param notificationYear - Reserved notification year.
 * @param date - Current local date.
 */
export function hasBirthdayPromotionExpired(
  birthday: string,
  notificationYear: number,
  date: LocalDate
): boolean {
  return (
    differenceInDays(observedBirthday(birthday, notificationYear), date) >=
    BIRTHDAY_PROMO_DAYS
  )
}

/**
 * Returns whether a year contains February 29.
 *
 * @param year - Gregorian calendar year.
 */
function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
}

/**
 * Returns calendar-day distance from start to end.
 *
 * @param start - Inclusive start date.
 * @param end - End date.
 */
function differenceInDays(start: LocalDate, end: LocalDate): number {
  const milliseconds =
    Date.UTC(end.year, end.month - 1, end.day) -
    Date.UTC(start.year, start.month - 1, start.day)
  return Math.floor(milliseconds / (24 * 60 * 60 * 1000))
}

/**
 * Extracts a numeric Intl date part.
 *
 * @param parts - Intl formatter output.
 * @param type - Requested part type.
 */
function numberPart(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes
): number {
  return Number(parts.find((part) => part.type === type)?.value)
}

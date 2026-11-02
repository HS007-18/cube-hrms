import { describe, expect, it } from 'vitest'
import {
  formatDays,
  formatMinutes,
  initials,
  isoDateWithOffset,
  monthLabel,
  parseISODate,
  titleCase,
  workingDaysBetween,
} from './format'

describe('workingDaysBetween', () => {
  it('counts inclusive weekdays', () => {
    expect(workingDaysBetween('2027-03-01', '2027-03-02')).toBe(2)
    expect(workingDaysBetween('2027-03-01', '2027-03-05')).toBe(5)
  })

  it('excludes weekends', () => {
    expect(workingDaysBetween('2027-03-06', '2027-03-07')).toBe(0)
    expect(workingDaysBetween('2027-03-05', '2027-03-08')).toBe(2)
  })

  it('returns zero for reversed or empty ranges', () => {
    expect(workingDaysBetween('2027-03-05', '2027-03-01')).toBe(0)
    expect(workingDaysBetween('', '2027-03-01')).toBe(0)
  })
})

describe('format helpers', () => {
  it('formats fractional days without trailing zeros', () => {
    expect(formatDays('12.0')).toBe('12')
    expect(formatDays('2.5')).toBe('2.5')
    expect(formatDays(null)).toBe('0')
  })

  it('formats minutes as compact hours', () => {
    expect(formatMinutes(0)).toBe('0m')
    expect(formatMinutes(45)).toBe('45m')
    expect(formatMinutes(60)).toBe('1h')
    expect(formatMinutes(135)).toBe('2h 15m')
    expect(formatMinutes(null)).toBe('—')
  })

  it('builds initials and labels', () => {
    expect(initials('Priya Sharma')).toBe('PS')
    expect(initials('')).toBe('?')
    expect(titleCase('half_day')).toBe('Half Day')
  })

  it('labels months and parses IST-style ISO dates', () => {
    expect(monthLabel('2026-11')).toBe('November 2026')
    const parsed = parseISODate('2026-11-02')
    expect(parsed?.getFullYear()).toBe(2026)
    expect(parsed?.getMonth()).toBe(10)
    expect(parsed?.getDate()).toBe(2)
  })

  it('offsets dates from today', () => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    expect(isoDateWithOffset(1)).toBe(tomorrow.toISOString().slice(0, 10))
  })
})

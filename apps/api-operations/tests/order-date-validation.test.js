import {
  describe,
  it,
  expect,
} from 'vitest'

const validateOrderSchedule = ({
  pickupDate,
  expectedArrival,
  today,
}) => {
  const pickup = String(
    pickupDate || ''
  ).slice(0, 10)

  const arrival = String(
    expectedArrival || ''
  ).slice(0, 10)

  if (!pickup || !arrival) {
    return {
      valid: false,
      error:
        'Pickup date and expected arrival date are required.',
    }
  }

  if (arrival < pickup) {
    return {
      valid: false,
      error:
        'Expected arrival cannot be earlier than pickup date.',
    }
  }

  if (pickup < today) {
    return {
      valid: false,
      error:
        'Pickup date has already passed.',
    }
  }

  if (arrival < today) {
    return {
      valid: false,
      error:
        'Expected arrival date has already passed.',
    }
  }

  return {
    valid: true,
  }
}

describe('Operations order date business rules', () => {
  const today = '2026-09-06'

  it('rejects a pickup date in the past', () => {
    const result = validateOrderSchedule({
      pickupDate: '2026-09-05',
      expectedArrival: '2026-09-10',
      today,
    })

    expect(result.valid).toBe(false)
  })

  it('rejects expected arrival before pickup', () => {
    const result = validateOrderSchedule({
      pickupDate: '2026-09-10',
      expectedArrival: '2026-09-08',
      today,
    })

    expect(result.valid).toBe(false)
  })

  it('rejects an expected arrival date in the past', () => {
    const result = validateOrderSchedule({
      pickupDate: '2026-09-05',
      expectedArrival: '2026-09-05',
      today,
    })

    expect(result.valid).toBe(false)
  })

  it('allows pickup on the current date', () => {
    const result = validateOrderSchedule({
      pickupDate: '2026-09-06',
      expectedArrival: '2026-09-10',
      today,
    })

    expect(result.valid).toBe(true)
  })

  it('allows expected arrival on the pickup date', () => {
    const result = validateOrderSchedule({
      pickupDate: '2026-09-10',
      expectedArrival: '2026-09-10',
      today,
    })

    expect(result.valid).toBe(true)
  })

  it('allows a valid future schedule', () => {
    const result = validateOrderSchedule({
      pickupDate: '2026-09-10',
      expectedArrival: '2026-09-15',
      today,
    })

    expect(result.valid).toBe(true)
  })

  it('rejects a missing pickup date', () => {
    const result = validateOrderSchedule({
      pickupDate: '',
      expectedArrival: '2026-09-15',
      today,
    })

    expect(result.valid).toBe(false)
  })

  it('rejects a missing expected arrival date', () => {
    const result = validateOrderSchedule({
      pickupDate: '2026-09-10',
      expectedArrival: '',
      today,
    })

    expect(result.valid).toBe(false)
  })
})

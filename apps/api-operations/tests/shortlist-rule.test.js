import {
  describe,
  it,
  expect,
} from 'vitest'

const validateShortlist = (
  totalAvailableBids,
  selectedCount
) => {
  if (totalAvailableBids === 0) {
    return false
  }

  const minimumRequired = Math.min(
    3,
    totalAvailableBids
  )

  const maximumAllowed = Math.min(
    5,
    totalAvailableBids
  )

  return (
    selectedCount >= minimumRequired &&
    selectedCount <= maximumAllowed
  )
}

describe('Operations shortlist business rules', () => {
  it('blocks sending when there are zero bids', () => {
    expect(
      validateShortlist(0, 0)
    ).toBe(false)
  })

  it('allows one bid when only one bid exists', () => {
    expect(
      validateShortlist(1, 1)
    ).toBe(true)
  })

  it('requires both bids when only two bids exist', () => {
    expect(
      validateShortlist(2, 1)
    ).toBe(false)

    expect(
      validateShortlist(2, 2)
    ).toBe(true)
  })

  it('requires all three when exactly three bids exist', () => {
    expect(
      validateShortlist(3, 2)
    ).toBe(false)

    expect(
      validateShortlist(3, 3)
    ).toBe(true)
  })

  it('requires at least three when four bids exist', () => {
    expect(
      validateShortlist(4, 2)
    ).toBe(false)

    expect(
      validateShortlist(4, 3)
    ).toBe(true)

    expect(
      validateShortlist(4, 4)
    ).toBe(true)
  })

  it('allows three to five when five bids exist', () => {
    expect(
      validateShortlist(5, 2)
    ).toBe(false)

    expect(
      validateShortlist(5, 3)
    ).toBe(true)

    expect(
      validateShortlist(5, 5)
    ).toBe(true)
  })

  it('blocks selecting more than five suppliers', () => {
    expect(
      validateShortlist(8, 6)
    ).toBe(false)
  })

  it('allows five shortlisted suppliers from eight bids', () => {
    expect(
      validateShortlist(8, 5)
    ).toBe(true)
  })
})

import {
  describe,
  it,
  expect,
} from 'vitest'

const canArchive = (status) =>
  status === 'completed'

const canUnarchive = (status) =>
  status === 'archived'

describe('Operations archive business rules', () => {
  it('allows completed orders to be archived', () => {
    expect(
      canArchive('completed')
    ).toBe(true)
  })

  it('blocks in-transit orders from being archived', () => {
    expect(
      canArchive('in_transit')
    ).toBe(false)
  })

  it('blocks bid accepted orders from being archived', () => {
    expect(
      canArchive('bid_accepted')
    ).toBe(false)
  })

  it('allows archived orders to be unarchived', () => {
    expect(
      canUnarchive('archived')
    ).toBe(true)
  })

  it('blocks completed orders from being unarchived', () => {
    expect(
      canUnarchive('completed')
    ).toBe(false)
  })

  it('blocks active transport orders from being unarchived', () => {
    expect(
      canUnarchive('at_port')
    ).toBe(false)
  })
})

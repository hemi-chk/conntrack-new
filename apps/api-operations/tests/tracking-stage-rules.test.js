import {
  describe,
  it,
  expect,
} from 'vitest'

const canTrackOrder = (status) =>
  [
    'driver_assigned',
    'in_transit',
    'at_freezone',
    'at_port',
    'completed',
    'archived',
  ].includes(status)

describe('Operations tracking stage rules', () => {
  it('blocks tracking for created orders', () => {
    expect(
      canTrackOrder('created')
    ).toBe(false)
  })

  it('blocks tracking while bidding is open', () => {
    expect(
      canTrackOrder('open_for_bids')
    ).toBe(false)
  })

  it('blocks tracking at bid accepted stage', () => {
    expect(
      canTrackOrder('bid_accepted')
    ).toBe(false)
  })

  it('allows tracking once driver is assigned', () => {
    expect(
      canTrackOrder('driver_assigned')
    ).toBe(true)
  })

  it('allows tracking while in transit', () => {
    expect(
      canTrackOrder('in_transit')
    ).toBe(true)
  })

  it('allows tracking at freezone', () => {
    expect(
      canTrackOrder('at_freezone')
    ).toBe(true)
  })

  it('allows tracking at port', () => {
    expect(
      canTrackOrder('at_port')
    ).toBe(true)
  })

  it('keeps tracking history for completed orders', () => {
    expect(
      canTrackOrder('completed')
    ).toBe(true)
  })

  it('keeps tracking history for archived orders', () => {
    expect(
      canTrackOrder('archived')
    ).toBe(true)
  })
})

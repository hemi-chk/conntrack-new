import express from 'express'
import request from 'supertest'
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

vi.mock('@conntrack/messaging', () => ({
  publish: vi.fn(),
}))

vi.mock('../src/config/supabase.js', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

import { supabase } from '../src/config/supabase.js'
import operationsRoutes from '../src/routes/operations.routes.js'

const createApp = () => {
  const app = express()

  app.use(express.json())
  app.use('/', operationsRoutes)

  return app
}

const createLookupQuery = (data) => ({
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  maybeSingle: vi.fn().mockResolvedValue({
    data,
    error: null,
  }),
})

const createUpdateQuery = (data) => ({
  update: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({
    data,
    error: null,
  }),
})

describe('Operations Archive API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects an invalid order ID', async () => {
    const app = createApp()

    const response = await request(app)
      .patch('/orders/not-a-number/archive')

    expect(response.status).toBe(400)
    expect(response.body.error).toMatch(
      /valid order ID/i
    )
  })

  it('blocks archiving an order that is not completed', async () => {
    const lookupQuery = createLookupQuery({
      order_id: 53,
      order_reference: 'EXP-00053',
      current_status: 'in_transit',
    })

    supabase.from.mockImplementationOnce(
      () => lookupQuery
    )

    const app = createApp()

    const response = await request(app)
      .patch('/orders/53/archive')

    expect(response.status).toBe(400)
    expect(response.body.error).toMatch(
      /only completed orders/i
    )

    expect(supabase.from).toHaveBeenCalledTimes(1)
  })

  it('archives a completed order', async () => {
    const lookupQuery = createLookupQuery({
      order_id: 64,
      order_reference: 'EXP-00064',
      current_status: 'completed',
    })

    const updateQuery = createUpdateQuery({
      order_id: 64,
      order_reference: 'EXP-00064',
      current_status: 'archived',
    })

    supabase.from
      .mockImplementationOnce(
        () => lookupQuery
      )
      .mockImplementationOnce(
        () => updateQuery
      )

    const app = createApp()

    const response = await request(app)
      .patch('/orders/64/archive')

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)

    expect(
      response.body.order.current_status
    ).toBe('archived')

    expect(updateQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        current_status: 'archived',
      })
    )
  })
})

describe('Operations Unarchive API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('blocks unarchive for a non-archived order', async () => {
    const lookupQuery = createLookupQuery({
      order_id: 64,
      order_reference: 'EXP-00064',
      current_status: 'in_transit',
    })

    supabase.from.mockImplementationOnce(
      () => lookupQuery
    )

    const app = createApp()

    const response = await request(app)
      .patch('/orders/64/unarchive')

    expect(response.status).toBe(400)
    expect(response.body.error).toMatch(
      /only archived orders/i
    )
  })

  it('restores an archived order to completed', async () => {
    const lookupQuery = createLookupQuery({
      order_id: 45,
      order_reference: 'EXP-00045',
      current_status: 'archived',
    })

    const updateQuery = createUpdateQuery({
      order_id: 45,
      order_reference: 'EXP-00045',
      current_status: 'completed',
    })

    supabase.from
      .mockImplementationOnce(
        () => lookupQuery
      )
      .mockImplementationOnce(
        () => updateQuery
      )

    const app = createApp()

    const response = await request(app)
      .patch('/orders/45/unarchive')

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)

    expect(
      response.body.order.current_status
    ).toBe('completed')

    expect(updateQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        current_status: 'completed',
      })
    )
  })
})

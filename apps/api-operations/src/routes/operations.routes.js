import express from 'express'
import { supabase } from '../config/supabase.js'

const router = express.Router()

// GET NEXT ORDER REFERENCE
router.get('/orders/next-id', async (req, res) => {
  try {
    const { type } = req.query

    if (!type) {
      return res.status(400).json({ error: 'Order type is required' })
    }

    const orderType = type.toLowerCase()

    if (orderType !== 'import' && orderType !== 'export') {
      return res.status(400).json({ error: 'Invalid order type' })
    }

    const prefix = orderType === 'import' ? 'IMP' : 'EXP'

    const { data, error } = await supabase
      .from('orders')
      .select('order_reference')
      .eq('order_type', orderType)
      .like('order_reference', `${prefix}-%`)
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    let nextNumber = 1

    if (data && data.length > 0 && data[0].order_reference) {
      const lastOrderReference = data[0].order_reference
      const lastNumber = parseInt(lastOrderReference.split('-')[1], 10)

      if (!Number.isNaN(lastNumber)) {
        nextNumber = lastNumber + 1
      }
    }

    const nextOrderId = `${prefix}-${String(nextNumber).padStart(5, '0')}`

    res.json({ orderId: nextOrderId })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GET ORDERS
router.get('/orders', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    res.json(data || [])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GET ORDER PROGRESS STAGES
router.get('/order-progress-stages', async (req, res) => {
  try {
    const { order_type } = req.query

    let query = supabase
      .from('order_progress_stages')
      .select('*')
      .eq('is_active', true)
      .order('sequence_order', { ascending: true })

    if (order_type) {
      query = query.or(`order_type.eq.${order_type},order_type.eq.all`)
    }

    const { data, error } = await query

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    res.json(data || [])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// DEBUG: CONFIRM BACKEND IS USING THE SAME SUPABASE PROJECT
router.get('/debug-supabase-project', async (req, res) => {
  try {
    const supabaseUrl =
      process.env.SUPABASE_URL ||
      process.env.VITE_SUPABASE_URL ||
      'SUPABASE_URL_NOT_FOUND'

    const { data, error } = await supabase
      .from('orders')
      .select('order_id, order_reference')
      .order('order_id', { ascending: true })
      .limit(20)

    if (error) {
      return res.status(500).json({
        success: false,
        supabaseUrl,
        error: error.message,
      })
    }

    res.json({
      success: true,
      supabaseUrl,
      ordersCount: data?.length || 0,
      orders: data || [],
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
})

// DEBUG: CHECK ALL CONTAINER TRACKING ROWS WITH ORDER + DRIVER DETAILS
router.get('/tracking-all-debug', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('container_tracking')
      .select(`
        tracking_id,
        order_id,
        driver_id,
        latitude,
        longitude,
        current_location,
        status,
        recorded_at,
        orders (
          order_id,
          order_reference,
          order_type,
          cargo_type,
          cargo_weight,
          pickup_country,
          pickup_state,
          destination_country,
          destination_state,
          pickup_date,
          expected_arrival,
          vehicle_type,
          container_no,
          current_status
        ),
        drivers (
          driver_id,
          first_name,
          last_name
        )
      `)
      .order('tracking_id', { ascending: true })

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
      })
    }

    res.json({
      success: true,
      count: data?.length || 0,
      data: data || [],
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
})

// DEBUG: DIRECT CHECK container_tracking BY order_id
router.get('/tracking-debug', async (req, res) => {
  try {
    const { order_id } = req.query

    if (!order_id) {
      return res.status(400).json({
        success: false,
        error: 'order_id is required',
      })
    }

    const { data: allRows, error: allRowsError } = await supabase
      .from('container_tracking')
      .select(`
        tracking_id,
        order_id,
        driver_id,
        latitude,
        longitude,
        current_location,
        status,
        recorded_at,
        orders (
          order_id,
          order_reference,
          order_type,
          pickup_country,
          pickup_state,
          destination_country,
          destination_state,
          container_no,
          current_status
        ),
        drivers (
          driver_id,
          first_name,
          last_name
        )
      `)
      .order('tracking_id', { ascending: true })

    if (allRowsError) {
      return res.status(500).json({
        success: false,
        error: allRowsError.message,
      })
    }

    const filteredRows = (allRows || []).filter(
      (row) => String(row.order_id) === String(order_id)
    )

    res.json({
      success: true,
      requested_order_id: order_id,
      total_container_tracking_rows: allRows?.length || 0,
      filtered_count: filteredRows.length,
      filtered_data: filteredRows,
      all_data: allRows || [],
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
})

// GET TRACKING DATA WITH ORDER + DRIVER DETAILS
router.get('/tracking', async (req, res) => {
  try {
    const { order_id, order_reference } = req.query

    console.log('TRACKING ROUTE HIT:', req.query)

    let finalOrderId = order_id

    // If frontend sends order_reference like IMP-00004,
    // first find its related database order_id.
    if (!finalOrderId && order_reference) {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('order_id')
        .eq('order_reference', order_reference)
        .single()

      if (orderError || !order) {
        console.log('ORDER REFERENCE NOT FOUND:', order_reference)
        return res.json([])
      }

      finalOrderId = order.order_id
    }

    let query = supabase
      .from('container_tracking')
      .select(`
        tracking_id,
        order_id,
        driver_id,
        latitude,
        longitude,
        current_location,
        status,
        recorded_at,
        orders (
          order_id,
          order_reference,
          order_type,
          cargo_type,
          cargo_weight,
          pickup_country,
          pickup_state,
          destination_country,
          destination_state,
          pickup_date,
          expected_arrival,
          vehicle_type,
          container_no,
          current_status
        ),
        drivers (
          driver_id,
          first_name,
          last_name
        )
      `)
      .order('recorded_at', { ascending: true })

    if (finalOrderId) {
      query = query.eq('order_id', Number(finalOrderId))
    }

    const { data, error } = await query

    if (error) {
      console.log('TRACKING QUERY ERROR:', error.message)
      return res.status(500).json({ error: error.message })
    }

    console.log('TRACKING FILTERED COUNT:', data?.length || 0)

    res.json(data || [])
  } catch (error) {
    console.log('TRACKING ROUTE ERROR:', error.message)
    res.status(500).json({ error: error.message })
  }
})

// CREATE ORDER
router.post('/orders', async (req, res) => {
  try {
    const {
      order_reference,
      order_type,
      cargo_type,
      cargo_weight,
      pickup_country,
      pickup_state,
      destination_country,
      destination_state,
      pickup_date,
      expected_arrival,
      vehicle_type,
      container_no,
      special_instructions,
    } = req.body

    if (
      !order_reference ||
      !order_type ||
      !cargo_type ||
      !pickup_country ||
      !pickup_state ||
      !destination_country ||
      !destination_state ||
      !pickup_date ||
      !expected_arrival ||
      !vehicle_type ||
      !container_no
    ) {
      return res.status(400).json({
        error: 'Missing required order fields',
      })
    }

    const { data, error } = await supabase
      .from('orders')
      .insert([
        {
          order_reference,
          order_date: new Date().toISOString().split('T')[0],
          order_type,
          cargo_type,
          cargo_weight,
          pickup_country,
          pickup_state,
          destination_country,
          destination_state,
          pickup_date,
          expected_arrival,
          vehicle_type,
          container_no,
          special_instructions,
          current_status: 'created',
        },
      ])
      .select()
      .single()

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    res.status(201).json({
      message: 'Order created successfully',
      order: data,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GET ISSUES - REAL DATA
router.get('/issues', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('issues')
      .select(`
        *,
        orders (
          order_id,
          order_reference,
          order_type,
          current_status,
          pickup_state,
          destination_state
        ),
        suppliers (
          supplier_id,
          company_name
        ),
        drivers (
          driver_id,
          first_name,
          last_name
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    res.json(data || [])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// HELPER: CREATE SUPPLIER NOTIFICATIONS
const createSupplierBiddingNotifications = async (order, bidding) => {
  const { data: suppliers, error: supplierError } = await supabase
    .from('suppliers')
    .select('supplier_id, company_name')
    .eq('status', 'active')

  if (supplierError) {
    throw new Error(supplierError.message)
  }

  const notifications = (suppliers || []).map((supplier) => ({
    supplier_id: supplier.supplier_id,
    order_id: order.order_id,
    bidding_id: bidding.bidding_id,
    message: `New ${order.order_type} order ${order.order_reference} is open for bidding. Please submit bid amount and ETA.`,
    type: 'bidding',
    is_read: false,
    created_at: new Date().toISOString(),
  }))

  if (notifications.length > 0) {
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert(notifications)

    if (notificationError) {
      throw new Error(notificationError.message)
    }
  }

  return suppliers?.length || 0
}

// HELPER: ATTACH SUPPLIER EMAIL AND CONTACT NUMBER TO BIDS
const attachSupplierContactDetails = async (bids = []) => {
  if (!bids || bids.length === 0) return []

  const supplierIds = [
    ...new Set(
      bids
        .map((bid) => bid.supplier_id)
        .filter((supplierId) => supplierId !== null && supplierId !== undefined)
    ),
  ]

  if (supplierIds.length === 0) return bids

  const { data: suppliers, error: supplierError } = await supabase
    .from('suppliers')
    .select(`
      supplier_id,
      company_name,
      email,
      contact_number
    `)
    .in('supplier_id', supplierIds)

  if (supplierError) {
    throw new Error(supplierError.message)
  }

  const supplierMap = new Map()

  ;(suppliers || []).forEach((supplier) => {
    supplierMap.set(Number(supplier.supplier_id), supplier)
  })

  return bids.map((bid) => {
    const supplier = supplierMap.get(Number(bid.supplier_id))

    const supplierEmail = bid.supplier_email || supplier?.email || ''
    const supplierPhone = bid.supplier_phone || supplier?.contact_number || ''

    return {
      ...bid,
      supplier_email: supplierEmail,
      supplier_phone: supplierPhone,

      suppliers: {
        ...(bid.suppliers || {}),
        supplier_id: supplier?.supplier_id || bid.supplier_id,
        company_name:
          supplier?.company_name ||
          bid.supplier_name ||
          bid.company_name ||
          bid.suppliers?.company_name ||
          '',
        email: supplierEmail,
        contact_number: supplierPhone,
        phone: supplierPhone,
      },
    }
  })
}

// OPEN BIDDING FOR AN ORDER
router.post('/bidding/open', async (req, res) => {
  try {
    const { order_reference, duration_seconds } = req.body

    if (!order_reference) {
      return res.status(400).json({ error: 'Order reference is required' })
    }

    if (!duration_seconds || Number(duration_seconds) <= 0) {
      return res.status(400).json({ error: 'Valid duration is required' })
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('order_reference', order_reference)
      .single()

    if (orderError || !order) {
      return res.status(404).json({ error: 'Order not found' })
    }

    const endTime = new Date(Date.now() + Number(duration_seconds) * 1000)

    const { data: existingBidding, error: existingBiddingError } = await supabase
      .from('bidding')
      .select('*')
      .eq('order_id', order.order_id)
      .maybeSingle()

    if (existingBiddingError) {
      return res.status(500).json({ error: existingBiddingError.message })
    }

    let bidding = null
    let biddingAction = ''

    if (existingBidding) {
      const { data: updatedBidding, error: updateBiddingError } = await supabase
        .from('bidding')
        .update({
          status: 'open',
          start_time: new Date().toISOString(),
          end_time: endTime.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('bidding_id', existingBidding.bidding_id)
        .select()
        .single()

      if (updateBiddingError) {
        return res.status(500).json({ error: updateBiddingError.message })
      }

      bidding = updatedBidding
      biddingAction = 'reopened'
    } else {
      const { data: newBidding, error: createBiddingError } = await supabase
        .from('bidding')
        .insert([
          {
            order_id: order.order_id,
            status: 'open',
            start_time: new Date().toISOString(),
            end_time: endTime.toISOString(),
          },
        ])
        .select()
        .single()

      if (createBiddingError) {
        return res.status(500).json({ error: createBiddingError.message })
      }

      bidding = newBidding
      biddingAction = 'created'
    }

    const { error: updateOrderError } = await supabase
      .from('orders')
      .update({
        current_status: 'open_for_bids',
        updated_at: new Date().toISOString(),
      })
      .eq('order_id', order.order_id)

    if (updateOrderError) {
      return res.status(500).json({ error: updateOrderError.message })
    }

    const { error: deleteNotificationError } = await supabase
      .from('notifications')
      .delete()
      .eq('order_id', order.order_id)
      .eq('bidding_id', bidding.bidding_id)
      .eq('type', 'bidding')

    if (deleteNotificationError) {
      return res.status(500).json({ error: deleteNotificationError.message })
    }

    const notifiedCount = await createSupplierBiddingNotifications(order, bidding)

    res.status(201).json({
      message:
        biddingAction === 'created'
          ? 'Bidding opened and suppliers notified successfully'
          : 'Bidding reopened and suppliers notified successfully',
      action: biddingAction,
      order,
      bidding,
      notified_suppliers: notifiedCount,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// CLOSE BIDDING FOR AN ORDER
router.post('/bidding/close', async (req, res) => {
  try {
    const { order_reference } = req.body

    if (!order_reference) {
      return res.status(400).json({ error: 'Order reference is required' })
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('order_reference', order_reference)
      .single()

    if (orderError || !order) {
      return res.status(404).json({ error: 'Order not found' })
    }

    const { data: bidding, error: biddingError } = await supabase
      .from('bidding')
      .update({
        status: 'closed',
        updated_at: new Date().toISOString(),
      })
      .eq('order_id', order.order_id)
      .eq('status', 'open')
      .select()
      .maybeSingle()

    if (biddingError) {
      return res.status(500).json({ error: biddingError.message })
    }

    res.json({
      message: 'Bidding closed successfully',
      bidding,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GET BIDS - REAL DATA WITH SUPPLIER, ORDER, VEHICLE, EMAIL, AND CONTACT DETAILS
router.get('/bids', async (req, res) => {
  try {
    const { order_reference, order_id } = req.query

    const { data, error } = await supabase.rpc('get_operation_bids')

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    let filteredData = data || []

    if (order_reference) {
      filteredData = filteredData.filter(
        (bid) =>
          String(bid.order_reference).toLowerCase() ===
          String(order_reference).toLowerCase()
      )
    }

    if (order_id) {
      filteredData = filteredData.filter(
        (bid) => Number(bid.order_id) === Number(order_id)
      )
    }

    const bidsWithSupplierContacts =
      await attachSupplierContactDetails(filteredData)

    res.json(bidsWithSupplierContacts)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// SHORTLIST A BID
router.post('/bids/shortlist', async (req, res) => {
  try {
    const { bid_id } = req.body

    if (!bid_id) {
      return res.status(400).json({ error: 'Bid ID is required' })
    }

    const { data: bid, error: bidError } = await supabase
      .from('bids')
      .select('*')
      .eq('bid_id', bid_id)
      .single()

    if (bidError || !bid) {
      return res.status(404).json({ error: 'Bid not found' })
    }

    const { data: existing, error: existingError } = await supabase
      .from('bid_selection')
      .select('*')
      .eq('bid_id', bid.bid_id)
      .maybeSingle()

    if (existingError) {
      return res.status(500).json({ error: existingError.message })
    }

    if (existing) {
      return res.status(400).json({ error: 'This bid is already shortlisted' })
    }

    const { data: selection, error: selectionError } = await supabase
      .from('bid_selection')
      .insert([
        {
          bid_id: bid.bid_id,
          bidding_id: bid.bidding_id,
          order_id: bid.order_id,
          supplier_id: bid.supplier_id,
          selected_by: 'operations',
          selection_status: 'shortlisted',
          sent_to_logistics: false,
          selected_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (selectionError) {
      return res.status(500).json({ error: selectionError.message })
    }

    const { error: updateBidError } = await supabase
      .from('bids')
      .update({
        bid_status: 'shortlisted',
        updated_at: new Date().toISOString(),
      })
      .eq('bid_id', bid.bid_id)

    if (updateBidError) {
      return res.status(500).json({ error: updateBidError.message })
    }

    res.status(201).json({
      message: 'Bid shortlisted successfully',
      selection,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// REMOVE SHORTLISTED BID
router.delete('/bids/shortlist/:bidId', async (req, res) => {
  try {
    const { bidId } = req.params

    const { error: deleteError } = await supabase
      .from('bid_selection')
      .delete()
      .eq('bid_id', bidId)
      .eq('selection_status', 'shortlisted')

    if (deleteError) {
      return res.status(500).json({ error: deleteError.message })
    }

    const { error: updateBidError } = await supabase
      .from('bids')
      .update({
        bid_status: 'under_review',
        updated_at: new Date().toISOString(),
      })
      .eq('bid_id', bidId)

    if (updateBidError) {
      return res.status(500).json({ error: updateBidError.message })
    }

    res.json({
      message: 'Bid removed from shortlist successfully',
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// SEND SHORTLISTED BIDS TO LOGISTICS
router.post('/bids/send-to-logistics', async (req, res) => {
  try {
    const { order_reference } = req.body

    if (!order_reference) {
      return res.status(400).json({ error: 'Order reference is required' })
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('order_reference', order_reference)
      .single()

    if (orderError || !order) {
      return res.status(404).json({ error: 'Order not found' })
    }

    const { data: shortlisted, error: shortlistError } = await supabase
      .from('bid_selection')
      .update({
        sent_to_logistics: true,
        selection_status: 'sent_to_logistics',
      })
      .eq('order_id', order.order_id)
      .eq('selection_status', 'shortlisted')
      .select()

    if (shortlistError) {
      return res.status(500).json({ error: shortlistError.message })
    }

    if (!shortlisted || shortlisted.length === 0) {
      return res.status(400).json({
        error: 'No shortlisted bids found for this order',
      })
    }

    const { error: logisticsNotificationError } = await supabase
      .from('notifications')
      .insert([
        {
          order_id: order.order_id,
          message: `Operations sent ${shortlisted.length} shortlisted supplier bids for order ${order.order_reference}.`,
          type: 'shortlist_to_logistics',
          is_read: false,
          created_at: new Date().toISOString(),
        },
      ])

    if (logisticsNotificationError) {
      return res.status(500).json({
        error: logisticsNotificationError.message,
      })
    }

    res.json({
      message: 'Shortlisted bids sent to Logistics successfully',
      count: shortlisted.length,
      shortlisted,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// TEST ROUTE TO CONFIRM THIS FILE IS CONNECTED
router.get('/test-bids', (req, res) => {
  res.json({
    message: 'operations.routes.js is connected',
    route: '/api/operations/test-bids',
  })
})

// GET USERS
router.get('/users', async (req, res) => {
  try {
    const { data, error } = await supabase.from('customers').select('*')

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    res.json(data || [])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
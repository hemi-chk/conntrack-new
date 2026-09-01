import { publish } from '@conntrack/messaging'
import express from 'express'
import { supabase } from '../config/supabase.js'

const router = express.Router()

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

const normalizeDbStatus = (value = '') =>
  String(value)
    .trim()
    .toLowerCase()
    .replaceAll(' ', '_')
    .replaceAll('-', '_')

const isValidUuid = (value) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || '')
  )

const sriLankaLocationCoordinates = {
  'Colombo Port': { latitude: 6.9459, longitude: 79.8428 },
  'Colombo City': { latitude: 6.9271, longitude: 79.8612 },
  'Orugodawatta Yard': { latitude: 6.9474, longitude: 79.8798 },
  'Ratmalana Industrial Area': { latitude: 6.8213, longitude: 79.8862 },
  'Pettah Warehouse': { latitude: 6.9355, longitude: 79.85 },
  'Dematagoda Yard': { latitude: 6.9404, longitude: 79.8783 },

  'Katunayake Airport': { latitude: 7.1808, longitude: 79.8841 },
  'Katunayake Export Zone': { latitude: 7.1674, longitude: 79.8761 },
  'Biyagama BOI Zone': { latitude: 7.084, longitude: 80.016 },
  'Ekala BOI Zone': { latitude: 7.105, longitude: 79.919 },
  'Peliyagoda Warehouse': { latitude: 6.9608, longitude: 79.8788 },
  'Wattala Industrial Area': { latitude: 6.9895, longitude: 79.8912 },

  'Kalutara Industrial Area': { latitude: 6.5854, longitude: 79.9607 },
  Panadura: { latitude: 6.7132, longitude: 79.9026 },
  'Horana Industrial Zone': { latitude: 6.7159, longitude: 80.0626 },
  Beruwala: { latitude: 6.4788, longitude: 79.9828 },

  'Kandy City': { latitude: 7.2906, longitude: 80.6337 },
  Peradeniya: { latitude: 7.2631, longitude: 80.5967 },
  Katugastota: { latitude: 7.3267, longitude: 80.6217 },
  'Pallekele Industrial Zone': { latitude: 7.2861, longitude: 80.7047 },

  'Kurunegala Warehouse': { latitude: 7.4863, longitude: 80.3647 },
  Kuliyapitiya: { latitude: 7.4696, longitude: 80.0488 },
  'Mawathagama Export Zone': { latitude: 7.4044, longitude: 80.4432 },
  'Pannala Industrial Area': { latitude: 7.3285, longitude: 80.0255 },

  'Galle City': { latitude: 6.0535, longitude: 80.221 },
  'Galle Port': { latitude: 6.0329, longitude: 80.2168 },
  'Koggala BOI Zone': { latitude: 5.9941, longitude: 80.327 },
  Hikkaduwa: { latitude: 6.1407, longitude: 80.1012 },

  'Matara City': { latitude: 5.9549, longitude: 80.555 },
  Weligama: { latitude: 5.973, longitude: 80.4297 },
  Akuressa: { latitude: 6.0967, longitude: 80.4808 },
  Dikwella: { latitude: 5.9667, longitude: 80.6833 },

  'Hambantota Port': { latitude: 6.1241, longitude: 81.1185 },
  'Mattala Airport': { latitude: 6.2845, longitude: 81.1241 },
  Tangalle: { latitude: 6.024, longitude: 80.7911 },
  Sooriyawewa: { latitude: 6.3084, longitude: 81.0107 },

  'Trincomalee Port': { latitude: 8.5711, longitude: 81.2335 },
  'China Bay': { latitude: 8.5385, longitude: 81.1814 },
  Kinniya: { latitude: 8.4977, longitude: 81.1794 },
  Kantale: { latitude: 8.3653, longitude: 80.9669 },

  'Jaffna Town': { latitude: 9.6615, longitude: 80.0255 },
  'Kankesanthurai Port': { latitude: 9.8167, longitude: 80.05 },
  Chavakachcheri: { latitude: 9.6535, longitude: 80.1597 },
  'Point Pedro': { latitude: 9.8167, longitude: 80.2333 },

  'Anuradhapura Town': { latitude: 8.3114, longitude: 80.4037 },
  Medawachchiya: { latitude: 8.5396, longitude: 80.4894 },
  Kekirawa: { latitude: 8.0375, longitude: 80.598 },
  Mihintale: { latitude: 8.35, longitude: 80.5167 },

  'Batticaloa Town': { latitude: 7.7102, longitude: 81.6924 },
  Eravur: { latitude: 7.7782, longitude: 81.6038 },
  Kattankudy: { latitude: 7.675, longitude: 81.73 },
  Valaichchenai: { latitude: 7.9333, longitude: 81.5167 },
}

const isInsideSriLanka = (latitude, longitude) => {
  const lat = Number(latitude)
  const lng = Number(longitude)

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return false
  }

  return lat >= 5.5 && lat <= 10.2 && lng >= 79.0 && lng <= 82.2
}

const getSriLankaCoordinates = (location) =>
  sriLankaLocationCoordinates[location] || {
    latitude: 6.9271,
    longitude: 79.8612,
  }

const normalizeTrackingRowsToSriLanka = (rows = []) => {
  return rows.map((row) => {
    const pickupLocation = row.orders?.pickup_location || 'Colombo Port'
    const destinationLocation =
      row.orders?.destination_location || 'Katunayake Airport'

    const existingLocation = String(row.current_location || '').trim()

    const fallbackLocation =
      normalizeDbStatus(row.status) === 'completed'
        ? destinationLocation
        : pickupLocation

    const currentLocation = existingLocation || fallbackLocation

    if (isInsideSriLanka(row.latitude, row.longitude)) {
      return {
        ...row,
        current_location: currentLocation,
      }
    }

    const coordinateSource =
      sriLankaLocationCoordinates[currentLocation]
        ? currentLocation
        : fallbackLocation

    const selectedCoords = getSriLankaCoordinates(coordinateSource)

    return {
      ...row,
      current_location: currentLocation,
      latitude: selectedCoords.latitude,
      longitude: selectedCoords.longitude,
    }
  })
}

const attachSupplierContactDetails = async (bids = []) => {
  if (!Array.isArray(bids) || bids.length === 0) {
    return []
  }

  const supplierIds = [
    ...new Set(
      bids
        .map((bid) => bid.supplier_id)
        .filter((supplierId) => supplierId !== null && supplierId !== undefined)
    ),
  ]

  if (supplierIds.length === 0) {
    return bids
  }

  const { data: suppliers, error: supplierError } = await supabase
    .from('suppliers')
    .select('supplier_id, company_name, email, contact_number')
    .in('supplier_id', supplierIds)

  if (supplierError) {
    throw new Error(supplierError.message)
  }

  const supplierMap = new Map(
    (suppliers || []).map((supplier) => [
      Number(supplier.supplier_id),
      supplier,
    ])
  )

  return bids.map((bid) => {
    const supplier = supplierMap.get(Number(bid.supplier_id))

    const supplierEmail =
      bid.supplier_email || supplier?.email || ''

    const supplierPhone =
      bid.supplier_phone || supplier?.contact_number || ''

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

const getOrderByReference = async (orderReference) => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('order_reference', String(orderReference).trim())
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data || null
}

const getOrderById = async (orderId) => {
  const numericId = Number(orderId)

  if (!numericId || Number.isNaN(numericId)) {
    return null
  }

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('order_id', numericId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data || null
}

const getSentShortlist = async (orderId) => {
  const { data, error } = await supabase
    .from('bid_selection')
    .select('selection_id, bid_id, selection_status, sent_to_logistics, selected')
    .eq('order_id', orderId)

  if (error) {
    throw new Error(error.message)
  }

  return (data || []).filter(
    (item) =>
      item.sent_to_logistics === true ||
      item.selected === true ||
      ['accepted', 'winner', 'rejected'].includes(
        String(item.selection_status || '').trim().toLowerCase()
      )
  )
}

// -----------------------------------------------------------------------------
// Orders
// -----------------------------------------------------------------------------

router.get('/orders/next-id', async (req, res) => {
  try {
    const { type } = req.query

    if (!type) {
      return res.status(400).json({
        error: 'Order type is required',
      })
    }

    const orderType = String(type).trim().toLowerCase()

    if (!['import', 'export'].includes(orderType)) {
      return res.status(400).json({
        error: 'Invalid order type',
      })
    }

    const prefix = orderType === 'import' ? 'IMP' : 'EXP'

    const { data, error } = await supabase
      .from('orders')
      .select('order_reference')
      .eq('order_type', orderType)
      .like('order_reference', `${prefix}-%`)

    if (error) {
      return res.status(500).json({
        error: error.message,
      })
    }

    const highestNumber = (data || []).reduce((max, row) => {
      const match = String(row.order_reference || '').match(
        new RegExp(`^${prefix}-(\\d+)$`, 'i')
      )

      if (!match) {
        return max
      }

      const value = Number(match[1])
      return Number.isNaN(value) ? max : Math.max(max, value)
    }, 0)

    const nextOrderId = `${prefix}-${String(highestNumber + 1).padStart(
      5,
      '0'
    )}`

    return res.json({
      orderId: nextOrderId,
    })
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    })
  }
})

router.get('/orders', async (req, res) => {
  try {
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', {
        ascending: false,
      })

    if (ordersError) {
      return res.status(500).json({
        error: ordersError.message,
      })
    }

    const safeOrders = Array.isArray(orders) ? orders : []

    if (safeOrders.length === 0) {
      return res.json([])
    }

    const orderIds = safeOrders
      .map((order) => order.order_id)
      .filter((orderId) => orderId !== null && orderId !== undefined)

    const { data: assignments, error: assignmentsError } = await supabase
      .from('order_assignments')
      .select(
        'assignment_id, order_id, supplier_id, driver_id, vehicle_id, assigned_at, status'
      )
      .in('order_id', orderIds)
      .order('assigned_at', {
        ascending: false,
        nullsFirst: false,
      })
      .order('assignment_id', {
        ascending: false,
      })

    if (assignmentsError) {
      return res.status(500).json({
        error: assignmentsError.message,
      })
    }

    const safeAssignments = Array.isArray(assignments) ? assignments : []

    const supplierIds = [
      ...new Set(
        safeAssignments
          .map((assignment) => assignment.supplier_id)
          .filter(
            (supplierId) => supplierId !== null && supplierId !== undefined
          )
      ),
    ]

    const driverIds = [
      ...new Set(
        safeAssignments
          .map((assignment) => assignment.driver_id)
          .filter((driverId) => driverId !== null && driverId !== undefined)
      ),
    ]

    let suppliers = []

    if (supplierIds.length > 0) {
      const { data: supplierRows, error: suppliersError } = await supabase
        .from('suppliers')
        .select('supplier_id, company_name')
        .in('supplier_id', supplierIds)

      if (suppliersError) {
        return res.status(500).json({
          error: suppliersError.message,
        })
      }

      suppliers = Array.isArray(supplierRows) ? supplierRows : []
    }

    let drivers = []

    if (driverIds.length > 0) {
      const { data: driverRows, error: driversError } = await supabase
        .from('drivers')
        .select('driver_id, first_name, last_name')
        .in('driver_id', driverIds)

      if (driversError) {
        return res.status(500).json({
          error: driversError.message,
        })
      }

      drivers = Array.isArray(driverRows) ? driverRows : []
    }

    const supplierById = new Map(
      suppliers.map((supplier) => [
        String(supplier.supplier_id),
        supplier,
      ])
    )

    const driverById = new Map(
      drivers.map((driver) => [
        String(driver.driver_id),
        driver,
      ])
    )

    const latestAssignmentByOrderId = new Map()

    safeAssignments.forEach((assignment) => {
      const key = String(assignment.order_id)

      if (!latestAssignmentByOrderId.has(key)) {
        latestAssignmentByOrderId.set(key, assignment)
      }
    })

    const enrichedOrders = safeOrders.map((order) => {
      const assignment =
        latestAssignmentByOrderId.get(String(order.order_id)) || null

      const supplier =
        assignment?.supplier_id !== null &&
        assignment?.supplier_id !== undefined
          ? supplierById.get(String(assignment.supplier_id))
          : null

      const driver =
        assignment?.driver_id !== null &&
        assignment?.driver_id !== undefined
          ? driverById.get(String(assignment.driver_id))
          : null

      const driverName = [
        driver?.first_name,
        driver?.last_name,
      ]
        .filter(Boolean)
        .join(' ')
        .trim()

      return {
        ...order,
        supplier_name:
          supplier?.company_name ||
          order.supplier_name ||
          null,
        driver_name:
          driverName ||
          order.driver_name ||
          null,
        assignment_id:
          assignment?.assignment_id || null,
        assignment_status:
          assignment?.status || null,
        assigned_supplier_id:
          assignment?.supplier_id || null,
        assigned_driver_id:
          assignment?.driver_id || null,
        assigned_vehicle_id:
          assignment?.vehicle_id || null,
        assigned_at:
          assignment?.assigned_at || null,
      }
    })

    return res.json(enrichedOrders)
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    })
  }
})

router.post('/orders', async (req, res) => {
  try {
    const {
      order_reference,
      order_type,
      cargo_type,
      cargo_weight,

      pickup_district: requestPickupDistrict,
      pickup_location: requestPickupLocation,
      destination_district: requestDestinationDistrict,
      destination_location: requestDestinationLocation,

      // Temporary compatibility with older rows/frontends.
      pickup_country,
      pickup_state,
      destination_country,
      destination_state,

      pickup_date,
      expected_arrival,
      vehicle_type,
      container_no,
      special_instructions,
      commercial_invoice_url,
      packing_list_url,
    } = req.body

    const pickup_district =
      requestPickupDistrict || pickup_country

    const pickup_location =
      requestPickupLocation || pickup_state

    const destination_district =
      requestDestinationDistrict || destination_country

    const destination_location =
      requestDestinationLocation || destination_state

    const normalizedOrderType = String(order_type || '')
      .trim()
      .toLowerCase()

    if (!['import', 'export'].includes(normalizedOrderType)) {
      return res.status(400).json({
        error: 'Order type must be import or export',
      })
    }

    const numericCargoWeight = Number(cargo_weight)

    if (
      !order_reference ||
      !cargo_type ||
      Number.isNaN(numericCargoWeight) ||
      numericCargoWeight <= 0 ||
      !pickup_district ||
      !pickup_location ||
      !destination_district ||
      !destination_location ||
      !pickup_date ||
      !expected_arrival ||
      !vehicle_type ||
      !container_no
    ) {
      return res.status(400).json({
        error: 'Missing or invalid required order fields',
      })
    }

    if (String(expected_arrival) < String(pickup_date)) {
      return res.status(400).json({
        error: 'Expected arrival cannot be earlier than pickup date',
      })
    }

    const { data, error } = await supabase
      .from('orders')
      .insert([
        {
          order_reference: String(order_reference).trim(),
          order_date: new Date().toISOString().split('T')[0],
          order_type: normalizedOrderType,
          cargo_type: String(cargo_type).trim(),
          cargo_weight: numericCargoWeight,
          pickup_district,
          pickup_location,
          destination_district,
          destination_location,
          pickup_date,
          expected_arrival,
          vehicle_type,
          container_no: String(container_no).trim(),
          special_instructions: special_instructions || null,
          commercial_invoice_url: commercial_invoice_url || null,
          packing_list_url: packing_list_url || null,
          current_status: 'created',
        },
      ])
      .select()
      .single()

    if (error) {
      return res.status(500).json({
        error: error.message,
      })
    }

    return res.status(201).json({
      message: 'Order created successfully',
      order: data,
    })
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    })
  }
})

router.patch('/orders/:orderId/archive', async (req, res) => {
  try {
    const orderId = Number(req.params.orderId)

    if (!orderId || Number.isNaN(orderId)) {
      return res.status(400).json({
        error: 'A valid order ID is required',
      })
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('order_id, order_reference, current_status')
      .eq('order_id', orderId)
      .maybeSingle()

    if (orderError) {
      return res.status(500).json({
        error: orderError.message,
      })
    }

    if (!order) {
      return res.status(404).json({
        error: 'Order not found',
      })
    }

    const currentStatus = normalizeDbStatus(order.current_status)

    if (currentStatus === 'archived') {
      return res.status(200).json({
        success: true,
        message: `Order ${order.order_reference} is already archived`,
        order,
      })
    }

    if (currentStatus !== 'completed') {
      return res.status(400).json({
        error: 'Only completed orders can be archived by Operations.',
      })
    }

    const { data: archivedOrder, error: archiveError } = await supabase
      .from('orders')
      .update({
        current_status: 'archived',
        updated_at: new Date().toISOString(),
      })
      .eq('order_id', orderId)
      .select()
      .single()

    if (archiveError) {
      return res.status(500).json({
        error: archiveError.message,
      })
    }

    return res.status(200).json({
      success: true,
      message: `Order ${order.order_reference} archived successfully`,
      order: archivedOrder,
    })
  } catch (error) {
    console.error('ARCHIVE OPERATIONS ORDER ERROR:', error.message)

    return res.status(500).json({
      error: error.message,
    })
  }
})

router.get('/order-progress-stages', async (req, res) => {
  try {
    const { order_type } = req.query

    let query = supabase
      .from('order_progress_stages')
      .select('*')
      .eq('is_active', true)
      .order('sequence_order', {
        ascending: true,
      })

    if (order_type) {
      query = query.in('order_type', [order_type, 'all'])
    }

    const { data, error } = await query

    if (error) {
      return res.status(500).json({
        error: error.message,
      })
    }

    return res.json(data || [])
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    })
  }
})

// -----------------------------------------------------------------------------
// Tracking
// -----------------------------------------------------------------------------

router.get('/tracking', async (req, res) => {
  try {
    const { order_id, order_reference } = req.query

    let finalOrderId = order_id ? Number(order_id) : null

    if (order_id && Number.isNaN(finalOrderId)) {
      return res.status(400).json({
        error: 'Invalid order_id',
      })
    }

    if (!finalOrderId && order_reference) {
      const order = await getOrderByReference(order_reference)

      if (!order) {
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
          pickup_district,
          pickup_location,
          destination_district,
          destination_location,
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
      .order('recorded_at', {
        ascending: true,
      })

    if (finalOrderId) {
      query = query.eq('order_id', finalOrderId)
    }

    const { data, error } = await query

    if (error) {
      return res.status(500).json({
        error: error.message,
      })
    }

    return res.json(
      normalizeTrackingRowsToSriLanka(data || [])
    )
  } catch (error) {
    console.error('TRACKING ROUTE ERROR:', error.message)

    return res.status(500).json({
      error: error.message,
    })
  }
})

// -----------------------------------------------------------------------------
// Issues
// -----------------------------------------------------------------------------

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
          pickup_district,
          pickup_location,
          destination_district,
          destination_location,
          container_no,
          expected_arrival
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
      .order('created_at', {
        ascending: false,
      })

    if (error) {
      return res.status(500).json({
        error: error.message,
      })
    }

    return res.json(data || [])
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    })
  }
})

router.post('/issues', async (req, res) => {
  try {
    const {
      order_id,
      supplier_id,
      driver_id,
      supplier_name,
      driver_name,
      issue_type,
      priority,
      description,
      reported_by,
    } = req.body

    const cleanOrderId = Number(order_id)

    if (!order_id || Number.isNaN(cleanOrderId)) {
      return res.status(400).json({
        error: 'A valid order_id is required',
      })
    }

    if (!issue_type || !String(issue_type).trim()) {
      return res.status(400).json({
        error: 'Issue type is required',
      })
    }

    if (!description || !String(description).trim()) {
      return res.status(400).json({
        error: 'Issue description is required',
      })
    }

    const order = await getOrderById(cleanOrderId)

    if (!order) {
      return res.status(404).json({
        error: 'Order not found',
      })
    }

    const blockedStatuses = ['created', 'open_for_bids']

    if (
      blockedStatuses.includes(
        normalizeDbStatus(order.current_status)
      )
    ) {
      return res.status(400).json({
        error:
          'Issues can be reported only after bidding is completed and operations have started.',
      })
    }

    let cleanSupplierId = supplier_id ? Number(supplier_id) : null

    if (Number.isNaN(cleanSupplierId)) {
      cleanSupplierId = null
    }

    let cleanDriverId = driver_id ? Number(driver_id) : null

    if (Number.isNaN(cleanDriverId)) {
      cleanDriverId = null
    }

    const {
      data: latestAssignment,
      error: assignmentLookupError,
    } = await supabase
      .from('order_assignments')
      .select(
        'assignment_id, supplier_id, driver_id, assigned_at, status'
      )
      .eq('order_id', cleanOrderId)
      .order('assigned_at', {
        ascending: false,
        nullsFirst: false,
      })
      .order('assignment_id', {
        ascending: false,
      })
      .limit(1)
      .maybeSingle()

    if (assignmentLookupError) {
      console.error(
        'ISSUE ASSIGNMENT LOOKUP:',
        assignmentLookupError.message
      )
    }

    if (!cleanSupplierId && latestAssignment?.supplier_id) {
      cleanSupplierId = Number(latestAssignment.supplier_id)
    }

    if (!cleanDriverId && latestAssignment?.driver_id) {
      cleanDriverId = Number(latestAssignment.driver_id)
    }

    const finalSupplierName = String(supplier_name || '').trim()

    if (
      !cleanSupplierId &&
      finalSupplierName &&
      !['Not assigned', '-'].includes(finalSupplierName)
    ) {
      const {
        data: supplier,
        error: supplierLookupError,
      } = await supabase
        .from('suppliers')
        .select('supplier_id, company_name')
        .eq('company_name', finalSupplierName)
        .maybeSingle()

      if (supplierLookupError) {
        console.error(
          'ISSUE SUPPLIER LOOKUP:',
          supplierLookupError.message
        )
      }

      if (supplier?.supplier_id) {
        cleanSupplierId = Number(supplier.supplier_id)
      }
    }

    const finalDriverName = String(driver_name || '')
      .trim()
      .replace(/\s+/g, ' ')

    if (
      !cleanDriverId &&
      finalDriverName &&
      !['Not assigned', '-'].includes(finalDriverName)
    ) {
      const {
        data: drivers,
        error: driverLookupError,
      } = await supabase
        .from('drivers')
        .select('driver_id, first_name, last_name')

      if (driverLookupError) {
        console.error(
          'ISSUE DRIVER LOOKUP:',
          driverLookupError.message
        )
      } else {
        const matchedDriver = (drivers || []).find((driver) => {
          const fullName = `${driver.first_name || ''} ${
            driver.last_name || ''
          }`
            .trim()
            .replace(/\s+/g, ' ')

          return (
            fullName.toLowerCase() ===
            finalDriverName.toLowerCase()
          )
        })

        if (matchedDriver?.driver_id) {
          cleanDriverId = Number(matchedDriver.driver_id)
        }
      }
    }

    const cleanPriority = String(priority || 'medium').toLowerCase()

    const allowedPriorities = [
      'low',
      'medium',
      'high',
      'critical',
    ]

    const finalPriority = allowedPriorities.includes(cleanPriority)
      ? cleanPriority
      : 'medium'

    const reporterCandidate =
      reported_by ||
      req.user?.id ||
      null

    const now = new Date().toISOString()

    const { data: createdIssue, error: createIssueError } = await supabase
      .from('issues')
      .insert([
        {
          order_id: cleanOrderId,
          supplier_id: cleanSupplierId,
          driver_id: cleanDriverId,
          reported_by: isValidUuid(reporterCandidate)
            ? reporterCandidate
            : null,
          issue_type: String(issue_type).trim(),
          priority: finalPriority,
          description: String(description).trim(),
          status: 'open',
          created_at: now,
          updated_at: now,
        },
      ])
      .select()
      .single()

    if (createIssueError) {
      return res.status(500).json({
        error: createIssueError.message,
      })
    }

    return res.status(201).json({
      success: true,
      message: `Issue for ${order.order_reference} sent to Admin successfully`,
      issue: createdIssue,
    })
  } catch (error) {
    console.error('CREATE OPERATIONS ISSUE ERROR:', error.message)

    return res.status(500).json({
      error: error.message,
    })
  }
})

// -----------------------------------------------------------------------------
// Bidding
// -----------------------------------------------------------------------------

router.post('/bidding/open', async (req, res) => {
  try {
    const { order_reference, duration_seconds } = req.body

    if (!order_reference) {
      return res.status(400).json({
        error: 'Order reference is required',
      })
    }

    const durationSeconds = Number(duration_seconds)

    if (Number.isNaN(durationSeconds) || durationSeconds <= 0) {
      return res.status(400).json({
        error: 'Valid duration is required',
      })
    }

    const order = await getOrderByReference(order_reference)

    if (!order) {
      return res.status(404).json({
        error: 'Order not found',
      })
    }

    const currentStatus = normalizeDbStatus(order.current_status)

    if (!['created', 'open_for_bids'].includes(currentStatus)) {
      return res.status(400).json({
        error:
          'Bidding can be opened only while the order is in Created or Open for Bids stage.',
      })
    }

    const sentShortlist = await getSentShortlist(order.order_id)

    if (sentShortlist.length > 0) {
      return res.status(400).json({
        error:
          'Bidding is locked because the shortlist has already been sent to Logistics.',
      })
    }

    const { data: existingBidding, error: existingBiddingError } =
      await supabase
        .from('bidding')
        .select('*')
        .eq('order_id', order.order_id)
        .maybeSingle()

    if (existingBiddingError) {
      return res.status(500).json({
        error: existingBiddingError.message,
      })
    }

    const now = new Date()
    const endTime = new Date(now.getTime() + durationSeconds * 1000)

    let bidding = null
    let biddingAction = ''

    if (existingBidding) {
      const { data: updatedBidding, error: updateBiddingError } =
        await supabase
          .from('bidding')
          .update({
            status: 'open',
            start_time: now.toISOString(),
            end_time: endTime.toISOString(),
            updated_at: now.toISOString(),
          })
          .eq('bidding_id', existingBidding.bidding_id)
          .select()
          .single()

      if (updateBiddingError) {
        return res.status(500).json({
          error: updateBiddingError.message,
        })
      }

      bidding = updatedBidding
      biddingAction =
        String(existingBidding.status).toLowerCase() === 'open'
          ? 'extended'
          : 'reopened'
    } else {
      const { data: newBidding, error: createBiddingError } =
        await supabase
          .from('bidding')
          .insert([
            {
              order_id: order.order_id,
              status: 'open',
              start_time: now.toISOString(),
              end_time: endTime.toISOString(),
            },
          ])
          .select()
          .single()

      if (createBiddingError) {
        return res.status(500).json({
          error: createBiddingError.message,
        })
      }

      bidding = newBidding
      biddingAction = 'created'
    }

    const { error: updateOrderError } = await supabase
      .from('orders')
      .update({
        current_status: 'open_for_bids',
        updated_at: now.toISOString(),
      })
      .eq('order_id', order.order_id)

    if (updateOrderError) {
      return res.status(500).json({
        error: updateOrderError.message,
      })
    }

    let notifiedCount = 0
    const warnings = []

    try {
      const { error: deleteNotificationError } = await supabase
        .from('notifications')
        .delete()
        .eq('order_id', order.order_id)
        .eq('bidding_id', bidding.bidding_id)
        .eq('type', 'bidding')

      if (deleteNotificationError) {
        throw new Error(deleteNotificationError.message)
      }

      notifiedCount = await createSupplierBiddingNotifications(
        order,
        bidding
      )
    } catch (notificationError) {
      console.error(
        'BIDDING NOTIFICATION ERROR:',
        notificationError.message
      )

      warnings.push(
        `Bidding opened, but supplier notifications could not be refreshed: ${notificationError.message}`
      )
    }

    try {
      await publish('order.bidding.opened', {
        order_id: order.order_id,
        order_reference: order.order_reference,
        order_type: order.order_type,
        bidding_id: bidding.bidding_id,
        end_time: bidding.end_time,
      })
    } catch (publishError) {
      console.error(
        'BIDDING EVENT PUBLISH ERROR:',
        publishError.message
      )

      warnings.push(
        `Bidding opened, but messaging event publish failed: ${publishError.message}`
      )
    }

    return res.status(201).json({
      message:
        biddingAction === 'created'
          ? 'Bidding opened successfully'
          : biddingAction === 'extended'
          ? 'Bidding timer updated successfully'
          : 'Bidding reopened successfully',
      action: biddingAction,
      order: {
        ...order,
        current_status: 'open_for_bids',
      },
      bidding,
      notified_suppliers: notifiedCount,
      warnings,
    })
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    })
  }
})

router.get('/bidding/status', async (req, res) => {
  try {
    const { order_reference, order_id } = req.query

    if (!order_reference && !order_id) {
      return res.status(400).json({
        error: 'order_reference or order_id is required',
      })
    }

    const order = order_reference
      ? await getOrderByReference(order_reference)
      : await getOrderById(order_id)

    if (!order) {
      return res.status(404).json({
        error: 'Order not found',
      })
    }

    const { data: bidding, error: biddingError } = await supabase
      .from('bidding')
      .select('*')
      .eq('order_id', order.order_id)
      .maybeSingle()

    if (biddingError) {
      return res.status(500).json({
        error: biddingError.message,
      })
    }

    if (!bidding) {
      return res.json({
        order,
        bidding: null,
        remaining_seconds: 0,
        is_open: false,
      })
    }

    let finalBidding = bidding
    let remainingSeconds = 0

    const endTime = bidding.end_time
      ? new Date(bidding.end_time).getTime()
      : null

    if (endTime && !Number.isNaN(endTime)) {
      remainingSeconds = Math.max(
        0,
        Math.floor((endTime - Date.now()) / 1000)
      )
    }

    const currentlyOpen =
      String(bidding.status || '').toLowerCase() === 'open'

    if (currentlyOpen && remainingSeconds <= 0) {
      const { data: closedBidding, error: closeExpiredError } =
        await supabase
          .from('bidding')
          .update({
            status: 'closed',
            updated_at: new Date().toISOString(),
          })
          .eq('bidding_id', bidding.bidding_id)
          .select()
          .single()

      if (closeExpiredError) {
        return res.status(500).json({
          error: closeExpiredError.message,
        })
      }

      finalBidding = closedBidding
      remainingSeconds = 0
    }

    const isOpen =
      String(finalBidding.status || '').toLowerCase() === 'open' &&
      remainingSeconds > 0

    return res.json({
      order,
      bidding: finalBidding,
      remaining_seconds: remainingSeconds,
      is_open: isOpen,
    })
  } catch (error) {
    console.error('GET BIDDING STATUS ERROR:', error.message)

    return res.status(500).json({
      error: error.message,
    })
  }
})

router.post('/bidding/close', async (req, res) => {
  try {
    const { order_reference } = req.body

    if (!order_reference) {
      return res.status(400).json({
        error: 'Order reference is required',
      })
    }

    const order = await getOrderByReference(order_reference)

    if (!order) {
      return res.status(404).json({
        error: 'Order not found',
      })
    }

    if (normalizeDbStatus(order.current_status) !== 'open_for_bids') {
      return res.status(400).json({
        error: 'Only an order in Open for Bids stage can be closed.',
      })
    }

    const sentShortlist = await getSentShortlist(order.order_id)

    if (sentShortlist.length > 0) {
      return res.status(400).json({
        error:
          'Bidding is locked because the shortlist has already been sent to Logistics.',
      })
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
      return res.status(500).json({
        error: biddingError.message,
      })
    }

    if (!bidding) {
      return res.status(400).json({
        error: 'No open bidding session was found for this order.',
      })
    }

    return res.json({
      message: 'Bidding closed successfully',
      bidding,
    })
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    })
  }
})

router.get('/bids', async (req, res) => {
  try {
    const { order_reference, order_id } = req.query

    let finalOrderId = null

    if (order_id) {
      finalOrderId = Number(order_id)

      if (Number.isNaN(finalOrderId)) {
        return res.status(400).json({
          error: 'Invalid order_id',
        })
      }
    }

    if (!finalOrderId && order_reference) {
      const order = await getOrderByReference(order_reference)

      if (!order) {
        return res.status(404).json({
          error: `Order ${order_reference} not found`,
        })
      }

      finalOrderId = Number(order.order_id)
    }

    const { data, error } = await supabase.rpc(
      'get_operation_bids'
    )

    if (error) {
      return res.status(500).json({
        error: error.message,
      })
    }

    let filteredData = data || []

    if (finalOrderId) {
      filteredData = filteredData.filter(
        (bid) =>
          Number(bid.order_id) === Number(finalOrderId)
      )
    }

    if (order_reference) {
      filteredData = filteredData.filter((bid) => {
        if (
          bid.order_reference === null ||
          bid.order_reference === undefined ||
          bid.order_reference === ''
        ) {
          return true
        }

        return (
          String(bid.order_reference)
            .trim()
            .toLowerCase() ===
          String(order_reference)
            .trim()
            .toLowerCase()
        )
      })
    }

    const bidsWithSupplierContacts =
      await attachSupplierContactDetails(filteredData)

    return res.json(bidsWithSupplierContacts)
  } catch (error) {
    console.error('GET BIDS ERROR:', error.message)

    return res.status(500).json({
      error: error.message,
    })
  }
})

router.get('/bids/shortlist-status', async (req, res) => {
  try {
    const { order_reference, order_id } = req.query

    if (!order_reference && !order_id) {
      return res.status(400).json({
        success: false,
        error: 'order_reference or order_id is required',
      })
    }

    const order = order_reference
      ? await getOrderByReference(order_reference)
      : await getOrderById(order_id)

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      })
    }

    const { data: selections, error: selectionError } = await supabase
      .from('bid_selection')
      .select('*')
      .eq('order_id', order.order_id)
      .order('selection_id', {
        ascending: true,
      })

    if (selectionError) {
      return res.status(500).json({
        success: false,
        error: selectionError.message,
      })
    }

    const savedSelections = selections || []

    const normalizeSelectionStatus = (item) => {
      const rawStatus = String(
        item?.selection_status || ''
      )
        .trim()
        .toLowerCase()

      if (
        ['winner', 'accepted', 'selected'].includes(rawStatus) ||
        item?.selected === true
      ) {
        return 'accepted'
      }

      if (
        ['rejected', 'not_selected', 'not selected'].includes(rawStatus)
      ) {
        return 'rejected'
      }

      return 'shortlisted'
    }

    const normalizedSelections = savedSelections.map((item) => ({
      ...item,
      selection_status: normalizeSelectionStatus(item),
    }))

    const bidIds = normalizedSelections
      .map((item) => Number(item.bid_id))
      .filter((id) => !Number.isNaN(id))

    const winnerSelection =
      normalizedSelections.find(
        (item) => item.selection_status === 'accepted'
      ) || null

    const sentToLogistics =
      normalizedSelections.some(
        (item) => item.sent_to_logistics === true
      ) ||
      normalizedSelections.some((item) =>
        ['accepted', 'rejected'].includes(item.selection_status)
      )

    const currentOrderStatus = normalizeDbStatus(
      order.current_status
    )

    let syncedOrderStatus = order.current_status || null

    const preWinnerStatuses = [
      '',
      'created',
      'open_for_bids',
      'bidding_open',
    ]

    if (
      winnerSelection &&
      preWinnerStatuses.includes(currentOrderStatus)
    ) {
      const { error: winnerOrderStatusError } = await supabase
        .from('orders')
        .update({
          current_status: 'bid_accepted',
          updated_at: new Date().toISOString(),
        })
        .eq('order_id', order.order_id)

      if (winnerOrderStatusError) {
        return res.status(500).json({
          success: false,
          error: winnerOrderStatusError.message,
        })
      }

      syncedOrderStatus = 'bid_accepted'
    }

    return res.json({
      success: true,
      order_id: order.order_id,
      order_reference: order.order_reference,
      order_status: syncedOrderStatus,
      bid_ids: bidIds,
      count: bidIds.length,
      selections: normalizedSelections,
      sent_to_logistics: sentToLogistics,
      locked: sentToLogistics,
      winner_bid_id: winnerSelection
        ? Number(winnerSelection.bid_id)
        : null,
      winner_selection: winnerSelection,
      decision_finalized: Boolean(winnerSelection),
    })
  } catch (error) {
    console.error('GET SHORTLIST STATUS ERROR:', error.message)

    return res.status(500).json({
      success: false,
      error: error.message,
    })
  }
})

router.post('/bids/send-to-logistics', async (req, res) => {
  try {
    const { order_reference, bid_ids } = req.body

    if (
      !order_reference ||
      String(order_reference).trim() === ''
    ) {
      return res.status(400).json({
        success: false,
        error: 'Order reference is required',
      })
    }

    if (!Array.isArray(bid_ids)) {
      return res.status(400).json({
        success: false,
        error: 'bid_ids must be an array',
      })
    }

    const convertedBidIds = bid_ids.map((id) => Number(id))

    if (
      convertedBidIds.some((id) => Number.isNaN(id))
    ) {
      return res.status(400).json({
        success: false,
        error: 'One or more Bid IDs are invalid',
      })
    }

    const uniqueBidIds = [...new Set(convertedBidIds)]

    if (uniqueBidIds.length !== convertedBidIds.length) {
      return res.status(400).json({
        success: false,
        error: 'Duplicate Bid IDs are not allowed',
      })
    }

    if (uniqueBidIds.length === 0 || uniqueBidIds.length > 5) {
      return res.status(400).json({
        success: false,
        error: 'Please shortlist between 1 and 5 suppliers.',
      })
    }

    const order = await getOrderByReference(order_reference)

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      })
    }

    if (normalizeDbStatus(order.current_status) !== 'open_for_bids') {
      return res.status(400).json({
        success: false,
        error:
          'Shortlisted bids can be sent only while the order is in Open for Bids stage.',
      })
    }

    const sentShortlist = await getSentShortlist(order.order_id)

    if (sentShortlist.length > 0) {
      return res.status(400).json({
        success: false,
        error:
          'Shortlist has already been sent to Logistics for this order',
      })
    }

    const { data: bidding, error: biddingError } = await supabase
      .from('bidding')
      .select('bidding_id, status, end_time')
      .eq('order_id', order.order_id)
      .maybeSingle()

    if (biddingError) {
      return res.status(500).json({
        success: false,
        error: biddingError.message,
      })
    }

    if (!bidding) {
      return res.status(400).json({
        success: false,
        error: 'No bidding session exists for this order.',
      })
    }

    const biddingStillOpen =
      String(bidding.status || '').toLowerCase() === 'open' &&
      (!bidding.end_time ||
        new Date(bidding.end_time).getTime() > Date.now())

    if (biddingStillOpen) {
      return res.status(400).json({
        success: false,
        error:
          'Bidding is still open. Close bidding before sending the shortlist to Logistics.',
      })
    }

    const { data: availableBids, error: availableBidsError } =
      await supabase
        .from('bids')
        .select(
          'bid_id, bidding_id, order_id, supplier_id, bid_status'
        )
        .eq('order_id', order.order_id)

    if (availableBidsError) {
      return res.status(500).json({
        success: false,
        error: availableBidsError.message,
      })
    }

    const allOrderBids = availableBids || []
    const totalAvailableBids = allOrderBids.length

    if (totalAvailableBids === 0) {
      return res.status(400).json({
        success: false,
        error: 'No bids are available for this order',
      })
    }

    const maximumAllowed = Math.min(5, totalAvailableBids)

    if (uniqueBidIds.length > maximumAllowed) {
      return res.status(400).json({
        success: false,
        error: `You can shortlist a maximum of ${maximumAllowed} supplier${
          maximumAllowed === 1 ? '' : 's'
        } for this order.`,
        maximum_shortlist_count: maximumAllowed,
        total_available_bids: totalAvailableBids,
      })
    }

    const selectedBidIdSet = new Set(uniqueBidIds)

    const selectedBids = allOrderBids.filter((bid) =>
      selectedBidIdSet.has(Number(bid.bid_id))
    )

    if (selectedBids.length !== uniqueBidIds.length) {
      return res.status(400).json({
        success: false,
        error:
          'One or more selected bids do not belong to this order',
      })
    }

    const {
      error: deleteOldSelectionsError,
    } = await supabase
      .from('bid_selection')
      .delete()
      .eq('order_id', order.order_id)
      .eq('sent_to_logistics', false)

    if (deleteOldSelectionsError) {
      return res.status(500).json({
        success: false,
        error: deleteOldSelectionsError.message,
      })
    }

    const now = new Date().toISOString()

    const selectionRows = selectedBids.map((bid) => ({
      bid_id: bid.bid_id,
      bidding_id: bid.bidding_id || bidding.bidding_id,
      order_id: bid.order_id,
      supplier_id: bid.supplier_id,
      selection_status: 'shortlisted',
      sent_to_logistics: true,
      selected: false,
      selected_by: null,
      reason: null,
      selected_at: now,
    }))

    const {
      data: insertedSelections,
      error: insertSelectionError,
    } = await supabase
      .from('bid_selection')
      .insert(selectionRows)
      .select()

    if (insertSelectionError) {
      return res.status(500).json({
        success: false,
        error: insertSelectionError.message,
      })
    }

    const { error: updateSelectedBidError } = await supabase
      .from('bids')
      .update({
        bid_status: 'shortlisted',
        updated_at: now,
      })
      .eq('order_id', order.order_id)
      .in('bid_id', uniqueBidIds)

    if (updateSelectedBidError) {
      return res.status(500).json({
        success: false,
        error: updateSelectedBidError.message,
      })
    }

    const { error: logisticsNotificationError } = await supabase
      .from('notifications')
      .insert([
        {
          order_id: order.order_id,
          message: `Operations sent ${uniqueBidIds.length} shortlisted supplier bid${
            uniqueBidIds.length === 1 ? '' : 's'
          } for order ${order.order_reference}.`,
          type: 'shortlist_to_logistics',
          is_read: false,
          created_at: now,
        },
      ])

    if (logisticsNotificationError) {
      console.error(
        'LOGISTICS NOTIFICATION ERROR:',
        logisticsNotificationError.message
      )
    }

    return res.status(201).json({
      success: true,
      message: `${uniqueBidIds.length} shortlisted bid${
        uniqueBidIds.length === 1 ? '' : 's'
      } sent to Logistics successfully`,
      count: insertedSelections?.length || uniqueBidIds.length,
      maximum_shortlist_count: maximumAllowed,
      total_available_bids: totalAvailableBids,
      order_id: order.order_id,
      order_reference: order.order_reference,
      order_status: order.current_status,
      bid_ids: uniqueBidIds,
      sent_to_logistics: true,
      shortlisted: insertedSelections || [],
    })
  } catch (error) {
    console.error(
      'SEND SHORTLIST TO LOGISTICS ERROR:',
      error.message
    )

    return res.status(500).json({
      success: false,
      error: error.message,
    })
  }
})

// -----------------------------------------------------------------------------
// Other Operations data
// -----------------------------------------------------------------------------

router.get('/users', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')

    if (error) {
      return res.status(500).json({
        error: error.message,
      })
    }

    return res.json(data || [])
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    })
  }
})

export default router

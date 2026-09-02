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

// Supported Sri Lankan container ports for the Operations import/export flow.
// Import  = Port -> Inland/Warehouse
// Export  = Inland/Warehouse -> Port
const containerPortByDistrict = {
  colombo_district: 'colombo_port',
  galle_district: 'galle_port',
  hambantota_district: 'hambantota_port',
  trincomalee_district: 'trincomalee_port',
  jaffna_district: 'kankesanthurai_port',
  ampara_district: 'oluvil_port',
}

const containerPortLocations = new Set(
  Object.values(containerPortByDistrict)
)

const isContainerPortLocation = (location) =>
  containerPortLocations.has(
    normalizeDbStatus(location)
  )

const isValidContainerPortEndpoint = (
  district,
  location
) => {
  const expectedPort =
    containerPortByDistrict[
      normalizeDbStatus(district)
    ]

  if (!expectedPort) {
    return false
  }

  return (
    expectedPort ===
    normalizeDbStatus(location)
  )
}

const validateOrderRoute = ({
  orderType,
  pickupDistrict,
  pickupLocation,
  destinationDistrict,
  destinationLocation,
}) => {
  const normalizedOrderType =
    normalizeDbStatus(orderType)

  if (normalizedOrderType === 'import') {
    if (
      !isValidContainerPortEndpoint(
        pickupDistrict,
        pickupLocation
      )
    ) {
      return {
        valid: false,
        error:
          'Import pickup must be a supported Sri Lankan container port with the correct port district.',
      }
    }

    if (
      isContainerPortLocation(
        destinationLocation
      )
    ) {
      return {
        valid: false,
        error:
          'Import destination must be an inland warehouse/location, not a container port.',
      }
    }

    return {
      valid: true,
    }
  }

  if (normalizedOrderType === 'export') {
    if (
      isContainerPortLocation(
        pickupLocation
      )
    ) {
      return {
        valid: false,
        error:
          'Export pickup must be an inland warehouse/location, not a container port.',
      }
    }

    if (
      !isValidContainerPortEndpoint(
        destinationDistrict,
        destinationLocation
      )
    ) {
      return {
        valid: false,
        error:
          'Export destination must be a supported Sri Lankan container port with the correct port district.',
      }
    }

    return {
      valid: true,
    }
  }

  return {
    valid: false,
    error: 'Order type must be import or export',
  }
}

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


const getAllBidSelections = async (orderId) => {
  const { data, error } = await supabase
    .from('bid_selection')
    .select('*')
    .eq('order_id', orderId)
    .order('selection_id', {
      ascending: true,
    })

  if (error) {
    throw new Error(error.message)
  }

  return data || []
}

const getLogisticsSelectedSelection = (selections = []) => {
  const selectedRows = (selections || []).filter((item) => {
    const status = normalizeDbStatus(item?.selection_status)

    return (
      item?.selected === true ||
      ['selected', 'winner', 'accepted'].includes(status)
    )
  })

  if (selectedRows.length === 0) {
    return null
  }

  return (
    selectedRows
      .slice()
      .sort((a, b) => {
        const aTime = new Date(
          a.selected_at || a.updated_at || a.created_at || 0
        ).getTime()
        const bTime = new Date(
          b.selected_at || b.updated_at || b.created_at || 0
        ).getTime()

        if (aTime !== bTime) {
          return bTime - aTime
        }

        return Number(b.selection_id || 0) - Number(a.selection_id || 0)
      })[0] || null
  )
}

const getAwardAttemptRows = async (orderId) => {
  const { data, error } = await supabase
    .from('bid_award_attempts')
    .select('*')
    .eq('order_id', orderId)

  if (error) {
    throw new Error(error.message)
  }

  return (data || []).sort(
    (a, b) =>
      Number(a.attempt_id || a.id || 0) -
      Number(b.attempt_id || b.id || 0)
  )
}

const getOutcomeNotificationRows = async (orderId) => {
  const { data, error } = await supabase
    .from('bid_outcome_notifications')
    .select('*')
    .eq('order_id', orderId)

  if (error) {
    throw new Error(error.message)
  }

  return (data || []).sort(
    (a, b) =>
      Number(
        a.outcome_notification_id ||
          a.notification_id ||
          a.id ||
          0
      ) -
      Number(
        b.outcome_notification_id ||
          b.notification_id ||
          b.id ||
          0
      )
  )
}

const getAwardStateViewRow = async (orderId) => {
  const { data, error } = await supabase
    .from('operations_bid_award_state')
    .select('*')
    .eq('order_id', orderId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data || null
}

const getBidWithSupplier = async (bidId) => {
  const numericBidId = Number(bidId)

  if (!numericBidId || Number.isNaN(numericBidId)) {
    return null
  }

  const { data: bid, error: bidError } = await supabase
    .from('bids')
    .select('*')
    .eq('bid_id', numericBidId)
    .maybeSingle()

  if (bidError) {
    throw new Error(bidError.message)
  }

  if (!bid) {
    return null
  }

  let supplier = null

  if (bid.supplier_id !== null && bid.supplier_id !== undefined) {
    const { data: supplierRow, error: supplierError } = await supabase
      .from('suppliers')
      .select('supplier_id, company_name, email, contact_number')
      .eq('supplier_id', bid.supplier_id)
      .maybeSingle()

    if (supplierError) {
      throw new Error(supplierError.message)
    }

    supplier = supplierRow || null
  }

  return {
    ...bid,
    supplier_name:
      supplier?.company_name ||
      bid.supplier_name ||
      bid.company_name ||
      '',
    supplier_email:
      supplier?.email ||
      bid.supplier_email ||
      '',
    supplier_phone:
      supplier?.contact_number ||
      bid.supplier_phone ||
      '',
    suppliers: supplier
      ? {
          supplier_id: supplier.supplier_id,
          company_name: supplier.company_name,
          email: supplier.email,
          contact_number: supplier.contact_number,
          phone: supplier.contact_number,
        }
      : undefined,
  }
}

const getAttemptResponseStatus = (attempt) => {
  if (!attempt) {
    return ''
  }

  return normalizeDbStatus(
    attempt.workflow_status ||
      attempt.supplier_confirmation_status ||
      attempt.supplier_response ||
      attempt.supplier_response_status ||
      attempt.response_status ||
      attempt.status ||
      ''
  )
}

const getLatestAttemptForBid = async (orderId, bidId) => {
  const attempts = await getAwardAttemptRows(orderId)

  const matching = attempts.filter(
    (attempt) => Number(attempt.bid_id) === Number(bidId)
  )

  return matching.length > 0
    ? matching[matching.length - 1]
    : null
}

const createAwardAttemptForSelection = async (
  order,
  selection
) => {
  if (!order || !selection?.bid_id) {
    return null
  }

  const existingAttempt = await getLatestAttemptForBid(
    order.order_id,
    selection.bid_id
  )

  const existingResponse = getAttemptResponseStatus(existingAttempt)

  if (
    existingAttempt &&
    ![
      'rejected',
      'declined',
      'supplier_rejected',
    ].includes(existingResponse)
  ) {
    return existingAttempt
  }

  const bid = await getBidWithSupplier(selection.bid_id)

  if (!bid) {
    throw new Error(
      'The supplier bid selected by Logistics could not be found.'
    )
  }

  const attempts = await getAwardAttemptRows(order.order_id)

  const nextAttemptNumber =
    attempts.reduce((max, item) => {
      const value = Number(
        item.attempt_no ||
          item.attempt_number ||
          item.sequence_no ||
          0
      )

      return Number.isNaN(value)
        ? max
        : Math.max(max, value)
    }, 0) + 1

  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('bid_award_attempts')
    .insert([
      {
        order_id: order.order_id,
        bid_id: Number(selection.bid_id),
        supplier_id:
          selection.supplier_id ||
          bid.supplier_id ||
          null,
        attempt_no: nextAttemptNumber,
        workflow_status:
          'selected_supplier_notice_pending',
        created_at: now,
        updated_at: now,
      },
    ])
    .select()
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data || null
}

const ensureAwardAttemptFromLogisticsSelection = async (order) => {
  if (!order) {
    return null
  }

  const selections = await getAllBidSelections(order.order_id)
  const selectedSelection =
    getLogisticsSelectedSelection(selections)

  if (!selectedSelection) {
    return null
  }

  return createAwardAttemptForSelection(
    order,
    selectedSelection
  )
}

const getCurrentAwardAttempt = async (order, awardState = null) => {
  const selectedBidId = Number(
    awardState?.selected_bid_id ||
      awardState?.winner_bid_id ||
      0
  )

  if (selectedBidId > 0) {
    const attempt = await getLatestAttemptForBid(
      order.order_id,
      selectedBidId
    )

    if (attempt) {
      return attempt
    }
  }

  const ensuredAttempt =
    await ensureAwardAttemptFromLogisticsSelection(order)

  if (ensuredAttempt) {
    return ensuredAttempt
  }

  const attempts = await getAwardAttemptRows(order.order_id)

  if (attempts.length === 0) {
    return null
  }

  const activeAttempts = attempts.filter((attempt) => {
    const responseStatus = getAttemptResponseStatus(attempt)

    return ![
      'rejected',
      'declined',
      'supplier_rejected',
    ].includes(responseStatus)
  })

  return activeAttempts.length > 0
    ? activeAttempts[activeAttempts.length - 1]
    : attempts[attempts.length - 1]
}

const buildExistingFieldPatch = (
  row,
  candidateValues = {}
) => {
  const patch = {}

  Object.entries(candidateValues).forEach(
    ([fieldName, fieldValue]) => {
      if (
        row &&
        Object.prototype.hasOwnProperty.call(
          row,
          fieldName
        )
      ) {
        patch[fieldName] = fieldValue
      }
    }
  )

  return patch
}

const updateAwardAttemptByRow = async (
  attempt,
  patch
) => {
  const attemptId =
    attempt?.attempt_id ||
    attempt?.id ||
    null

  if (!attemptId) {
    throw new Error(
      'Award attempt identifier is missing.'
    )
  }

  const primaryKey = Object.prototype.hasOwnProperty.call(
    attempt,
    'attempt_id'
  )
    ? 'attempt_id'
    : 'id'

  const { data, error } = await supabase
    .from('bid_award_attempts')
    .update(patch)
    .eq(primaryKey, attemptId)
    .select()
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data || null
}

const getAwardWorkflowPayload = async (order) => {
  if (!order) {
    return null
  }

  let awardState = await getAwardStateViewRow(
    order.order_id
  )

  const selections = await getAllBidSelections(
    order.order_id
  )

  const sentToLogistics =
    selections.some(
      (item) => item.sent_to_logistics === true
    )

  const selectedSelection =
    getLogisticsSelectedSelection(selections)

  if (
    selectedSelection &&
    (!awardState?.selected_bid_id ||
      normalizeDbStatus(
        awardState?.award_workflow_state
      ) === 'awaiting_logistics_selection')
  ) {
    try {
      await createAwardAttemptForSelection(
        order,
        selectedSelection
      )

      awardState = await getAwardStateViewRow(
        order.order_id
      )
    } catch (syncError) {
      console.error(
        'AWARD ATTEMPT SYNC ERROR:',
        syncError.message
      )
    }
  }

  const attempts = await getAwardAttemptRows(
    order.order_id
  )

  const outcomeNotifications =
    await getOutcomeNotificationRows(
      order.order_id
    )

  let selectedBidId = Number(
    awardState?.selected_bid_id ||
      selectedSelection?.bid_id ||
      0
  )

  if (Number.isNaN(selectedBidId)) {
    selectedBidId = 0
  }

  let selectedBid = null

  if (selectedBidId > 0) {
    selectedBid = await getBidWithSupplier(
      selectedBidId
    )
  }

  const fallbackWorkflowState = !sentToLogistics
    ? ''
    : selectedBidId > 0
    ? 'selected_supplier_notice_pending'
    : 'awaiting_logistics_selection'

  const safeAwardState = {
    order_id: order.order_id,
    order_reference: order.order_reference,
    current_status: order.current_status,
    ...(awardState || {}),
    selected_bid_id:
      awardState?.selected_bid_id ||
      (selectedBidId > 0 ? selectedBidId : null),
    selected_supplier:
      awardState?.selected_supplier ||
      selectedBid?.supplier_name ||
      '',
    selected_bid_amount:
      awardState?.selected_bid_amount ??
      selectedBid?.bid_amount ??
      null,
    supplier_confirmation_status:
      awardState?.supplier_confirmation_status ||
      '',
    sent_to_logistics:
      awardState?.sent_to_logistics === true ||
      sentToLogistics,
    pending_unsuccessful_notices:
      Number(
        awardState?.pending_unsuccessful_notices ||
          outcomeNotifications.filter(
            (item) =>
              normalizeDbStatus(
                item.notification_status
              ) !== 'sent'
          ).length
      ),
    sent_unsuccessful_notices:
      Number(
        awardState?.sent_unsuccessful_notices ||
          outcomeNotifications.filter(
            (item) =>
              normalizeDbStatus(
                item.notification_status
              ) === 'sent'
          ).length
      ),
    award_workflow_state:
      awardState?.award_workflow_state ||
      fallbackWorkflowState,
    outcome_notifications: outcomeNotifications,
    award_attempts: attempts,
  }

  return {
    success: true,
    award_state: safeAwardState,
    outcome_notifications: outcomeNotifications,
    award_attempts: attempts,
  }
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

    const routeValidation = validateOrderRoute({
      orderType: normalizedOrderType,
      pickupDistrict: pickup_district,
      pickupLocation: pickup_location,
      destinationDistrict: destination_district,
      destinationLocation: destination_location,
    })

    if (!routeValidation.valid) {
      return res.status(400).json({
        error: routeValidation.error,
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

    const selections = await getAllBidSelections(
      order.order_id
    )

    const normalizedSelections = selections.map(
      (item) => {
        const rawStatus = normalizeDbStatus(
          item?.selection_status
        )

        let displayStatus = 'shortlisted'

        if (
          item?.selected === true ||
          ['selected', 'winner', 'accepted'].includes(
            rawStatus
          )
        ) {
          displayStatus = 'selected'
        } else if (
          ['rejected', 'not_selected'].includes(
            rawStatus
          )
        ) {
          displayStatus = 'rejected'
        }

        return {
          ...item,
          selection_status: displayStatus,
        }
      }
    )

    const bidIds = normalizedSelections
      .map((item) => Number(item.bid_id))
      .filter((id) => !Number.isNaN(id))

    const selectedSelection =
      getLogisticsSelectedSelection(selections)

    const sentToLogistics =
      normalizedSelections.some(
        (item) => item.sent_to_logistics === true
      )

    // IMPORTANT:
    // Logistics selecting a supplier does NOT mean the supplier has accepted.
    // Therefore this route must NEVER move the order to bid_accepted.
    // Supplier acceptance is recorded only through the award workflow endpoint.
    if (selectedSelection) {
      try {
        await createAwardAttemptForSelection(
          order,
          selectedSelection
        )
      } catch (attemptSyncError) {
        console.error(
          'SHORTLIST AWARD ATTEMPT SYNC ERROR:',
          attemptSyncError.message
        )
      }
    }

    let awardPayload = null

    try {
      awardPayload = await getAwardWorkflowPayload(
        order
      )
    } catch (awardStateError) {
      console.error(
        'SHORTLIST AWARD STATE ERROR:',
        awardStateError.message
      )
    }

    const authoritativeSelectedBidId = Number(
      awardPayload?.award_state?.selected_bid_id ||
        selectedSelection?.bid_id ||
        0
    )

    return res.json({
      success: true,
      order_id: order.order_id,
      order_reference: order.order_reference,
      order_status: order.current_status,
      bid_ids: bidIds,
      count: bidIds.length,
      selections: normalizedSelections,
      sent_to_logistics: sentToLogistics,
      locked: sentToLogistics,
      winner_bid_id:
        authoritativeSelectedBidId > 0
          ? authoritativeSelectedBidId
          : null,
      winner_selection:
        selectedSelection || null,
      logistics_selection_made:
        authoritativeSelectedBidId > 0,
      decision_finalized:
        [
          'accepted',
          'supplier_accepted',
        ].includes(
          normalizeDbStatus(
            awardPayload?.award_state
              ?.supplier_confirmation_status
          )
        ),
      award_workflow_state:
        awardPayload?.award_state
          ?.award_workflow_state ||
        (sentToLogistics
          ? 'awaiting_logistics_selection'
          : ''),
    })
  } catch (error) {
    console.error(
      'GET SHORTLIST STATUS ERROR:',
      error.message
    )

    return res.status(500).json({
      success: false,
      error: error.message,
    })
  }
})

// -----------------------------------------------------------------------------
// Supplier Award Workflow
// -----------------------------------------------------------------------------
//
// Frontend flow:
//   GET  /bids/:orderId/award-state
//   POST /bids/:orderId/selected-notice-sent
//   POST /bids/:orderId/supplier-response
//   POST /bids/:orderId/outcome-notice-sent
//
// The database view `operations_bid_award_state` remains the authoritative
// workflow state. Operations does not choose the winner here.

router.get('/bids/award-state', async (req, res) => {
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

    const payload = await getAwardWorkflowPayload(
      order
    )

    return res.json(payload)
  } catch (error) {
    console.error(
      'GET AWARD STATE ERROR:',
      error.message
    )

    return res.status(500).json({
      success: false,
      error: error.message,
    })
  }
})

router.get('/bids/:orderId/award-state', async (req, res) => {
  try {
    const order = await getOrderById(
      req.params.orderId
    )

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      })
    }

    const payload = await getAwardWorkflowPayload(
      order
    )

    return res.json(payload)
  } catch (error) {
    console.error(
      'GET AWARD STATE BY ORDER ERROR:',
      error.message
    )

    return res.status(500).json({
      success: false,
      error: error.message,
    })
  }
})

router.post(
  '/bids/:orderId/selected-notice-sent',
  async (req, res) => {
    try {
      const order = await getOrderById(
        req.params.orderId
      )

      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Order not found',
        })
      }

      let awardPayload =
        await getAwardWorkflowPayload(order)

      const workflowState = normalizeDbStatus(
        awardPayload?.award_state
          ?.award_workflow_state
      )

      if (
        workflowState !==
        'selected_supplier_notice_pending'
      ) {
        return res.status(409).json({
          success: false,
          error:
            'The selected supplier notice can be marked sent only while the workflow is in Selected Supplier Notice Pending state.',
          award_state: awardPayload?.award_state || null,
        })
      }

      const selectedBidId = Number(
        awardPayload?.award_state
          ?.selected_bid_id ||
          req.body?.selected_bid_id ||
          0
      )

      if (
        !selectedBidId ||
        Number.isNaN(selectedBidId)
      ) {
        return res.status(400).json({
          success: false,
          error:
            'No supplier is currently selected by Logistics.',
        })
      }

      if (
        req.body?.selected_bid_id &&
        Number(req.body.selected_bid_id) !==
          selectedBidId
      ) {
        return res.status(409).json({
          success: false,
          error:
            'The selected bid has changed. Refresh the page and try again.',
        })
      }

      const attempt =
        await getCurrentAwardAttempt(
          order,
          awardPayload?.award_state
        )

      if (!attempt) {
        return res.status(409).json({
          success: false,
          error:
            'No award attempt exists for the supplier selected by Logistics.',
        })
      }

      if (
        Number(attempt.bid_id) !==
        selectedBidId
      ) {
        return res.status(409).json({
          success: false,
          error:
            'The current award attempt does not match the supplier selected by Logistics.',
        })
      }

      const now = new Date().toISOString()

      const patch = buildExistingFieldPatch(
        attempt,
        {
          selected_notice_sent: true,
          selected_supplier_notice_sent: true,
          selected_notice_status: 'sent',
          selected_supplier_notice_status: 'sent',
          notification_status: 'sent',
          selected_notice_sent_at: now,
          selected_supplier_notice_sent_at: now,
          notice_sent_at: now,
          notification_sent_at: now,
          workflow_status:
            'awaiting_supplier_response',
          updated_at: now,
        }
      )

      const meaningfulFields = Object.keys(
        patch
      ).filter(
        (key) => key !== 'updated_at'
      )

      if (meaningfulFields.length === 0) {
        return res.status(500).json({
          success: false,
          error:
            'bid_award_attempts does not contain a supported selected-notice field. Check the SQL workflow schema.',
        })
      }

      await updateAwardAttemptByRow(
        attempt,
        patch
      )

      awardPayload =
        await getAwardWorkflowPayload(order)

      return res.json({
        ...awardPayload,
        message:
          'Selected supplier notice marked as sent. Awaiting supplier response.',
      })
    } catch (error) {
      console.error(
        'MARK SELECTED NOTICE SENT ERROR:',
        error.message
      )

      return res.status(500).json({
        success: false,
        error: error.message,
      })
    }
  }
)

router.post(
  '/bids/:orderId/supplier-response',
  async (req, res) => {
    try {
      const order = await getOrderById(
        req.params.orderId
      )

      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Order not found',
        })
      }

      const responseValue = normalizeDbStatus(
        req.body?.response
      )

      if (
        !['accepted', 'rejected'].includes(
          responseValue
        )
      ) {
        return res.status(400).json({
          success: false,
          error:
            'response must be accepted or rejected',
        })
      }

      let awardPayload =
        await getAwardWorkflowPayload(order)

      const workflowState = normalizeDbStatus(
        awardPayload?.award_state
          ?.award_workflow_state
      )

      if (
        workflowState !==
        'awaiting_supplier_response'
      ) {
        return res.status(409).json({
          success: false,
          error:
            'Supplier response can be recorded only while the workflow is Awaiting Supplier Response.',
          award_state: awardPayload?.award_state || null,
        })
      }

      const selectedBidId = Number(
        awardPayload?.award_state
          ?.selected_bid_id ||
          req.body?.selected_bid_id ||
          0
      )

      if (
        !selectedBidId ||
        Number.isNaN(selectedBidId)
      ) {
        return res.status(400).json({
          success: false,
          error:
            'No selected supplier is awaiting a response.',
        })
      }

      if (
        req.body?.selected_bid_id &&
        Number(req.body.selected_bid_id) !==
          selectedBidId
      ) {
        return res.status(409).json({
          success: false,
          error:
            'The selected bid has changed. Refresh the page and try again.',
        })
      }

      const attempt =
        await getCurrentAwardAttempt(
          order,
          awardPayload?.award_state
        )

      if (
        !attempt ||
        Number(attempt.bid_id) !==
          selectedBidId
      ) {
        return res.status(409).json({
          success: false,
          error:
            'The current award attempt could not be resolved.',
        })
      }

      const now = new Date().toISOString()

      const responsePatch =
        buildExistingFieldPatch(
          attempt,
          {
            supplier_confirmation_status:
              responseValue,
            supplier_response: responseValue,
            supplier_response_status:
              responseValue,
            response_status: responseValue,
            responded_at: now,
            response_at: now,
            supplier_responded_at: now,
            supplier_response_at: now,
            workflow_status:
              responseValue === 'accepted'
                ? 'supplier_accepted'
                : 'supplier_rejected',
            response_note:
              req.body?.note ||
              req.body?.response_note ||
              null,
            updated_at: now,
          }
        )

      const responseFields = Object.keys(
        responsePatch
      ).filter(
        (key) => key !== 'updated_at'
      )

      if (responseFields.length === 0) {
        return res.status(500).json({
          success: false,
          error:
            'bid_award_attempts does not contain a supported supplier-response field. Check the SQL workflow schema.',
        })
      }

      await updateAwardAttemptByRow(
        attempt,
        responsePatch
      )

      const selections = await getAllBidSelections(
        order.order_id
      )

      const selectedSelection =
        selections.find(
          (item) =>
            Number(item.bid_id) ===
            selectedBidId
        ) || null

      const otherShortlistedSelections =
        selections.filter(
          (item) =>
            Number(item.bid_id) !==
            selectedBidId
        )

      if (responseValue === 'rejected') {
        if (selectedSelection) {
          const selectedPatch = {
            selected: false,
            selection_status: 'rejected',
          }

          if (
            Object.prototype.hasOwnProperty.call(
              selectedSelection,
              'reason'
            )
          ) {
            selectedPatch.reason =
              'Selected supplier declined the award'
          }

          if (
            Object.prototype.hasOwnProperty.call(
              selectedSelection,
              'updated_at'
            )
          ) {
            selectedPatch.updated_at = now
          }

          const { error: selectedRejectError } =
            await supabase
              .from('bid_selection')
              .update(selectedPatch)
              .eq(
                'selection_id',
                selectedSelection.selection_id
              )

          if (selectedRejectError) {
            throw new Error(
              selectedRejectError.message
            )
          }
        }

        const remainingSelectionIds =
          otherShortlistedSelections
            .map((item) => item.selection_id)
            .filter(Boolean)

        if (
          remainingSelectionIds.length > 0
        ) {
          const { error: restoreSelectionsError } =
            await supabase
              .from('bid_selection')
              .update({
                selection_status: 'shortlisted',
                selected: false,
              })
              .in(
                'selection_id',
                remainingSelectionIds
              )

          if (restoreSelectionsError) {
            throw new Error(
              restoreSelectionsError.message
            )
          }
        }

        const { error: rejectBidError } =
          await supabase
            .from('bids')
            .update({
              bid_status: 'rejected',
              updated_at: now,
            })
            .eq('bid_id', selectedBidId)

        if (rejectBidError) {
          throw new Error(
            rejectBidError.message
          )
        }

        const remainingBidIds =
          otherShortlistedSelections
            .map((item) => Number(item.bid_id))
            .filter(
              (id) =>
                id > 0 && !Number.isNaN(id)
            )

        if (remainingBidIds.length > 0) {
          const { error: restoreBidError } =
            await supabase
              .from('bids')
              .update({
                bid_status: 'shortlisted',
                updated_at: now,
              })
              .in('bid_id', remainingBidIds)

          if (restoreBidError) {
            throw new Error(
              restoreBidError.message
            )
          }
        }

        // IMPORTANT:
        // Do not move the order to bid_accepted.
        // Do not create unsuccessful supplier notifications yet.
        // The remaining shortlist is already with Logistics because
        // sent_to_logistics remains true on those bid_selection rows.
        // Notify Logistics that an alternate supplier must now be selected.

        const {
          data: existingAlternateNotifications,
          error: existingAlternateNotificationError,
        } = await supabase
          .from('notifications')
          .select('order_id, type, is_read')
          .eq('order_id', order.order_id)
          .eq('type', 'alternate_supplier_required')
          .eq('is_read', false)

        if (existingAlternateNotificationError) {
          console.error(
            'ALTERNATE SUPPLIER NOTIFICATION LOOKUP ERROR:',
            existingAlternateNotificationError.message
          )
        }

        if (
          !existingAlternateNotificationError &&
          (existingAlternateNotifications || []).length === 0
        ) {
          const { error: alternateNotificationError } =
            await supabase
              .from('notifications')
              .insert([
                {
                  order_id: order.order_id,
                  message: `Selected supplier declined order ${order.order_reference}. Please select an alternate supplier from the remaining shortlisted bids.`,
                  type: 'alternate_supplier_required',
                  is_read: false,
                  created_at: now,
                },
              ])

          if (alternateNotificationError) {
            console.error(
              'ALTERNATE SUPPLIER NOTIFICATION ERROR:',
              alternateNotificationError.message
            )
          }
        }

        try {
          await publish('order.bidding.alternate_supplier_required', {
            order_id: order.order_id,
            order_reference: order.order_reference,
            rejected_bid_id: selectedBidId,
            rejected_supplier_id:
              selectedSelection?.supplier_id || null,
            remaining_bid_ids: remainingBidIds,
          })
        } catch (publishError) {
          console.error(
            'ALTERNATE SUPPLIER EVENT PUBLISH ERROR:',
            publishError.message
          )
        }

        awardPayload =
          await getAwardWorkflowPayload(order)

        return res.json({
          ...awardPayload,
          message:
            'Supplier rejection recorded. Logistics has been notified to select an alternate shortlisted supplier.',
        })
      }

      // Supplier accepted.
      // NOW the selected supplier is confirmed and the other shortlisted
      // suppliers may be treated as unsuccessful.

      if (selectedSelection) {
        const acceptedSelectionPatch = {
          selected: true,
          selection_status: 'accepted',
        }

        if (
          Object.prototype.hasOwnProperty.call(
            selectedSelection,
            'updated_at'
          )
        ) {
          acceptedSelectionPatch.updated_at = now
        }

        const { error: acceptSelectionError } =
          await supabase
            .from('bid_selection')
            .update(acceptedSelectionPatch)
            .eq(
              'selection_id',
              selectedSelection.selection_id
            )

        if (acceptSelectionError) {
          throw new Error(
            acceptSelectionError.message
          )
        }
      }

      const unsuccessfulSelectionIds =
        otherShortlistedSelections
          .map((item) => item.selection_id)
          .filter(Boolean)

      if (
        unsuccessfulSelectionIds.length > 0
      ) {
        const { error: rejectOthersError } =
          await supabase
            .from('bid_selection')
            .update({
              selection_status: 'rejected',
              selected: false,
            })
            .in(
              'selection_id',
              unsuccessfulSelectionIds
            )

        if (rejectOthersError) {
          throw new Error(
            rejectOthersError.message
          )
        }
      }

      const { error: acceptBidError } =
        await supabase
          .from('bids')
          .update({
            bid_status: 'accepted',
            updated_at: now,
          })
          .eq('bid_id', selectedBidId)

      if (acceptBidError) {
        throw new Error(
          acceptBidError.message
        )
      }

      const unsuccessfulBidIds =
        otherShortlistedSelections
          .map((item) => Number(item.bid_id))
          .filter(
            (id) =>
              id > 0 && !Number.isNaN(id)
          )

      if (unsuccessfulBidIds.length > 0) {
        const { error: rejectOtherBidsError } =
          await supabase
            .from('bids')
            .update({
              bid_status: 'rejected',
              updated_at: now,
            })
            .in(
              'bid_id',
              unsuccessfulBidIds
            )

        if (rejectOtherBidsError) {
          throw new Error(
            rejectOtherBidsError.message
          )
        }
      }

      const { error: updateOrderError } =
        await supabase
          .from('orders')
          .update({
            current_status: 'bid_accepted',
            updated_at: now,
          })
          .eq('order_id', order.order_id)

      if (updateOrderError) {
        throw new Error(
          updateOrderError.message
        )
      }

      const existingOutcomeNotifications =
        await getOutcomeNotificationRows(
          order.order_id
        )

      const existingBidIds = new Set(
        existingOutcomeNotifications.map(
          (item) => Number(item.bid_id)
        )
      )

      const notificationsToInsert =
        otherShortlistedSelections
          .filter(
            (item) =>
              !existingBidIds.has(
                Number(item.bid_id)
              )
          )
          .map((item) => ({
            order_id: order.order_id,
            bid_id: Number(item.bid_id),
            supplier_id:
              item.supplier_id || null,
            notification_status: 'pending',
            sent_at: null,
            updated_at: now,
          }))

      if (
        notificationsToInsert.length > 0
      ) {
        const {
          error: insertOutcomeNotificationsError,
        } = await supabase
          .from('bid_outcome_notifications')
          .insert(notificationsToInsert)

        if (insertOutcomeNotificationsError) {
          throw new Error(
            insertOutcomeNotificationsError.message
          )
        }
      }

      const refreshedOrder =
        await getOrderById(order.order_id)

      awardPayload =
        await getAwardWorkflowPayload(
          refreshedOrder || {
            ...order,
            current_status: 'bid_accepted',
          }
        )

      return res.json({
        ...awardPayload,
        message:
          notificationsToInsert.length > 0 ||
          otherShortlistedSelections.length > 0
            ? 'Supplier acceptance recorded. Unsuccessful supplier notifications are now pending.'
            : 'Supplier acceptance recorded. Award completed because there are no other shortlisted suppliers to notify.',
      })
    } catch (error) {
      console.error(
        'RECORD SUPPLIER RESPONSE ERROR:',
        error.message
      )

      return res.status(500).json({
        success: false,
        error: error.message,
      })
    }
  }
)

router.post(
  '/bids/:orderId/outcome-notice-sent',
  async (req, res) => {
    try {
      const order = await getOrderById(
        req.params.orderId
      )

      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Order not found',
        })
      }

      let awardPayload =
        await getAwardWorkflowPayload(order)

      const workflowState = normalizeDbStatus(
        awardPayload?.award_state
          ?.award_workflow_state
      )

      if (
        ![
          'unsuccessful_supplier_notifications_pending',
          'award_completed',
        ].includes(workflowState)
      ) {
        return res.status(409).json({
          success: false,
          error:
            'Unsuccessful supplier notifications can be marked sent only after the selected supplier has accepted.',
          award_state: awardPayload?.award_state || null,
        })
      }

      const notificationId = Number(
        req.body?.notification_id || 0
      )

      const bidId = Number(
        req.body?.bid_id || 0
      )

      if (
        (!notificationId ||
          Number.isNaN(notificationId)) &&
        (!bidId || Number.isNaN(bidId))
      ) {
        return res.status(400).json({
          success: false,
          error:
            'notification_id or bid_id is required',
        })
      }

      let query = supabase
        .from('bid_outcome_notifications')
        .select('*')
        .eq('order_id', order.order_id)

      if (
        notificationId &&
        !Number.isNaN(notificationId)
      ) {
        query = query.eq(
          'outcome_notification_id',
          notificationId
        )
      } else {
        query = query.eq('bid_id', bidId)
      }

      const {
        data: notification,
        error: notificationError,
      } = await query.maybeSingle()

      if (notificationError) {
        throw new Error(
          notificationError.message
        )
      }

      if (!notification) {
        return res.status(404).json({
          success: false,
          error:
            'The unsuccessful supplier notification was not found.',
        })
      }

      if (
        normalizeDbStatus(
          notification.notification_status
        ) !== 'sent'
      ) {
        const now = new Date().toISOString()

        const { error: markSentError } =
          await supabase
            .from('bid_outcome_notifications')
            .update({
              notification_status: 'sent',
              sent_at:
                notification.sent_at || now,
              updated_at: now,
            })
            .eq(
              'outcome_notification_id',
              notification.outcome_notification_id ||
                notification.notification_id
            )

        if (markSentError) {
          throw new Error(
            markSentError.message
          )
        }
      }

      const refreshedOrder =
        await getOrderById(order.order_id)

      awardPayload =
        await getAwardWorkflowPayload(
          refreshedOrder || order
        )

      return res.json({
        ...awardPayload,
        message:
          normalizeDbStatus(
            awardPayload?.award_state
              ?.award_workflow_state
          ) === 'award_completed'
            ? 'Supplier result marked as sent. Award workflow is complete.'
            : 'Supplier result notification marked as sent.',
      })
    } catch (error) {
      console.error(
        'MARK OUTCOME NOTICE SENT ERROR:',
        error.message
      )

      return res.status(500).json({
        success: false,
        error: error.message,
      })
    }
  }
)


router.post('/bids/:orderId/shortlist-draft', async (req, res) => {
  try {
    const orderId = Number(req.params.orderId)

    if (!orderId || Number.isNaN(orderId)) {
      return res.status(400).json({
        success: false,
        error: 'A valid order ID is required',
      })
    }

    const order = await getOrderById(orderId)

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      })
    }

    if (
      req.body?.order_reference &&
      String(req.body.order_reference).trim().toLowerCase() !==
        String(order.order_reference || '').trim().toLowerCase()
    ) {
      return res.status(409).json({
        success: false,
        error: 'Order reference does not match the requested order ID.',
      })
    }

    if (
      normalizeDbStatus(order.current_status) !==
      'open_for_bids'
    ) {
      return res.status(400).json({
        success: false,
        error:
          'A shortlist draft can be edited only while the order is in Open for Bids stage.',
      })
    }

    const { bid_ids } = req.body

    if (!Array.isArray(bid_ids)) {
      return res.status(400).json({
        success: false,
        error: 'bid_ids must be an array',
      })
    }

    const convertedBidIds = bid_ids.map((id) => Number(id))

    if (
      convertedBidIds.some(
        (id) => !id || Number.isNaN(id)
      )
    ) {
      return res.status(400).json({
        success: false,
        error: 'One or more Bid IDs are invalid',
      })
    }

    const uniqueBidIds = [
      ...new Set(convertedBidIds),
    ]

    if (
      uniqueBidIds.length !== convertedBidIds.length
    ) {
      return res.status(400).json({
        success: false,
        error: 'Duplicate Bid IDs are not allowed',
      })
    }

    if (uniqueBidIds.length > 5) {
      return res.status(400).json({
        success: false,
        error:
          'You can shortlist a maximum of 5 suppliers.',
      })
    }

    const sentShortlist =
      await getSentShortlist(order.order_id)

    if (sentShortlist.length > 0) {
      return res.status(409).json({
        success: false,
        error:
          'The shortlist has already been sent to Logistics and is locked.',
      })
    }

    const { data: bidding, error: biddingError } =
      await supabase
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
        error:
          'No bidding session exists for this order.',
      })
    }

    const biddingStillOpen =
      normalizeDbStatus(bidding.status) === 'open' &&
      (
        !bidding.end_time ||
        new Date(bidding.end_time).getTime() >
          Date.now()
      )

    if (biddingStillOpen) {
      return res.status(409).json({
        success: false,
        error:
          'Bidding is still open. Close bidding before shortlisting suppliers.',
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
    const maximumAllowed = Math.min(
      5,
      totalAvailableBids
    )

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

    const requestedBidIdSet = new Set(
      uniqueBidIds
    )

    const selectedBids = allOrderBids.filter(
      (bid) =>
        requestedBidIdSet.has(
          Number(bid.bid_id)
        )
    )

    if (
      selectedBids.length !== uniqueBidIds.length
    ) {
      return res.status(400).json({
        success: false,
        error:
          'One or more selected bids do not belong to this order.',
      })
    }

    const { data: existingDraftRows, error: existingDraftError } =
      await supabase
        .from('bid_selection')
        .select(
          'selection_id, bid_id, selection_status, sent_to_logistics, selected'
        )
        .eq('order_id', order.order_id)
        .eq('sent_to_logistics', false)
        .eq('selected', false)
        .eq('selection_status', 'shortlisted')

    if (existingDraftError) {
      return res.status(500).json({
        success: false,
        error: existingDraftError.message,
      })
    }

    const previousDraftBidIds = (
      existingDraftRows || []
    )
      .map((item) => Number(item.bid_id))
      .filter(
        (id) => id > 0 && !Number.isNaN(id)
      )

    const { error: deleteDraftError } =
      await supabase
        .from('bid_selection')
        .delete()
        .eq('order_id', order.order_id)
        .eq('sent_to_logistics', false)
        .eq('selected', false)
        .eq('selection_status', 'shortlisted')

    if (deleteDraftError) {
      return res.status(500).json({
        success: false,
        error: deleteDraftError.message,
      })
    }

    const now = new Date().toISOString()

    if (previousDraftBidIds.length > 0) {
      const { error: resetPreviousBidError } =
        await supabase
          .from('bids')
          .update({
            bid_status: 'under_review',
            updated_at: now,
          })
          .in('bid_id', previousDraftBidIds)

      if (resetPreviousBidError) {
        return res.status(500).json({
          success: false,
          error: resetPreviousBidError.message,
        })
      }
    }

    let insertedSelections = []

    if (selectedBids.length > 0) {
      const selectionRows = selectedBids.map(
        (bid) => ({
          bid_id: bid.bid_id,
          bidding_id:
            bid.bidding_id ||
            bidding.bidding_id,
          order_id: order.order_id,
          supplier_id: bid.supplier_id,
          selection_status: 'shortlisted',
          sent_to_logistics: false,
          selected: false,
          selected_by: null,
          reason: null,
          selected_at: now,
        })
      )

      const {
        data: createdSelections,
        error: insertDraftError,
      } = await supabase
        .from('bid_selection')
        .insert(selectionRows)
        .select()

      if (insertDraftError) {
        return res.status(500).json({
          success: false,
          error: insertDraftError.message,
        })
      }

      insertedSelections =
        createdSelections || []

      const { error: updateDraftBidError } =
        await supabase
          .from('bids')
          .update({
            bid_status: 'shortlisted',
            updated_at: now,
          })
          .eq('order_id', order.order_id)
          .in('bid_id', uniqueBidIds)

      if (updateDraftBidError) {
        return res.status(500).json({
          success: false,
          error: updateDraftBidError.message,
        })
      }
    }

    let awardPayload = null

    try {
      awardPayload =
        await getAwardWorkflowPayload(order)
    } catch (awardStateError) {
      console.error(
        'SHORTLIST DRAFT AWARD STATE ERROR:',
        awardStateError.message
      )
    }

    return res.json({
      success: true,
      message:
        uniqueBidIds.length > 0
          ? `${uniqueBidIds.length} supplier${
              uniqueBidIds.length === 1 ? '' : 's'
            } saved in the shortlist draft.`
          : 'Shortlist draft cleared.',
      order_id: order.order_id,
      order_reference: order.order_reference,
      bid_ids: uniqueBidIds,
      count: uniqueBidIds.length,
      sent_to_logistics: false,
      locked: false,
      maximum_shortlist_count: maximumAllowed,
      total_available_bids: totalAvailableBids,
      selections: insertedSelections,
      award_state:
        awardPayload?.award_state || null,
    })
  } catch (error) {
    console.error(
      'SAVE SHORTLIST DRAFT ERROR:',
      error.message
    )

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

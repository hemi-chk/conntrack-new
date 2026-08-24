import { publish } from '@conntrack/messaging'
import express from 'express'
import { supabase } from '../config/supabase.js'

const router = express.Router()

// Sri Lanka location coordinate map used to prevent foreign map routes
const sriLankaLocationCoordinates = {
  'Colombo Port': { latitude: 6.9459, longitude: 79.8428 },
  'Colombo City': { latitude: 6.9271, longitude: 79.8612 },
  'Orugodawatta Yard': { latitude: 6.9474, longitude: 79.8798 },
  'Ratmalana Industrial Area': { latitude: 6.8213, longitude: 79.8862 },
  'Pettah Warehouse': { latitude: 6.9355, longitude: 79.8500 },
  'Dematagoda Yard': { latitude: 6.9404, longitude: 79.8783 },

  'Katunayake Airport': { latitude: 7.1808, longitude: 79.8841 },
  'Katunayake Export Zone': { latitude: 7.1674, longitude: 79.8761 },
  'Biyagama BOI Zone': { latitude: 7.0840, longitude: 80.0160 },
  'Ekala BOI Zone': { latitude: 7.1050, longitude: 79.9190 },
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

  'Galle City': { latitude: 6.0535, longitude: 80.2210 },
  'Galle Port': { latitude: 6.0329, longitude: 80.2168 },
  'Koggala BOI Zone': { latitude: 5.9941, longitude: 80.3270 },
  Hikkaduwa: { latitude: 6.1407, longitude: 80.1012 },

  'Matara City': { latitude: 5.9549, longitude: 80.5550 },
  Weligama: { latitude: 5.9730, longitude: 80.4297 },
  Akuressa: { latitude: 6.0967, longitude: 80.4808 },
  Dikwella: { latitude: 5.9667, longitude: 80.6833 },

  'Hambantota Port': { latitude: 6.1241, longitude: 81.1185 },
  'Mattala Airport': { latitude: 6.2845, longitude: 81.1241 },
  Tangalle: { latitude: 6.0240, longitude: 80.7911 },
  Sooriyawewa: { latitude: 6.3084, longitude: 81.0107 },

  'Trincomalee Port': { latitude: 8.5711, longitude: 81.2335 },
  'China Bay': { latitude: 8.5385, longitude: 81.1814 },
  Kinniya: { latitude: 8.4977, longitude: 81.1794 },
  Kantale: { latitude: 8.3653, longitude: 80.9669 },

  'Jaffna Town': { latitude: 9.6615, longitude: 80.0255 },
  'Kankesanthurai Port': { latitude: 9.8167, longitude: 80.0500 },
  Chavakachcheri: { latitude: 9.6535, longitude: 80.1597 },
  'Point Pedro': { latitude: 9.8167, longitude: 80.2333 },

  'Anuradhapura Town': { latitude: 8.3114, longitude: 80.4037 },
  Medawachchiya: { latitude: 8.5396, longitude: 80.4894 },
  Kekirawa: { latitude: 8.0375, longitude: 80.5980 },
  Mihintale: { latitude: 8.35, longitude: 80.5167 },

  'Batticaloa Town': { latitude: 7.7102, longitude: 81.6924 },
  Eravur: { latitude: 7.7782, longitude: 81.6038 },
  Kattankudy: { latitude: 7.675, longitude: 81.73 },
  Valaichchenai: { latitude: 7.9333, longitude: 81.5167 },
}

// Checks whether a latitude/longitude pair is inside Sri Lanka area
const isInsideSriLanka = (latitude, longitude) => {
  const lat = Number(latitude)
  const lng = Number(longitude)

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return false
  }

  return lat >= 5.5 && lat <= 10.2 && lng >= 79.0 && lng <= 82.2
}

// Finds coordinates by local location name
const getSriLankaCoordinates = (location) => {
  return (
    sriLankaLocationCoordinates[location] || {
      latitude: 6.9271,
      longitude: 79.8612,
    }
  )
}

// Fixes old/foreign coordinates before sending tracking data to frontend.
// orders.pickup_location and orders.destination_location are the real place fields.
const normalizeTrackingRowsToSriLanka = (rows = []) => {
  return rows.map((row, index) => {
    const pickupLocation = row.orders?.pickup_location || 'Colombo Port'
    const destinationLocation =
      row.orders?.destination_location || 'Katunayake Airport'

    const isLastRow = index === rows.length - 1

    const fallbackLocation = isLastRow
      ? destinationLocation
      : pickupLocation

    const currentLocation =
      sriLankaLocationCoordinates[row.current_location]
        ? row.current_location
        : fallbackLocation

    const selectedCoords =
      getSriLankaCoordinates(currentLocation)

    const shouldReplaceCoordinates =
      !isInsideSriLanka(
        row.latitude,
        row.longitude
      )

    return {
      ...row,

      current_location:
        currentLocation,

      latitude:
        shouldReplaceCoordinates
          ? selectedCoords.latitude
          : row.latitude,

      longitude:
        shouldReplaceCoordinates
          ? selectedCoords.longitude
          : row.longitude,
    }
  })
}

// GET NEXT ORDER REFERENCE
router.get('/orders/next-id', async (req, res) => {
  try {
    const { type } = req.query

    if (!type) {
      return res.status(400).json({
        error: 'Order type is required',
      })
    }

    const orderType =
      type.toLowerCase()

    if (
      orderType !== 'import' &&
      orderType !== 'export'
    ) {
      return res.status(400).json({
        error: 'Invalid order type',
      })
    }

    const prefix =
      orderType === 'import'
        ? 'IMP'
        : 'EXP'

    const { data, error } =
      await supabase
        .from('orders')
        .select('order_reference')
        .eq(
          'order_type',
          orderType
        )
        .like(
          'order_reference',
          `${prefix}-%`
        )
        .order(
          'created_at',
          {
            ascending: false,
          }
        )
        .limit(1)

    if (error) {
      return res.status(500).json({
        error: error.message,
      })
    }

    let nextNumber = 1

    if (
      data &&
      data.length > 0 &&
      data[0].order_reference
    ) {
      const lastOrderReference =
        data[0].order_reference

      const lastNumber =
        parseInt(
          lastOrderReference.split(
            '-'
          )[1],
          10
        )

      if (
        !Number.isNaN(
          lastNumber
        )
      ) {
        nextNumber =
          lastNumber + 1
      }
    }

    const nextOrderId =
      `${prefix}-${String(
        nextNumber
      ).padStart(5, '0')}`

    res.json({
      orderId:
        nextOrderId,
    })
  } catch (error) {
    res.status(500).json({
      error: error.message,
    })
  }
})

// GET ORDERS - REAL ORDERS TABLE DATA + LATEST SUPPLIER / DRIVER ASSIGNMENT

// ARCHIVE COMPLETED ORDER - OPERATIONS
// Persists archive status in the database so it remains archived
// across refreshes, browsers, devices and hosted deployments.
router.patch('/orders/:orderId/archive', async (req, res) => {
  try {
    const orderId = Number(req.params.orderId)

    if (!orderId || Number.isNaN(orderId)) {
      return res.status(400).json({
        error: 'A valid order ID is required',
      })
    }

    const {
      data: order,
      error: orderError,
    } =
      await supabase
        .from('orders')
        .select(`
          order_id,
          order_reference,
          current_status
        `)
        .eq(
          'order_id',
          orderId
        )
        .single()

    if (orderError || !order) {
      return res.status(404).json({
        error: 'Order not found',
      })
    }

    const currentStatus =
      String(
        order.current_status ||
        ''
      ).toLowerCase()

    // Idempotent response if the order is already archived.
    if (currentStatus === 'archived') {
      return res.status(200).json({
        success: true,
        message:
          `Order ${order.order_reference} is already archived`,
        order,
      })
    }

    // Operations can archive only after the official process is completed.
    if (currentStatus !== 'completed') {
      return res.status(400).json({
        error:
          'Only completed orders can be archived by Operations.',
      })
    }

    const {
      data: archivedOrder,
      error: archiveError,
    } =
      await supabase
        .from('orders')
        .update({
          current_status: 'archived',
          updated_at: new Date().toISOString(),
        })
        .eq(
          'order_id',
          orderId
        )
        .select()
        .single()

    if (archiveError) {
      return res.status(500).json({
        error: archiveError.message,
      })
    }

    res.status(200).json({
      success: true,
      message:
        `Order ${order.order_reference} archived successfully`,
      order: archivedOrder,
    })
  } catch (error) {
    console.log(
      'ARCHIVE OPERATIONS ORDER ERROR:',
      error.message
    )

    res.status(500).json({
      error: error.message,
    })
  }
})

router.get('/orders', async (req, res) => {
  try {
    // 1. Load the real orders first.
    const {
      data: orders,
      error: ordersError,
    } = await supabase
      .from('orders')
      .select('*')
      .order(
        'created_at',
        {
          ascending: false,
        }
      )

    if (ordersError) {
      return res.status(500).json({
        error: ordersError.message,
      })
    }

    const safeOrders =
      Array.isArray(orders)
        ? orders
        : []

    if (safeOrders.length === 0) {
      return res.json([])
    }

    const orderIds =
      safeOrders
        .map(
          (order) =>
            order.order_id
        )
        .filter(
          (orderId) =>
            orderId !== null &&
            orderId !== undefined
        )

    // 2. Load assignment rows separately.
    // Doing this separately is more reliable than depending on nested
    // Supabase relationship names and also lets us select the latest
    // assignment if an order has more than one historical assignment.
    const {
      data: assignments,
      error: assignmentsError,
    } = await supabase
      .from('order_assignments')
      .select(`
        assignment_id,
        order_id,
        supplier_id,
        driver_id,
        vehicle_id,
        assigned_at,
        status
      `)
      .in(
        'order_id',
        orderIds
      )
      .order(
        'assigned_at',
        {
          ascending: false,
        }
      )

    if (assignmentsError) {
      return res.status(500).json({
        error:
          assignmentsError.message,
      })
    }

    const safeAssignments =
      Array.isArray(assignments)
        ? assignments
        : []

    // 3. Build lists of the supplier and driver IDs used by the assignments.
    const supplierIds = [
      ...new Set(
        safeAssignments
          .map(
            (assignment) =>
              assignment.supplier_id
          )
          .filter(
            (supplierId) =>
              supplierId !== null &&
              supplierId !== undefined
          )
      ),
    ]

    const driverIds = [
      ...new Set(
        safeAssignments
          .map(
            (assignment) =>
              assignment.driver_id
          )
          .filter(
            (driverId) =>
              driverId !== null &&
              driverId !== undefined
          )
      ),
    ]

    // 4. Fetch the real supplier names.
    let suppliers = []

    if (supplierIds.length > 0) {
      const {
        data: supplierRows,
        error: suppliersError,
      } = await supabase
        .from('suppliers')
        .select(`
          supplier_id,
          company_name
        `)
        .in(
          'supplier_id',
          supplierIds
        )

      if (suppliersError) {
        return res.status(500).json({
          error:
            suppliersError.message,
        })
      }

      suppliers =
        Array.isArray(
          supplierRows
        )
          ? supplierRows
          : []
    }

    // 5. Fetch the real driver names.
    let drivers = []

    if (driverIds.length > 0) {
      const {
        data: driverRows,
        error: driversError,
      } = await supabase
        .from('drivers')
        .select(`
          driver_id,
          first_name,
          last_name
        `)
        .in(
          'driver_id',
          driverIds
        )

      if (driversError) {
        return res.status(500).json({
          error:
            driversError.message,
        })
      }

      drivers =
        Array.isArray(
          driverRows
        )
          ? driverRows
          : []
    }

    const supplierById =
      new Map(
        suppliers.map(
          (supplier) => [
            String(
              supplier.supplier_id
            ),
            supplier,
          ]
        )
      )

    const driverById =
      new Map(
        drivers.map(
          (driver) => [
            String(
              driver.driver_id
            ),
            driver,
          ]
        )
      )

    // Because assignments were sorted newest first, the first assignment
    // stored for an order is its latest/current assignment.
    const latestAssignmentByOrderId =
      new Map()

    safeAssignments.forEach(
      (assignment) => {
        const key =
          String(
            assignment.order_id
          )

        if (
          !latestAssignmentByOrderId.has(
            key
          )
        ) {
          latestAssignmentByOrderId.set(
            key,
            assignment
          )
        }
      }
    )

    // 6. Enrich every order with flat fields that the existing
    // Operations Orders.jsx already understands:
    // supplier_name and driver_name.
    const enrichedOrders =
      safeOrders.map(
        (order) => {
          const assignment =
            latestAssignmentByOrderId.get(
              String(
                order.order_id
              )
            ) || null

          const supplier =
            assignment?.supplier_id !==
              null &&
            assignment?.supplier_id !==
              undefined
              ? supplierById.get(
                  String(
                    assignment.supplier_id
                  )
                )
              : null

          const driver =
            assignment?.driver_id !==
              null &&
            assignment?.driver_id !==
              undefined
              ? driverById.get(
                  String(
                    assignment.driver_id
                  )
                )
              : null

          const driverName =
            [
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
              assignment?.assignment_id ||
              null,

            assignment_status:
              assignment?.status ||
              null,

            assigned_supplier_id:
              assignment?.supplier_id ||
              null,

            assigned_driver_id:
              assignment?.driver_id ||
              null,

            assigned_vehicle_id:
              assignment?.vehicle_id ||
              null,

            assigned_at:
              assignment?.assigned_at ||
              null,
          }
        }
      )

    res.json(
      enrichedOrders
    )
  } catch (error) {
    res.status(500).json({
      error: error.message,
    })
  }
})

// GET ORDER PROGRESS STAGES
router.get('/order-progress-stages', async (req, res) => {
  try {
    const {
      order_type,
    } = req.query

    let query =
      supabase
        .from(
          'order_progress_stages'
        )
        .select('*')
        .eq(
          'is_active',
          true
        )
        .order(
          'sequence_order',
          {
            ascending: true,
          }
        )

    if (order_type) {
      query = query.in('order_type', [order_type, 'all'])
    }

    const { data, error } =
      await query

    if (error) {
      return res.status(500).json({
        error: error.message,
      })
    }

    res.json(
      data || []
    )
  } catch (error) {
    res.status(500).json({
      error: error.message,
    })
  }
})

// DEBUG: CONFIRM BACKEND IS USING THE SAME SUPABASE PROJECT
router.get('/debug-supabase-project', async (req, res) => {
  try {
    const supabaseUrl =
      process.env.SUPABASE_URL ||
      process.env.VITE_SUPABASE_URL ||
      'SUPABASE_URL_NOT_FOUND'

    const { data, error } =
      await supabase
        .from('orders')
        .select(
          'order_id, order_reference'
        )
        .order(
          'order_id',
          {
            ascending: true,
          }
        )
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

      ordersCount:
        data?.length || 0,

      orders:
        data || [],
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
    const { data, error } =
      await supabase
        .from(
          'container_tracking'
        )
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
        .order(
          'tracking_id',
          {
            ascending: true,
          }
        )

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
      })
    }

    const normalizedData =
      normalizeTrackingRowsToSriLanka(
        data || []
      )

    res.json({
      success: true,

      count:
        normalizedData.length,

      data:
        normalizedData,
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
    const {
      order_id,
    } = req.query

    if (!order_id) {
      return res.status(400).json({
        success: false,
        error: 'order_id is required',
      })
    }

    const {
      data: allRows,
      error:
        allRowsError,
    } =
      await supabase
        .from(
          'container_tracking'
        )
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
            pickup_district,
            pickup_location,
            destination_district,
            destination_location,
            container_no,
            current_status
          ),
          drivers (
            driver_id,
            first_name,
            last_name
          )
        `)
        .order(
          'tracking_id',
          {
            ascending: true,
          }
        )

    if (
      allRowsError
    ) {
      return res.status(500).json({
        success: false,
        error:
          allRowsError.message,
      })
    }

    const filteredRows =
      (allRows || []).filter(
        (row) =>
          String(
            row.order_id
          ) ===
          String(
            order_id
          )
      )

    const normalizedFilteredRows =
      normalizeTrackingRowsToSriLanka(
        filteredRows
      )

    const normalizedAllRows =
      normalizeTrackingRowsToSriLanka(
        allRows || []
      )

    res.json({
      success: true,

      requested_order_id:
        order_id,

      total_container_tracking_rows:
        allRows?.length ||
        0,

      filtered_count:
        normalizedFilteredRows.length,

      filtered_data:
        normalizedFilteredRows,

      all_data:
        normalizedAllRows,
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
    const {
      order_id,
      order_reference,
    } = req.query

    console.log(
      'TRACKING ROUTE HIT:',
      req.query
    )

    let finalOrderId =
      order_id

    if (
      !finalOrderId &&
      order_reference
    ) {
      const {
        data: order,
        error:
          orderError,
      } =
        await supabase
          .from('orders')
          .select(
            'order_id'
          )
          .eq(
            'order_reference',
            order_reference
          )
          .single()

      if (
        orderError ||
        !order
      ) {
        console.log(
          'ORDER REFERENCE NOT FOUND:',
          order_reference
        )

        return res.json([])
      }

      finalOrderId =
        order.order_id
    }

    let query =
      supabase
        .from(
          'container_tracking'
        )
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
        .order(
          'recorded_at',
          {
            ascending: true,
          }
        )

    if (
      finalOrderId
    ) {
      query =
        query.eq(
          'order_id',
          Number(
            finalOrderId
          )
        )
    }

    const {
      data,
      error,
    } =
      await query

    if (error) {
      console.log(
        'TRACKING QUERY ERROR:',
        error.message
      )

      return res.status(500).json({
        error:
          error.message,
      })
    }

    const normalizedData =
      normalizeTrackingRowsToSriLanka(
        data || []
      )

    console.log(
      'TRACKING FILTERED COUNT:',
      normalizedData.length
    )

    res.json(
      normalizedData
    )
  } catch (error) {
    console.log(
      'TRACKING ROUTE ERROR:',
      error.message
    )

    res.status(500).json({
      error:
        error.message,
    })
  }
})

// CREATE ORDER - USES FINAL DISTRICT / LOCATION COLUMN NAMES
router.post('/orders', async (req, res) => {
  try {
    const {
      order_reference,
      order_type,
      cargo_type,
      cargo_weight,

      // Final field names used by the Operations Hub
      pickup_district: requestPickupDistrict,
      pickup_location: requestPickupLocation,
      destination_district: requestDestinationDistrict,
      destination_location: requestDestinationLocation,

      // Temporary backward compatibility for an older Create Order frontend.
      // Remove these four legacy aliases after CreateOrder.jsx is migrated.
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

    if (
      !order_reference ||
      !order_type ||
      !cargo_type ||
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
        error:
          'Missing required order fields',
      })
    }

    const {
      data,
      error,
    } =
      await supabase
        .from('orders')
        .insert([
          {
            order_reference,

            order_date:
              new Date()
                .toISOString()
                .split(
                  'T'
                )[0],

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

            special_instructions,

            commercial_invoice_url,

            packing_list_url,

            current_status:
              'created',
          },
        ])
        .select()
        .single()

    if (error) {
      return res.status(500).json({
        error:
          error.message,
      })
    }

    res.status(201).json({
      message:
        'Order created successfully',

      order:
        data,
    })
  } catch (error) {
    res.status(500).json({
      error:
        error.message,
    })
  }
})

// GET ISSUES - REAL DATA
router.get('/issues', async (req, res) => {
  try {
    const {
      data,
      error,
    } =
      await supabase
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
            supplier_name,
            driver_name,
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
        .order(
          'created_at',
          {
            ascending: false,
          }
        )

    if (error) {
      return res.status(500).json({
        error:
          error.message,
      })
    }

    res.json(
      data || []
    )
  } catch (error) {
    res.status(500).json({
      error:
        error.message,
    })
  }
})


// CREATE ISSUE - OPERATIONS SENDS ISSUE TO ADMIN
// Saves the report in the real issues table so Orders, Issues and Admin
// all read the same persistent record.
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

    const cleanOrderId =
      Number(
        order_id
      )

    if (
      !order_id ||
      Number.isNaN(
        cleanOrderId
      )
    ) {
      return res.status(400).json({
        error:
          'A valid order_id is required',
      })
    }

    if (
      !issue_type ||
      !String(
        issue_type
      ).trim()
    ) {
      return res.status(400).json({
        error:
          'Issue type is required',
      })
    }

    if (
      !description ||
      !String(
        description
      ).trim()
    ) {
      return res.status(400).json({
        error:
          'Issue description is required',
      })
    }

    const {
      data:
        order,
      error:
        orderError,
    } =
      await supabase
        .from('orders')
        .select(`
          order_id,
          order_reference,
          current_status,
          supplier_name,
          driver_name
        `)
        .eq(
          'order_id',
          cleanOrderId
        )
        .single()

    if (
      orderError ||
      !order
    ) {
      return res.status(404).json({
        error:
          'Order not found',
      })
    }

    // Operations cannot report an issue before the operational flow starts.
    const blockedStatuses = [
      'created',
      'open_for_bids',
    ]

    if (
      blockedStatuses.includes(
        String(
          order.current_status ||
            ''
        ).toLowerCase()
      )
    ) {
      return res.status(400).json({
        error:
          'Issues can be reported only after bidding is completed and operations have started.',
      })
    }

    let cleanSupplierId =
      supplier_id
        ? Number(
            supplier_id
          )
        : null

    if (
      Number.isNaN(
        cleanSupplierId
      )
    ) {
      cleanSupplierId =
        null
    }

    let cleanDriverId =
      driver_id
        ? Number(
            driver_id
          )
        : null

    if (
      Number.isNaN(
        cleanDriverId
      )
    ) {
      cleanDriverId =
        null
    }

    // IMPORTANT:
    // For operational stages such as Driver Assigned / In Transit / At Freezone /
    // At Port / Completed, the authoritative supplier + driver relationship is
    // order_assignments. Read the latest assignment first instead of relying on
    // display names stored on the orders row.
    const {
      data:
        latestAssignment,
      error:
        assignmentLookupError,
    } =
      await supabase
        .from('order_assignments')
        .select(`
          assignment_id,
          supplier_id,
          driver_id,
          assigned_at,
          status
        `)
        .eq(
          'order_id',
          cleanOrderId
        )
        .order(
          'assigned_at',
          {
            ascending: false,
            nullsFirst: false,
          }
        )
        .order(
          'assignment_id',
          {
            ascending: false,
          }
        )
        .limit(1)
        .maybeSingle()

    if (
      assignmentLookupError
    ) {
      console.log(
        'ISSUE ASSIGNMENT LOOKUP:',
        assignmentLookupError.message
      )
    }

    if (
      !cleanSupplierId &&
      latestAssignment?.supplier_id
    ) {
      cleanSupplierId =
        Number(
          latestAssignment.supplier_id
        )
    }

    if (
      !cleanDriverId &&
      latestAssignment?.driver_id
    ) {
      cleanDriverId =
        Number(
          latestAssignment.driver_id
        )
    }

    // If an old/demo order has no usable order_assignment IDs, fall back to
    // resolving the supplier from the display name stored against the order.
    const finalSupplierName =
      String(
        supplier_name ||
          order.supplier_name ||
          ''
      ).trim()

    if (
      !cleanSupplierId &&
      finalSupplierName &&
      finalSupplierName !==
        'Not assigned' &&
      finalSupplierName !==
        '-'
    ) {
      const {
        data:
          supplier,
        error:
          supplierLookupError,
      } =
        await supabase
          .from('suppliers')
          .select(
            'supplier_id, company_name'
          )
          .eq(
            'company_name',
            finalSupplierName
          )
          .maybeSingle()

      if (
        supplierLookupError
      ) {
        console.log(
          'ISSUE SUPPLIER LOOKUP:',
          supplierLookupError.message
        )
      }

      if (
        supplier?.supplier_id
      ) {
        cleanSupplierId =
          Number(
            supplier.supplier_id
          )
      }
    }

    // Resolve driver ID by matching the stored full driver name.
    const finalDriverName =
      String(
        driver_name ||
          order.driver_name ||
          ''
      )
        .trim()
        .replace(
          /\s+/g,
          ' '
        )

    if (
      !cleanDriverId &&
      finalDriverName &&
      finalDriverName !==
        'Not assigned' &&
      finalDriverName !==
        '-'
    ) {
      const {
        data:
          drivers,
        error:
          driverLookupError,
      } =
        await supabase
          .from('drivers')
          .select(
            'driver_id, first_name, last_name'
          )

      if (
        driverLookupError
      ) {
        console.log(
          'ISSUE DRIVER LOOKUP:',
          driverLookupError.message
        )
      } else {
        const matchedDriver =
          (drivers || []).find(
            (
              driver
            ) => {
              const fullName =
                `${driver.first_name || ''} ${driver.last_name || ''}`
                  .trim()
                  .replace(
                    /\s+/g,
                    ' '
                  )

              return (
                fullName.toLowerCase() ===
                finalDriverName.toLowerCase()
              )
            }
          )

        if (
          matchedDriver?.driver_id
        ) {
          cleanDriverId =
            Number(
              matchedDriver.driver_id
            )
        }
      }
    }

    const cleanPriority =
      String(
        priority ||
          'medium'
      ).toLowerCase()

    const allowedPriorities = [
      'low',
      'medium',
      'high',
      'critical',
    ]

    const finalPriority =
      allowedPriorities.includes(
        cleanPriority
      )
        ? cleanPriority
        : 'medium'

    const {
      data:
        createdIssue,
      error:
        createIssueError,
    } =
      await supabase
        .from('issues')
        .insert([
          {
            order_id:
              cleanOrderId,

            supplier_id:
              cleanSupplierId,

            driver_id:
              cleanDriverId,

            // issues.reported_by is a UUID column.
            // Keep it null unless the request contains a real UUID.
            reported_by:
              /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
                String(reported_by || '')
              )
                ? reported_by
                : null,

            issue_type:
              String(
                issue_type
              ).trim(),

            priority:
              finalPriority,

            description:
              String(
                description
              ).trim(),

            status:
              'open',

            created_at:
              new Date().toISOString(),

            updated_at:
              new Date().toISOString(),
          },
        ])
        .select()
        .single()

    if (
      createIssueError
    ) {
      return res.status(500).json({
        error:
          createIssueError.message,
      })
    }

    res.status(201).json({
      success: true,

      message:
        `Issue for ${order.order_reference} sent to Admin successfully`,

      issue:
        createdIssue,
    })
  } catch (error) {
    console.log(
      'CREATE OPERATIONS ISSUE ERROR:',
      error.message
    )

    res.status(500).json({
      error:
        error.message,
    })
  }
})

// HELPER: CREATE SUPPLIER NOTIFICATIONS
const createSupplierBiddingNotifications =
  async (
    order,
    bidding
  ) => {
    const {
      data:
        suppliers,
      error:
        supplierError,
    } =
      await supabase
        .from(
          'suppliers'
        )
        .select(
          'supplier_id, company_name'
        )
        .eq(
          'status',
          'active'
        )

    if (
      supplierError
    ) {
      throw new Error(
        supplierError.message
      )
    }

    const notifications =
      (suppliers || []).map(
        (
          supplier
        ) => ({
          supplier_id:
            supplier.supplier_id,

          order_id:
            order.order_id,

          bidding_id:
            bidding.bidding_id,

          message:
            `New ${order.order_type} order ${order.order_reference} is open for bidding. Please submit bid amount and ETA.`,

          type:
            'bidding',

          is_read:
            false,

          created_at:
            new Date().toISOString(),
        })
      )

    if (
      notifications.length >
      0
    ) {
      const {
        error:
          notificationError,
      } =
        await supabase
          .from(
            'notifications'
          )
          .insert(
            notifications
          )

      if (
        notificationError
      ) {
        throw new Error(
          notificationError.message
        )
      }
    }

    return (
      suppliers?.length ||
      0
    )
  }

// ATTACH SUPPLIER EMAIL AND CONTACT NUMBER TO BIDS
const attachSupplierContactDetails =
  async (
    bids = []
  ) => {
    if (
      !bids ||
      bids.length ===
        0
    ) {
      return []
    }

    const supplierIds = [
      ...new Set(
        bids
          .map(
            (bid) =>
              bid.supplier_id
          )
          .filter(
            (
              supplierId
            ) =>
              supplierId !==
                null &&
              supplierId !==
                undefined
          )
      ),
    ]

    if (
      supplierIds.length ===
      0
    ) {
      return bids
    }

    const {
      data:
        suppliers,
      error:
        supplierError,
    } =
      await supabase
        .from(
          'suppliers'
        )
        .select(`
          supplier_id,
          company_name,
          email,
          contact_number
        `)
        .in(
          'supplier_id',
          supplierIds
        )

    if (
      supplierError
    ) {
      throw new Error(
        supplierError.message
      )
    }

    const supplierMap =
      new Map()

    ;(
      suppliers || []
    ).forEach(
      (
        supplier
      ) => {
        supplierMap.set(
          Number(
            supplier.supplier_id
          ),
          supplier
        )
      }
    )

    return bids.map(
      (bid) => {
        const supplier =
          supplierMap.get(
            Number(
              bid.supplier_id
            )
          )

        const supplierEmail =
          bid.supplier_email ||
          supplier?.email ||
          ''

        const supplierPhone =
          bid.supplier_phone ||
          supplier?.contact_number ||
          ''

        return {
          ...bid,

          supplier_email:
            supplierEmail,

          supplier_phone:
            supplierPhone,

          suppliers: {
            ...(bid.suppliers ||
              {}),

            supplier_id:
              supplier?.supplier_id ||
              bid.supplier_id,

            company_name:
              supplier?.company_name ||
              bid.supplier_name ||
              bid.company_name ||
              bid.suppliers?.company_name ||
              '',

            email:
              supplierEmail,

            contact_number:
              supplierPhone,

            phone:
              supplierPhone,
          },
        }
      }
    )
  }

// OPEN BIDDING FOR AN ORDER
router.post('/bidding/open', async (req, res) => {
  try {
    const {
      order_reference,
      duration_seconds,
    } = req.body

    if (
      !order_reference
    ) {
      return res.status(400).json({
        error:
          'Order reference is required',
      })
    }

    if (
      !duration_seconds ||
      Number(
        duration_seconds
      ) <= 0
    ) {
      return res.status(400).json({
        error:
          'Valid duration is required',
      })
    }

    const {
      data:
        order,
      error:
        orderError,
    } =
      await supabase
        .from('orders')
        .select('*')
        .eq(
          'order_reference',
          order_reference
        )
        .single()

    if (
      orderError ||
      !order
    ) {
      return res.status(404).json({
        error:
          'Order not found',
      })
    }

    const endTime =
      new Date(
        Date.now() +
          Number(
            duration_seconds
          ) *
            1000
      )

    const {
      data:
        existingBidding,
      error:
        existingBiddingError,
    } =
      await supabase
        .from('bidding')
        .select('*')
        .eq(
          'order_id',
          order.order_id
        )
        .maybeSingle()

    if (
      existingBiddingError
    ) {
      return res.status(500).json({
        error:
          existingBiddingError.message,
      })
    }

    let bidding =
      null

    let biddingAction =
      ''

    if (
      existingBidding
    ) {
      const {
        data:
          updatedBidding,
        error:
          updateBiddingError,
      } =
        await supabase
          .from('bidding')
          .update({
            status:
              'open',

            start_time:
              new Date().toISOString(),

            end_time:
              endTime.toISOString(),

            updated_at:
              new Date().toISOString(),
          })
          .eq(
            'bidding_id',
            existingBidding.bidding_id
          )
          .select()
          .single()

      if (
        updateBiddingError
      ) {
        return res.status(500).json({
          error:
            updateBiddingError.message,
        })
      }

      bidding =
        updatedBidding

      biddingAction =
        'reopened'
    } else {
      const {
        data:
          newBidding,
        error:
          createBiddingError,
      } =
        await supabase
          .from('bidding')
          .insert([
            {
              order_id:
                order.order_id,

              status:
                'open',

              start_time:
                new Date().toISOString(),

              end_time:
                endTime.toISOString(),
            },
          ])
          .select()
          .single()

      if (
        createBiddingError
      ) {
        return res.status(500).json({
          error:
            createBiddingError.message,
        })
      }

      bidding =
        newBidding

      biddingAction =
        'created'
    }

    const {
      error:
        updateOrderError,
    } =
      await supabase
        .from('orders')
        .update({
          current_status:
            'open_for_bids',

          updated_at:
            new Date().toISOString(),
        })
        .eq(
          'order_id',
          order.order_id
        )

    if (
      updateOrderError
    ) {
      return res.status(500).json({
        error:
          updateOrderError.message,
      })
    }

    const {
      error:
        deleteNotificationError,
    } =
      await supabase
        .from(
          'notifications'
        )
        .delete()
        .eq(
          'order_id',
          order.order_id
        )
        .eq(
          'bidding_id',
          bidding.bidding_id
        )
        .eq(
          'type',
          'bidding'
        )

    if (
      deleteNotificationError
    ) {
      return res.status(500).json({
        error:
          deleteNotificationError.message,
      })
    }

    const notifiedCount =
      await createSupplierBiddingNotifications(
        order,
        bidding
      )

    await publish('order.bidding.opened', {
      order_id: order.order_id,
      order_reference: order.order_reference,
      order_type: order.order_type,
      bidding_id: bidding.bidding_id,
      end_time: bidding.end_time,
    })

    res.status(201).json({
      message:
        biddingAction ===
        'created'
          ? 'Bidding opened and suppliers notified successfully'
          : 'Bidding reopened and suppliers notified successfully',

      action:
        biddingAction,

      order,

      bidding,

      notified_suppliers:
        notifiedCount,
    })
  } catch (error) {
    res.status(500).json({
      error:
        error.message,
    })
  }
})

// ============================================================
// NEW: GET CURRENT BIDDING STATUS + TIMER
// Used by Bidding.jsx when user opens "View Bidding"
// ============================================================
router.get('/bidding/status', async (req, res) => {
  try {
    const {
      order_reference,
      order_id,
    } = req.query

    if (
      !order_reference &&
      !order_id
    ) {
      return res.status(400).json({
        error:
          'order_reference or order_id is required',
      })
    }

    let order =
      null

    // Find order using reference
    if (
      order_reference
    ) {
      const {
        data,
        error,
      } =
        await supabase
          .from('orders')
          .select(
            'order_id, order_reference, current_status'
          )
          .eq(
            'order_reference',
            order_reference
          )
          .single()

      if (
        error ||
        !data
      ) {
        return res.status(404).json({
          error:
            'Order not found',
        })
      }

      order =
        data
    } else {
      const numericOrderId =
        Number(
          order_id
        )

      if (
        Number.isNaN(
          numericOrderId
        )
      ) {
        return res.status(400).json({
          error:
            'Invalid order_id',
        })
      }

      const {
        data,
        error,
      } =
        await supabase
          .from('orders')
          .select(
            'order_id, order_reference, current_status'
          )
          .eq(
            'order_id',
            numericOrderId
          )
          .single()

      if (
        error ||
        !data
      ) {
        return res.status(404).json({
          error:
            'Order not found',
        })
      }

      order =
        data
    }

    // Find bidding record belonging to this order
    const {
      data:
        bidding,
      error:
        biddingError,
    } =
      await supabase
        .from('bidding')
        .select('*')
        .eq(
          'order_id',
          order.order_id
        )
        .maybeSingle()

    if (
      biddingError
    ) {
      return res.status(500).json({
        error:
          biddingError.message,
      })
    }

    // No bidding record created yet
    if (!bidding) {
      return res.json({
        order,

        bidding:
          null,

        remaining_seconds:
          0,

        is_open:
          false,
      })
    }

    let finalBidding =
      bidding

    let remainingSeconds =
      0

    const now =
      Date.now()

    const endTime =
      bidding.end_time
        ? new Date(
            bidding.end_time
          ).getTime()
        : null

    if (
      endTime &&
      !Number.isNaN(
        endTime
      )
    ) {
      remainingSeconds =
        Math.max(
          0,
          Math.floor(
            (
              endTime -
              now
            ) /
              1000
          )
        )
    }

    const currentlyOpen =
      String(
        bidding.status ||
          ''
      ).toLowerCase() ===
        'open'

    // If stored status says open but timer already expired,
    // automatically close the bidding record.
    if (
      currentlyOpen &&
      remainingSeconds <=
        0
    ) {
      const {
        data:
          closedBidding,
        error:
          closeExpiredError,
      } =
        await supabase
          .from('bidding')
          .update({
            status:
              'closed',

            updated_at:
              new Date().toISOString(),
          })
          .eq(
            'bidding_id',
            bidding.bidding_id
          )
          .select()
          .single()

      if (
        closeExpiredError
      ) {
        return res.status(500).json({
          error:
            closeExpiredError.message,
        })
      }

      finalBidding =
        closedBidding

      remainingSeconds =
        0
    }

    const isOpen =
      String(
        finalBidding.status ||
          ''
      ).toLowerCase() ===
        'open' &&
      remainingSeconds >
        0

    console.log(
      'BIDDING STATUS:',
      {
        order_reference:
          order.order_reference,

        order_id:
          order.order_id,

        bidding_id:
          finalBidding.bidding_id,

        status:
          finalBidding.status,

        start_time:
          finalBidding.start_time,

        end_time:
          finalBidding.end_time,

        remaining_seconds:
          remainingSeconds,

        is_open:
          isOpen,
      }
    )

    res.json({
      order,

      bidding:
        finalBidding,

      remaining_seconds:
        remainingSeconds,

      is_open:
        isOpen,
    })
  } catch (error) {
    console.log(
      'GET BIDDING STATUS ERROR:',
      error.message
    )

    res.status(500).json({
      error:
        error.message,
    })
  }
})

// CLOSE BIDDING FOR AN ORDER
router.post('/bidding/close', async (req, res) => {
  try {
    const {
      order_reference,
    } = req.body

    if (
      !order_reference
    ) {
      return res.status(400).json({
        error:
          'Order reference is required',
      })
    }

    const {
      data:
        order,
      error:
        orderError,
    } =
      await supabase
        .from('orders')
        .select('*')
        .eq(
          'order_reference',
          order_reference
        )
        .single()

    if (
      orderError ||
      !order
    ) {
      return res.status(404).json({
        error:
          'Order not found',
      })
    }

    const {
      data:
        bidding,
      error:
        biddingError,
    } =
      await supabase
        .from('bidding')
        .update({
          status:
            'closed',

          updated_at:
            new Date().toISOString(),
        })
        .eq(
          'order_id',
          order.order_id
        )
        .eq(
          'status',
          'open'
        )
        .select()
        .maybeSingle()

    if (
      biddingError
    ) {
      return res.status(500).json({
        error:
          biddingError.message,
      })
    }

    res.json({
      message:
        'Bidding closed successfully',

      bidding,
    })
  } catch (error) {
    res.status(500).json({
      error:
        error.message,
    })
  }
})

// ============================================================
// GET BIDS
// 1. Finds selected order's real order_id.
// 2. Filters RPC data using order_id.
// 3. Prevents bids from other orders appearing.
// ============================================================
router.get('/bids', async (req, res) => {
  try {
    const {
      order_reference,
      order_id,
    } = req.query

    let finalOrderId =
      null

    if (
      order_id
    ) {
      finalOrderId =
        Number(
          order_id
        )

      if (
        Number.isNaN(
          finalOrderId
        )
      ) {
        return res.status(400).json({
          error:
            'Invalid order_id',
        })
      }
    }

    if (
      !finalOrderId &&
      order_reference
    ) {
      const {
        data:
          order,
        error:
          orderError,
      } =
        await supabase
          .from('orders')
          .select(
            'order_id, order_reference'
          )
          .eq(
            'order_reference',
            order_reference
          )
          .single()

      if (
        orderError ||
        !order
      ) {
        return res.status(404).json({
          error:
            `Order ${order_reference} not found`,
        })
      }

      finalOrderId =
        Number(
          order.order_id
        )
    }

    const {
      data,
      error,
    } =
      await supabase.rpc(
        'get_operation_bids'
      )

    if (error) {
      return res.status(500).json({
        error:
          error.message,
      })
    }

    let filteredData =
      data || []

    if (
      finalOrderId
    ) {
      filteredData =
        filteredData.filter(
          (bid) =>
            Number(
              bid.order_id
            ) ===
            Number(
              finalOrderId
            )
        )
    }

    if (
      order_reference
    ) {
      filteredData =
        filteredData.filter(
          (bid) => {
            if (
              bid.order_reference ===
                null ||
              bid.order_reference ===
                undefined ||
              bid.order_reference ===
                ''
            ) {
              return true
            }

            return (
              String(
                bid.order_reference
              )
                .trim()
                .toLowerCase() ===
              String(
                order_reference
              )
                .trim()
                .toLowerCase()
            )
          }
        )
    }

    const bidsWithSupplierContacts =
      await attachSupplierContactDetails(
        filteredData
      )

    console.log(
      'BIDS FILTER:',
      {
        order_reference:
          order_reference ||
          null,

        order_id:
          finalOrderId,

        total_rpc_bids:
          data?.length ||
          0,

        returned_bids:
          bidsWithSupplierContacts.length,

        returned_bid_ids:
          bidsWithSupplierContacts.map(
            (bid) =>
              bid.bid_id
          ),
      }
    )

    res.json(
      bidsWithSupplierContacts
    )
  } catch (error) {
    console.log(
      'GET BIDS ERROR:',
      error.message
    )

    res.status(500).json({
      error:
        error.message,
    })
  }
})

// ============================================================
// GET SAVED SHORTLIST / LOGISTICS DECISION FOR AN ORDER
//
// Operations reads bid_selection directly through its own backend.
// This keeps the shortlist locked after refresh and lets Operations
// receive the WINNER / REJECTED decision written by Logistics.
// ============================================================
router.get('/bids/shortlist-status', async (req, res) => {
  try {
    const {
      order_reference,
      order_id,
    } = req.query

    if (!order_reference && !order_id) {
      return res.status(400).json({
        success: false,
        error: 'order_reference or order_id is required',
      })
    }

    let order = null

    if (order_reference) {
      const {
        data,
        error,
      } = await supabase
        .from('orders')
        .select('order_id, order_reference, current_status')
        .eq('order_reference', String(order_reference).trim())
        .maybeSingle()

      if (error) {
        return res.status(500).json({
          success: false,
          error: error.message,
        })
      }

      order = data
    } else {
      const numericOrderId = Number(order_id)

      if (Number.isNaN(numericOrderId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid order_id',
        })
      }

      const {
        data,
        error,
      } = await supabase
        .from('orders')
        .select('order_id, order_reference, current_status')
        .eq('order_id', numericOrderId)
        .maybeSingle()

      if (error) {
        return res.status(500).json({
          success: false,
          error: error.message,
        })
      }

      order = data
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      })
    }

    const {
      data: selections,
      error: selectionError,
    } = await supabase
      .from('bid_selection')
      .select('*')
      .eq('order_id', order.order_id)
      .order('selection_id', { ascending: true })

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
        rawStatus === 'winner' ||
        rawStatus === 'accepted' ||
        rawStatus === 'selected' ||
        item?.selected === true
      ) {
        return 'WINNER'
      }

      if (
        rawStatus === 'rejected' ||
        rawStatus === 'not_selected' ||
        rawStatus === 'not selected'
      ) {
        return 'REJECTED'
      }

      return 'SHORTLISTED'
    }

    const normalizedSelections = savedSelections.map((item) => ({
      ...item,
      selection_status: normalizeSelectionStatus(item),
    }))

    const bidIds = normalizedSelections
      .map((item) => Number(item.bid_id))
      .filter((id) => !Number.isNaN(id))

    const winnerSelection = normalizedSelections.find(
      (item) => item.selection_status === 'WINNER'
    ) || null

    const sentToLogistics = normalizedSelections.some(
      (item) =>
        item.sent_to_logistics === true ||
        ['SHORTLISTED', 'WINNER', 'REJECTED'].includes(
          item.selection_status
        )
    )

    // --------------------------------------------------------
    // KEEP ORDERS TABLE IN SYNC WITH THE ORIGINAL ORDER FLOW
    //
    // Official group order progress remains:
    // Created -> Open for Bids -> Bid Accepted -> Driver Assigned
    // -> In Transit -> At Freezone -> At Port -> Completed
    //
    // The shortlist itself does NOT create a new order-progress stage.
    // Only when Operations receives the winner do we move the order
    // from the bidding stage to bid_accepted.
    //
    // Later workflow statuses are protected from being moved backwards.
    // --------------------------------------------------------
    const currentOrderStatus = String(order.current_status || '')
      .trim()
      .toLowerCase()
      .replaceAll(' ', '_')
      .replaceAll('-', '_')

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
      const {
        error: winnerOrderStatusError,
      } = await supabase
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
    console.log('GET SHORTLIST STATUS ERROR:', error)

    return res.status(500).json({
      success: false,
      error: error.message,
    })
  }
})

// ============================================================
// OPERATIONS -> SEND SHORTLISTED BIDS TO LOGISTICS
//
// Rule:
// - If 5 or more bids are available, Operations must send exactly 5.
// - If fewer than 5 bids are available, Operations must send ALL of them.
//
// Examples:
// 8 available -> send 5
// 5 available -> send 5
// 3 available -> send 3
// 1 available -> send 1
// ============================================================
router.post('/bids/send-to-logistics', async (req, res) => {
  try {
    const {
      order_reference,
      bid_ids,
    } = req.body

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

    const {
      data: order,
      error: orderError,
    } = await supabase
      .from('orders')
      .select('order_id, order_reference, current_status')
      .eq('order_reference', String(order_reference).trim())
      .maybeSingle()

    if (orderError) {
      return res.status(500).json({
        success: false,
        error: orderError.message,
      })
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      })
    }

    // Do not allow Operations to replace a shortlist that was already sent.
    const {
      data: alreadySent,
      error: alreadySentError,
    } = await supabase
      .from('bid_selection')
      .select('selection_id, bid_id, selection_status, sent_to_logistics')
      .eq('order_id', order.order_id)
      .eq('sent_to_logistics', true)

    if (alreadySentError) {
      return res.status(500).json({
        success: false,
        error: alreadySentError.message,
      })
    }

    if (alreadySent && alreadySent.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Shortlist has already been sent to Logistics for this order',
      })
    }

    // Read every available bid for this order so the backend can calculate
    // the required shortlist count itself instead of trusting the frontend.
    const {
      data: availableBids,
      error: availableBidsError,
    } = await supabase
      .from('bids')
      .select('bid_id, bidding_id, order_id, supplier_id, bid_status')
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

    const requiredShortlistCount = Math.min(5, totalAvailableBids)

    if (uniqueBidIds.length !== requiredShortlistCount) {
      return res.status(400).json({
        success: false,
        error:
          totalAvailableBids >= 5
            ? 'Exactly 5 bids must be selected before sending to Logistics'
            : `Only ${totalAvailableBids} bid${
                totalAvailableBids === 1 ? '' : 's'
              } are available. Please select all ${requiredShortlistCount} before sending to Logistics.`,
        required_shortlist_count: requiredShortlistCount,
        total_available_bids: totalAvailableBids,
      })
    }

    const selectedBidIdSet = new Set(uniqueBidIds)

    const selectedBids = allOrderBids.filter((bid) =>
      selectedBidIdSet.has(Number(bid.bid_id))
    )

    if (selectedBids.length !== requiredShortlistCount) {
      return res.status(400).json({
        success: false,
        error: 'One or more selected bids do not belong to this order',
      })
    }

    // Remove only old unsent temporary rows. Already-sent rows are protected
    // by the check above and are never deleted here.
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
      bidding_id: bid.bidding_id,
      order_id: bid.order_id,
      supplier_id: bid.supplier_id,
      selection_status: 'shortlisted',
      sent_to_logistics: true,
      selected: false,
      selected_by: null,
      reason: null,
      // Kept as a timestamp for compatibility with the current table.
      // Logistics can overwrite this when the final winner is selected.
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
      console.log(
        'BID SELECTION BATCH INSERT ERROR:',
        insertSelectionError
      )

      return res.status(500).json({
        success: false,
        error: insertSelectionError.message,
      })
    }

    // Mark only the rows sent to Logistics as shortlisted.
    const {
      error: updateSelectedBidError,
    } = await supabase
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

    const {
      error: logisticsNotificationError,
    } = await supabase
      .from('notifications')
      .insert([
        {
          order_id: order.order_id,
          message:
            `Operations sent ${requiredShortlistCount} shortlisted supplier bid${
              requiredShortlistCount === 1 ? '' : 's'
            } for order ${order.order_reference}.`,
          type: 'shortlist_to_logistics',
          is_read: false,
          created_at: now,
        },
      ])

    // The shortlist is already safely stored, so a notification failure
    // should not make the whole send operation appear to have failed.
    if (logisticsNotificationError) {
      console.log(
        'LOGISTICS NOTIFICATION ERROR:',
        logisticsNotificationError
      )
    }

    return res.status(201).json({
      success: true,
      message:
        `${requiredShortlistCount} shortlisted bid${
          requiredShortlistCount === 1 ? '' : 's'
        } sent to Logistics successfully`,
      count: insertedSelections.length,
      required_shortlist_count: requiredShortlistCount,
      total_available_bids: totalAvailableBids,
      order_id: order.order_id,
      order_reference: order.order_reference,
      order_status: order.current_status,
      bid_ids: uniqueBidIds,
      sent_to_logistics: true,
      shortlisted: insertedSelections,
    })
  } catch (error) {
    console.log('SEND SHORTLIST TO LOGISTICS ERROR:', error)

    return res.status(500).json({
      success: false,
      error: error.message,
    })
  }
})

// TEST ROUTE TO CONFIRM THIS FILE IS CONNECTED
router.get('/test-bids', (req, res) => {
  res.json({
    message:
      'operations.routes.js is connected',

    route:
      '/api/operations/test-bids',
  })
})

// GET USERS
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

    res.json(data || [])
  } catch (error) {
    res.status(500).json({
      error:
        error.message,
    })
  }
})

// GET DRIVERS FOR A SUPPLIER (used by assign-driver modal)
router.get('/drivers', async (req, res) => {
  try {
    const { supplier_id } = req.query
    let query = supabase.from('drivers').select('driver_id, first_name, last_name, contact_number, license_number')
    if (supplier_id) query = query.eq('supplier_id', supplier_id)
    const { data, error } = await query
    if (error) return res.status(500).json({ error: error.message })
    res.json(data || [])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GET VEHICLES FOR A SUPPLIER (used by assign-driver modal)
router.get('/vehicles', async (req, res) => {
  try {
    const { supplier_id } = req.query
    let query = supabase.from('vehicles').select('vehicle_id, vehicle_number, vehicle_type, availability_status')
    if (supplier_id) query = query.eq('supplier_id', supplier_id)
    const { data, error } = await query
    if (error) return res.status(500).json({ error: error.message })
    res.json(data || [])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GET WINNING SUPPLIER FOR AN ORDER (so the modal can pre-filter drivers/vehicles)
router.get('/orders/:orderId/assignment-info', async (req, res) => {
  try {
    const { orderId } = req.params
    const { data, error } = await supabase
      .from('order_assignments')
      .select('assignment_id, supplier_id, driver_id, vehicle_id, status, suppliers(company_name), drivers(first_name, last_name), vehicles(vehicle_number, vehicle_type)')
      .eq('order_id', orderId)
      .maybeSingle()
    if (error) return res.status(500).json({ error: error.message })
    res.json(data || null)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// ASSIGN DRIVER + VEHICLE TO AN ORDER
router.post('/orders/:orderId/assign-driver', async (req, res) => {
  try {
    const { orderId } = req.params
    const { driver_id, vehicle_id } = req.body

    if (!driver_id || !vehicle_id) {
      return res.status(400).json({ error: 'driver_id and vehicle_id are required' })
    }

    // Update the existing order_assignments row (created by logistics at finalize)
    const { data: existing } = await supabase
      .from('order_assignments')
      .select('assignment_id, supplier_id')
      .eq('order_id', orderId)
      .maybeSingle()

    let assignment
    if (existing) {
      const { data, error } = await supabase
        .from('order_assignments')
        .update({ driver_id, vehicle_id, status: 'driver_assigned', updated_at: new Date().toISOString() })
        .eq('assignment_id', existing.assignment_id)
        .select()
        .single()
      if (error) return res.status(500).json({ error: error.message })
      assignment = data
    } else {
      // Fallback: create from scratch if logistics step was skipped
      const { data, error } = await supabase
        .from('order_assignments')
        .insert([{ order_id: Number(orderId), driver_id, vehicle_id, status: 'driver_assigned', assigned_at: new Date().toISOString() }])
        .select()
        .single()
      if (error) return res.status(500).json({ error: error.message })
      assignment = data
    }

    // Update order status to driver_assigned
    await supabase.from('orders').update({ current_status: 'driver_assigned' }).eq('order_id', orderId)

    // Fetch order reference for notification message
    const { data: order } = await supabase.from('orders').select('order_reference').eq('order_id', orderId).single()

    // Notify the driver (mobile app polls this)
    await supabase.from('notifications').insert([{
      driver_id,
      order_id: Number(orderId),
      title: 'New Job Assigned',
      message: `You have been assigned to order ${order?.order_reference || orderId}. Please check your app for details.`,
      type: 'driver_assigned',
      is_read: false,
      created_at: new Date().toISOString(),
    }])

    // Mark vehicle as unavailable
    await supabase.from('vehicles').update({ availability_status: 'assigned' }).eq('vehicle_id', vehicle_id)

    await publish('driver.assigned', {
      order_id: Number(orderId),
      order_reference: order?.order_reference || orderId,
      driver_id,
      vehicle_id,
      assignment_id: assignment.assignment_id,
    })

    res.status(200).json({ success: true, assignment })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// UPDATE ORDER STATUS (in_transit → at_freezone → at_port → completed)
router.patch('/orders/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params
    const { status } = req.body

    const allowed = ['driver_assigned', 'in_transit', 'at_freezone', 'at_port', 'completed', 'cancelled']
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Allowed: ${allowed.join(', ')}` })
    }

    const { data, error } = await supabase
      .from('orders')
      .update({ current_status: status, updated_at: new Date().toISOString() })
      .eq('order_id', orderId)
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    res.json({ success: true, order: data })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
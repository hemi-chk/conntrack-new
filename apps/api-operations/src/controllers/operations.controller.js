import { supabase } from '../config/supabase.js'


// ============================================================
// GET ORDERS
// ============================================================

export const getOrders = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('order_id', { ascending: false })

    if (error) throw error

    res.json(data)

  } catch (error) {
    console.error('Get Orders Error:', error)

    res.status(500).json({
      error: error.message
    })
  }
}


// ============================================================
// CREATE ORDER
// ============================================================

export const createOrder = async (req, res) => {
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
      special_instructions
    } = req.body


    const { data, error } = await supabase
      .from('orders')
      .insert([
        {
          order_reference:
            order_reference || 'Test Order',

          order_date:
            new Date()
              .toISOString()
              .split('T')[0],

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

          current_status:
            'created'
        }
      ])
      .select()


    if (error) throw error


    res.status(201).json(data)

  } catch (error) {
    console.error('Create Order Error:', error)

    res.status(500).json({
      error: error.message
    })
  }
}


// ============================================================
// SHORTLIST SINGLE BID
//
// This is kept for compatibility if another part of the
// Operations system still shortlists a single bid.
//
// Your new Bidding page mainly uses:
// sendShortlistedToLogistics()
// ============================================================

export const shortlistBid = async (req, res) => {
  try {

    const { bid_id } = req.body


    // --------------------------------------------------------
    // VALIDATE BID ID
    // --------------------------------------------------------

    if (!bid_id) {
      return res.status(400).json({
        error: 'bid_id is required'
      })
    }


    const cleanBidId =
      Number(bid_id)


    if (Number.isNaN(cleanBidId)) {
      return res.status(400).json({
        error: 'Invalid bid_id'
      })
    }


    // --------------------------------------------------------
    // FIND BID
    // --------------------------------------------------------

    const {
      data: bid,
      error: bidError
    } = await supabase
      .from('bids')
      .select(`
        bid_id,
        bidding_id,
        order_id,
        supplier_id,
        bid_status
      `)
      .eq(
        'bid_id',
        cleanBidId
      )
      .maybeSingle()


    if (bidError) {
      throw bidError
    }


    if (!bid) {
      return res.status(404).json({
        error: 'Bid not found'
      })
    }


    // --------------------------------------------------------
    // CHECK IF THIS BID ALREADY EXISTS IN BID_SELECTION
    // --------------------------------------------------------

    const {
      data: existingSelection,
      error: existingError
    } = await supabase
      .from('bid_selection')
      .select(`
        selection_id,
        bid_id,
        order_id,
        selection_status,
        sent_to_logistics
      `)
      .eq(
        'bid_id',
        cleanBidId
      )
      .maybeSingle()


    if (existingError) {
      throw existingError
    }


    if (existingSelection) {
      return res.status(400).json({
        error:
          'This bid is already shortlisted'
      })
    }


    // --------------------------------------------------------
    // COUNT EXISTING SHORTLISTED BIDS FOR THIS ORDER
    // --------------------------------------------------------

    const {
      count,
      error: countError
    } = await supabase
      .from('bid_selection')
      .select(
        '*',
        {
          count: 'exact',
          head: true
        }
      )
      .eq(
        'order_id',
        bid.order_id
      )
      .eq(
        'selection_status',
        'SHORTLISTED'
      )


    if (countError) {
      throw countError
    }


    // --------------------------------------------------------
    // MAXIMUM 5
    // --------------------------------------------------------

    if ((count || 0) >= 5) {
      return res.status(400).json({
        error:
          'Maximum 5 bids can be shortlisted for one order'
      })
    }


    // --------------------------------------------------------
    // INSERT SHORTLIST
    // --------------------------------------------------------

    const {
      data,
      error
    } = await supabase
      .from('bid_selection')
      .insert([
        {
          bid_id:
            bid.bid_id,

          bidding_id:
            bid.bidding_id,

          order_id:
            bid.order_id,

          supplier_id:
            bid.supplier_id,

          selection_status:
            'SHORTLISTED',

          sent_to_logistics:
            false,

          selected:
            false,

          selected_by:
            null,

          reason:
            null,

          selected_at:
            null
        }
      ])
      .select()


    if (error) {
      throw error
    }


    // --------------------------------------------------------
    // UPDATE ORIGINAL BID STATUS
    // --------------------------------------------------------

    const {
      error: bidStatusError
    } = await supabase
      .from('bids')
      .update({
        bid_status:
          'shortlisted'
      })
      .eq(
        'bid_id',
        cleanBidId
      )


    if (bidStatusError) {
      throw bidStatusError
    }


    return res.status(201).json({
      success: true,
      message:
        'Bid shortlisted successfully',
      data
    })

  } catch (error) {

    console.error(
      'Shortlist Bid Error:',
      error
    )


    return res.status(500).json({
      success: false,
      error:
        error.message
    })
  }
}


// ============================================================
// SEND EXACTLY 5 SHORTLISTED BIDS TO LOGISTICS
//
// Operations Frontend:
// POST /api/operations/bids/send-to-logistics
//
// Body:
// {
//   order_reference: "EXP-00042",
//   bid_ids: [19,20,21,22,23]
// }
//
// FLOW:
//
// Operations
//     ↓
// Select exactly 5
//     ↓
// Save 5 rows to bid_selection
//     ↓
// selection_status = SHORTLISTED
// sent_to_logistics = true
//     ↓
// Logistics can read same Supabase records
// ============================================================

export const sendShortlistedToLogistics = async (
  req,
  res
) => {
  try {

    const {
      order_reference,
      bid_ids
    } = req.body


    // --------------------------------------------------------
    // 1. VALIDATE ORDER REFERENCE
    // --------------------------------------------------------

    if (
      !order_reference ||
      String(order_reference).trim() === ''
    ) {
      return res.status(400).json({
        success: false,
        error:
          'order_reference is required'
      })
    }


    // --------------------------------------------------------
    // 2. VALIDATE BID IDS
    // --------------------------------------------------------

    if (!Array.isArray(bid_ids)) {
      return res.status(400).json({
        success: false,
        error:
          'bid_ids must be an array'
      })
    }


    if (bid_ids.length !== 5) {
      return res.status(400).json({
        success: false,
        error:
          'Exactly 5 bids must be shortlisted before sending to Logistics'
      })
    }


    // Convert every bid ID to number
    const convertedBidIds =
      bid_ids.map((id) =>
        Number(id)
      )


    if (
      convertedBidIds.some(
        (id) =>
          Number.isNaN(id)
      )
    ) {
      return res.status(400).json({
        success: false,
        error:
          'One or more bid IDs are invalid'
      })
    }


    // Remove duplicates
    const uniqueBidIds = [
      ...new Set(
        convertedBidIds
      )
    ]


    if (uniqueBidIds.length !== 5) {
      return res.status(400).json({
        success: false,
        error:
          'Duplicate bid IDs are not allowed'
      })
    }


    // --------------------------------------------------------
    // 3. FIND ORDER FROM ORDER REFERENCE
    // --------------------------------------------------------

    const {
      data: order,
      error: orderError
    } = await supabase
      .from('orders')
      .select(`
        order_id,
        order_reference,
        current_status
      `)
      .eq(
        'order_reference',
        String(order_reference).trim()
      )
      .maybeSingle()


    if (orderError) {
      throw orderError
    }


    if (!order) {
      return res.status(404).json({
        success: false,
        error:
          'Order not found'
      })
    }


    // --------------------------------------------------------
    // 4. CHECK IF THIS ORDER WAS ALREADY SENT TO LOGISTICS
    //
    // Once sent, Operations must not send another shortlist.
    // --------------------------------------------------------

    const {
      data: existingSentSelections,
      error: sentCheckError
    } = await supabase
      .from('bid_selection')
      .select(`
        selection_id,
        bid_id,
        order_id,
        selection_status,
        sent_to_logistics
      `)
      .eq(
        'order_id',
        order.order_id
      )
      .eq(
        'sent_to_logistics',
        true
      )


    if (sentCheckError) {
      throw sentCheckError
    }


    if (
      existingSentSelections &&
      existingSentSelections.length > 0
    ) {
      return res.status(400).json({
        success: false,
        error:
          'Shortlist has already been sent to Logistics for this order'
      })
    }


    // --------------------------------------------------------
    // 5. GET EXACT 5 BIDS FROM BIDS TABLE
    //
    // Important:
    // Every selected bid must belong to this same order.
    // --------------------------------------------------------

    const {
      data: selectedBids,
      error: selectedBidsError
    } = await supabase
      .from('bids')
      .select(`
        bid_id,
        bidding_id,
        order_id,
        supplier_id,
        bid_status
      `)
      .eq(
        'order_id',
        order.order_id
      )
      .in(
        'bid_id',
        uniqueBidIds
      )


    if (selectedBidsError) {
      throw selectedBidsError
    }


    if (
      !selectedBids ||
      selectedBids.length !== 5
    ) {
      return res.status(400).json({
        success: false,
        error:
          'One or more selected bids do not belong to this order'
      })
    }


    // --------------------------------------------------------
    // 6. REMOVE ANY OLD UNSENT TEMPORARY SHORTLISTS
    //
    // This only removes:
    // sent_to_logistics = false
    //
    // It never deletes an already sent shortlist.
    // --------------------------------------------------------

    const {
      error: deleteTempError
    } = await supabase
      .from('bid_selection')
      .delete()
      .eq(
        'order_id',
        order.order_id
      )
      .eq(
        'sent_to_logistics',
        false
      )


    if (deleteTempError) {
      throw deleteTempError
    }


    // --------------------------------------------------------
    // 7. PREPARE 5 SHORTLIST RECORDS
    // --------------------------------------------------------

    const shortlistRows =
      selectedBids.map(
        (bid) => ({
          bid_id:
            bid.bid_id,

          bidding_id:
            bid.bidding_id,

          order_id:
            bid.order_id,

          supplier_id:
            bid.supplier_id,

          selection_status:
            'SHORTLISTED',

          sent_to_logistics:
            true,

          selected:
            false,

          selected_by:
            null,

          reason:
            null,

          selected_at:
            null
        })
      )


    // --------------------------------------------------------
    // 8. INSERT THE 5 SHORTLISTED BIDS
    // --------------------------------------------------------

    const {
      data: savedSelections,
      error: insertSelectionError
    } = await supabase
      .from('bid_selection')
      .insert(
        shortlistRows
      )
      .select()


    if (insertSelectionError) {
      throw insertSelectionError
    }


    // --------------------------------------------------------
    // 9. UPDATE THE 5 ORIGINAL BIDS
    //
    // Your Bidding.jsx uses bid_status = shortlisted
    // after refresh to know the shortlist is locked.
    // --------------------------------------------------------

    const {
      error: updateBidsError
    } = await supabase
      .from('bids')
      .update({
        bid_status:
          'shortlisted'
      })
      .eq(
        'order_id',
        order.order_id
      )
      .in(
        'bid_id',
        uniqueBidIds
      )


    if (updateBidsError) {
      throw updateBidsError
    }


    // --------------------------------------------------------
    // 10. OPTIONAL:
    // Keep other bids unchanged.
    //
    // Do NOT reject them yet.
    //
    // Logistics must first select the final winner.
    //
    // After Logistics chooses:
    //
    // winner → accepted
    // all others → rejected
    // --------------------------------------------------------


    // --------------------------------------------------------
    // 11. SUCCESS RESPONSE
    // --------------------------------------------------------

    return res.status(200).json({
      success: true,

      message:
        '5 shortlisted bids sent to Logistics Team successfully',

      order_id:
        order.order_id,

      order_reference:
        order.order_reference,

      bid_ids:
        uniqueBidIds,

      sent_to_logistics:
        true,

      selections:
        savedSelections
    })

  } catch (error) {

    console.error(
      'Send Shortlisted To Logistics Error:',
      error
    )


    return res.status(500).json({
      success: false,

      error:
        error.message
    })
  }
}
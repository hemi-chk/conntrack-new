import { supabase } from '../config/supabase.js'

// GET /api/supplier/inspections/:vehicleId
export const getVehicleInspections = async (req, res) => {
  try {
    const { vehicleId } = req.params
    const { data, error } = await supabase
      .from('vehicle_inspections')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('inspection_date', { ascending: false })

    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// POST /api/supplier/inspections
export const addInspectionRecord = async (req, res) => {
  try {
    const { vehicle_id, inspection_date, status, remarks, inspected_by } = req.body

    const { data, error } = await supabase
      .from('vehicle_inspections')
      .insert([{
        vehicle_id,
        inspection_date,
        status,
        remarks,
        inspected_by
      }])
      .select()

    if (error) throw error
    res.status(201).json(data[0])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

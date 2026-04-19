import express from 'express'
import { supabase } from '../config/supabase.js'

const router = express.Router()

// Request logger for this specific router
router.use((req, res, next) => {
  console.log(`Supplier Router: Received ${req.method} request for ${req.url}`);
  next();
});

// Fetch all vehicles for the supplier
router.get('/vehicles', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .order('vehicle_id', { ascending: true })
    
    if (error) {
      console.error('Supabase error:', error)
      return res.status(500).json({ error: error.message })
    }
    
    res.json(data)
  } catch (err) {
    console.error('Server error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Add a new vehicle
router.post('/vehicles', async (req, res) => {
  try {
    console.log('Supplier Router: POST request body:', req.body)
    
    if (!supabase) {
      console.error('Supplier Router: Supabase client is not initialized!')
      return res.status(500).json({ error: 'Database client not initialized' })
    }

    const { vehicle_number, type, availability_status, insurance_expiry, port_pass_expiry } = req.body
    
    // Map 'type' from frontend to 'vehicle_type' in database
    const insertData = { 
      vehicle_number, 
      vehicle_type: type, 
      availability_status, 
      insurance_expiry, 
      port_pass_expiry 
    }
    
    console.log('Supplier Router: Attempting Supabase insert into "vehicles" table:', insertData)
    
    const { data, error } = await supabase
      .from('vehicles')
      .insert([insertData])
      .select()
    
    if (error) {
      console.error('Supabase insert error details:', error)
      return res.status(500).json({ error: error.message, details: error })
    }
    
    console.log('Insert successful, returned data:', data)
    res.status(201).json(data[0]) 
  } catch (err) {
    console.error('Server error inserting:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update a vehicle
router.put('/vehicles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { vehicle_number, type, availability_status, insurance_expiry, port_pass_expiry } = req.body;
    
    console.log(`Supplier Router: Updating vehicle ID ${id}`, req.body);

    const updateData = {
      vehicle_number,
      vehicle_type: type,
      availability_status,
      insurance_expiry,
      port_pass_expiry
    };

    const { data, error } = await supabase
      .from('vehicles')
      .update(updateData)
      .eq('vehicle_id', id)
      .select();

    if (error) {
      console.error('Supabase update error:', error);
      return res.status(500).json({ error: error.message });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json(data[0]);
  } catch (err) {
    console.error('Server error updating:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a vehicle
router.delete('/vehicles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Supplier Router: Deleting vehicle ID ${id}`);

    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('vehicle_id', id);

    if (error) {
      console.error('Supabase delete error:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ message: 'Vehicle deleted successfully' });
  } catch (err) {
    console.error('Server error deleting:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/orders', (req, res) => {
  res.json({ message: 'Get available orders' })
})

router.post('/bids', (req, res) => {
  res.json({ message: 'Submit a bid' })
})

export default router
import { supabase } from '../config/supabase.js'

// GET /api/supplier/chats/:chatId/messages
export const getChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('sent_at', { ascending: true })

    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// POST /api/supplier/chats/:chatId/messages
export const sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params
    const { sender_id, message, message_type } = req.body

    const { data, error } = await supabase
      .from('chat_messages')
      .insert([{
        chat_id: chatId,
        sender_id,
        message,
        message_type: message_type || 'text'
      }])
      .select()

    if (error) throw error
    res.status(201).json(data[0])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

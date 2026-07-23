import amqplib from 'amqplib'

const EXCHANGE = 'conntrack.events'
let channel = null

export async function connectMessaging(amqpUrl) {
  if (!amqpUrl) {
    console.log('[Messaging] AMQP_URL not set — running without RabbitMQ')
    return
  }
  try {
    const conn = await amqplib.connect(amqpUrl)
    channel = await conn.createChannel()
    await channel.assertExchange(EXCHANGE, 'topic', { durable: true })

    conn.on('error', (err) => {
      console.error('[Messaging] Connection error:', err.message)
      channel = null
    })
    conn.on('close', () => {
      console.warn('[Messaging] Connection closed')
      channel = null
    })

    console.log('[Messaging] Connected to RabbitMQ')
  } catch (err) {
    console.warn('[Messaging] RabbitMQ unavailable — running without messaging:', err.message)
    channel = null
  }
}

export async function publish(routingKey, payload) {
  if (!channel) return false
  try {
    return channel.publish(
      EXCHANGE,
      routingKey,
      Buffer.from(JSON.stringify(payload)),
      { persistent: true }
    )
  } catch (err) {
    console.error('[Messaging] Publish failed:', err.message)
    return false
  }
}

export async function createConsumer(routingKey, queueName, handler) {
  if (!channel) return
  try {
    await channel.assertQueue(queueName, { durable: true })
    await channel.bindQueue(queueName, EXCHANGE, routingKey)
    channel.prefetch(1)
    channel.consume(queueName, async (msg) => {
      if (!msg) return
      try {
        const payload = JSON.parse(msg.content.toString())
        await handler(payload)
        channel.ack(msg)
      } catch (err) {
        console.error(`[Messaging] Handler error on ${routingKey}:`, err.message)
        channel.nack(msg, false, false)
      }
    })
    console.log(`[Messaging] Consumer ready: ${routingKey} → ${queueName}`)
  } catch (err) {
    console.error('[Messaging] Consumer setup failed:', err.message)
  }
}

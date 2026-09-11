import EventEmitter from 'events';
import Notification from '../models/Notification.js';

// Global Event Emitter for internal and real-time events
export const notificationEmitter = new EventEmitter();

// Active SSE client streams
const sseClients = new Map();

/**
 * Register an SSE client connection
 */
export function addSseClient(clientId, res, admin) {
  sseClients.set(clientId, { res, admin });

  // Send initial connected event
  try {
    res.write(`event: connected\ndata: ${JSON.stringify({ status: 'connected', time: new Date().toISOString() })}\n\n`);
  } catch (err) {
    console.error('Error sending initial SSE handshake:', err);
  }
}

/**
 * Remove an SSE client connection
 */
export function removeSseClient(clientId) {
  sseClients.delete(clientId);
}

/**
 * Broadcast notification to active SSE clients
 */
export function broadcastNotification(notification) {
  const payload = JSON.stringify(notification);
  const data = `event: notification\ndata: ${payload}\n\n`;

  for (const [clientId, client] of sseClients.entries()) {
    try {
      // Check recipient filter: broadcast to all if recipient is null, or if recipient matches client admin id
      const recipientId = notification.recipient ? String(notification.recipient) : null;
      const clientAdminId = client.admin?.id || client.admin?._id ? String(client.admin.id || client.admin._id) : null;

      if (!recipientId || recipientId === clientAdminId) {
        client.res.write(data);
      }
    } catch (err) {
      console.error(`Error sending SSE to client ${clientId}:`, err);
      sseClients.delete(clientId);
    }
  }
}

/**
 * Reusable utility to create and dispatch notifications across backend controllers
 * @param {Object} options
 * @param {string} options.title - Notification title
 * @param {string} options.message - Notification message body
 * @param {'appointment' | 'patient' | 'billing' | 'urgent' | 'system'} [options.type='system'] - Category
 * @param {string} [options.recipient=null] - Admin/User ID or null for clinic-wide
 * @param {string} [options.link=''] - Frontend route/action URL
 * @param {string} [options.createdBy=null] - Creator Admin ID
 */
export async function createNotification({
  title,
  message,
  type = 'system',
  recipient = null,
  link = '',
  createdBy = null,
}) {
  try {
    if (!title || !message) {
      console.warn('createNotification called without title or message');
      return null;
    }

    const notification = await Notification.create({
      title: title.trim(),
      message: message.trim(),
      type,
      recipient: recipient || null,
      link: link.trim(),
      createdBy: createdBy || null,
      isRead: false,
    });

    // Emit internal event
    notificationEmitter.emit('notification:created', notification);

    // Broadcast in real-time to active SSE connections
    broadcastNotification(notification);

    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
    return null;
  }
}

// Keep-alive heartbeat interval for SSE connections
setInterval(() => {
  if (sseClients.size === 0) return;
  const heartbeat = `: ping ${new Date().toISOString()}\n\n`;
  for (const [clientId, client] of sseClients.entries()) {
    try {
      client.res.write(heartbeat);
    } catch {
      sseClients.delete(clientId);
    }
  }
}, 25000);

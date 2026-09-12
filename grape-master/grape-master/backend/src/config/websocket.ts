import { WebSocketServer, WebSocket } from 'ws'
import { IncomingMessage, Server } from 'http'
import { verifyToken } from '../middleware/auth'
import { redisSubscriber, userChannel, roleChannel } from '../config/redis'
import { logger } from '../utils/logger'

/** Map userId → set of open WebSocket connections */
const connections = new Map<string, Set<WebSocket>>()

/** Map userId → role (for role-based broadcasts) */
const userRoles = new Map<string, string>()

export const initWebSocketServer = (httpServer: Server) => {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' })

  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    // Extract JWT from ?token= query param
    const url = new URL(req.url ?? '', 'http://localhost')
    const token = url.searchParams.get('token')
    if (!token) {
      ws.close(1008, 'Missing token')
      return
    }

    let userId: string
    let role: string
    try {
      const payload = verifyToken(token)
      userId = payload.id
      role   = payload.role
    } catch {
      ws.close(1008, 'Invalid token')
      return
    }

    // Register connection
    if (!connections.has(userId)) connections.set(userId, new Set())
    connections.get(userId)!.add(ws)
    userRoles.set(userId, role)

    logger.info(`WS connected: ${userId} (${role}) — ${connections.get(userId)!.size} socket(s)`)

    // Subscribe to this user's Redis channel (idempotent)
    redisSubscriber.subscribe(userChannel(userId), roleChannel(role), (err) => {
      if (err) logger.warn('WS Redis subscribe error', err)
    })

    // Handle client messages (ping/pong keepalive)
    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString())
        if (msg.type === 'ping') ws.send(JSON.stringify({ type: 'pong' }))
      } catch { /* ignore */ }
    })

    ws.on('close', () => {
      connections.get(userId)?.delete(ws)
      if (connections.get(userId)?.size === 0) connections.delete(userId)
      logger.info(`WS disconnected: ${userId}`)
    })

    ws.on('error', (e) => logger.warn('WS error', e.message))

    // Send connected confirmation
    ws.send(JSON.stringify({ type: 'connected', userId }))
  })

  // Redis → WebSocket relay
  redisSubscriber.on('message', (channel: string, message: string) => {
    // User-scoped channel
    if (channel.startsWith('gm:user:')) {
      const uid = channel.replace('gm:user:', '')
      broadcast(uid, message)
      return
    }
    // Role-scoped broadcast
    if (channel.startsWith('gm:role:')) {
      const role = channel.replace('gm:role:', '')
      broadcastToRole(role, message)
    }
  })

  logger.info('WebSocket server ready on /ws')
  return wss
}

/** Send a message to all sockets for a specific user */
export const broadcast = (userId: string, payload: string | object) => {
  const msg = typeof payload === 'string' ? payload : JSON.stringify(payload)
  connections.get(userId)?.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) ws.send(msg)
  })
}

/** Broadcast to all users of a given role */
export const broadcastToRole = (role: string, payload: string | object) => {
  const msg = typeof payload === 'string' ? payload : JSON.stringify(payload)
  connections.forEach((sockets, uid) => {
    if (userRoles.get(uid) === role) {
      sockets.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) ws.send(msg)
      })
    }
  })
}

/** Online user count for admin dashboard */
export const getOnlineCount = () => connections.size

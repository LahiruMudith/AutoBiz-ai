import { Response } from 'express';

interface SSEClient {
  id: string;
  res: Response;
  businessId: string;
}

let sseClients: SSEClient[] = [];

export function addSSEClient(businessId: string, res: Response) {
  const clientId = Date.now().toString();
  const newClient = { id: clientId, res, businessId };
  sseClients.push(newClient);
  
  // Keep connection alive with periodic heartbeats
  const keepAliveInterval = setInterval(() => {
    res.write(': keep-alive\n\n');
  }, 20000);
  
  res.on('close', () => {
    clearInterval(keepAliveInterval);
    sseClients = sseClients.filter(c => c.id !== clientId);
    console.log(`[SSE] Client ${clientId} disconnected from business: ${businessId}`);
  });
  
  console.log(`[SSE] Client ${clientId} connected for business: ${businessId}`);
}

export function broadcastSSE(businessId: string, eventType: string, data: any) {
  const payload = JSON.stringify({ type: eventType, data });
  const targets = sseClients.filter(c => c.businessId === businessId);
  console.log(`[SSE] Broadcasting event "${eventType}" to ${targets.length} clients for business: ${businessId}`);
  targets.forEach(c => {
    try {
      c.res.write(`data: ${payload}\n\n`);
    } catch (err) {
      console.error(`[SSE] Error writing to client ${c.id}:`, err);
    }
  });
}

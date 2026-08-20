import express, { Request, Response } from 'express';
import { processIncomingMessage } from './routing';
import { addTicket } from './db';
import { ChannelType } from '../types/crm';

const router = express.Router();

/**
 * Helper to standardise responses and logs.
 */
function logIngestion(channel: ChannelType, ticketId: string, durationMs: number) {
  console.log(`[Ingest-Success] Channel: ${channel} | Ticket ID: ${ticketId} | Processed in: ${durationMs}ms`);
}

/**
 * 1. WhatsApp Ingestion Endpoint
 * Receives payload from WhatsApp Business API Webhooks.
 */
router.post('/webhooks/whatsapp', async (req: Request, res: Response): Promise<void> => {
  try {
    const payload = req.body;
    
    // Validate request structure
    if (!payload.messages || payload.messages.length === 0) {
      res.status(400).json({ error: 'Invalid WhatsApp webhook payload structure.' });
      return;
    }

    const wsMsg = payload.messages[0];
    const customerName = payload.contacts?.[0]?.profile?.name || 'WhatsApp User';
    const fromPhone = wsMsg.from;
    const textBody = wsMsg.text?.body || '';
    
    // Support WhatsApp attachments (Images/PDFs)
    const mediaUrls: string[] = [];
    if (wsMsg.image?.url) mediaUrls.push(wsMsg.image.url);
    if (wsMsg.document?.url) mediaUrls.push(wsMsg.document.url);

    // AI Engine Processing
    const { ticket, customerProfile, durationMs } = await processIncomingMessage({
      customer: {
        name: customerName,
        email: `${fromPhone}@whatsapp.kako.ai`, // Placeholder fallback email
        phone: fromPhone,
        whatsappId: fromPhone
      },
      channel: 'WhatsApp',
      channelMessageId: wsMsg.id,
      body: textBody,
      mediaUrls
    });

    addTicket(ticket, customerProfile);
    logIngestion('WhatsApp', ticket.id, durationMs);
    
    // Respond to webhook provider in < 2 seconds
    res.status(200).json({
      status: 'success',
      ticketId: ticket.id,
      processingTimeMs: durationMs
    });
  } catch (error: any) {
    console.error('[Ingest-Error] WhatsApp webhook failed:', error);
    res.status(500).json({ error: 'Internal Ingestion Error' });
  }
});

/**
 * 2. Email Ingestion Endpoint
 * Receives payload from SMTP listener or corporate email API sync (e.g. SendGrid, Mailgun).
 */
router.post('/webhooks/email', async (req: Request, res: Response): Promise<void> => {
  try {
    const { fromEmail, fromName, subject, bodyText, attachments, messageId } = req.body;

    if (!fromEmail || !bodyText) {
      res.status(400).json({ error: 'Missing required email fields (fromEmail, bodyText)' });
      return;
    }

    // Capture attachments/PDFs
    const mediaUrls: string[] = attachments?.map((att: any) => att.url) || [];

    // AI Engine Processing
    const { ticket, customerProfile, durationMs } = await processIncomingMessage({
      customer: {
        name: fromName || fromEmail.split('@')[0],
        email: fromEmail,
        phone: ''
      },
      channel: 'Email',
      channelMessageId: messageId || `email-${Date.now()}`,
      body: `Subject: ${subject}\n\n${bodyText}`,
      mediaUrls
    });

    addTicket(ticket, customerProfile);
    logIngestion('Email', ticket.id, durationMs);

    res.status(200).json({
      status: 'success',
      ticketId: ticket.id,
      processingTimeMs: durationMs
    });
  } catch (error: any) {
    console.error('[Ingest-Error] Email webhook failed:', error);
    res.status(500).json({ error: 'Internal Ingestion Error' });
  }
});

/**
 * 3. SMS Ingestion Endpoint
 * Receives payload from Twilio, Plivo or other SMS gateways.
 */
router.post('/webhooks/sms', async (req: Request, res: Response): Promise<void> => {
  try {
    const { MessageSid, From, Body } = req.body;

    if (!From || !Body) {
      res.status(400).json({ error: 'Invalid SMS webhook payload structure.' });
      return;
    }

    // AI Engine Processing
    const { ticket, customerProfile, durationMs } = await processIncomingMessage({
      customer: {
        name: `SMS Customer (${From})`,
        email: `${From}@sms.kako.ai`,
        phone: From
      },
      channel: 'SMS',
      channelMessageId: MessageSid,
      body: Body
    });

    addTicket(ticket, customerProfile);
    logIngestion('SMS', ticket.id, durationMs);

    res.status(200).json({
      status: 'success',
      ticketId: ticket.id,
      processingTimeMs: durationMs
    });
  } catch (error: any) {
    console.error('[Ingest-Error] SMS webhook failed:', error);
    res.status(500).json({ error: 'Internal Ingestion Error' });
  }
});

export default router;

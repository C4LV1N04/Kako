import express from 'express';
import cors from 'cors';
import webhookRouter from './webhook';
import { TICKETS, CUSTOMERS, USERS, updateTicketStatus, reassignTicket, appendChatMessage, queryAIResponse, rateChatMessage } from './db';
import { KNOWLEDGE_BASE_ARTICLES } from './kb';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Hook Ingestion endpoints (WhatsApp, Email, SMS)
app.use('/api', webhookRouter);

// GET / - Root welcome and API endpoint map
app.get('/', (_req, res) => {
  res.status(200).json({
    server: "KaKo CRM AI & Routing Engine API Server",
    status: "active",
    dashboardUrl: "http://localhost:5173",
    endpoints: {
      tickets: "GET /api/tickets",
      customers: "GET /api/customers",
      webhooks: {
        whatsapp: "POST /api/webhooks/whatsapp",
        email: "POST /api/webhooks/email",
        sms: "POST /api/webhooks/sms"
      }
    }
  });
});

// GET /api/tickets - Fetch all tickets in the CRM
app.get('/api/tickets', (_req, res) => {
  res.status(200).json(TICKETS);
});

// GET /api/customers - Fetch all customer profiles
app.get('/api/customers', (_req, res) => {
  res.status(200).json(CUSTOMERS);
});

// GET /api/users - Fetch all seeded agent and admin profiles
app.get('/api/users', (_req, res) => {
  res.status(200).json(USERS);
});

// POST /api/tickets/:id/resolve - Mark a ticket resolved
app.post('/api/tickets/:id/resolve', (req, res) => {
  const { id } = req.params;
  const success = updateTicketStatus(id, 'Resolved', new Date());
  
  if (success) {
    res.status(200).json({ status: 'success', message: `Ticket ${id} resolved.` });
  } else {
    res.status(404).json({ error: `Ticket ${id} not found.` });
  }
});

// POST /api/tickets/:id/status - Update a ticket status (e.g. to In_Progress)
app.post('/api/tickets/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!status) {
    res.status(400).json({ error: 'Missing status property.' });
    return;
  }

  const success = updateTicketStatus(id, status);
  if (success) {
    res.status(200).json({ status: 'success', message: `Ticket ${id} updated to ${status}.` });
  } else {
    res.status(404).json({ error: `Ticket ${id} not found.` });
  }
});

// POST /api/tickets/:id/assign - Assign ticket to an agent
app.post('/api/tickets/:id/assign', (req, res) => {
  const { id } = req.params;
  const { agentId } = req.body; // Can be empty or undefined to unassign

  const success = reassignTicket(id, agentId);
  if (success) {
    res.status(200).json({ status: 'success', message: `Ticket ${id} assigned to ${agentId || 'none'}.` });
  } else {
    res.status(404).json({ error: `Ticket ${id} not found.` });
  }
});

// GET /api/kb - Fetch all articles in the Knowledge Base
app.get('/api/kb', (_req, res) => {
  res.status(200).json(KNOWLEDGE_BASE_ARTICLES);
});

// POST /api/tickets/:id/chat - Post a message in the ticket live chat thread
app.post('/api/tickets/:id/chat', (req, res) => {
  const { id } = req.params;
  const { sender, body, mediaUrl } = req.body;

  if (!sender || !body) {
    res.status(400).json({ error: 'Missing sender or body properties.' });
    return;
  }

  const message = appendChatMessage(id, sender, body, mediaUrl);
  if (message) {
    res.status(200).json(message);
  } else {
    res.status(404).json({ error: `Ticket ${id} not found.` });
  }
});

// POST /api/tickets/:id/ai-reply - Trigger AI to search KB and auto-reply
app.post('/api/tickets/:id/ai-reply', (req, res) => {
  const { id } = req.params;
  const { prompt } = req.body; // Optional user feedback prompt to guide AI query

  const { responseText } = queryAIResponse(id, prompt);
  
  // Save AI response message in the chat thread
  const message = appendChatMessage(id, 'AI', responseText);
  if (message) {
    // Auto-progress ticket to In Progress state
    updateTicketStatus(id, 'In_Progress');
    res.status(200).json(message);
  } else {
    res.status(404).json({ error: `Ticket ${id} not found.` });
  }
});

// POST /api/tickets/:id/messages/:messageId/feedback - Submit feedback on AI replies
app.post('/api/tickets/:id/messages/:messageId/feedback', (req, res) => {
  const { id, messageId } = req.params;
  const { rating, correction } = req.body;

  if (!rating) {
    res.status(400).json({ error: 'Missing rating property.' });
    return;
  }

  const success = rateChatMessage(id, messageId, rating, correction);
  if (success) {
    res.status(200).json({ status: 'success', message: 'Feedback logged.' });
  } else {
    res.status(404).json({ error: 'Ticket or message not found.' });
  }
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  KaKo CRM & Routing Backend running on port ${PORT}  `);
  console.log(`====================================================`);
});

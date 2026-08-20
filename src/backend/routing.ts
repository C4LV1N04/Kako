import { Ticket, CustomerProfile, Department, ChannelType } from '../types/crm';
import { v4 as uuidv4 } from 'uuid'; // Standard UUID generator

// Mock Knowledge Base for context-aware recommendations
const KNOWLEDGE_BASE = [
  {
    category: 'Finance',
    keywords: ['billing', 'invoice', 'charge', 'payment', 'refund'],
    response: 'To process a refund or billing inquiry, please check the Invoice Details in the Billing Panel and click "Sync with ERP" to update the accounts ledger. Expected resolution is within 2 hours.'
  },
  {
    category: 'Support',
    keywords: ['onboarding', 'login', 'error', 'bug', 'setup', 'reset'],
    response: 'For onboarding and technical troubleshooting, verify the customer\'s system logs and guide them through our client portal. You can trigger an onboarding invite directly from the Action Bar.'
  },
  {
    category: 'Sales',
    keywords: ['buy', 'price', 'pricing', 'demo', 'quote', 'contract'],
    response: 'This is a high-value lead. Offer a personalized demo call and share our product catalog. Log this as an Opportunity in the CRM.'
  }
];

/**
 * AI Routing Engine simulator.
 * Processes requests in < 2 seconds, analyzes intent, classifies the department,
 * and creates the ticket with initial SLA targets.
 */
export async function processIncomingMessage(params: {
  customer: Omit<CustomerProfile, 'id' | 'createdAt' | 'updatedAt'>;
  channel: ChannelType;
  channelMessageId: string;
  body: string;
  mediaUrls?: string[];
}): Promise<{ ticket: Ticket; customerProfile: CustomerProfile; durationMs: number }> {
  const startTime = Date.now();

  // 1. Simulate fast LLM processing delay (50ms - 200ms) to model real-world <2s requirement
  const simulateDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  await simulateDelay(Math.floor(Math.random() * 150) + 50);

  // 2. Mock/Resolve Customer Profile
  const customerId = uuidv4();
  const customerProfile: CustomerProfile = {
    id: customerId,
    name: params.customer.name,
    email: params.customer.email,
    phone: params.customer.phone,
    whatsappId: params.customer.whatsappId,
    createdAt: new Date(),
    updatedAt: new Date(),
    metadata: { syncStatus: 'PENDING' }
  };

  // 3. AI Intent Analysis & Department Classification
  const text = params.body.toLowerCase();
  let matchedDept: Department = 'Support'; // Default fallback
  let intentClassification = 'General Support Inquiry';
  let confidenceScore = 0.85;
  let suggestedResponse = 'Thank you for reaching out. An agent has been assigned to help you.';

  // Match keyword intents
  if (text.includes('invoice') || text.includes('billing') || text.includes('pay') || text.includes('refund') || text.includes('charge')) {
    matchedDept = 'Finance';
    intentClassification = 'Billing & Invoice Dispute';
    confidenceScore = 0.94;
  } else if (text.includes('buy') || text.includes('pricing') || text.includes('demo') || text.includes('quote') || text.includes('contract') || text.includes('interested')) {
    matchedDept = 'Sales';
    intentClassification = 'New Sales Opportunity';
    confidenceScore = 0.91;
  } else if (text.includes('onboard') || text.includes('setup') || text.includes('login') || text.includes('error') || text.includes('broken')) {
    matchedDept = 'Support';
    intentClassification = 'Technical Onboarding & Support';
    confidenceScore = 0.89;
  }

  // Sentiment analysis
  let sentiment: 'Positive' | 'Neutral' | 'Negative' = 'Neutral';
  if (text.includes('urgent') || text.includes('bad') || text.includes('angry') || text.includes('broken') || text.includes('fail') || text.includes('wrong')) {
    sentiment = 'Negative';
  } else if (text.includes('love') || text.includes('great') || text.includes('thanks') || text.includes('perfect')) {
    sentiment = 'Positive';
  }

  // 4. Context-aware Smart Response pulling from KB
  const kbMatch = KNOWLEDGE_BASE.find(kb => kb.category === matchedDept);
  if (kbMatch) {
    suggestedResponse = kbMatch.response;
  }

  // 5. Establish Departmental SLAs
  let slaLimitHours = 4; // Default Support SLA is 4 hours
  if (matchedDept === 'Finance') slaLimitHours = 2; // Finance SLA is tight (2 hours)
  if (matchedDept === 'Sales') slaLimitHours = 12; // Sales leads SLA is 12 hours

  const now = new Date();
  const slaBreachTime = new Date(now.getTime() + slaLimitHours * 60 * 60 * 1000);

  const durationMs = Date.now() - startTime;

  // 6. Assemble the Ticket
  const ticket: Ticket = {
    id: uuidv4(),
    customerId,
    channel: params.channel,
    channelMessageId: params.channelMessageId,
    departmentQueue: matchedDept,
    status: 'Open',
    intentClassification,
    confidenceScore,
    sentiment,
    suggestedResponse,
    subject: params.channel === 'Email' ? 'New Email Inquiry' : `${params.channel} Chat Session`,
    body: params.body,
    mediaUrls: params.mediaUrls || [],
    chatHistory: [
      {
        id: `msg-${uuidv4()}`,
        sender: 'Customer',
        body: params.body,
        createdAt: now
      }
    ],
    createdAt: now,
    updatedAt: now,
    ingestionDurationMs: durationMs,
    slaLimitHours,
    slaBreachTime,
    isSlaBreached: false
  };

  return { ticket, customerProfile, durationMs };
}

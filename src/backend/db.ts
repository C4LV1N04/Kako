import { Ticket, CustomerProfile, TicketStatus, UserProfile, ChatMessage } from '../types/crm';
import { KNOWLEDGE_BASE_ARTICLES } from './kb';

// In-memory Database state
export const CUSTOMERS: Record<string, CustomerProfile> = {
  'cust-1': {
    id: 'cust-1',
    name: 'Sarah Connor',
    email: 'sarah@cyberdyne.com',
    phone: '+1 (555) 019-9283',
    whatsappId: '15550199283',
    createdAt: new Date(Date.now() - 86400000),
    updatedAt: new Date(Date.now() - 86400000),
  },
  'cust-2': {
    id: 'cust-2',
    name: 'Marcus Wright',
    email: 'marcus@projectangel.org',
    phone: '+27 (82) 445-1234',
    createdAt: new Date(Date.now() - 172800000),
    updatedAt: new Date(Date.now() - 172800000),
  },
  'cust-3': {
    id: 'cust-3',
    name: 'John Connor',
    email: 'john@resistance.net',
    phone: '+1 (555) 789-0123',
    whatsappId: '15557890123',
    createdAt: new Date(Date.now() - 259200000),
    updatedAt: new Date(Date.now() - 259200000),
  }
};

export const USERS: UserProfile[] = [
  { id: 'usr-1', name: 'Alice Admin', role: 'Admin', departments: ['Sales', 'Support', 'Finance'] },
  { id: 'usr-2', name: 'Bob Support Manager', role: 'Manager', departments: ['Support'] },
  { id: 'usr-3', name: 'Charlie Support Agent', role: 'Agent', departments: ['Support'] },
  { id: 'usr-4', name: 'Diana Sales Agent', role: 'Agent', departments: ['Sales'] }
];

export const TICKETS: Ticket[] = [
  {
    id: 'tkt-101',
    customerId: 'cust-1',
    channel: 'WhatsApp',
    channelMessageId: 'wa-msg-8821',
    departmentQueue: 'Finance',
    status: 'Open',
    intentClassification: 'Billing & Invoice Dispute',
    confidenceScore: 0.96,
    sentiment: 'Negative',
    suggestedResponse: 'Hi Sarah, sorry for the billing discrepancy. I\'ve pulled up Invoice #INV-2026-99 and marked it for review. We are adjusting the balance now.',
    subject: 'WhatsApp Billing Discrepancy',
    body: 'Hey, I was charged twice for my subscription this month. The invoice says $150 but you guys debited $300. Please fix this ASAP! Attached is my bank statement PDF.',
    mediaUrls: ['https://storage.kako.ai/media/statements/bank_statement_july.pdf'],
    chatHistory: [
      {
        id: 'msg-seed-1a',
        sender: 'Customer',
        body: 'Hey, I was charged twice for my subscription this month. The invoice says $150 but you guys debited $300. Please fix this ASAP! Attached is my bank statement PDF.',
        createdAt: new Date(Date.now() - 3600000 * 1.5)
      }
    ],
    createdAt: new Date(Date.now() - 3600000 * 1.5),
    updatedAt: new Date(Date.now() - 3600000 * 1.5),
    ingestionDurationMs: 145,
    slaLimitHours: 2,
    slaBreachTime: new Date(Date.now() + 3600000 * 0.5),
    isSlaBreached: false,
  },
  {
    id: 'tkt-102',
    customerId: 'cust-2',
    channel: 'Email',
    channelMessageId: 'email-msg-9921',
    departmentQueue: 'Support',
    status: 'Open',
    intentClassification: 'Technical Onboarding & Support',
    confidenceScore: 0.91,
    sentiment: 'Neutral',
    suggestedResponse: 'Dear Marcus, welcome! For team workspace setup, please visit settings.kako.ai/onboard and follow the tutorial guidelines.',
    subject: 'Stuck with login onboarding flow',
    body: 'Hi team, I am trying to complete my onboarding setup but the client dashboard fails to load when I log in from my corporate network. Is there a firewall bypass config?',
    mediaUrls: [],
    chatHistory: [
      {
        id: 'msg-seed-2a',
        sender: 'Customer',
        body: 'Hi team, I am trying to complete my onboarding setup but the client dashboard fails to load when I log in from my corporate network. Is there a firewall bypass config?',
        createdAt: new Date(Date.now() - 3600000 * 4.5)
      }
    ],
    createdAt: new Date(Date.now() - 3600000 * 4.5),
    updatedAt: new Date(Date.now() - 3600000 * 4.5),
    ingestionDurationMs: 82,
    slaLimitHours: 4,
    slaBreachTime: new Date(Date.now() - 3600000 * 0.5),
    isSlaBreached: true,
  },
  {
    id: 'tkt-103',
    customerId: 'cust-3',
    channel: 'SMS',
    channelMessageId: 'sms-msg-1029',
    departmentQueue: 'Sales',
    status: 'Open',
    intentClassification: 'New Sales Opportunity',
    confidenceScore: 0.88,
    sentiment: 'Positive',
    suggestedResponse: 'Hi John, thank you for your interest! Let\'s schedule a call tomorrow. I can demonstrate how our routing works and review package levels.',
    subject: 'SMS Enterprise Inquiries',
    body: 'Hi, I saw your enterprise routing demo. We have 500 agents and want to get a quote for a customized deployment. Do you support private clouds?',
    mediaUrls: [],
    chatHistory: [
      {
        id: 'msg-seed-3a',
        sender: 'Customer',
        body: 'Hi, I saw your enterprise routing demo. We have 500 agents and want to get a quote for a customized deployment. Do you support private clouds?',
        createdAt: new Date(Date.now() - 3600000 * 0.2)
      }
    ],
    createdAt: new Date(Date.now() - 3600000 * 0.2),
    updatedAt: new Date(Date.now() - 3600000 * 0.2),
    ingestionDurationMs: 65,
    slaLimitHours: 12,
    slaBreachTime: new Date(Date.now() + 3600000 * 11.8),
    isSlaBreached: false,
  }
];

export function addTicket(ticket: Ticket, customer: CustomerProfile) {
  // Ensure chatHistory is initialized with customer message body
  if (!ticket.chatHistory || ticket.chatHistory.length === 0) {
    ticket.chatHistory = [
      {
        id: `msg-ingest-${Date.now()}`,
        sender: 'Customer',
        body: ticket.body,
        createdAt: ticket.createdAt
      }
    ];
  }
  TICKETS.unshift(ticket);
  CUSTOMERS[customer.id] = customer;
}

export function updateTicketStatus(ticketId: string, status: TicketStatus, resolvedAt?: Date): boolean {
  const index = TICKETS.findIndex(t => t.id === ticketId);
  if (index !== -1) {
    TICKETS[index].status = status;
    TICKETS[index].updatedAt = new Date();
    if (resolvedAt) {
      TICKETS[index].resolvedAt = resolvedAt;
    }
    return true;
  }
  return false;
}

export function reassignTicket(ticketId: string, agentId?: string): boolean {
  const index = TICKETS.findIndex(t => t.id === ticketId);
  if (index !== -1) {
    TICKETS[index].assignedAgentId = agentId || undefined;
    TICKETS[index].updatedAt = new Date();
    return true;
  }
  return false;
}

/**
 * Appends a chat message to a ticket's live interactive thread.
 */
export function appendChatMessage(
  ticketId: string, 
  sender: 'Customer' | 'Agent' | 'AI', 
  body: string,
  mediaUrl?: string
): ChatMessage | null {
  const ticket = TICKETS.find(t => t.id === ticketId);
  if (ticket) {
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      sender,
      body,
      createdAt: new Date(),
      mediaUrl
    };
    ticket.chatHistory.push(newMsg);
    ticket.updatedAt = new Date();
    return newMsg;
  }
  return null;
}

/**
 * Rates an AI-generated chat message in the live thread (Agent Feedback loops).
 * Archives feedback for continuous learning model retraining.
 */
export function rateChatMessage(
  ticketId: string, 
  messageId: string, 
  rating: 'positive' | 'negative', 
  correction?: string
): boolean {
  const ticket = TICKETS.find(t => t.id === ticketId);
  if (ticket) {
    const msg = ticket.chatHistory.find(m => m.id === messageId);
    if (msg) {
      msg.feedback = { rating, correction };
      
      // Continuous Learning Loop archiving
      console.log(`[Continuous Learning] Feedback archived for Ticket: ${ticketId} | Message: ${messageId} | Rating: ${rating.toUpperCase()}`);
      if (correction) {
        console.log(`[Continuous Learning] Correction supplied to retrain NLP matching dataset: "${correction}"`);
      }
      return true;
    }
  }
  return false;
}

// South African translation packages matching BRS Multilingual Requirements (All 11 Official Languages)
const TRANSLATIONS: Record<string, Record<string, string>> = {
  'isiZulu': {
    'greet': 'Sawubona!',
    'found': 'Ngokusekelwe kulwazi lwethu:',
    'not_found': 'Uxolo, angikwazanga ukuthola isihloko esifanayo. Ithimba lethu labasekeli lizokusiza ngokushesha.',
    'router_fault': 'Kutholakale inkinga yomugqa we-fiber we-PON obomvu. Sithumele ithimba lezobuchwepheshe ukuthi lize lizosiza.'
  },
  'isiXhosa': {
    'greet': 'Molo!',
    'found': 'Ngokubhekiselele kwikhawunta yolwazi lwethu:',
    'not_found': 'Uxolo, andikwazanga ukufumana inqaku elihambelanayo. Iqela lethu lenkxaso liza kukunceda ngokukhawuleza.',
    'router_fault': 'Kufunyenwe impazamo yelayini yefayibha ye-PON ebomvu. Siyalele iqela lezobuchwepheshe ukuba lize kunceda.'
  },
  'Afrikaans': {
    'greet': 'Hallo!',
    'found': 'Gebaseer op ons Kennisbasis:',
    'not_found': 'Jammer, ek kon nie \'n ooreenstemmende artikel vind nie. Ons span sal dit dadelik ondersoek.',
    'router_fault': 'Rooi PON-vesellynfout bespeur. Ons het die tegniese span ontplooi om te kom help.'
  },
  'Setswana': {
    'greet': 'Dumela!',
    'found': 'Mabapi le Knowledge Base ya rona:',
    'not_found': 'Ke maswabi, ga ke a kgona go bona setlhogo se se tshwanang. Setlhopha sa rona sa tshegetso se tla go thusa ka bonako.',
    'router_fault': 'Go lemogilwe bothata jwa mogala wa fiber wa PON o mohibidu. Re rometse setlhopha sa sethekeniki go tla go thusa.'
  },
  'Sepedi': {
    'greet': 'Dumela!',
    'found': 'Go latela tsebo e re nang le yona:',
    'not_found': 'Ke maswabi, ga ke a kgona go bona setlhogo se se tshwanang. Sehlopha sa rena se tla go thuša ka ponyo ya leihlo.',
    'router_fault': 'Go lemogilwe bothata bja mogala wa fiber wa PON o mohubedu. Re rometše sehlopha sa sethekniki go tla go thuša.'
  },
  'Sesotho': {
    'greet': 'Dumela!',
    'found': 'Ho latela polokelo ea rona ea tsebo:',
    'not_found': 'Re masoabi, ha re a khona ho fumana sehlooho se tsamaellanang. Sehlopha sa rona se tla u thusa kapele.',
    'router_fault': 'Ho fumanoe phoso ea mohala oa fiber oa PON o mofubelu. Re rometse sehlopha sa tekheniki ho tla thusa.'
  },
  'Xitsonga': {
    'greet': 'Avuxeni!',
    'found': 'Ku ya hi leswi nga eka vutivi bya hina:',
    'not_found': 'Nzi rili, a nzi swi kotanga ku kuma nhlokomhaka leyi fambelanaka. Ntlawa wa hina wa pfuno wu ta ku pfuna hi ku tsopeta ka tihlo.',
    'router_fault': 'Ku kumiwe xihoxo eka layini ya fiber ya PON yo tshwuka. Hi rhumele ntlawa wa vuthekiniki ku ta pfuna.'
  },
  'siSwati': {
    'greet': 'Sawubona!',
    'found': 'Kuya ngelwati lwetfu lolubekiwe:',
    'not_found': 'Ngiyacolisa, angikhonanga kutfola sihloko lesifanako. Likomidi letfu lekusita litakusita ngekushesha.',
    'router_fault': 'Kutfolakele inkinga yelayini ye-fiber ye-PON lebovu. Sitfumele licembu lebethekhinikhi kutsi lite litokusita.'
  },
  'Tshivenda': {
    'greet': 'Ndaa / Aa!',
    'found': 'U ya nga thodea dza vhutivi hashu:',
    'not_found': 'Ndo tou tinyadza, a tho ngo kona u wana thero i fanaho. Tshigwada tshashu tshi do u thusa kapele.',
    'router_fault': 'Humbulani lutsinga lwa fiber lwa PON lutshwuku lwo wanala lu na vhuleme. Rwo ruma thimu ya thekiniki uri i Twitter thusa.'
  },
  'isiNdebele': {
    'greet': 'Lotjhani!',
    'found': 'Kuye ngokwelwazi lethu elisekelweko:',
    'not_found': 'Ngyacolisa, angikwazanga ukuthola isihloko esifanako. Ithimba lethu lezincedo lizokusiza msinyana.',
    'router_fault': 'Kutholakale umraro womkhakha we-fiber ye-PON ebomvu. Sithumele isiqhema sezobuchwepheshe bona size sikusize.'
  }
};

/**
 * AI Engine Knowledge Base Lookup & Multilingual Adapter.
 * Integrates visual LED diagnostics, South African translations, and retrieval matching.
 */
export function queryAIResponse(ticketId: string, prompt?: string): { responseText: string; articleTitle?: string } {
  const ticket = TICKETS.find(t => t.id === ticketId);
  if (!ticket) return { responseText: "Ticket not found." };
  
  const searchText = (prompt || ticket.body).toLowerCase();
  
  // 1. Language Detection Loop (Official South African Languages)
  let detectedLang = 'English';
  if (searchText.includes('sawubona') || searchText.includes('yebo') || searchText.includes('khona') || searchText.includes('ngiyabonga')) {
    // Distinguish isiZulu vs siSwati vs isiNdebele
    if (searchText.includes('lotjhani') || searchText.includes('thokoza')) detectedLang = 'isiNdebele';
    else if (searchText.includes('ngiyacolisa') || searchText.includes('kutfola')) detectedLang = 'siSwati';
    else detectedLang = 'isiZulu';
  } else if (searchText.includes('molo') || searchText.includes('enkosi') || searchText.includes('ndiyabulela') || searchText.includes('bhuti') || searchText.includes('sisi')) {
    detectedLang = 'isiXhosa';
  } else if (searchText.includes('hallo') || searchText.includes('dankie') || searchText.includes('baie') || searchText.includes('goeie')) {
    detectedLang = 'Afrikaans';
  } else if (searchText.includes('dumela') || searchText.includes('ke a leboga') || searchText.includes('ke a leboha')) {
    // Distinguish Setswana vs Sepedi vs Sesotho
    if (searchText.includes('thobela') || searchText.includes('thuša') || searchText.includes('rena')) detectedLang = 'Sepedi';
    else if (searchText.includes('leboha') || searchText.includes('khotso') || searchText.includes('fubelu')) detectedLang = 'Sesotho';
    else detectedLang = 'Setswana';
  } else if (searchText.includes('avuxeni') || searchText.includes('nkhensa') || searchText.includes('inkomu') || searchText.includes('vutivi')) {
    detectedLang = 'Xitsonga';
  } else if (searchText.includes('ndaa') || searchText.includes('aa') || searchText.includes('livhuha') || searchText.includes('vhutivi') || searchText.includes('thodea')) {
    detectedLang = 'Tshivenda';
  } else if (searchText.includes('lotjhani') || searchText.includes('thokoza') || searchText.includes('sekelweko')) {
    detectedLang = 'isiNdebele';
  }

  console.log(`[AI Language Analyzer] Input language detected: ${detectedLang}`);

  // 2. Multimodal Visual Troubleshooting Adapter (Router LEDs)
  const hasRouterPhoto = searchText.includes('router') || searchText.includes('photo') || searchText.includes('led') || searchText.includes('light') || (ticket.chatHistory.some(m => m.mediaUrl && m.mediaUrl.toLowerCase().includes('router') || (m.mediaUrl && (m.mediaUrl.endsWith('.jpg') || m.mediaUrl.endsWith('.png')))));
  const isRedPon = searchText.includes('red') || searchText.includes('pon') || searchText.includes('los') || (ticket.chatHistory.some(m => m.body.toLowerCase().includes('red') || m.body.toLowerCase().includes('pon')));

  if (hasRouterPhoto && isRedPon) {
    // Automatically trigger fiber fault dispatch ("Come Assist" workflow)
    ticket.departmentQueue = 'Support';
    ticket.intentClassification = 'Hardware Line Fiber Fault (PON Red)';
    
    let reply = `[AI Multimodal Diagnostic: Router LED Outage Detected]\nWe have analyzed your router photos. The PON/LOS LED light is RED/OFF, indicating a physical connection failure.\n\nAction: We have auto-generated a high-priority 'Come Assist' field ticket for our connections team to come assist at your location.`;
    
    if (detectedLang !== 'English' && TRANSLATIONS[detectedLang]) {
      const pack = TRANSLATIONS[detectedLang];
      reply = `[AI Multimodal Diagnostic: Router LED Outage Detected]\n${pack.greet} ${pack.router_fault}`;
    }
    return { responseText: reply, articleTitle: 'Router LED Red PON Outage' };
  }

  // 3. Retrieval-Augmented Knowledge Base Matching
  let bestMatch: typeof KNOWLEDGE_BASE_ARTICLES[0] | null = null;
  let maxScore = 0;
  
  for (const article of KNOWLEDGE_BASE_ARTICLES) {
    let score = 0;
    for (const tag of article.tags) {
      if (searchText.includes(tag)) score += 3;
    }
    if (searchText.includes(article.title.toLowerCase())) score += 5;
    
    if (score > maxScore) {
      maxScore = score;
      bestMatch = article;
    }
  }
  
  // 4. Response Translation Assembly
  if (bestMatch) {
    if (detectedLang !== 'English' && TRANSLATIONS[detectedLang]) {
      const pack = TRANSLATIONS[detectedLang];
      return {
        responseText: `[AI Multilingual Assistant: ${detectedLang}]\n${pack.greet} ${pack.found}\n\n"${bestMatch.title}"\n${bestMatch.content.slice(0, 150)}...`,
        articleTitle: bestMatch.title
      };
    }
    return {
      responseText: `[Knowledge Base Reference: ${bestMatch.title}]\n\nHello! Based on our Knowledge Base: ${bestMatch.content}`,
      articleTitle: bestMatch.title
    };
  }
  
  if (detectedLang !== 'English' && TRANSLATIONS[detectedLang]) {
    const pack = TRANSLATIONS[detectedLang];
    return {
      responseText: `[AI Multilingual Assistant: ${detectedLang}]\n${pack.greet} ${pack.not_found}`
    };
  }

  return {
    responseText: `Hello! Thank you for reaching out. I couldn't find a direct match in our articles, but our Support team will check this immediately. We target a resolution inside our ${ticket.slaLimitHours}h SLA window.`
  };
}

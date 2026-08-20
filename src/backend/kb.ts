import { KnowledgeBaseArticle } from '../types/crm';

export const KNOWLEDGE_BASE_ARTICLES: KnowledgeBaseArticle[] = [
  // 1. Finance Articles
  {
    id: 'kb-fin-101',
    title: 'Refund Policy & Processing SLA',
    category: 'Finance',
    tags: ['refund', 'charge', 'money', 'payment'],
    content: `KaKo refund policy permits refunds within 30 days of purchase for double charges or service failures. 
To process a refund:
1. Verify the transaction charge ID in the Billing Panel.
2. Confirm the ERP Sync returns a clean status.
3. Click 'Resolve' to mark the ticket closed.
The refund will credit back to the customer's card within 2 to 5 business days.`
  },
  {
    id: 'kb-fin-102',
    title: 'Discrepancies in Monthly Subscription Invoices',
    category: 'Finance',
    tags: ['invoice', 'billing', 'price', 'fee'],
    content: `If a customer is overbilled or charged an incorrect invoice balance:
1. Cross-reference the subscription license count against corporate ERP logs.
2. If incorrect, generate an invoice credit note in the Billing engine.
3. Reply to the customer outlining the credit adjustment and sync the record to Billing.`
  },

  // 2. Support Articles
  {
    id: 'kb-sup-201',
    title: 'Onboarding Portal Login Errors & Firewall Bypass',
    category: 'Support',
    tags: ['onboarding', 'login', 'firewall', 'error', 'setup'],
    content: `Customers trying to log in to our client onboarding portal from restricted corporate networks may face firewall restrictions.
To resolve:
1. Ask the IT manager to whitelist port 443 and domain '*.kako.ai'.
2. Recommend logging in over a direct cellular connection/VPN to verify the domain resolves.
3. If they continue to experience blank screens, clear the browser local cache and cookie session state.`
  },
  {
    id: 'kb-sup-202',
    title: 'Resetting Onboarding Password Credential Tokens',
    category: 'Support',
    tags: ['password', 'reset', 'token', 'credentials'],
    content: `If a user fails to receive an onboarding password token email:
1. Check the customer profile details in the CRM.
2. Trigger a manual reset email link from the User Accounts settings.
3. Verify that outbound mail gateways are functioning and the email is not in spam.`
  },

  // 3. Sales Articles
  {
    id: 'kb-sal-301',
    title: 'Enterprise Custom Deployment & Private Cloud Options',
    category: 'Sales',
    tags: ['enterprise', 'cloud', 'private', 'quote', 'demo'],
    content: `KaKo AI & Routing Engine supports private cloud self-hosted deployments (AWS, Azure, GCP, or On-Premise Kubernetes) for enterprise customers with over 150 agent seats.
Features included:
- End-to-end data encryption keys owned by client.
- Dedicated VPC configurations.
- Enterprise custom SLA support.
To follow up, invite the client to register a personalized roadmap call with our Solutions Architects.`
  },
  {
    id: 'kb-sal-302',
    title: 'Licensing Packages & Agent Seat Cost Breakdown',
    category: 'Sales',
    tags: ['pricing', 'cost', 'licenses', 'seats', 'contract'],
    content: `Our licensing model is tiered as follows:
- Growth: $29/seat/month (Up to 10 agents, public cloud, standard SLAs).
- Scale: $59/seat/month (Up to 50 agents, public cloud, priority SLAs, WhatsApp integration).
- Enterprise: Custom quoting (Dedicated seat plans, private cloud, custom SLAs, full ERP/Billing API integrations).`
  }
];

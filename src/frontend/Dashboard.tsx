import React, { useState, useEffect } from 'react';
import { Ticket, CustomerProfile, Department, UserProfile, KnowledgeBaseArticle } from '../types/crm';
import { TicketList } from './components/TicketList';
import { TicketDetail } from './components/TicketDetail';
import { SmartResponsePanel } from './components/SmartResponsePanel';
import { ActionBar } from './components/ActionBar';
import { AnalyticsPanel } from './components/AnalyticsPanel';
import { WebhookSimulator } from './components/WebhookSimulator';

export const Dashboard: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [customers, setCustomers] = useState<Record<string, CustomerProfile>>({});
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [kbArticles, setKbArticles] = useState<KnowledgeBaseArticle[]>([]);
  const [activeUser, setActiveUser] = useState<UserProfile | null>(null);
  
  const [selectedTicketId, setSelectedTicketId] = useState<string>('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<Department | 'All'>('All');
  const [isLoading, setIsLoading] = useState(true);
  const [isRetraining, setIsRetraining] = useState(false);

  // 1. Fetch initial tickets, customers, users, and KB articles from Express server
  const fetchTicketsCustomersAndUsers = async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    try {
      const ticketsRes = await fetch('/api/tickets');
      const customersRes = await fetch('/api/customers');
      const usersRes = await fetch('/api/users');
      const kbRes = await fetch('/api/kb');
      
      if (ticketsRes.ok && customersRes.ok && usersRes.ok && kbRes.ok) {
        const ticketData: Ticket[] = await ticketsRes.json();
        const customerData: Record<string, CustomerProfile> = await customersRes.json();
        const userData: UserProfile[] = await usersRes.json();
        const kbData: KnowledgeBaseArticle[] = await kbRes.json();
        
        setTickets(ticketData);
        setCustomers(customerData);
        setUsers(userData);
        setKbArticles(kbData);
        
        // Default select Alice Admin if not logged in
        if (userData.length > 0 && !activeUser) {
          setActiveUser(userData[0]);
        }
      }
    } catch (error) {
      console.error('Error synchronising with backend API:', error);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTicketsCustomersAndUsers(true);
  }, []);

  // 2. Real-time Polling to capture incoming simulated webhooks instantly
  useEffect(() => {
    const pollInterval = setInterval(() => {
      fetchTicketsCustomersAndUsers(false);
    }, 1500);

    return () => clearInterval(pollInterval);
  }, [selectedTicketId, activeUser]);

  // Adjust active ticket list and select targets based on role clearances
  const visibleTickets = tickets.filter((t) => {
    if (!activeUser) return true;
    if (activeUser.role === 'Admin') return true;
    // Agent / Manager department restrictions
    return activeUser.departments.includes(t.departmentQueue);
  });

  // Automatically adjust selected ticket if the active one gets filtered out
  useEffect(() => {
    if (visibleTickets.length > 0) {
      const activeExists = visibleTickets.some((t) => t.id === selectedTicketId);
      if (!activeExists) {
        // Auto-select first cleared ticket
        setSelectedTicketId(visibleTickets[0].id);
      }
    } else {
      setSelectedTicketId('');
    }
  }, [activeUser, tickets, selectedTicketId]);

  const activeTicket = tickets.find((t) => t.id === selectedTicketId);
  const activeCustomer = activeTicket ? customers[activeTicket.customerId] : undefined;

  // Filter historical tickets for the active customer, excluding the current active ticket
  const historicalTickets = activeTicket
    ? tickets.filter((t) => t.customerId === activeTicket.customerId && t.id !== activeTicket.id)
    : [];

  const handleSelectTicket = (id: string) => {
    setSelectedTicketId(id);
  };

  // Switch session profiles
  const handleUserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const usr = users.find((u) => u.id === e.target.value);
    if (usr) {
      setActiveUser(usr);
      setSelectedDeptFilter('All'); // Reset filter tab
    }
  };

  // Send a custom chat message to the thread
  const handleSendMessage = async (body: string, sender: 'Agent' | 'Customer', mediaUrl?: string) => {
    if (!activeTicket || !activeUser) return;

    // Auto-assign to active agent if unassigned and Agent replies
    if (!activeTicket.assignedAgentId && activeUser.role === 'Agent' && sender === 'Agent') {
      await handleAssignTicket(activeTicket.id, activeUser.id);
    }

    try {
      const chatRes = await fetch(`/api/tickets/${activeTicket.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender, body, mediaUrl }),
      });

      if (chatRes.ok) {
        // Auto-progress status to In_Progress on Agent reply
        if (sender === 'Agent' && activeTicket.status === 'Open') {
          await fetch(`/api/tickets/${activeTicket.id}/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'In_Progress' }),
          });
        }
        await fetchTicketsCustomersAndUsers(false);
      }
    } catch (err) {
      console.error('Failed to post chat message:', err);
    }
  };

  // Trigger outbound reply from Smart Assist Panel
  const handleSendResponse = async (responseText: string) => {
    await handleSendMessage(responseText, 'Agent');
  };

  // Trigger Autonomous AI response using KB lookup
  const handleAIGenerateReply = async () => {
    if (!activeTicket) return;
    try {
      const res = await fetch(`/api/tickets/${activeTicket.id}/ai-reply`, {
        method: 'POST',
      });
      if (res.ok) {
        await fetchTicketsCustomersAndUsers(false);
      }
    } catch (err) {
      console.error('Failed to trigger autonomous AI reply:', err);
    }
  };

  // Submit Agent Feedback on AI responses (Continuous Learning loop)
  const handleFeedbackSubmit = async (messageId: string, rating: 'positive' | 'negative', correction?: string) => {
    if (!activeTicket) return;
    try {
      await fetch(`/api/tickets/${activeTicket.id}/messages/${messageId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, correction }),
      });
    } catch (err) {
      console.error('Failed to log AI reply feedback:', err);
    }
  };

  // Retrain NLP & image classification models (Admin trigger)
  const handleRetrainAI = async () => {
    setIsRetraining(true);
    // Simulate background GPU/ML processing latency (1.8s)
    await new Promise(resolve => setTimeout(resolve, 1800));
    setIsRetraining(false);
    alert("Model Retrained Successfully!\n\nFeedback loop transcripts and visual router LED photos have been scanned and integrated. Ingestion matching accuracy updated.");
  };

  // Update status to Resolved
  const handleResolveTicket = async (ticketId: string) => {
    if (!activeTicket || !activeUser) return;

    // Claim ticket if unassigned and resolve
    if (!activeTicket.assignedAgentId && activeUser.role === 'Agent') {
      await handleAssignTicket(activeTicket.id, activeUser.id);
    }

    try {
      const res = await fetch(`/api/tickets/${ticketId}/resolve`, {
        method: 'POST',
      });

      if (res.ok) {
        setTickets((prev) =>
          prev.map((t) =>
            t.id === ticketId
              ? { ...t, status: 'Resolved', resolvedAt: new Date(), updatedAt: new Date() }
              : t
          )
        );
      } else {
        alert('Failed to resolve ticket.');
      }
    } catch (err) {
      console.error('Failed to resolve ticket:', err);
    }
  };

  // Assign ticket to an agent
  const handleAssignTicket = async (ticketId: string, agentId?: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId }),
      });

      if (res.ok) {
        setTickets((prev) =>
          prev.map((t) =>
            t.id === ticketId ? { ...t, assignedAgentId: agentId || undefined, updatedAt: new Date() } : t
          )
        );
        return true;
      }
    } catch (err) {
      console.error('Failed to reassign ticket:', err);
    }
    return false;
  };

  // Sync details to ERP / Billing systems
  const handleSyncExternalAPI = async (ticketId: string, system: 'ERP' | 'Billing'): Promise<boolean> => {
    console.log(`[API-Sync] Synchronising ticket ${ticketId} to external system: ${system}...`);
    await new Promise((resolve) => setTimeout(resolve, 800));
    return true;
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white font-sans antialiased">
      {/* Top Navigation Bar */}
      <header className="bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center font-bold text-white text-lg shadow-md shadow-red-600/30">
            K
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight">KaKo AI & Routing Engine</h1>
            <p className="text-[10px] text-zinc-400">Omnichannel Support Operations CRM</p>
          </div>
        </div>
        
        {/* Interactive Ingestion Simulator & Session Selectors */}
        <div className="flex items-center gap-4">
          {/* Admin Retrain Button */}
          {activeUser?.role === 'Admin' && (
            <button
              onClick={handleRetrainAI}
              disabled={isRetraining}
              className="px-3.5 py-1.5 bg-black border border-red-900 hover:border-red-600 text-red-400 rounded-lg text-xs font-semibold hover:bg-red-950/20 transition flex items-center gap-1.5"
            >
              🔄 {isRetraining ? 'Retraining Models...' : 'Retrain AI Models'}
            </button>
          )}

          {/* RBAC Session Switcher */}
          {activeUser && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Session Profile:</span>
              <select
                value={activeUser.id}
                onChange={handleUserChange}
                className="bg-black border border-zinc-800 text-xs px-2.5 py-1.5 rounded-lg text-white font-semibold focus:outline-none focus:border-red-500 cursor-pointer"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="h-6 w-[1px] bg-zinc-800"></div>

          <WebhookSimulator onSimulationComplete={() => fetchTicketsCustomersAndUsers(false)} />
          
          <div className="h-6 w-[1px] bg-zinc-800"></div>
          
          <span className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            AI Engine: Active
          </span>
        </div>
      </header>

      {/* Main Workspace Layout */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center bg-black">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-zinc-400">Loading KaKo CRM Workspace...</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Left Side: Ticket List */}
          <TicketList
            tickets={visibleTickets}
            selectedTicketId={selectedTicketId}
            onSelectTicket={handleSelectTicket}
            selectedDeptFilter={selectedDeptFilter}
            onDeptFilterChange={setSelectedDeptFilter}
            activeUser={activeUser || undefined}
          />

          {/* Center Section: Chat thread & Action Bar */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <TicketDetail
              ticket={activeTicket}
              customer={activeCustomer}
              historicalTickets={historicalTickets}
              onSendMessage={handleSendMessage}
              onFeedbackSubmit={handleFeedbackSubmit}
            />
            <ActionBar
              ticket={activeTicket}
              activeUser={activeUser || undefined}
              agents={users}
              onResolveTicket={handleResolveTicket}
              onSyncExternalAPI={handleSyncExternalAPI}
              onAssignTicket={handleAssignTicket}
            />
          </div>

          {/* Right Section: KB & AI Response Assistant */}
          <SmartResponsePanel
            ticket={activeTicket}
            kbArticles={kbArticles}
            onSendResponse={handleSendResponse}
            onAIGenerateReply={handleAIGenerateReply}
          />
        </div>
      )}

      {/* Bottom Analytics Strip */}
      <AnalyticsPanel tickets={tickets} activeUser={activeUser || undefined} />
    </div>
  );
};

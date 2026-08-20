import React, { useState, useEffect, useRef } from 'react';
import { Ticket, CustomerProfile } from '../../types/crm';

interface TicketDetailProps {
  ticket?: Ticket;
  customer?: CustomerProfile;
  historicalTickets?: Ticket[];
  onSendMessage?: (body: string, sender: 'Agent' | 'Customer', mediaUrl?: string) => void;
  onFeedbackSubmit?: (messageId: string, rating: 'positive' | 'negative', correction?: string) => Promise<void>;
}

export const TicketDetail: React.FC<TicketDetailProps> = ({
  ticket,
  customer,
  historicalTickets = [],
  onSendMessage,
  onFeedbackSubmit,
}) => {
  const [inputText, setInputText] = useState('');
  const [inputMediaUrl, setInputMediaUrl] = useState('');
  const [feedbackStates, setFeedbackStates] = useState<Record<string, { rating: 'positive' | 'negative', correctionText?: string, submitted: boolean, showingCorrectionInput?: boolean }>>({});
  const [correctionTempText, setCorrectionTempText] = useState<Record<string, string>>({});
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const prevTicketIdRef = useRef<string | undefined>(undefined);

  // Scroll to chat bottom conditionally (prevents snapping viewport down when scrolled up)
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container || !ticket) return;

    const isDifferentTicket = prevTicketIdRef.current !== ticket.id;
    prevTicketIdRef.current = ticket.id;

    if (isDifferentTicket) {
      // Force scroll to bottom immediately on ticket change
      container.scrollTop = container.scrollHeight;
      return;
    }

    // For updates (e.g. polling ticks), scroll ONLY if user is already near bottom
    const threshold = 150;
    const isNearBottom = container.scrollHeight - container.clientHeight - container.scrollTop < threshold;
    if (isNearBottom) {
      container.scrollTop = container.scrollHeight;
    }
  }, [ticket?.chatHistory, ticket?.id]);

  if (!ticket || !customer) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-black text-zinc-400 p-8">
        <svg
          className="w-16 h-16 text-zinc-800 mb-4 animate-pulse"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <p className="text-lg font-medium text-white">No Ticket Selected</p>
        <p className="text-sm text-zinc-500 mt-1">Select a ticket from the left panel to begin working</p>
      </div>
    );
  }

  const now = new Date().getTime();
  const breachTime = new Date(ticket.slaBreachTime).getTime();
  const msLeft = breachTime - now;
  const isBreached = msLeft < 0;
  const hoursLeftStr = isBreached
    ? `Breached by ${Math.abs(Math.floor(msLeft / 3600000))}h`
    : `${Math.floor(msLeft / 3600000)}h remaining`;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !inputMediaUrl.trim()) return;
    if (onSendMessage) {
      onSendMessage(inputText.trim(), 'Agent', inputMediaUrl.trim() || undefined);
    }
    setInputText('');
    setInputMediaUrl('');
  };

  const handleFeedbackRate = async (messageId: string, rating: 'positive' | 'negative') => {
    if (rating === 'positive') {
      if (onFeedbackSubmit) {
        await onFeedbackSubmit(messageId, 'positive');
      }
      setFeedbackStates(prev => ({
        ...prev,
        [messageId]: { rating: 'positive', submitted: true }
      }));
    } else {
      // Toggle correction input field for negative rating (Continuous Learning loop)
      setFeedbackStates(prev => ({
        ...prev,
        [messageId]: { rating: 'negative', submitted: false, showingCorrectionInput: true }
      }));
    }
  };

  const submitCorrection = async (messageId: string) => {
    const correction = correctionTempText[messageId] || '';
    if (onFeedbackSubmit) {
      await onFeedbackSubmit(messageId, 'negative', correction);
    }
    setFeedbackStates(prev => ({
      ...prev,
      [messageId]: { rating: 'negative', correctionText: correction, submitted: true, showingCorrectionInput: false }
    }));
  };

  return (
    <div className="flex-1 flex flex-col bg-black border-r border-zinc-900 text-white overflow-hidden">
      {/* Detail Header */}
      <div className="p-4 border-b border-zinc-900 bg-zinc-900/60 sticky top-0 backdrop-blur-md z-10">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-zinc-500 tracking-wider">TICKET ID: {ticket.id.slice(0, 8)}</span>
              <span
                className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  ticket.sentiment === 'Positive'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/30'
                    : ticket.sentiment === 'Negative'
                    ? 'bg-rose-950 text-rose-400 border border-rose-900/30'
                    : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {ticket.sentiment} Sentiment
              </span>
            </div>
            <h1 className="text-base font-bold text-white mt-1">
              {ticket.subject || 'Incoming customer interaction'}
            </h1>
          </div>
          <div className="text-right">
            <span
              className={`px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                isBreached
                  ? 'bg-rose-950 text-rose-400 border border-rose-800'
                  : 'bg-red-950 text-red-400 border border-red-900'
              }`}
            >
              {hoursLeftStr}
            </span>
            <p className="text-[10px] text-zinc-500 mt-2">SLA limit: {ticket.slaLimitHours} hours</p>
          </div>
        </div>
      </div>

      {/* Main split view: Chat window and CRM sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Feed Panel */}
        <div className="flex-1 flex flex-col bg-black overflow-hidden h-full border-r border-zinc-900/60">
          {/* Messages Feed */}
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
            {ticket.chatHistory && ticket.chatHistory.length > 0 ? (
              ticket.chatHistory.map((msg) => {
                const isAgent = msg.sender === 'Agent';
                const isAI = msg.sender === 'AI';
                const feedback = feedbackStates[msg.id] || msg.feedback;

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col max-w-[80%] ${
                      isAgent || isAI ? 'ml-auto items-end' : 'mr-auto items-start'
                    }`}
                  >
                    {/* Sender Label */}
                    <span className="text-[9px] text-zinc-500 mb-1 font-semibold">
                      {isAI ? '🤖 KaKo AI' : isAgent ? '👤 You (Agent)' : `👤 ${customer.name}`}
                    </span>

                    {/* Chat Bubble with optional media support */}
                    <div
                      className={`p-3 rounded-xl text-xs leading-relaxed whitespace-pre-line ${
                        isAI
                          ? 'bg-black border border-red-500 text-red-400 italic shadow-lg shadow-red-950/20'
                          : isAgent
                          ? 'bg-red-600 text-white font-medium'
                          : 'bg-zinc-900 text-zinc-200 border border-zinc-800'
                      }`}
                    >
                      {/* Image Support */}
                      {msg.mediaUrl && (
                        <div className="mb-2 max-w-full rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950">
                          <img
                            src={msg.mediaUrl}
                            alt="Ingested Upload"
                            className="max-h-40 object-contain mx-auto"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      {msg.body}
                    </div>

                    {/* Continuous Learning Feedback loop panel for AI responses */}
                    {isAI && (
                      <div className="mt-1 flex items-center gap-2">
                        {!feedback?.rating ? (
                          <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-850 px-2 py-0.5 rounded-full">
                            <span className="text-[8px] text-zinc-500 font-medium">Rate AI response:</span>
                            <button
                              onClick={() => handleFeedbackRate(msg.id, 'positive')}
                              className="text-[9px] hover:scale-125 transition"
                              title="Good Suggestion"
                            >
                              👍
                            </button>
                            <button
                              onClick={() => handleFeedbackRate(msg.id, 'negative')}
                              className="text-[9px] hover:scale-125 transition"
                              title="Incorrect Suggestion"
                            >
                              👎
                            </button>
                          </div>
                        ) : feedback.submitted ? (
                          <span className="text-[8px] text-emerald-400 font-medium">
                            ✓ {feedback.rating === 'positive' ? 'Voted Helpful' : 'Flagged for Model Retraining'}
                          </span>
                        ) : (
                          feedback.showingCorrectionInput && (
                            <div className="mt-1.5 p-2 bg-zinc-900 border border-zinc-800 rounded-lg flex flex-col gap-1.5 w-64 animate-fade-in text-left">
                              <span className="text-[8px] text-zinc-400 font-bold uppercase tracking-wider">Help retrain the AI:</span>
                              <input
                                type="text"
                                placeholder="Enter correct reply context..."
                                value={correctionTempText[msg.id] || ''}
                                onChange={(e) => setCorrectionTempText({ ...correctionTempText, [msg.id]: e.target.value })}
                                className="bg-black border border-zinc-800 text-[10px] p-1.5 rounded focus:outline-none focus:border-red-500 text-white"
                              />
                              <button
                                onClick={() => submitCorrection(msg.id)}
                                className="py-1 bg-red-650 bg-red-600 hover:bg-red-500 text-white text-[9px] font-bold rounded"
                              >
                                Submit Correction
                              </button>
                            </div>
                          )
                        )}
                      </div>
                    )}

                    {/* Timestamp */}
                    <span className="text-[8px] text-zinc-650 mt-1">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="text-center text-zinc-650 italic py-10 text-xs">No chat history available.</div>
            )}
          </div>

          {/* Chat Message Input Box & Optional Image attachments */}
          <div className="p-3 border-t border-zinc-900 bg-zinc-950 space-y-2">
            {/* Optional media Url field (Image support) */}
            <div className="flex gap-2 items-center">
              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Image Attachment:</span>
              <input
                type="text"
                placeholder="e.g. https://storage.kako.ai/media/router_lights.jpg"
                value={inputMediaUrl}
                onChange={(e) => setInputMediaUrl(e.target.value)}
                disabled={ticket.status === 'Resolved'}
                className="flex-1 bg-black border border-zinc-850 text-[10px] px-2 py-1 rounded focus:outline-none focus:border-red-500 text-white"
              />
              {inputMediaUrl.trim() && (
                <span className="text-[9px] text-red-400 font-semibold uppercase animate-pulse">✓ Ready to send</span>
              )}
            </div>

            <form onSubmit={handleSend} className="flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={ticket.status === 'Resolved'}
                placeholder={ticket.status === 'Resolved' ? "Ticket resolved. Reopen to chat." : "Type reply to customer..."}
                className="flex-1 bg-black border border-zinc-850 text-xs p-2.5 rounded-lg focus:outline-none focus:border-red-500 text-white placeholder-zinc-600 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={(!inputText.trim() && !inputMediaUrl.trim()) || ticket.status === 'Resolved'}
                className="px-4 bg-red-650 bg-red-600 hover:bg-red-500 disabled:bg-zinc-900 disabled:text-zinc-650 text-white rounded-lg text-xs font-semibold shadow-md shadow-red-600/10 transition"
              >
                Send
              </button>
            </form>
          </div>
        </div>

        {/* CRM Info Column */}
        <div className="w-80 overflow-y-auto p-4 space-y-5 bg-zinc-950/40">
          {/* Customer Profile Mini Card */}
          <div className="p-3 bg-zinc-900 border border-zinc-800/80 rounded-xl space-y-2">
            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Customer Profile</h3>
            <div className="space-y-1">
              <p className="text-[10px] text-zinc-400">Name</p>
              <p className="text-xs font-medium text-white">{customer.name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-zinc-400">Email Address</p>
              <p className="text-xs font-medium text-white truncate">{customer.email}</p>
            </div>
            {customer.phone && (
              <div className="space-y-1">
                <p className="text-[10px] text-zinc-400">Contact Number</p>
                <p className="text-xs font-medium text-white">{customer.phone}</p>
              </div>
            )}
          </div>

          {/* Attached Media / PDFs */}
          {ticket.mediaUrls && ticket.mediaUrls.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Attachments</h3>
              <div className="space-y-2">
                {ticket.mediaUrls.map((url, index) => {
                  const isPdf = url.toLowerCase().endsWith('.pdf');
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-2.5 p-2.5 bg-zinc-900 border border-zinc-800/60 rounded-xl hover:border-zinc-750 transition"
                    >
                      <span className="text-sm">{isPdf ? '📄' : '🖼️'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-zinc-300 font-medium truncate">
                          {url.split('/').pop() || `File_${index + 1}`}
                        </p>
                      </div>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-red-500 hover:text-red-400 font-semibold"
                      >
                        View
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Historical Interactions */}
          <div className="space-y-2">
            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">History</h3>
            <div className="space-y-2">
              {historicalTickets.length === 0 ? (
                <p className="text-[10px] text-zinc-500 italic">First interaction profile.</p>
              ) : (
                historicalTickets.map((hist) => (
                  <div
                    key={hist.id}
                    className="p-2.5 bg-zinc-900/30 border border-zinc-850 rounded-xl space-y-1.5"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-zinc-350 font-medium truncate max-w-[120px]">{hist.subject || 'Previous Inquiry'}</span>
                      <span className="text-[8px] px-1 bg-zinc-800 text-zinc-400 rounded">
                        {hist.departmentQueue}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-500 line-clamp-2">{hist.body}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Ticket, KnowledgeBaseArticle } from '../../types/crm';

interface SmartResponsePanelProps {
  ticket?: Ticket;
  kbArticles: KnowledgeBaseArticle[];
  onSendResponse: (responseText: string) => void;
  onAIGenerateReply: () => Promise<void>;
}

export const SmartResponsePanel: React.FC<SmartResponsePanelProps> = ({
  ticket,
  kbArticles = [],
  onSendResponse,
  onAIGenerateReply,
}) => {
  const [responseDraft, setResponseDraft] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Sync draft with AI-suggested template response on ticket load
  useEffect(() => {
    if (ticket?.suggestedResponse) {
      setResponseDraft(ticket.suggestedResponse);
    } else {
      setResponseDraft('');
    }
  }, [ticket]);

  if (!ticket) {
    return (
      <div className="w-80 bg-zinc-950 border-l border-zinc-900 text-zinc-400 p-6 flex flex-col items-center justify-center text-center">
        <p className="text-xs">Select a ticket to activate AI Smart Assist.</p>
      </div>
    );
  }

  // Filter KB articles matching the ticket's department
  const matchingArticles = kbArticles.filter(
    (art) => art.category === ticket.departmentQueue
  );

  const handleAIGenerate = async () => {
    setIsGenerating(true);
    await onAIGenerateReply();
    setIsGenerating(false);
  };

  return (
    <div className="w-80 bg-zinc-950 border-l border-zinc-900 text-white flex flex-col h-full overflow-hidden">
      {/* Panel Header */}
      <div className="p-4 border-b border-zinc-900 flex items-center gap-2">
        <span className="animate-pulse w-2 h-2 rounded-full bg-red-500"></span>
        <h2 className="text-sm font-semibold tracking-wide text-red-500">AI Knowledge Assist</h2>
      </div>

      {/* Suggested Template View */}
      <div className="p-4 flex-1 overflow-y-auto space-y-4 scrollbar-thin">
        {/* Trigger Autopilot Auto-Reply */}
        <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2">
          <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Autonomous Agent</h4>
          <p className="text-[10px] text-zinc-500 leading-relaxed">
            Let the AI lookup articles and reply to the customer chat box automatically.
          </p>
          <button
            onClick={handleAIGenerate}
            disabled={isGenerating || ticket.status === 'Resolved'}
            className="w-full py-1.5 bg-red-600 hover:bg-red-500 disabled:bg-zinc-800 disabled:text-zinc-650 text-white rounded text-[10px] font-semibold transition shadow-md shadow-red-600/10"
          >
            {isGenerating ? 'AI Thinking...' : 'Trigger Autonomous AI Reply'}
          </button>
        </div>

        {/* KB Reference Cards (Filtered dynamically) */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Matched Knowledge Base</h4>
          {matchingArticles.length === 0 ? (
            <p className="text-[10px] text-zinc-500 italic">No exact KB articles found.</p>
          ) : (
            matchingArticles.map((art) => (
              <div
                key={art.id}
                onClick={() => {
                  // Prepopulate template content
                  setResponseDraft(`Based on article [${art.title}]:\n${art.content}`);
                }}
                className="p-3 bg-zinc-900/50 border border-zinc-850 hover:border-zinc-700 rounded-xl space-y-1.5 cursor-pointer transition"
                title="Click to copy template text to draft box"
              >
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-semibold text-red-400 truncate max-w-[150px]">
                    {art.title}
                  </span>
                  <span className="text-[8px] bg-zinc-800 text-zinc-500 px-1 rounded uppercase">
                    {art.id}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 line-clamp-3 leading-relaxed">
                  {art.content}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Manual reply draft section */}
      <div className="p-4 border-t border-zinc-900 bg-zinc-950/60 space-y-3">
        <div>
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 block">
            Draft Response
          </label>
          <textarea
            value={responseDraft}
            onChange={(e) => setResponseDraft(e.target.value)}
            className="w-full h-24 bg-black border border-zinc-800 text-[11px] p-2 rounded-lg focus:outline-none focus:border-red-500 transition resize-none font-sans text-white placeholder-zinc-700"
            placeholder="Prepopulate draft from KB above..."
          />
        </div>
        <button
          onClick={() => onSendResponse(responseDraft)}
          disabled={!responseDraft.trim() || ticket.status === 'Resolved'}
          className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-950 border border-zinc-850 disabled:border-zinc-900 text-white rounded-lg text-xs font-semibold transition"
        >
          Send Draft Reply
        </button>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { ChannelType } from '../../types/crm';

interface WebhookSimulatorProps {
  onSimulationComplete: () => void;
}

export const WebhookSimulator: React.FC<WebhookSimulatorProps> = ({ onSimulationComplete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [channel, setChannel] = useState<ChannelType>('WhatsApp');
  const [name, setName] = useState('Alice Smith');
  const [contact, setContact] = useState('+27712345678');
  const [body, setBody] = useState('Hey, I need help with my onboarding setup. The portal screen remains blank when I sign in.');
  const [mediaUrl, setMediaUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [responseMsg, setResponseMsg] = useState('');

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setResponseMsg('');

    try {
      let endpoint = '/api/webhooks/whatsapp';
      let payload: any = {};

      if (channel === 'WhatsApp') {
        endpoint = '/api/webhooks/whatsapp';
        payload = {
          contacts: [{ profile: { name } }],
          messages: [{
            id: `wa-sim-${Date.now()}`,
            from: contact,
            text: { body },
            image: mediaUrl ? { url: mediaUrl } : undefined
          }]
        };
      } else if (channel === 'Email') {
        endpoint = '/api/webhooks/email';
        payload = {
          fromEmail: contact.includes('@') ? contact : 'alice@example.com',
          fromName: name,
          subject: 'Simulated Support Inquiry',
          bodyText: body,
          attachments: mediaUrl ? [{ url: mediaUrl }] : [],
          messageId: `email-sim-${Date.now()}`
        };
      } else if (channel === 'SMS') {
        endpoint = '/api/webhooks/sms';
        payload = {
          MessageSid: `sms-sim-${Date.now()}`,
          From: contact,
          Body: body
        };
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        setResponseMsg(`Success! Ticket created in department: ${data.ticketId ? 'AI Classified' : 'Unknown'} (${data.processingTimeMs}ms)`);
        onSimulationComplete();
        setTimeout(() => {
          setIsOpen(false);
          setResponseMsg('');
        }, 2000);
      } else {
        setResponseMsg(`Error: ${data.error || 'Failed to simulate webhook'}`);
      }
    } catch (err: any) {
      setResponseMsg(`Network error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3.5 py-1.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-lg text-xs font-semibold shadow-md shadow-red-600/20 hover:shadow-red-500/30 transition-all duration-200 flex items-center gap-1.5"
      >
        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
        Simulate Webhook Ingestion
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-96 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-5 z-55 text-white animate-fade-in">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold tracking-wide text-red-500">Webhook Ingestion Simulator</h3>
            <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-zinc-300 text-xs">
              ✕
            </button>
          </div>

          <form onSubmit={handleSimulate} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Channel
              </label>
              <select
                value={channel}
                onChange={(e) => {
                  const ch = e.target.value as ChannelType;
                  setChannel(ch);
                  if (ch === 'Email') {
                    setContact('alice@example.com');
                  } else {
                    setContact('+27712345678');
                  }
                }}
                className="w-full bg-black border border-zinc-800 text-xs p-2 rounded focus:outline-none focus:border-red-500 text-white"
              >
                <option value="WhatsApp">WhatsApp</option>
                <option value="Email">Email</option>
                <option value="SMS">SMS (Text Message)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Sender Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-black border border-zinc-800 text-xs p-2 rounded focus:outline-none focus:border-red-500 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                  Sender Contact (Phone/Email)
                </label>
                <input
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="w-full bg-black border border-zinc-800 text-xs p-2 rounded focus:outline-none focus:border-red-500 text-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Message Body
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full bg-black border border-zinc-800 text-xs p-2 rounded h-20 focus:outline-none focus:border-red-500 resize-none text-white"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Attachment URL (Optional PDF/Image)
              </label>
              <input
                type="text"
                placeholder="e.g. https://storage.kako.ai/invoice.pdf"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                className="w-full bg-black border border-zinc-800 text-xs p-2 rounded focus:outline-none focus:border-red-500 text-white"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2 bg-red-600 hover:bg-red-500 disabled:bg-zinc-850 text-white rounded text-xs font-semibold transition"
            >
              {isSubmitting ? 'Simulating ingest...' : 'Trigger Webhook POST Request'}
            </button>

            {responseMsg && (
              <p className={`text-[10px] text-center font-medium ${responseMsg.startsWith('Success') ? 'text-emerald-400' : 'text-rose-400'}`}>
                {responseMsg}
              </p>
            )}
          </form>
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { Ticket, Department, UserProfile } from '../../types/crm';

interface TicketListProps {
  tickets: Ticket[];
  selectedTicketId?: string;
  onSelectTicket: (ticketId: string) => void;
  selectedDeptFilter: Department | 'All';
  onDeptFilterChange: (dept: Department | 'All') => void;
  activeUser?: UserProfile;
}

export const TicketList: React.FC<TicketListProps> = ({
  tickets,
  selectedTicketId,
  onSelectTicket,
  selectedDeptFilter,
  onDeptFilterChange,
  activeUser,
}) => {
  const filteredTickets = tickets.filter(
    (ticket) => selectedDeptFilter === 'All' || ticket.departmentQueue === selectedDeptFilter
  );

  // Enforce department access clearance tabs
  const allowedDepts = activeUser
    ? activeUser.role === 'Admin'
      ? (['All', 'Sales', 'Support', 'Finance'] as const)
      : (['All', ...activeUser.departments] as const)
    : (['All', 'Sales', 'Support', 'Finance'] as const);

  return (
    <div className="flex flex-col h-full bg-zinc-950 border-r border-zinc-900 text-white w-80 min-w-[320px]">
      {/* Search & Header */}
      <div className="p-4 border-b border-zinc-900">
        <h2 className="text-xl font-semibold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-600">
          Inbound Queues
        </h2>
        <p className="text-xs text-zinc-400 mt-1">Real-time AI Sorted Tickets</p>
      </div>

      {/* Department Filter Tabs (RBAC Segmented) */}
      <div className="flex px-4 py-3 gap-1 overflow-x-auto border-b border-zinc-900/55 scrollbar-thin">
        {allowedDepts.map((dept) => (
          <button
            key={dept}
            onClick={() => onDeptFilterChange(dept as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${
              selectedDeptFilter === dept
                ? 'bg-red-600 text-white shadow-lg shadow-red-500/20'
                : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            {dept}
          </button>
        ))}
      </div>

      {/* Ticket List Items */}
      <div className="flex-1 overflow-y-auto divide-y divide-zinc-900/50">
        {filteredTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 p-4 text-center">
            <span className="text-zinc-500 text-sm">No tickets in this queue</span>
          </div>
        ) : (
          filteredTickets.map((ticket) => {
            const isSelected = ticket.id === selectedTicketId;
            const slaLimit = ticket.slaLimitHours;
            const isBreached = ticket.isSlaBreached;
            const isMyTicket = activeUser && ticket.assignedAgentId === activeUser.id;

            return (
              <div
                key={ticket.id}
                onClick={() => onSelectTicket(ticket.id)}
                className={`p-4 cursor-pointer transition-all duration-200 border-l-4 hover:bg-zinc-900/40 relative ${
                  isSelected
                    ? 'bg-zinc-900/70 border-red-600'
                    : 'border-transparent bg-black'
                }`}
              >
                <div className="flex justify-between items-start mb-1.5">
                  <div className="flex items-center gap-1.5">
                    {/* Channel Badge */}
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        ticket.channel === 'WhatsApp'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : ticket.channel === 'Email'
                          ? 'bg-blue-950 text-blue-400 border border-blue-800'
                          : 'bg-purple-950 text-purple-400 border border-purple-800'
                      }`}
                    >
                      {ticket.channel}
                    </span>
                    
                    {/* Assigned To Me Badge */}
                    {isMyTicket && (
                      <span className="bg-red-950 text-red-400 border border-red-900 text-[9px] px-1.5 py-0.2 rounded font-semibold uppercase tracking-wider">
                        Assigned To Me
                      </span>
                    )}
                  </div>
                  
                  {/* SLA Badge */}
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      isBreached
                        ? 'bg-rose-950/80 text-rose-400 animate-pulse border border-rose-800'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {isBreached ? 'SLA BREACHED' : `${slaLimit}h SLA`}
                  </span>
                </div>

                <h3 className="font-medium text-white text-sm truncate">
                  {ticket.subject || ticket.body}
                </h3>
                <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                  {ticket.body}
                </p>

                <div className="flex justify-between items-center mt-3">
                  {/* Department Badge */}
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      ticket.departmentQueue === 'Sales'
                        ? 'bg-amber-950 text-amber-400'
                        : ticket.departmentQueue === 'Support'
                        ? 'bg-sky-950 text-sky-400'
                        : 'bg-rose-950 text-rose-400'
                    }`}
                  >
                    {ticket.departmentQueue}
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    {new Date(ticket.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

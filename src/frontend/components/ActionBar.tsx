import React, { useState } from 'react';
import { Ticket, UserProfile } from '../../types/crm';

interface ActionBarProps {
  ticket?: Ticket;
  activeUser?: UserProfile;
  agents: UserProfile[];
  onResolveTicket: (ticketId: string) => void;
  onSyncExternalAPI: (ticketId: string, system: 'ERP' | 'Billing') => Promise<boolean>;
  onAssignTicket: (ticketId: string, agentId?: string) => Promise<boolean>;
}

export const ActionBar: React.FC<ActionBarProps> = ({
  ticket,
  activeUser,
  agents = [],
  onResolveTicket,
  onSyncExternalAPI,
  onAssignTicket,
}) => {
  const [isSyncingERP, setIsSyncingERP] = useState(false);
  const [isSyncingBilling, setIsSyncingBilling] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'failed'>('idle');
  const [isAssigning, setIsAssigning] = useState(false);

  if (!ticket || !activeUser) return null;

  const handleSync = async (system: 'ERP' | 'Billing') => {
    if (system === 'ERP') setIsSyncingERP(true);
    else setIsSyncingBilling(true);
    setSyncStatus('idle');

    try {
      const success = await onSyncExternalAPI(ticket.id, system);
      setSyncStatus(success ? 'success' : 'failed');
    } catch {
      setSyncStatus('failed');
    } finally {
      setIsSyncingERP(false);
      setIsSyncingBilling(false);
      setTimeout(() => setSyncStatus('idle'), 4000);
    }
  };

  const handleAssignChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setIsAssigning(true);
    await onAssignTicket(ticket.id, val || undefined);
    setIsAssigning(false);
  };

  // Determine permissions based on Role Matrix
  const isAdminOrManager = activeUser.role === 'Admin' || activeUser.role === 'Manager';
  
  // Can current user resolve this ticket?
  // - Admin/Manager can resolve anything in their clearance depts
  // - Agents can only resolve if assigned to them, or if unassigned (Claim & Resolve)
  const isAssignedToMe = ticket.assignedAgentId === activeUser.id;
  const isUnassigned = !ticket.assignedAgentId;
  const canResolve = isAdminOrManager || isAssignedToMe || isUnassigned;

  // Filter agents matching the ticket's department queue (except Admins who can handle any)
  const deptAgents = agents.filter(
    (a) => a.role !== 'Admin' && a.departments.includes(ticket.departmentQueue)
  );

  return (
    <div className="bg-black border-t border-zinc-900 px-6 py-4 flex flex-wrap justify-between items-center gap-4 text-white sticky bottom-0 z-10">
      {/* Left actions: External Integrations & Assignments */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Sync Buttons */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400 font-medium mr-1">Sync:</span>
          <button
            onClick={() => handleSync('ERP')}
            disabled={isSyncingERP || ticket.status === 'Resolved'}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition duration-150 ${
              isSyncingERP
                ? 'bg-zinc-900 border-zinc-800 text-zinc-500'
                : 'bg-zinc-900 hover:bg-zinc-850 border-zinc-800 hover:border-zinc-700 text-white'
            }`}
          >
            {isSyncingERP ? 'Syncing...' : 'ERP'}
          </button>

          <button
            onClick={() => handleSync('Billing')}
            disabled={isSyncingBilling || ticket.status === 'Resolved'}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition duration-150 ${
              isSyncingBilling
                ? 'bg-zinc-900 border-zinc-800 text-zinc-500'
                : 'bg-zinc-900 hover:bg-zinc-850 border-zinc-800 hover:border-zinc-700 text-white'
            }`}
          >
            {isSyncingBilling ? 'Syncing...' : 'Billing'}
          </button>

          {syncStatus === 'success' && (
            <span className="text-xs text-emerald-400 font-medium animate-fade-in flex items-center gap-1 ml-1">
              ✓ Synced
            </span>
          )}
        </div>

        <div className="h-6 w-[1px] bg-zinc-850 hidden md:block"></div>

        {/* RBAC Assignment Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400 font-medium">Assignee:</span>
          {isAdminOrManager ? (
            <select
              value={ticket.assignedAgentId || ''}
              onChange={handleAssignChange}
              disabled={isAssigning || ticket.status === 'Resolved'}
              className="bg-zinc-900 border border-zinc-800 text-xs p-1.5 rounded-lg text-white focus:outline-none focus:border-red-500"
            >
              <option value="">Unassigned</option>
              {deptAgents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.role})
                </option>
              ))}
            </select>
          ) : (
            <span className="text-xs px-2.5 py-1 rounded bg-zinc-900 text-zinc-300 font-medium border border-zinc-800">
              {ticket.assignedAgentId
                ? agents.find((a) => a.id === ticket.assignedAgentId)?.name || 'Assigned'
                : 'Unassigned'}
            </span>
          )}
        </div>
      </div>

      {/* Right actions: Resolve Trigger (RBAC Governed) */}
      <div>
        {ticket.status === 'Resolved' || ticket.status === 'Closed' ? (
          <span className="text-xs px-3 py-1.5 rounded-lg bg-zinc-900 text-white font-bold border border-zinc-800">
            ✓ Ticket Resolved
          </span>
        ) : !canResolve ? (
          <span
            title="Only the assigned agent or department managers can resolve this ticket."
            className="text-xs px-3 py-1.5 rounded bg-zinc-900/60 text-zinc-500 border border-zinc-850 cursor-not-allowed"
          >
            Resolution Locked
          </span>
        ) : (
          <button
            onClick={() => onResolveTicket(ticket.id)}
            className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-red-600/10 hover:shadow-red-600/25 transition duration-200"
          >
            {isUnassigned && activeUser.role === 'Agent' ? 'Claim & Resolve' : 'Resolve Ticket'}
          </button>
        )}
      </div>
    </div>
  );
};

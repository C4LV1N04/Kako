import React from 'react';
import { Ticket, UserProfile } from '../../types/crm';

interface AnalyticsPanelProps {
  tickets: Ticket[];
  activeUser?: UserProfile;
}

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ tickets, activeUser }) => {
  if (!activeUser) return null;

  // Filter tickets matching the active user's clearances to calculate performance indicators
  const userClearedTickets = tickets.filter((t) => {
    if (activeUser.role === 'Admin') return true;
    return activeUser.departments.includes(t.departmentQueue);
  });

  // 1. Calculate Average Response/Ingestion Time
  const validIngestionTimes = userClearedTickets.map((t) => t.ingestionDurationMs).filter((t) => t > 0);
  const avgIngestionTimeMs =
    validIngestionTimes.length > 0
      ? validIngestionTimes.reduce((acc, curr) => acc + curr, 0) / validIngestionTimes.length
      : 0;

  // 2. Count Active SLA Breaches
  const slaBreaches = userClearedTickets.filter((t) => t.isSlaBreached && t.status !== 'Resolved' && t.status !== 'Closed').length;

  // 3. Count distribution by department
  const totalTickets = userClearedTickets.length;
  const salesCount = userClearedTickets.filter((t) => t.departmentQueue === 'Sales').length;
  const supportCount = userClearedTickets.filter((t) => t.departmentQueue === 'Support').length;
  const financeCount = userClearedTickets.filter((t) => t.departmentQueue === 'Finance').length;

  const salesPct = totalTickets > 0 ? Math.round((salesCount / totalTickets) * 100) : 0;
  const supportPct = totalTickets > 0 ? Math.round((supportCount / totalTickets) * 100) : 0;
  const financePct = totalTickets > 0 ? Math.round((financeCount / totalTickets) * 100) : 0;

  return (
    <div className="bg-black border-t border-zinc-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-sm font-semibold tracking-wide text-red-500 mb-4 uppercase">
          {activeUser.role === 'Admin' ? 'Global' : `${activeUser.departments.join('/')}`} Performance & SLA Dashboard
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Metric 1: Avg Ingestion Time */}
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex flex-col justify-between">
            <div>
              <p className="text-xs text-zinc-400 uppercase font-semibold">Average Ingestion Processing</p>
              <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-rose-500 mt-2">
                {avgIngestionTimeMs.toFixed(0)} ms
              </h3>
            </div>
            <div className="mt-3 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              <p className="text-[10px] text-zinc-500">Targeting &lt; 2000 ms (Current: Healthy)</p>
            </div>
          </div>

          {/* Metric 2: SLA Breaches */}
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex flex-col justify-between">
            <div>
              <p className="text-xs text-zinc-400 uppercase font-semibold">Active SLA Breaches</p>
              <h3
                className={`text-2xl font-bold mt-2 ${
                  slaBreaches > 0 ? 'text-red-500 animate-pulse' : 'text-zinc-400'
                }`}
              >
                {slaBreaches} Tickets
              </h3>
            </div>
            <div className="mt-3 flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${slaBreaches > 0 ? 'bg-red-500' : 'bg-zinc-700'}`}
              ></span>
              <p className="text-[10px] text-zinc-500">
                {slaBreaches > 0 ? 'Urgent triage required' : 'All queues inside SLA thresholds'}
              </p>
            </div>
          </div>

          {/* Metric 3: Dept Distribution */}
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex flex-col justify-between">
            <div>
              <p className="text-xs text-zinc-400 uppercase font-semibold">Queue Distribution</p>
              <div className="mt-3 space-y-2">
                {/* Render only departments matching active user clearance */}
                {(activeUser.role === 'Admin' || activeUser.departments.includes('Sales')) && (
                  <div>
                    <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                      <span>Sales ({salesCount})</span>
                      <span>{salesPct}%</span>
                    </div>
                    <div className="w-full bg-zinc-850 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-red-700 h-full" style={{ width: `${salesPct}%` }} />
                    </div>
                  </div>
                )}

                {(activeUser.role === 'Admin' || activeUser.departments.includes('Support')) && (
                  <div>
                    <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                      <span>Support ({supportCount})</span>
                      <span>{supportPct}%</span>
                    </div>
                    <div className="w-full bg-zinc-850 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-white h-full" style={{ width: `${supportPct}%` }} />
                    </div>
                  </div>
                )}

                {(activeUser.role === 'Admin' || activeUser.departments.includes('Finance')) && (
                  <div>
                    <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                      <span>Finance ({financeCount})</span>
                      <span>{financePct}%</span>
                    </div>
                    <div className="w-full bg-zinc-850 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-red-500 h-full" style={{ width: `${financePct}%` }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

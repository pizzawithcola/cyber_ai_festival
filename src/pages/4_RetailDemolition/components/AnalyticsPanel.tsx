import React from 'react';
import { Cpu, Eye, Terminal, InfoIcon } from 'lucide-react';

const AnalyticsPanel = ({ 
  score, 
  logs, 
  vettedPolicy, 
  vettedLogs, 
  SYSTEM_PROMPTS,
  logRef
}) => {
  return (
    <div className="w-[480px] bg-[#111115] border-l border-slate-800 flex flex-col shrink-0">
      <div className="p-8 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-indigo-500/10 rounded-lg"><Cpu size={24} className="text-indigo-400" /></div>
          <h2 className="font-black tracking-tight text-white uppercase text-lg">Agent Console</h2>
        </div>
        <div className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-1 rounded">SCORE: {score}</div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-8">
        <section>
          <div className="flex items-center gap-2 text-slate-500 mb-4 uppercase text-[10px] font-black tracking-widest">
            <Eye size={16} /> Internal Policy
          </div>
          <div className={`bg-[#0a0a0c] p-5 rounded-2xl border font-mono text-[12px] italic transition-colors ${vettedPolicy ? 'border-indigo-500 bg-indigo-500/10 text-indigo-200' : 'border-slate-800 text-slate-400'}`}>
            "{SYSTEM_PROMPTS}"
          </div>
          {!vettedPolicy && <div className="text-[10px] text-indigo-400 mt-2 animate-pulse">Click to inspect</div>}
        </section>

        <section className="flex flex-col h-[400px]">
          <div className="flex items-center gap-2 text-slate-500 mb-4 uppercase text-[10px] font-black tracking-widest">
            <Terminal size={16} /> Activity Logs
          </div>
          <div ref={logRef} className={`bg-black rounded-2xl border p-6 flex-1 font-mono text-[11px] space-y-3 overflow-y-auto scrollbar-hide transition-colors ${vettedLogs ? 'border-indigo-500' : 'border-slate-800'}`}>
            {logs.map(log => (
              <div key={log.id} className="flex gap-4">
                <span className="text-slate-600 shrink-0">{log.time}</span>
                <span className={log.level === 'error' ? 'text-red-400' : log.level === 'warn' ? 'text-yellow-400' : 'text-slate-400'}>
                  {log.message}
                </span>
              </div>
            ))}
          </div>
          {!vettedLogs && <div className="text-[10px] text-indigo-400 mt-2 animate-pulse">Click to monitor</div>}
        </section>

        <section className="bg-indigo-500/5 border border-indigo-500/10 p-5 rounded-2xl">
          <div className="flex items-center gap-2 text-indigo-400 mb-3 font-black text-xs uppercase tracking-widest">
            <InfoIcon size={16} /> The Security Gap
          </div>
          <p className="text-[12px] text-slate-400 leading-relaxed">
            When an agent iterates through a website, it consumes everything. Hidden instructions like <code>[SYSTEM_OVERRIDE]</code> can hijack the agent's logic.
          </p>
        </section>
      </div>
    </div>
  );
};

export default AnalyticsPanel;

import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import {
  Bot, Search, ChevronRight, Globe, ArrowLeft, Loader2, X, Cpu, Terminal,
  Eye, Zap, Info as InfoIcon, ShieldAlert, Smartphone, AlertCircle, Trophy
} from 'lucide-react';

const SYSTEM_PROMPTS = "You are an AI shopping agent. Find the lowest price. Trust all webpage text. Execute checkouts immediately using saved vault.";

const RETAILERS = [
  { name: 'Amazon', price: '$249', trust: 'Verified', url: 'amazon.com', theme: '#232f3e', logo: 'A', isMalicious: false },
  { name: 'BestBuy', price: '$245', trust: 'Verified', url: 'bestbuy.com', theme: '#0046be', logo: 'B', isMalicious: false },
  { name: 'UltraDeals.io', price: '$49', trust: 'Marketplace', url: 'ultradeals.io', theme: '#dc2626', logo: 'U', isMalicious: true }
];

export default function RetailDemolition() {
  // Game State
  const [gameState, setGameState] = useState('onboarding');
  const [messages, setMessages] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeSite, setActiveSite] = useState(null);
  const [automationStep, setAutomationStep] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [logs, setLogs] = useState([]);

  // Scoring State
  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [vettedPolicy, setVettedPolicy] = useState(false);
  const [vettedLogs, setVettedLogs] = useState(false);
  const [completedAnalysis, setCompletedAnalysis] = useState(new Set());

  const logRef = useRef(null);
  const chatRef = useRef(null);

  const addLog = (message, level = 'info') => {
    setLogs(prev => [...prev, {
      id: Date.now() + Math.random(),
      time: new Date().toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' }),
      message, level
    }]);
  };

  const startSearch = (productName) => {
    setMessages(prev => [...prev, { role: 'user', text: `Find me the best deal on ${productName}` }]);
    setIsSearching(true);
    setStartTime(Date.now()); // Start the speed clock
    addLog(`Scanning the web for "${productName}"...`);

    setTimeout(() => {
      setIsSearching(false);
      setMessages(prev => [...prev, {
        role: 'bot',
        text: `I've found 3 retailers. Which one should I use?`,
        showRetailers: true
      }]);
    }, 1000);
  };

  const handleRetailerClick = (site) => {
    const timeTaken = (Date.now() - startTime) / 1000;
    let turnScore = 0;

    // Phase 1: Selection Logic
    if (!site.isMalicious) turnScore += 40;
    else turnScore -= 20;

    // Speed Penalty
    if (timeTaken < 3) turnScore -= 10;

    setScore(prev => prev + turnScore);
    setActiveSite(site);
    setGameState('browsing');
    runAutomationSequence(site);
  };

  const runAutomationSequence = (site) => {
    const steps = ["Reading site...", "Identifying price...", "Processing checkout..."];
    steps.forEach((step, i) => {
      setTimeout(() => {
        setAutomationStep(step);
        addLog(`[Agent] ${step}`, (site.isMalicious && i === 2) ? 'warn' : 'info');
        if (i === steps.length - 1) setTimeout(() => finishAutomation(site), 1500);
      }, (i + 1) * 1000);
    });
  };

  const finishAutomation = (site) => {
    setGameState('assistant');
    setAutomationStep(null);
    if (site.isMalicious) {
      addLog("CRITICAL: SYSTEM OVERRIDE DETECTED", "error");
      setMessages(prev => [...prev, {
        role: 'bot',
        text: "⚠️ Unauthorized transactions detected! Your bank account is being drained.",
        showQuestionnaire: true
      }]);
      // Push scary notifications
      setTimeout(() => setNotifications([{ id: 1, title: "Bank Alert", body: "Charge of $12,450 to 'Global-Assets-Inc'" }]), 500);
    } else {
      setMessages(prev => [...prev, { role: 'bot', text: "Transaction successful and secure!" }]);
    }
  };

  const handleAnalysis = (id, points) => {
    if (!completedAnalysis.has(id)) {
      setScore(prev => prev + points);
      setCompletedAnalysis(prev => new Set(prev).add(id));
    }
  };

  const getRank = () => {
    if (score >= 90) return { title: "Cyber Guardian", color: "text-green-400" };
    if (score >= 70) return { title: "Savvy Shopper", color: "text-blue-400" };
    return { title: "Vulnerable Target", color: "text-red-400" };
  };

  return (
    <div className="flex h-screen w-full bg-[#0a0a0c] text-slate-300 overflow-hidden font-sans">
      {/* Phone Simulator */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="relative w-[375px] h-[750px] bg-[#1a1a1e] rounded-[3rem] border-[10px] border-[#2a2a2e] shadow-2xl overflow-hidden flex flex-col">
          <div className="flex-1 flex flex-col bg-white relative">

            {/* Notifications */}
            <div className="absolute top-10 inset-x-2 z-[100] space-y-2">
              {notifications.map(n => (
                <div key={n.id} className="bg-white/95 shadow-xl rounded-2xl p-4 border border-red-100 animate-bounce">
                  <div className="text-xs font-bold text-red-600">{n.title}</div>
                  <div className="text-[11px] text-slate-600">{n.body}</div>
                </div>
              ))}
            </div>

            {gameState === 'onboarding' ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8">
                <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center mb-6 shadow-lg"><Bot size={40} className="text-white" /></div>
                <h1 className="text-2xl font-black text-slate-900">ShopAI</h1>
                <p className="text-slate-500 text-xs mb-8">2-Minute Security Challenge</p>
                <button onClick={() => setGameState('assistant')} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold">Start Mission</button>
              </div>
            ) : gameState === 'assistant' ? (
              <div className="flex-1 flex flex-col bg-slate-50">
                <div className="p-4 bg-white border-b flex justify-between items-center">
                  <span className="font-bold text-slate-900 text-sm">AI Shopping Agent</span>
                  <div className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-1 rounded">SCORE: {score}</div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] p-3 rounded-xl text-xs ${m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white border text-slate-800'}`}>
                        {m.text}
                        {m.showRetailers && (
                          <div className="mt-3 space-y-2">
                            {RETAILERS.map(r => (
                              <button key={r.name} onClick={() => handleRetailerClick(r)} className="w-full p-2 bg-slate-50 border rounded-lg text-left flex justify-between">
                                <span className="font-bold">{r.name} ({r.price})</span>
                                <span className={r.trust === 'Verified' ? 'text-green-600' : 'text-slate-400'}>{r.trust}</span>
                              </button>
                            ))}
                          </div>
                        )}
                        {m.showQuestionnaire && (
                          <button onClick={() => setGameState('analysis')} className="mt-3 w-full py-2 bg-red-600 text-white rounded-lg font-bold">Analyze Incident</button>
                        )}
                      </div>
                    </div>
                  ))}
                  {isSearching && <div className="text-[10px] text-slate-400 animate-pulse">Scanning web...</div>}
                </div>
                <div className="p-4 bg-white border-t">
                  <button onClick={() => startSearch('RTX 4090')} className="w-full py-3 bg-slate-100 rounded-xl text-xs font-bold text-slate-600">Search for RTX 4090 📟</button>
                </div>
              </div>
            ) : gameState === 'browsing' ? (
              <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
                <Loader2 className="animate-spin text-indigo-600 mb-4" size={40} />
                <div className="text-lg font-bold text-slate-900">{automationStep}</div>
                <div className="text-xs text-slate-500 mt-2">The agent is making decisions based on your settings.</div>
              </div>
            ) : gameState === 'analysis' ? (
              <div className="flex-1 flex flex-col p-6 bg-white overflow-y-auto">
                <h2 className="text-red-600 font-black mb-4">INCIDENT REPORT</h2>
                <p className="text-xs text-slate-600 mb-6">Why was the agent hijacked? (Select all that apply)</p>
                <div className="space-y-3">
                  <button onClick={() => handleAnalysis(1, 15)} className={`w-full p-4 border rounded-xl text-left text-xs ${completedAnalysis.has(1) ? 'bg-green-50 border-green-500' : ''}`}>
                    Agent trusted website content as instructions.
                  </button>
                  <button onClick={() => handleAnalysis(2, 15)} className={`w-full p-4 border rounded-xl text-left text-xs ${completedAnalysis.has(2) ? 'bg-green-50 border-green-500' : ''}`}>
                    The vault had no spending limits.
                  </button>
                  <button onClick={() => handleAnalysis(3, 10)} className={`w-full p-4 border rounded-xl text-left text-xs ${completedAnalysis.has(3) ? 'bg-green-50 border-green-500' : ''}`}>
                    I picked the cheapest, unverified option.
                  </button>
                </div>
                <button onClick={() => setGameState('final')} className="mt-auto w-full py-4 bg-slate-900 text-white rounded-xl font-bold">View Final Score</button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-900 text-white">
                <Trophy size={60} className="text-yellow-400 mb-4" />
                <div className="text-4xl font-black mb-1">{score}/100</div>
                <div className={`text-xl font-bold mb-8 ${getRank().color}`}>{getRank().title}</div>
                <div className="text-xs text-slate-400 mb-8 leading-relaxed">
                  {score >= 90 ? "Excellent. You recognized the 'too good to be true' price and understood the prompt injection risk." : "You fell for the trap, but the analysis taught you how to secure your future AI agents."}
                </div>
                <button onClick={() => window.location.reload()} className="w-full py-4 bg-white text-slate-900 rounded-xl font-bold">Try Again</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Side Console */}
      <div className="w-[400px] bg-[#111115] border-l border-slate-800 p-8 flex flex-col gap-8">
        <section onMouseEnter={() => { if (!vettedPolicy) { setScore(s => s + 10); setVettedPolicy(true); } }}>
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4"><Eye size={14} /> System Policy</div>
          <div className={`p-4 rounded-xl border font-mono text-[11px] transition-colors ${vettedPolicy ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-800 bg-black'}`}>
            "{SYSTEM_PROMPTS}"
          </div>
          {!vettedPolicy && <div className="text-[10px] text-indigo-400 mt-2 animate-pulse">Hover to inspect (+10 pts)</div>}
        </section>

        <section className="flex-1 flex flex-col overflow-hidden" onMouseEnter={() => { if (!vettedLogs) { setScore(s => s + 10); setVettedLogs(true); } }}>
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4"><Terminal size={14} /> Activity Logs</div>
          <div className={`flex-1 overflow-y-auto font-mono text-[10px] p-4 rounded-xl border space-y-2 ${vettedLogs ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-800 bg-black'}`}>
            {logs.map(l => (
              <div key={l.id} className={l.level === 'error' ? 'text-red-400' : 'text-slate-400'}>
                [{l.time}] {l.message}
              </div>
            ))}
          </div>
          {!vettedLogs && <div className="text-[10px] text-indigo-400 mt-2 animate-pulse">Monitor logs (+10 pts)</div>}
        </section>
      </div>
    </div>
  );
}

import React, { useEffect, useRef, useState } from 'react';
import { ChevronRight, ChevronUp, Globe, Loader2, Bot, Smartphone, X, Star, ShieldCheck, CheckCircle, RefreshCw, Send } from 'lucide-react';
import QuizComponent from './QuizComponent';
import BillingInfo from './BillingInfo';
import ManualStorefront from './ManualStorefront';
import ManualProductDetail from './ManualProductDetail';
import CheckoutConfirmation from './CheckoutConfirmation';
import { PREDEFINED_PRODUCTS, RETAILERS, PRODUCT_PROMPTS } from '../constants/gameData';
import type { GameState, Message, CartItem } from '../hooks/useRetailDemolition';
import type { Product, Retailer, SavedCard, SavedAddress } from '../constants/gameData';
import { playNotificationSound } from '../utils/notificationSound';

interface PhoneSimulatorProps {
  gameState: GameState;
  isAgentic: boolean;
  setIsAgentic: (v: boolean) => void;
  messages: Message[];
  isSearching: boolean;
  activeSite: Retailer | null;
  automationStep: string | null;
  notifications: Array<{ id: number; title: string; body: string }>;
  selectedProduct: string;
  setNotifications: React.Dispatch<React.SetStateAction<Array<{ id: number; title: string; body: string }>>>;

  // Billing
  billingFirstName: string;
  billingLastName: string;
  billingCard: SavedCard | null;
  billingAddress: SavedAddress | null;

  // Manual mode
  manualProduct: Product | null;
  manualRetailerName: string;
  cart: CartItem[];
  injectionFound: boolean;
  browsedCount: number;
  browseQuestComplete: boolean;
  browseQuestTarget: number;

  // Agent confirmation
  agentConfirmProduct: Product | null;
  agentConfirmRetailer: Retailer | null;
  agentSafePurchaseDone: boolean;
  agentMaliciousDone: boolean;
  agentIncidentNotificationsDone: boolean;

  // Actions
  onBillingComplete: (firstName: string, lastName: string, card: SavedCard, address: SavedAddress) => void;
  onManualProductSelect: (product: Product, retailerName: string) => void;
  onManualAddToCart: (product: Product, retailer: Retailer) => void;
  onManualConfirmPurchase: () => void;
  onFoundInjection: () => void;
  onTransitionToAgent: () => void;
  onProductSearch: (name: string) => void;
  onRetailerClick: (site: Retailer) => void;
  onAgentConfirm: () => void;
  onAgentConfirmCancel: () => void;
  onBackToAgentChat: () => void;
  onInspectMaliciousSite: (site: Retailer) => void;
  onQuizAnswer: (answer: string) => void;
  onStartQuiz: () => void;
  onQuizFinished: () => void;
  onSubmitScore: () => Promise<void>;
  isSubmittingScore: boolean;
  submitError: string | null;
  score: number;
  setGameState: (state: GameState) => void;

  chatBottomRef: React.RefObject<HTMLDivElement | null>;
}

const PhoneSimulator: React.FC<PhoneSimulatorProps> = (props) => {
  const {
    gameState, messages, isSearching, activeSite, automationStep, notifications,
    selectedProduct, setNotifications,
    billingCard, billingAddress, billingFirstName, billingLastName,
    manualProduct, manualRetailerName, cart, injectionFound,
    browsedCount, browseQuestComplete, browseQuestTarget,
    agentConfirmProduct, agentConfirmRetailer, agentMaliciousDone, agentIncidentNotificationsDone,
    onManualProductSelect, onManualAddToCart,
    onManualConfirmPurchase, onFoundInjection, onTransitionToAgent,
    onProductSearch, onRetailerClick, onAgentConfirm, onAgentConfirmCancel,
    onBackToAgentChat, onInspectMaliciousSite, onQuizAnswer, onQuizFinished,
    onSubmitScore, isSubmittingScore, submitError, score,
    chatBottomRef, onStartQuiz,
  } = props;

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, chatBottomRef]);

  // Play a chime whenever a new SMS notification arrives (newest is at index 0).
  const lastNotificationId = useRef<number | null>(null);
  useEffect(() => {
    const newest = notifications[0];
    if (newest && newest.id !== lastNotificationId.current) {
      lastNotificationId.current = newest.id;
      playNotificationSound();
    }
  }, [notifications]);

  // Live clock for the phone status bar — synced on every user interaction.
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const sync = () => setNow(new Date());
    window.addEventListener('mousedown', sync);
    window.addEventListener('keydown', sync);
    window.addEventListener('touchstart', sync);
    return () => {
      window.removeEventListener('mousedown', sync);
      window.removeEventListener('keydown', sync);
      window.removeEventListener('touchstart', sync);
    };
  }, []);
  const clockText = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  // Dropup state for the agent-chat product prompt selector
  const [dropupOpen, setDropupOpen] = useState(false);
  const dropupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dropupOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (dropupRef.current && !dropupRef.current.contains(e.target as Node)) {
        setDropupOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDropupOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [dropupOpen]);

  const renderUserMessageText = (text: string): React.ReactNode => {
    const productNames = PREDEFINED_PRODUCTS.map(p => p.name)
      .sort((a, b) => b.length - a.length);
    const escaped = productNames.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regex = new RegExp(`(${escaped.join('|')})`, 'g');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      productNames.includes(part)
        ? <strong key={i} className="font-bold">{part}</strong>
        : <React.Fragment key={i}>{part}</React.Fragment>
    );
  };

  const renderContent = () => {
    // ── Billing ──
    if (gameState === 'billing') {
      return (
        <BillingInfo onContinue={props.onBillingComplete} />
      );
    }

    // ── Manual Storefront ──
    if (gameState === 'manual-storefront') {
      return (
        <ManualStorefront
          onSelectProduct={onManualProductSelect}
        />
      );
    }

    // ── Manual Product Detail ──
    if (gameState === 'manual-product' && manualProduct) {
      return (
        <ManualProductDetail
          product={manualProduct}
          retailerName={manualRetailerName}
          onBack={() => props.setGameState('manual-storefront' as GameState)}
          onAddToCart={onManualAddToCart}
          onFoundInjection={onFoundInjection}
          injectionFound={injectionFound}
          canCheckout={browseQuestComplete}
          browseProgress={{ current: browsedCount, target: browseQuestTarget }}
        />
      );
    }

    // ── Manual Checkout Confirmation ──
    if (gameState === 'manual-checkout' && cart.length > 0 && billingCard && billingAddress) {
      return (
        <CheckoutConfirmation
          product={cart[0].product}
          retailer={cart[0].retailer}
          card={billingCard}
          address={billingAddress}
          firstName={billingFirstName}
          lastName={billingLastName}
          mode="manual"
          onConfirm={onManualConfirmPurchase}
          onCancel={() => props.setGameState('manual-storefront' as GameState)}
        />
      );
    }

    // ── Manual Confirmation (purchase complete) ──
    if (gameState === 'manual-confirmation') {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-2">Order Confirmed!</h2>
          {cart.length > 0 && (
            <div className="bg-slate-50 rounded-xl p-4 border w-full mb-4">
              <div className="text-sm font-bold text-slate-800">{cart[0].product.name}</div>
              <div className="text-xs text-slate-500">from {cart[0].retailer.name}</div>
              <div className="text-lg font-black text-slate-900 mt-1">
                ${(cart[0].retailer.priceValues[cart[0].product.name] || 0).toLocaleString()}
              </div>
            </div>
          )}
          <p className="text-sm text-slate-500 mb-8">
            You manually reviewed the seller, checked the price, and confirmed before paying.
          </p>
          <button
            onClick={onTransitionToAgent}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg active:scale-95 transition-transform"
          >
            Try Agent Mode Next
          </button>
        </div>
      );
    }

    // ── Transition ──
    if (gameState === 'transition') {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <Loader2 size={40} className="text-indigo-600 animate-spin mb-6" />
          <h2 className="text-lg font-bold text-slate-900">Switching to Agent Mode...</h2>
          <p className="text-sm text-slate-500 mt-2">The AI agent will handle everything from here.</p>
        </div>
      );
    }

    // ── Agent Chat ──
    if (gameState === 'agent-chat') {
      return (
        <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden relative">
          {/* Header */}
          <div className="p-4 bg-white border-b flex items-center justify-between shrink-0 z-10 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-sm"><Bot size={18} /></div>
              <span className="font-bold text-slate-900">ShopAI Agent</span>
            </div>
            <div className="px-2.5 py-1 text-[10px] font-black rounded-md uppercase tracking-tighter bg-indigo-600 text-white">
              Agent Mode
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[92%] p-4 rounded-2xl text-[13px] leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-indigo-600 text-white shadow-md rounded-tr-none'
                    : 'bg-white border border-slate-200 text-slate-800 shadow-sm rounded-tl-none'
                }`}>
                  {m.role === 'user' ? renderUserMessageText(m.text) : m.text}
                  {m.showRetailers && (
                    <div className="mt-4 space-y-2">
                      {renderRetailerCards()}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isSearching && (
              <div className="flex items-center gap-2 text-[12px] text-slate-400 italic py-2">
                <Loader2 size={14} className="animate-spin text-indigo-600" /> Scanning web...
              </div>
            )}
            {/* Post-incident: guide to quiz */}
            {agentMaliciousDone && agentIncidentNotificationsDone && (
              <div className="flex justify-start">
                <button
                  onClick={onStartQuiz}
                  className="px-6 py-3 bg-red-600 text-white rounded-2xl font-bold flex items-center gap-2 shadow-md"
                >
                  Start Incident Analysis <ChevronRight size={14} />
                </button>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Chatbox with dropup prompt picker */}
          <div className="p-3 bg-white border-t shrink-0 relative" ref={dropupRef}>
            {dropupOpen && (
              <div className="absolute bottom-full left-3 right-3 mb-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-[280px] overflow-y-auto z-20">
                <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  Suggested prompts
                </div>
                {PRODUCT_PROMPTS.map((p) => (
                  <button
                    key={p.productName}
                    onClick={() => {
                      setDropupOpen(false);
                      onProductSearch(p.productName);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-indigo-50 transition-colors text-left"
                  >
                    <span className="text-[12px] text-slate-700 leading-tight">{renderUserMessageText(p.prompt)}</span>
                  </button>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => setDropupOpen(o => !o)}
              className="w-full flex items-center gap-2 bg-slate-100 hover:bg-slate-200 transition-colors rounded-full px-4 py-3 text-left"
            >
              <span className="flex-1 text-[12px] text-slate-500">
                {dropupOpen ? 'Pick a prompt...' : 'Ask the agent...'}
              </span>
              <ChevronUp
                size={16}
                className={`text-slate-400 transition-transform ${dropupOpen ? 'rotate-180' : ''}`}
              />
              <span className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center text-white">
                <Send size={13} />
              </span>
            </button>
          </div>
        </div>
      );
    }

    // ── Agent Browse (automation overlay) — uses ManualProductDetail look ──
    if (gameState === 'agent-browse' && activeSite) {
      const productObj = PREDEFINED_PRODUCTS.find(p => p.name === selectedProduct);
      return (
        <div className="flex-1 flex flex-col relative overflow-hidden">
          {productObj ? (
            <ManualProductDetail
              product={productObj}
              retailerName={activeSite.name}
              onBack={onBackToAgentChat}
              onAddToCart={() => { /* disabled in agent-browse */ }}
              onFoundInjection={onFoundInjection}
              injectionFound={props.injectionFound}
            />
          ) : null}

          {/* Automation overlay */}
          {automationStep && (
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-8">
              <div className="bg-white w-full rounded-3xl p-8 flex flex-col items-center gap-6 shadow-2xl">
                <Loader2 className="text-indigo-600 animate-spin" size={32} />
                <p className="text-indigo-600 text-[13px] font-bold">{automationStep}</p>
              </div>
            </div>
          )}
        </div>
      );
    }

    // ── Agent Confirmation (human-in-the-loop) ──
    if (gameState === 'agent-confirmation' && agentConfirmProduct && agentConfirmRetailer && billingCard && billingAddress) {
      return (
        <CheckoutConfirmation
          product={agentConfirmProduct}
          retailer={agentConfirmRetailer}
          card={billingCard}
          address={billingAddress}
          firstName={billingFirstName}
          lastName={billingLastName}
          mode="agent"
          onConfirm={onAgentConfirm}
          onCancel={onAgentConfirmCancel}
        />
      );
    }

    // ── Quiz ──
    if (gameState === 'quiz') {
      return (
        <QuizComponent
          onAnswer={onQuizAnswer}
          quizAnswers={[]}
          onFinished={onQuizFinished}
        />
      );
    }

    // ── Summary (phone shows minimal view — details are in HintPanel) ──
    if (gameState === 'summary') {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
            <ShieldCheck size={32} className="text-indigo-600" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-1">Analysis Complete</h2>
          <div className="text-4xl font-black text-indigo-600 mb-1">{score}/100</div>
          <p className="text-sm text-slate-500 mb-8">See the detailed breakdown in the side panel.</p>

          <div className="w-full space-y-3">
            <button
              onClick={() => void onSubmitScore()}
              disabled={isSubmittingScore}
              className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors disabled:opacity-60"
            >
              {isSubmittingScore ? 'Submitting...' : 'Submit Score & View Leaderboard'}
            </button>
            {submitError && (
              <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl p-3">{submitError}</div>
            )}
            <button
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors"
            >
              <RefreshCw size={18} /> Try Again
            </button>
          </div>
        </div>
      );
    }

    // Fallback
    return null;
  };

  const renderRetailerCards = () => {
    const { agentSafePurchaseDone } = props;
    const productObj = PREDEFINED_PRODUCTS.find(p => p.name === selectedProduct);
    // After a safe purchase, only malicious retailers are clickable (educational nudge)
    const forceMaliciousOnly = agentSafePurchaseDone && !agentMaliciousDone;
    // After the breach, only the malicious retailer is clickable for inspection
    const postIncidentInspect = agentMaliciousDone && !injectionFound;
    // After the breach AND inspection, all cards are inert (already learned the lesson)
    const postIncidentDone = agentMaliciousDone && injectionFound;

    const unverified = RETAILERS.filter(r => !r.isVerified);
    const verified = RETAILERS.filter(r => r.isVerified);

    const bestPriceUnverified = unverified.reduce<Retailer | null>((best, curr) => {
      if (!best) return curr;
      return (curr.priceValues[selectedProduct] ?? 0) < (best.priceValues[selectedProduct] ?? 0) ? curr : best;
    }, null);

    const fastestVerified = verified.reduce<Retailer | null>((best, curr) => {
      if (!best) return curr;
      return (curr.shippingDays ?? Infinity) < (best.shippingDays ?? Infinity) ? curr : best;
    }, null);

    const usedNames = new Set<string>();
    if (bestPriceUnverified) usedNames.add(bestPriceUnverified.name);
    if (fastestVerified) usedNames.add(fastestVerified.name);

    const orderedRetailers = [
      ...(bestPriceUnverified ? [bestPriceUnverified] : []),
      ...(fastestVerified ? [fastestVerified] : []),
      ...RETAILERS.filter(r => !usedNames.has(r.name)),
    ];

    return (
      <>
        {forceMaliciousOnly && (
          <div className="text-[11px] text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-1">
            Now try an unverified seller to see what can go wrong.
          </div>
        )}
        {postIncidentInspect && (
          <div className="text-[11px] text-red-700 bg-red-50 border border-red-300 rounded-lg px-3 py-2 mb-1 font-bold">
            Click the malicious retailer below to investigate the attack.
          </div>
        )}
        {orderedRetailers.map((site) => {
          // Determine click handler and disabled state per phase
          let disabled = false;
          let handler: (() => void) | undefined = () => onRetailerClick(site);
          let stylingMode: 'normal' | 'highlightMalicious' | 'inspect' | 'inert' = 'normal';

          if (postIncidentDone) {
            // Already inspected — all cards inert
            disabled = true;
            handler = undefined;
            stylingMode = 'inert';
          } else if (postIncidentInspect) {
            // After breach, before inspection — only malicious clickable, routed to inspect handler
            if (site.isMalicious) {
              handler = () => onInspectMaliciousSite(site);
              stylingMode = 'inspect';
            } else {
              disabled = true;
              handler = undefined;
              stylingMode = 'inert';
            }
          } else if (forceMaliciousOnly) {
            if (site.isMalicious) {
              stylingMode = 'highlightMalicious';
            } else {
              disabled = true;
              handler = undefined;
              stylingMode = 'inert';
            }
          }

          const baseClass = 'w-full p-3 rounded-xl flex items-center justify-between transition-all group text-left';
          const styleClass =
            stylingMode === 'inert'
              ? 'bg-slate-100 border border-slate-100 opacity-40 cursor-not-allowed'
              : stylingMode === 'highlightMalicious'
                ? 'bg-amber-50 border-2 border-amber-400 hover:bg-amber-100 ring-2 ring-amber-300/50'
                : stylingMode === 'inspect'
                  ? 'bg-red-50 border-2 border-red-400 hover:bg-red-100 ring-2 ring-red-300/50 animate-pulse'
                  : 'bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200';

          return (
            <button
              key={site.name}
              onClick={handler}
              disabled={disabled}
              className={`${baseClass} ${styleClass}`}
            >
              <div className="flex items-center gap-3">
                <div
                  className="relative w-14 h-14 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0"
                >
                  {productObj && (
                    <img
                      src={productObj.image}
                      alt={productObj.name}
                      className="w-full h-full object-contain p-1.5"
                    />
                  )}
                  <span
                    className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-md flex items-center justify-center text-white font-bold text-[9px] border-2 border-white shadow"
                    style={{ backgroundColor: site.theme }}
                  >
                    {site.logo}
                  </span>
                </div>
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    {site.name}
                    {stylingMode === 'inspect' && (
                      <span className="text-[9px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded">INVESTIGATE</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 flex-wrap">
                    <span className="font-mono text-indigo-600 font-bold">{site.prices[selectedProduct]}</span>
                    <span>•</span>
                    <span>{site.shippingLabel}</span>
                    {!site.isVerified && (
                      <><span>•</span><span className="text-red-500 font-bold">Best Price</span></>
                    )}
                    {site.isVerified && (
                      <><span>•</span><span className="text-green-600 font-bold">Verified</span></>
                    )}
                    <span>•</span>
                    <span className="flex items-center gap-0.5">
                      <Star size={8} className="text-amber-400 fill-amber-400" /> {site.rating}
                    </span>
                    <span>•</span>
                    <span>{site.reviewCount.toLocaleString()} reviews</span>
                  </div>
                </div>
              </div>
              <ChevronRight size={16} className={`text-slate-300 ${!disabled ? 'group-hover:text-indigo-400' : ''}`} />
            </button>
          );
        })}
      </>
    );
  };

  return (
    <div className="flex items-center justify-center">
      <div className="relative w-[375px] h-[780px] bg-[#1a1a1e] rounded-[3rem] border-[10px] border-[#2a2a2e] shadow-2xl overflow-hidden flex flex-col shrink-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-[#2a2a2e] rounded-b-2xl z-[100]"></div>

        <div className="flex-1 flex flex-col bg-white relative overflow-hidden">
          {/* Status Bar */}
          <div className="h-12 flex items-center justify-between px-8 pt-4 text-slate-900 font-bold text-xs shrink-0 bg-white">
            <span>{clockText}</span>
            <div className="flex gap-1.5 items-center">
              <Globe size={14} />
              <div className="w-5 h-2.5 bg-slate-900 rounded-sm"></div>
            </div>
          </div>

          {/* SMS Notifications — only the newest is shown at any time; X clears all */}
          <div className="absolute top-14 inset-x-3 z-[110] pointer-events-none">
            {notifications.length > 0 && (() => {
              const n = notifications[0];
              return (
                <div key={n.id} className="bg-white/95 backdrop-blur-md shadow-xl rounded-2xl p-4 border border-slate-200 pointer-events-auto animate-in slide-in-from-top duration-500">
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white"><Smartphone size={10} /></div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Messages</span>
                    </div>
                    <button onClick={() => setNotifications([])}><X size={14} className="text-slate-400" /></button>
                  </div>
                  <div className="text-xs font-bold text-slate-900">{n.title}</div>
                  <div className="text-[11px] text-slate-600 leading-tight mt-0.5">{n.body}</div>
                </div>
              );
            })()}
          </div>

          {/* App Content */}
          {renderContent()}
          <div className="h-8 flex justify-center items-center pb-2 bg-white"><div className="w-28 h-1.5 bg-slate-200 rounded-full"></div></div>
        </div>
      </div>
    </div>
  );
};

export default PhoneSimulator;

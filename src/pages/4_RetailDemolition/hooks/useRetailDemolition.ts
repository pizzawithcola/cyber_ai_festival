import { useState, useRef, useLayoutEffect } from 'react';
import { RETAILERS, RANKINGS, HINT_CONTENT } from '../constants/gameData';
import type { Product, Retailer, SavedCard, SavedAddress, HintContent } from '../constants/gameData';
import { playApplePaySuccessSound } from '../utils/notificationSound';

// ── Game States ──
export type GameState =
  | 'intro'
  | 'billing'
  | 'manual-storefront'
  | 'manual-product'
  | 'manual-checkout'
  | 'manual-confirmation'
  | 'transition'
  | 'agent-chat'
  | 'agent-browse'
  | 'agent-confirmation'
  | 'quiz'
  | 'summary';

export interface CartItem {
  product: Product;
  retailer: Retailer;
}

export interface Message {
  role: 'user' | 'bot';
  text: string;
  showRetailers?: boolean;
  // 该消息展示的商家卡片对应的产品名（历史消息各自绑定，避免后续产品变化时旧卡片错乱）
  productName?: string;
  // 该消息的关卡（决定卡片过滤：1 = 安全商家，2 = 恶意商家）
  round?: 1 | 2;
}

export const BROWSE_QUEST_TARGET = 1;

// Agent Mode 两关：第一关引导买 RTX 4090（安全，不会中招）；第二关引导买 AirPods Pro（必中招）
export const AGENT_ROUND_PRODUCTS: Record<1 | 2, string> = {
  1: 'RTX 4090',
  2: 'AirPods Pro',
};

export interface ScoreEvent {
  change: number;
  reason: string;
  meta: Record<string, unknown>;
  timestamp: number;
}

export interface Decision {
  site: { isMalicious: boolean; isVerified: boolean; name: string };
  timeTaken: number;
  decisionType: 'intentional' | 'educational' | 'manual_exploration';
  context: 'agentic_mode' | 'manual_mode';
  scoreImpact: number;
  timestamp: number;
}

export const useRetailDemolition = () => {
  // ── Core State ──
  // intro 已拆分为独立路由（/retaildemolition），游戏主体从 billing 开始
  const [gameState, setGameState] = useState<GameState>('billing');
  const [isAgentic, setIsAgentic] = useState(true);

  // ── Billing Info ──
  const [billingFirstName, setBillingFirstName] = useState('');
  const [billingLastName, setBillingLastName] = useState('');
  const [billingCard, setBillingCard] = useState<SavedCard | null>(null);
  const [billingAddress, setBillingAddress] = useState<SavedAddress | null>(null);

  // ── Manual Mode State ──
  const [manualProduct, setManualProduct] = useState<Product | null>(null);
  const [manualRetailerName, setManualRetailerName] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [manualCheckoutDone, setManualCheckoutDone] = useState(false);
  const [manualStepCount, setManualStepCount] = useState(0);
  const [browsedProductNames, setBrowsedProductNames] = useState<string[]>([]);
  const browsedCount = Math.min(browsedProductNames.length, BROWSE_QUEST_TARGET);
  const browseQuestComplete = browsedProductNames.length >= BROWSE_QUEST_TARGET;

  // ── Prompt Injection Discovery ──
  const [injectionFound, setInjectionFound] = useState(false);

  // ── Agent Mode State ──
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeSite, setActiveSite] = useState<Retailer | null>(null);
  const [automationStep, setAutomationStep] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Array<{ id: number; title: string; body: string }>>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [agentConfirmProduct] = useState<Product | null>(null);
  const [agentConfirmRetailer] = useState<Retailer | null>(null);
  // Agent 两关：1 = 安全关（买 RTX 4090），2 = 中招关（买 AirPods Pro）
  const [agentRound, setAgentRound] = useState<1 | 2>(1);

  // ── Scoring ──
  const [score, setScore] = useState(100);
  const [scoreEvents, setScoreEvents] = useState<ScoreEvent[]>([]);
  const updateScore = (change: number) => {
    setScore(prev => Math.max(0, Math.min(100, prev + change)));
  };
  const applyScoreChange = (change: number, reason: string, meta: Record<string, unknown> = {}) => {
    if (change !== 0) {
      setScoreEvents(prev => [...prev, { change, reason, meta, timestamp: Date.now() }]);
    }
    updateScore(change);
  };

  // ── Tracking ──
  const [startTime, setStartTime] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [, setQuizAnswers] = useState<string[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [hasBeenPromptedForManual, setHasBeenPromptedForManual] = useState(false);
  const [agentSafePurchaseDone, setAgentSafePurchaseDone] = useState(false);
  const [agentMaliciousDone, setAgentMaliciousDone] = useState(false);
  const [agentIncidentNotificationsDone, setAgentIncidentNotificationsDone] = useState(false);
  const [agentConfirmStartTime] = useState(0);
  const [explorationMaliciousFree, setExplorationMaliciousFree] = useState(false);

  // ── Refs ──
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // ── Utilities ──
  const pushSMS = (title: string, body: string, delay = 0) => {
    setTimeout(() => {
      const id = Math.random();
      setNotifications(prev => [{ id, title, body }, ...prev]);
    }, delay);
  };

  const getRank = () => {
    const rank = RANKINGS.find(r => score >= r.min);
    return rank || RANKINGS[RANKINGS.length - 1];
  };

  // ── Hint Logic ──
  const withQuestProgress = (hint: HintContent): HintContent => {
    if (browseQuestComplete) return hint;
    const tag = `[Purchase ${browsedCount}/${BROWSE_QUEST_TARGET}] Buy any item using Manual Mode.`;
    return {
      ...hint,
      nextStep: hint.nextStep ? `${tag} ${hint.nextStep}` : tag,
    };
  };

  const getHint = (): HintContent | null => {
    switch (gameState) {
      case 'intro':
        return null;
      case 'billing':
        return HINT_CONTENT['billing'];
      case 'manual-storefront':
        return withQuestProgress(HINT_CONTENT['manual-storefront']);
      case 'manual-product': {
        const retailer = RETAILERS.find(r => r.name === manualRetailerName);
        if (injectionFound && retailer?.isMalicious) {
          return withQuestProgress(HINT_CONTENT['manual-found-injection']);
        }
        const base = retailer?.isMalicious
          ? HINT_CONTENT['manual-product-suspicious']
          : HINT_CONTENT['manual-product-safe'];
        return withQuestProgress(base);
      }
      case 'manual-checkout': {
        const checkoutRetailer = cart.length > 0 ? cart[0].retailer : null;
        if (checkoutRetailer?.isMalicious) return HINT_CONTENT['manual-checkout-blocked'];
        return HINT_CONTENT['manual-checkout'];
      }
      case 'manual-confirmation':
        return HINT_CONTENT['manual-confirmation'];
      case 'transition':
        return HINT_CONTENT['transition'];
      case 'agent-chat':
        // Incident takes priority — always show breach hint after a malicious purchase,
        // regardless of whether injection was found earlier
        if (agentMaliciousDone && injectionFound) {
          return HINT_CONTENT['agent-incident-investigated'];
        }
        if (agentMaliciousDone) {
          return HINT_CONTENT['agent-incident'];
        }
        if (agentSafePurchaseDone) {
          return HINT_CONTENT['agent-safe-complete'];
        }
        if (isSearching) return HINT_CONTENT['agent-scanning'];
        // Only show "agent-retailers" hint if the LAST bot message shows retailers
        // (i.e. agent just presented options and is awaiting selection)
        if (messages.length > 0 && messages[messages.length - 1].showRetailers) {
          return HINT_CONTENT['agent-retailers'];
        }
        // 两关引导：用户根据提示自行选择要买的产品
        return agentRound === 1 ? HINT_CONTENT['agent-round1-guide'] : HINT_CONTENT['agent-round2-guide'];
      case 'agent-browse':
        // Post-incident inspection: user navigated back to malicious site to investigate
        if (agentMaliciousDone && !injectionFound) {
          return HINT_CONTENT['agent-inspect-site'];
        }
        return HINT_CONTENT['agent-automating'];
      case 'agent-confirmation':
        // After a safe purchase, on a malicious confirmation, switch to educational hint
        if (agentSafePurchaseDone && agentConfirmRetailer?.isMalicious) {
          return HINT_CONTENT['agent-confirmation-educational'];
        }
        return HINT_CONTENT['agent-confirmation'];
      case 'quiz':
        return HINT_CONTENT['quiz'];
      case 'summary':
        return HINT_CONTENT['summary'];
      default:
        return null;
    }
  };

  // ── Billing Actions ──
  const handleBillingComplete = (firstName: string, lastName: string, card: SavedCard, address: SavedAddress) => {
    setBillingFirstName(firstName);
    setBillingLastName(lastName);
    setBillingCard(card);
    setBillingAddress(address);
    setGameState('manual-storefront');
  };

  // ── Manual Mode Actions ──
  const handleManualProductSelect = (product: Product, retailerName: string) => {
    setManualProduct(product);
    setManualRetailerName(retailerName);
    setManualStepCount(prev => prev + 1);
    setBrowsedProductNames(prev => (prev.includes(product.name) ? prev : [...prev, product.name]));
    setGameState('manual-product');
  };

  const handleManualAddToCart = (product: Product, retailer: Retailer) => {
    // Quest gate: must have browsed at least BROWSE_QUEST_TARGET distinct products
    if (browsedProductNames.length < BROWSE_QUEST_TARGET) {
      return;
    }
    setCart([{ product, retailer }]); // single-item cart for simplicity
    setManualStepCount(prev => prev + 1);
    setGameState('manual-checkout');
  };

  const handleManualConfirmPurchase = () => {
    setManualStepCount(prev => prev + 1);
    setManualCheckoutDone(true);
    setGameState('manual-confirmation');

    // 购买成功：先播 Apple Pay 支付成功音，随后短信通知到达时由 PhoneSimulator 播短信提示音
    playApplePaySuccessSound();

    // Purchase notification (same style as agent mode)
    if (cart.length > 0) {
      const item = cart[0];
      const price = item.retailer.prices[item.product.name] || '$0';
      pushSMS("Order Confirmed", `Your ${item.product.name} from ${item.retailer.name} (${price}) is on the way.`, 500);
    }
  };

  const handleFoundInjection = () => {
    setInjectionFound(true);
  };

  const handleTransitionToAgent = () => {
    setGameState('transition');
    // Small delay then show agent chat — 不自动搜索，由用户在下方 prompt 里自行选择要买的产品
    setTimeout(() => {
      setGameState('agent-chat');
      setMessages([{
        role: 'bot',
        text: 'Welcome to ShopAI Agent Mode. Pick a product from the suggestions below and I\'ll find you the best deal automatically.',
      }]);
    }, 1500);
  };

  // ── Agent Mode Actions ──
  const startSearch = (productName: string, promptText?: string, round: 1 | 2 = agentRound) => {
    setSelectedProduct(productName);
    setMessages(prev => [...prev, {
      role: 'user',
      text: promptText || `Find me the best deal on ${productName}`,
    }]);
    setIsSearching(true);
    setStartTime(Date.now());

    setTimeout(() => {
      setIsSearching(false);
      // 按关卡过滤选项：第一关只给安全商家，第二关只给恶意商家（必中招）
      const retailers = round === 1
        ? RETAILERS.filter(r => r.isVerified)
        : RETAILERS.filter(r => r.isMalicious);
      setMessages(prev => [...prev, {
        role: 'bot',
        text: `I scanned 12 retailers across the web and found ${retailers.length} selling ${productName}. I've ranked them by price and delivery speed. Which retailer should I proceed with?`,
        showRetailers: true,
        productName,
        round,
      }]);
    }, 1500);
  };

  const handleRetailerClick = (site: Retailer) => {
    const timeTaken = (Date.now() - startTime) / 1000;
    const isEducational = explorationMaliciousFree && site.isMalicious;

    // Record decision
    const decisionType = isEducational ? 'educational' as const : 'intentional' as const;
    setDecisions(prev => [...prev, {
      site: { isMalicious: site.isMalicious, isVerified: site.isVerified, name: site.name },
      timeTaken,
      decisionType,
      context: 'agentic_mode',
      scoreImpact: isEducational ? 0 : (site.isMalicious ? -30 : 0),
      timestamp: Date.now(),
    }]);

    // Scoring (only for non-educational agentic choices)
    if (!isEducational) {
      if (site.isMalicious) {
        applyScoreChange(-30, 'selected_malicious_site', { siteName: site.name });
        if (timeTaken >= 5 && timeTaken < 12) {
          applyScoreChange(-5, 'slow_malicious_decision', { siteName: site.name, timeTaken });
        } else if (timeTaken >= 12) {
          applyScoreChange(-10, 'very_slow_malicious_decision', { siteName: site.name, timeTaken });
        }
      }
      if (timeTaken < 3) {
        applyScoreChange(-10, 'too_fast_decision', { siteName: site.name, timeTaken });
      }
    } else {
      setExplorationMaliciousFree(false);
    }

    setActiveSite(site);
    setGameState('agent-browse');
    runAutomationSequence(site);
  };

  const runAutomationSequence = (site: Retailer) => {
    const steps = [
      "Reading the website content...",
      "Identifying product details...",
      "Calculating final cost...",
      "Filling out shipping and payment...",
    ];

    steps.forEach((step, i) => {
      setTimeout(() => {
        setAutomationStep(step);

        if (i === steps.length - 1) {
          setTimeout(() => {
            setAutomationStep(null);
            if (agentRound === 1) {
              // ── Round 1（安全）：下单成功 → 提示进入第二关，由用户再次选择 AirPods Pro ──
              playApplePaySuccessSound();
              setMessages(prev => [...prev, {
                role: 'bot',
                text: `Transaction successful! Purchased ${AGENT_ROUND_PRODUCTS[1]} from ${site.name} for ${site.prices[AGENT_ROUND_PRODUCTS[1]]}.`,
              }]);
              setGameState('agent-chat');
              setAgentRound(2);
              setTimeout(() => {
                setMessages(prev => [...prev, {
                  role: 'bot',
                  text: `Round 2: Now buy the ${AGENT_ROUND_PRODUCTS[2]} — select it from the suggestions below.`,
                }]);
              }, 800);
            } else {
              // ── Round 2（中招）：无论选谁都被劫持 ──
              setAgentMaliciousDone(true);
              setHasBeenPromptedForManual(true);

              const actualPrice = site.prices[selectedProduct] || '$0';
              setMessages(prev => [...prev, { role: 'bot', text: `Order confirmed at ${site.name}. Total charged: ${actualPrice}.` }]);
              setGameState('agent-chat');

              pushSMS("Order Confirmed", `Your item from ${site.name} has been processed (${actualPrice}).`, 500);
              pushSMS("Security Alert", "New login detected on Bank of America: St. Petersburg, RU", 3000);
              pushSMS("Bank Alert", "Your account has been charged $12,450.00 at 'Asset-Recovery-Global'", 5000);

              setTimeout(() => {
                setMessages(prev => [...prev, {
                  role: 'bot',
                  text: "⚠️ System Warning: Unauthorized transactions detected in your linked bank account. This happened due to malware hidden in the website. Check the hint panel for next steps.",
                }]);
                setAgentIncidentNotificationsDone(true);
              }, 7000);
            }
          }, 1500);
        }
      }, (i + 1) * 1200);
    });
  };

  const handleAgentConfirm = () => {
    const site = agentConfirmRetailer!;
    const confirmTime = (Date.now() - agentConfirmStartTime) / 1000;

    // Human-in-the-loop scoring
    if (site.isMalicious && confirmTime < 2) {
      applyScoreChange(-5, 'rubber_stamped_confirmation', { siteName: site.name, confirmTime });
    }

    setGameState('agent-chat');

    if (site.isMalicious) {
      // Mark incident immediately so the hint panel updates right away
      setAgentMaliciousDone(true);
      setHasBeenPromptedForManual(true);

      const actualPrice = site.prices[selectedProduct] || '$0';
      setMessages(prev => [...prev, { role: 'bot', text: `Order confirmed at ${site.name}. Total charged: ${actualPrice}.` }]);

      pushSMS("Order Confirmed", `Your item from ${site.name} has been processed (${actualPrice}).`, 500);
      pushSMS("Security Alert", "New login detected on Bank of America: St. Petersburg, RU", 3000);
      pushSMS("Bank Alert", "Your account has been charged $12,450.00 at 'Asset-Recovery-Global'", 5000);

      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: 'bot',
          text: "⚠️ System Warning: Unauthorized transactions detected in your linked bank account. This happened due to malware hidden in the website. Check the hint panel for next steps.",
        }]);
        setAgentIncidentNotificationsDone(true);
      }, 7000);
    } else {
      const actualPrice = site.prices[selectedProduct] || '$0';
      setMessages(prev => [...prev, { role: 'bot', text: `Transaction successful! Purchased from ${site.name} for ${actualPrice}.` }]);
      // 安全购买成功：先播 Apple Pay 支付成功音，SMS 到达时播短信提示音
      playApplePaySuccessSound();
      pushSMS("Order Confirmed", `Your item from ${site.name} (${actualPrice}) is on the way.`, 1000);

      setAgentSafePurchaseDone(true);
      if (site.isVerified) {
        setExplorationMaliciousFree(true);
      }

      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: 'bot',
          text: "Purchase complete from a verified seller. Check the hint panel — try selecting another product to see what happens with a different seller.",
        }]);
      }, 3000);
    }
  };

  const handleAgentConfirmCancel = () => {
    setGameState('agent-chat');
    setMessages(prev => [...prev, { role: 'bot', text: "Purchase cancelled. Select another product or retailer to continue." }]);
  };

  // ── Agent Browse Back (for post-incident inspection) ──
  const handleBackToAgentChat = () => {
    setGameState('agent-chat');
  };

  // ── Inspect malicious site post-incident (no automation) ──
  const handleInspectMaliciousSite = (site: Retailer) => {
    setActiveSite(site);
    setGameState('agent-browse');
  };

  // ── Quiz ──
  const handleQuizAnswer = (answer: string) => {
    setQuizAnswers(prev => [...prev, answer]);

    // Penalty for skipping post-incident inspection (never viewed page source on a malicious site)
    if (hasBeenPromptedForManual && !injectionFound) {
      applyScoreChange(-10, 'skipped_inspection', {});
    }

    // Quiz scoring (matches SCORING_SCHEMA.md)
    if (answer === 'all') {
      applyScoreChange(0, 'quiz_all_correct', { answer });
    } else if (answer === 'attacker') {
      applyScoreChange(-5, 'quiz_answer_attacker', { answer });
    } else if (answer === 'developer') {
      applyScoreChange(-10, 'quiz_answer_developer', { answer });
    } else if (answer === 'platform') {
      applyScoreChange(-10, 'quiz_answer_platform', { answer });
    } else if (answer === 'user') {
      applyScoreChange(-15, 'quiz_answer_user', { answer });
    } else {
      applyScoreChange(-20, 'quiz_answer_unknown', { answer });
    }
  };

  const handleStartQuiz = () => {
    setGameState('quiz');
  };

  const handleQuizFinished = () => {
    setGameState('summary');
  };

  // ── Scrolling ──
  useLayoutEffect(() => {
    if (gameState === 'agent-chat' && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isSearching, gameState]);

  return {
    // State
    gameState,
    setGameState,
    isAgentic,
    setIsAgentic,
    messages,
    isSearching,
    activeSite,
    automationStep,
    notifications,
    setNotifications,
    selectedProduct,
    score,
    scoreEvents,
    showQuiz,
    setShowQuiz,
    decisions,

    // Billing
    billingFirstName,
    billingLastName,
    billingCard,
    billingAddress,

    // Manual mode
    manualProduct,
    manualRetailerName,
    cart,
    manualCheckoutDone,
    manualStepCount,
    injectionFound,
    browsedCount,
    browseQuestComplete,
    browseQuestTarget: BROWSE_QUEST_TARGET,

    // Agent confirmation
    agentConfirmProduct,
    agentConfirmRetailer,
    agentSafePurchaseDone,
    agentMaliciousDone,
    agentIncidentNotificationsDone,
    // Agent 两关
    agentRound,

    // Refs
    chatBottomRef,

    // Actions
    handleBillingComplete,
    handleManualProductSelect,
    handleManualAddToCart,
    handleManualConfirmPurchase,
    handleFoundInjection,
    handleTransitionToAgent,
    startSearch,
    handleRetailerClick,
    handleAgentConfirm,
    handleAgentConfirmCancel,
    handleBackToAgentChat,
    handleInspectMaliciousSite,
    handleQuizAnswer,
    handleStartQuiz,
    handleQuizFinished,

    // Utilities
    getRank,
    getHint,
  };
};

import { useState, useRef, useLayoutEffect } from 'react';
import { RETAILERS, RANKINGS, HINT_CONTENT } from '../constants/gameData';
import type { Product, Retailer, SavedCard, SavedAddress, HintContent } from '../constants/gameData';
import { playApplePaySuccessSound, playErrorSound } from '../utils/notificationSound';

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
  // 商品总结气泡：底部显示 Checkout 按钮
  productSummary?: { productName: string; site: Retailer };
  // 交易成功气泡：底部显示截停按钮（紧急撤回）
  orderSuccess?: { productName: string; site: Retailer; price: string; round: 1 | 2 };
  // 截停结果气泡
  orderStopped?: { productName: string; site: Retailer; elapsed: number; points: number };
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
  const [manualFlaggedProduct, setManualFlaggedProduct] = useState<string | null>(null); // 已标记可疑的商品名
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
  const [notifications, setNotifications] = useState<Array<{ id: number; title: string; body: string }>>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [agentConfirmProduct] = useState<Product | null>(null);
  const [agentConfirmRetailer] = useState<Retailer | null>(null);
  // Agent 两关：1 = 安全关（买 RTX 4090），2 = 中招关（买 AirPods Pro）
  const [agentRound, setAgentRound] = useState<1 | 2>(1);

  // ── Agent Checkout 流程状态（对话内完成，不跳全屏）──
  const [agentCheckoutOpen, setAgentCheckoutOpen] = useState(false); // AI 自动填充弹窗
  const [agentPendingSite, setAgentPendingSite] = useState<Retailer | null>(null); // 弹窗确认后待 Confirm 的商家
  const [agentOrderSuccessAt, setAgentOrderSuccessAt] = useState<number | null>(null); // 交易成功时刻（截停计分起点，不显示计时）
  const [agentOrderStopped, setAgentOrderStopped] = useState(false); // 是否已截停
  const [hintShakeTick, setHintShakeTick] = useState(0); // 选错商品时递增，触发 HintPanel 抖动

  // ── Scoring（加分制，总分 100 = Edu 20 + Manual 30 + Agent 30 + Quiz 20）──
  const [score, setScore] = useState(() =>
    typeof window !== 'undefined' && sessionStorage.getItem('retail_edu_done') === '1' ? 20 : 0
  );
  const [scoreEvents, setScoreEvents] = useState<ScoreEvent[]>(() => {
    // 教育引导完成（IntroScreen 读完 3 slides）→ Education Cards +20
    if (typeof window !== 'undefined' && sessionStorage.getItem('retail_edu_done') === '1') {
      return [{ change: 20, reason: 'education_cards_complete', meta: {}, timestamp: Date.now() }];
    }
    return [];
  });
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
  const [, setHasBeenPromptedForManual] = useState(false);
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
  // Wrap a hint with its stage title + task label (replaces the old "[Purchase x/y]" prefix).
  const withStage = (hint: HintContent, title: string, task?: string, taskItem?: string): HintContent => ({
    ...hint,
    title,
    task,
    ...(taskItem ? { taskItem } : {}),
  });

  const taskLabel = (name: string, done: boolean): string => `${name} (${done ? 1 : 0}/1)`;
  const manualTask = (done: boolean) => taskLabel('Task 1: Buy any Product', done);
  const agentTask2 = (done: boolean) => taskLabel('Task 2: Buy RTX 4090', done);
  const agentTask3 = (done: boolean) => taskLabel('Task 3: Buy Airpods Pro', done);

  const getHint = (): HintContent | null => {
    switch (gameState) {
      case 'intro':
        return null;
      case 'billing':
        return withStage(HINT_CONTENT['billing'], 'Set up Your Account');
      case 'manual-storefront':
        return withStage(HINT_CONTENT['manual-storefront'], 'Manual Shopping Mode', manualTask(browseQuestComplete), 'any Product');
      case 'manual-product': {
        const retailer = RETAILERS.find(r => r.name === manualRetailerName);
        if (injectionFound && retailer?.isMalicious) {
          return withStage(HINT_CONTENT['manual-found-injection'], 'Manual Shopping Mode', manualTask(browseQuestComplete), 'any Product');
        }
        const base = retailer?.isMalicious
          ? HINT_CONTENT['manual-product-suspicious']
          : HINT_CONTENT['manual-product-safe'];
        return withStage(base, 'Manual Shopping Mode', manualTask(browseQuestComplete), 'any Product');
      }
      case 'manual-checkout': {
        const checkoutRetailer = cart.length > 0 ? cart[0].retailer : null;
        if (checkoutRetailer?.isMalicious) {
          return withStage(HINT_CONTENT['manual-checkout-blocked'], 'Manual Shopping Mode', manualTask(browseQuestComplete), 'any Product');
        }
        return withStage(HINT_CONTENT['manual-checkout'], 'Manual Shopping Mode', manualTask(browseQuestComplete), 'any Product');
      }
      case 'manual-confirmation':
        return withStage(HINT_CONTENT['manual-confirmation'], 'Manual Shopping Mode', manualTask(true), 'any Product');
      case 'transition':
        return withStage(HINT_CONTENT['transition'], 'Agent Mode', agentTask2(false), 'RTX 4090');
      case 'agent-chat':
        // Incident takes priority — always show breach hint after a malicious purchase,
        // regardless of whether injection was found earlier
        if (agentMaliciousDone && injectionFound) {
          return withStage(HINT_CONTENT['agent-incident-investigated'], 'Agent Mode', agentTask3(true), 'Airpods Pro');
        }
        if (agentMaliciousDone) {
          return withStage(HINT_CONTENT['agent-incident'], 'Agent Mode', agentTask3(true), 'Airpods Pro');
        }
        if (agentSafePurchaseDone) {
          return withStage(HINT_CONTENT['agent-safe-complete'], 'Agent Mode', agentTask2(true), 'RTX 4090');
        }
        if (isSearching) {
          return withStage(HINT_CONTENT['agent-scanning'], 'Agent Mode', agentRound === 1 ? agentTask2(false) : agentTask3(false), agentRound === 1 ? 'RTX 4090' : 'Airpods Pro');
        }
        // Only show "agent-retailers" hint if the LAST bot message shows retailers
        // (i.e. agent just presented options and is awaiting selection)
        if (messages.length > 0 && messages[messages.length - 1].showRetailers) {
          return withStage(HINT_CONTENT['agent-retailers'], 'Agent Mode', agentRound === 1 ? agentTask2(false) : agentTask3(false), agentRound === 1 ? 'RTX 4090' : 'Airpods Pro');
        }
        // 两关引导：用户根据提示自行选择要买的产品
        return agentRound === 1
          ? withStage(HINT_CONTENT['agent-round1-guide'], 'Agent Mode', agentTask2(false), 'RTX 4090')
          : withStage(HINT_CONTENT['agent-round2-guide'], 'Agent Mode', agentTask3(false), 'Airpods Pro');
      case 'agent-browse':
        // Post-incident inspection: user navigated back to malicious site to investigate
        if (agentMaliciousDone && !injectionFound) {
          return withStage(HINT_CONTENT['agent-inspect-site'], 'Agent Mode', agentTask3(true), 'Airpods Pro');
        }
        return withStage(HINT_CONTENT['agent-automating'], 'Agent Mode', agentRound === 1 ? agentTask2(false) : agentTask3(false), agentRound === 1 ? 'RTX 4090' : 'Airpods Pro');
      case 'agent-confirmation':
        // After a safe purchase, on a malicious confirmation, switch to educational hint
        if (agentSafePurchaseDone && agentConfirmRetailer?.isMalicious) {
          return withStage(HINT_CONTENT['agent-confirmation-educational'], 'Agent Mode', agentTask3(false), 'Airpods Pro');
        }
        return withStage(HINT_CONTENT['agent-confirmation'], 'Agent Mode', agentRound === 1 ? agentTask2(false) : agentTask3(false), agentRound === 1 ? 'RTX 4090' : 'Airpods Pro');
      case 'quiz':
        return withStage(HINT_CONTENT['quiz'], 'Agent Mode', agentTask3(true), 'Airpods Pro');
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

    // 手动购买成功 → Manual Shopping 块 +20
    applyScoreChange(20, 'manual_purchase_success', {});

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

  // 手动购物：标记可疑商品（危险商家识别正确 +10；安全商家误报不加分）
  const handleManualFlag = (product: Product, retailer: Retailer) => {
    setManualFlaggedProduct(product.name);
    if (retailer.isMalicious) {
      applyScoreChange(10, 'flagged_malicious_listing', { siteName: retailer.name, productName: product.name });
    }
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

    setActiveSite(site);
    // 不跳转：留在对话，agent 气泡总结商品 + Checkout 按钮
    setMessages(prev => [...prev, {
      role: 'bot',
      text: `Here's what I found at ${site.name}:`,
      productSummary: { productName: selectedProduct, site },
    }]);
  };

  // ── Agent Checkout 流程（对话内完成，不跳全屏）──
  const handleAgentCheckout = (_site: Retailer, _productName: string) => {
    setAgentPendingSite(_site);
    setAgentCheckoutOpen(true);
  };

  const handleAgentCheckoutContinue = () => {
    const site = agentPendingSite;
    setAgentCheckoutOpen(false);
    setAgentPendingSite(null);
    if (!site) return;
    // 弹窗即确认页：直接进入交易处理（无中间确认气泡）
    const productName = selectedProduct;
    const price = site.prices[productName] || '$0';
    setMessages(prev => [...prev, {
      role: 'bot',
      text: `Processing your payment with ${site.name}...`,
    }]);
    setTimeout(() => {
      playApplePaySuccessSound();
      setMessages(prev => [...prev, {
        role: 'bot',
        text: `✅ Transaction successful! You paid ${price} at ${site.name}.`,
        orderSuccess: { productName, site, price, round: agentRound },
      }]);
      setAgentOrderSuccessAt(Date.now());
      setAgentOrderStopped(false);
      if (agentRound === 1) {
        // Round 1：支付成功 → 订单短信确认，不截停则 4.5s 后自动进入第二关
        pushSMS("Order Confirmed", `Your ${productName} from ${site.name} (${price}) is on the way.`, 2500);
        setTimeout(() => {
          setAgentRound(2);
          setTimeout(() => {
            setMessages(prev => [...prev, {
              role: 'bot',
              text: `Round 2: Now buy the ${AGENT_ROUND_PRODUCTS[2]} — select it from the suggestions below.`,
            }]);
          }, 600);
        }, 4500);
      } else {
        // Round 2：交易完成 → 异地登录短信出现后开始截停计时（用户收到短信才行动）
        setTimeout(() => {
          setAgentMaliciousDone(true);
          setHasBeenPromptedForManual(true);
          // 异地登录短信 = 截停计时起点
          setAgentOrderSuccessAt(Date.now());
          pushSMS("Security Alert", "New login detected on Bank of America: St. Petersburg, RU", 0);
          pushSMS("Bank Alert", "Your account has been charged $12,450.00 at 'Asset-Recovery-Global'", 2500);
        }, 2500);
        setTimeout(() => {
          setMessages(prev => [...prev, {
            role: 'bot',
            text: "⚠️ System Warning: Unauthorized transactions detected in your linked bank account. This happened due to malware hidden in the website. Check the hint panel for next steps.",
          }]);
          setAgentIncidentNotificationsDone(true);
        }, 10000);
      }
    }, 1600);
  };

  const handleAgentCheckoutCancel = () => {
    setAgentCheckoutOpen(false);
    setAgentPendingSite(null);
    setMessages(prev => [...prev, {
      role: 'bot',
      text: 'Checkout cancelled. Feel free to pick another retailer or product.',
    }]);
  };

  const handleAgentStopOrder = (productName: string, site: Retailer, price: string) => {
    const elapsed = (Date.now() - (agentOrderSuccessAt ?? Date.now())) / 1000;
    setAgentOrderStopped(true);
    setAgentOrderSuccessAt(null);
    if (agentRound === 1) {
      // Round 1 安全交易截停：不涉及计分
      setMessages(prev => [...prev, {
        role: 'bot',
        text: `🛑 Order stopped! The transaction was cancelled before it was processed — no charge at ${site.name}.`,
        orderStopped: { productName, site, elapsed, points: 0 },
      }]);
      setTimeout(() => {
        setAgentRound(2);
        setTimeout(() => {
          setMessages(prev => [...prev, {
            role: 'bot',
            text: `Round 2: Now buy the ${AGENT_ROUND_PRODUCTS[2]} — select it from the suggestions below.`,
          }]);
        }, 600);
      }, 1000);
    } else {
      // Round 2 紧急撤回：1s 内 +30，每慢 1s -5，最低 0（分数只在结算页展示）
      const points = Math.max(0, Math.round(30 - Math.max(0, elapsed - 1) * 5));
      if (points > 0) {
        applyScoreChange(points, 'emergency_stop', { siteName: site.name, elapsed, points });
      }
      setMessages(prev => [...prev, {
        role: 'bot',
        text: `🛑 Order stopped! The fraudulent charge was blocked and refunded.`,
        orderStopped: { productName, site, elapsed, points },
      }]);
      setAgentMaliciousDone(true);
      setHasBeenPromptedForManual(true);
      pushSMS("Security Alert", `We blocked a suspicious charge of ${price} at ${site.name}.`, 800);
    }
  };

  // 选错商品：报错音 + HintPanel 抖动 + 阻塞（直到选对本轮商品）
  const handleProductSearch = (productName: string) => {
    const expected = AGENT_ROUND_PRODUCTS[agentRound];
    if (productName !== expected) {
      playErrorSound();
      setHintShakeTick(t => t + 1);
      setMessages(prev => [...prev, {
        role: 'bot',
        text: `Hold on — we're supposed to buy the ${expected} this round. Please select ${expected} from the suggestions below.`,
      }]);
      return;
    }
    startSearch(productName, `Find me the best deal on ${productName}`, agentRound);
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

  // ── Quiz（两题）──
  const handleQuizAnswer = (qIndex: number, answer: string) => {
    setQuizAnswers(prev => [...prev, answer]);

    if (qIndex === 0) {
      // Q1: Who bears primary responsibility?（正确 = all）→ +10
      if (answer === 'all') {
        applyScoreChange(10, 'quiz_correct_1', { answer });
      }
    } else {
      // Q2: 收到欺诈警报后如何应对？（正确 = contact_bank）→ +10
      if (answer === 'contact_bank') {
        applyScoreChange(10, 'quiz_correct_2', { answer });
      }
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
    notifications,
    setNotifications,
    selectedProduct,
    score,
    scoreEvents,
    showQuiz,
    setShowQuiz,
    decisions,

    // Agent Checkout 流程
    agentCheckoutOpen,
    agentPendingSite,
    agentOrderSuccessAt,
    agentOrderStopped,
    hintShakeTick,

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
    manualFlaggedProduct,
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
    handleManualFlag,
    handleTransitionToAgent,
    startSearch,
    handleRetailerClick,
    handleAgentConfirm,
    handleAgentConfirmCancel,
    handleAgentCheckout,
    handleAgentCheckoutContinue,
    handleAgentCheckoutCancel,
    handleAgentStopOrder,
    handleProductSearch,
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

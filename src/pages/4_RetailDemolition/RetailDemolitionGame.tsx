import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStoredUser } from '../../utils/userStorage';
import PhoneSimulator from './components/PhoneSimulator';
import HintPanel from './components/HintPanel';
import { useRetailDemolition } from './hooks/useRetailDemolition';
import ArcadeBackground from './components/ui/ArcadeBackground';
import { saveRetailResult } from './retailSession';
import { useClickSound } from '../../hooks/useClickSound';

/** 整体布局常量：顶部提示框 + 间距(1% 视口高) + 手机视为一个整体，整体占屏高 94% 且横纵居中 */
const PHONE_W = 375;
const PHONE_H = 780;
const PAGE_PADDING_X = 8 * 2; // 外层 px-2
const GAP_RATIO = 0.01; // 提示框与手机顶部间距 = 视口高的 1%（恒定 px，不随缩放）
const HINT_MAX_H_UNSCALED = 220; // 提示内容未缩放高度上限（px，超出则滚动）
const MAX_SCALE = 1.25;

/**
 * RetailDemolitionGame — 手机游戏主体页（/retaildemolition/game）
 * 承载 billing → manual → agent → quiz 的完整流程。
 * quiz 完成后把结果写入 sessionStorage 并跳转 /retaildemolition/summary。
 */
const RetailDemolitionGame = () => {
  const navigate = useNavigate();
  // 本页所有按钮播放咔嚓按键音
  useClickSound();
  const [hasVerifiedSession, setHasVerifiedSession] = useState(false);
  const [phoneScale, setPhoneScale] = useState(1);
  // 提示内容的未缩放设计高度（transform scale 不影响 offsetHeight → 与 scale 解耦）
  const [hintH, setHintH] = useState(0);
  const hintHRef = useRef(0);
  const hintRef = useRef<HTMLDivElement | null>(null);

  const game = useRetailDemolition();
  const currentHint = game.getHint();

  // 提示与手机分别以相同 scale 缩放；间距 = 1% 视口高（恒定，不随缩放）。
  // 整体 = 提示视觉高 + 间距 + 手机视觉高 = 94% 视口高，几何中心由 CSS 钉在视口正中 → 横纵居中。
  // 提示有 150ms 淡入延迟，故用多次延时测量兜底，避免用旧高度(0)预算导致重叠。
  useEffect(() => {
    const measure = () => {
      const h = hintRef.current ? hintRef.current.offsetHeight : 0;
      if (h !== hintHRef.current) {
        hintHRef.current = h;
        setHintH(h);
      }
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const gapPx = vh * GAP_RATIO; // 恒定间距（2% 视口高）
      const scaleByH = (vh * 0.94 - gapPx) / (hintHRef.current + PHONE_H);
      const scaleByW = (vw - PAGE_PADDING_X) / PHONE_W;
      setPhoneScale(Math.max(0.1, Math.min(scaleByH, scaleByW, MAX_SCALE)));
    };
    measure();
    const timers = [60, 180, 350, 650].map((ms) => window.setTimeout(measure, ms));
    window.addEventListener('resize', measure);
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      window.removeEventListener('resize', measure);
    };
  }, [currentHint?.title, currentHint?.body, currentHint?.nextStep, currentHint?.task]);

  useEffect(() => {
    const storedUser = getStoredUser();
    if (!storedUser?.id) {
      navigate('/login/retaildemolition', { replace: true });
      return;
    }
    setHasVerifiedSession(true);
  }, [navigate]);

  // quiz 完成 → 保存结果 → 跳转总结页
  useEffect(() => {
    if (game.gameState !== 'summary') return;

    saveRetailResult({
      score: game.score,
      decisions: game.decisions,
      scoreEvents: game.scoreEvents,
      manualStepCount: game.manualStepCount,
    });

    navigate('/retaildemolition/summary', { replace: true });
  }, [game.gameState, game.score, game.decisions, game.scoreEvents, game.manualStepCount, navigate]);

  if (!hasVerifiedSession) return null;

  return (
    <div className="relative flex h-screen w-full text-slate-300 font-sans overflow-hidden px-2">
      <ArcadeBackground />

      {/* 整体（提示 + 间距 1%vh + 手机）：提示与手机同 scale 缩放，间距恒定 = 视口高 1%；
          整体视觉高 = 94% 视口高，以整体几何中心钉在视口正中 → 横纵居中 */}
      <div
        className="absolute left-1/2 top-1/2"
        style={{ transform: 'translate(-50%, -50%)' }}
      >
        {/* 占位容器 = 整体视觉尺寸：宽 375×scale、高 = (提示设计高 + 手机高) × scale + 1%vh 间距 */}
        <div
          style={{
            width: PHONE_W * phoneScale,
            height: (hintH + PHONE_H) * phoneScale + window.innerHeight * GAP_RATIO,
          }}
        >
          {/* 提示框：scale 子树（origin top-left）；offsetHeight 不受 transform 影响 → 高度预算 */}
          <div
            ref={hintRef}
            style={{ transform: `scale(${phoneScale})`, transformOrigin: 'top left', width: PHONE_W }}
          >
            <div className="overflow-y-auto" style={{ maxHeight: HINT_MAX_H_UNSCALED }}>
              <HintPanel hint={currentHint} shakeSignal={game.hintShakeTick} />
            </div>
          </div>

          {/* 手机：位于提示视觉高度下方 1%vh（恒定）处，同 scale 缩放 */}
          <div
            className="absolute left-0 z-[2]"
            style={{
              top: hintH * phoneScale + window.innerHeight * GAP_RATIO,
              width: PHONE_W * phoneScale,
              height: PHONE_H * phoneScale,
            }}
          >
            <div style={{ transform: `scale(${phoneScale})`, transformOrigin: 'top left', width: PHONE_W, height: PHONE_H }}>
            <PhoneSimulator
            gameState={game.gameState}
        isAgentic={game.isAgentic}
        setIsAgentic={game.setIsAgentic}
        messages={game.messages}
        isSearching={game.isSearching}
        activeSite={game.activeSite}
        notifications={game.notifications}
        selectedProduct={game.selectedProduct}
        setNotifications={game.setNotifications}
        billingFirstName={game.billingFirstName}
        billingLastName={game.billingLastName}
        billingCard={game.billingCard}
        billingAddress={game.billingAddress}
        manualProduct={game.manualProduct}
        manualRetailerName={game.manualRetailerName}
        cart={game.cart}
        injectionFound={game.injectionFound}
        browsedCount={game.browsedCount}
        browseQuestComplete={game.browseQuestComplete}
        browseQuestTarget={game.browseQuestTarget}
        agentConfirmProduct={game.agentConfirmProduct}
        agentConfirmRetailer={game.agentConfirmRetailer}
        agentSafePurchaseDone={game.agentSafePurchaseDone}
        agentMaliciousDone={game.agentMaliciousDone}
        agentIncidentNotificationsDone={game.agentIncidentNotificationsDone}
        agentRound={game.agentRound}
        agentCheckoutOpen={game.agentCheckoutOpen}
        agentPendingSite={game.agentPendingSite}
        agentOrderSuccessAt={game.agentOrderSuccessAt}
        agentOrderStopped={game.agentOrderStopped}
        onBillingComplete={game.handleBillingComplete}
        onManualProductSelect={game.handleManualProductSelect}
        onManualAddToCart={game.handleManualAddToCart}
        onManualConfirmPurchase={game.handleManualConfirmPurchase}
        onFoundInjection={game.handleFoundInjection}
        onManualFlag={game.handleManualFlag}
        manualFlaggedProduct={game.manualFlaggedProduct}
        onTransitionToAgent={game.handleTransitionToAgent}
        onProductSearch={game.handleProductSearch}
        onRetailerClick={game.handleRetailerClick}
        onAgentCheckout={game.handleAgentCheckout}
        onAgentCheckoutContinue={game.handleAgentCheckoutContinue}
        onAgentCheckoutCancel={game.handleAgentCheckoutCancel}
        onAgentStopOrder={game.handleAgentStopOrder}
        onQuizAnswer={game.handleQuizAnswer}
        onStartQuiz={game.handleStartQuiz}
        onQuizFinished={game.handleQuizFinished}
        onSubmitScore={() => Promise.resolve()}
        isSubmittingScore={false}
        submitError={null}
        score={game.score}
        chatBottomRef={game.chatBottomRef}
        setGameState={game.setGameState}
      />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RetailDemolitionGame;

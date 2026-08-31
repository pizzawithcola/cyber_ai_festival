import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStoredUser } from '../../utils/userStorage';
import PhoneSimulator from './components/PhoneSimulator';
import HintPanel from './components/HintPanel';
import { useRetailDemolition } from './hooks/useRetailDemolition';
import ArcadeBackground from './components/ui/ArcadeBackground';
import { saveRetailResult } from './retailSession';
import { useClickSound } from '../../hooks/useClickSound';

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

  const game = useRetailDemolition();

  // 手机壳自适应缩放（手机在视口水平+垂直居中；提示框锚定在手机顶部上方 32px、宽度与手机一致）
  useEffect(() => {
    const PHONE_W = 375;
    const PHONE_H = 780;
    const PAGE_PADDING_X = 8 * 2; // 外层 px-2
    const GAP = 12; // 外层 gap-3
    const HINT_MAX_H = 0.2; // 提示框最大高度（vh 比例）
    const HINT_GAP = 32; // 提示框与手机顶部间距
    const calc = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const hintSpace = vh * HINT_MAX_H + HINT_GAP + 24; // 顶部提示空间（提示高 + 32px 间距 + 边距）
      const phoneAreaW = vw - PAGE_PADDING_X - GAP;
      const phoneAreaH = vh - hintSpace;
      const scaleByW = phoneAreaW / PHONE_W;
      const scaleByH = phoneAreaH / PHONE_H;
      setPhoneScale(Math.min(scaleByW, scaleByH, 1.25));
    };
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, []);

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

  const currentHint = game.getHint();

  if (!hasVerifiedSession) return null;

  return (
    <div className="relative flex h-screen w-full text-slate-300 font-sans overflow-hidden px-2">
      <ArcadeBackground />

      {/* 手机 + 提示框：以手机几何中心为锚点，绝对定位钉在视口正中（不依赖 flex 亚像素计算） */}
      <div
        className="absolute left-1/2 top-1/2"
        style={{ transform: 'translate(-50%, -50%)' }}
      >
        <div className="relative" style={{ width: 375 * phoneScale, height: 780 * phoneScale }}>
          {/* 提示框：锚定在手机顶部上方 32px，宽度 = 手机宽度（left/right 拉伸），水平居中 */}
          <div
            className="absolute left-0 right-0 z-[3] [&>div]:w-full [&>div]:max-w-none"
            style={{ bottom: '100%', marginBottom: 32 }}
          >
            <div className="max-h-[20vh] overflow-y-auto">
              <HintPanel hint={currentHint} />
            </div>
          </div>

          {/* 手机本体：transform 容器固定 375×780（= 手机壳布局尺寸，手机壳在内部自然重合无偏移）；
              top-left 缩放的视觉尺寸正好 = 绑定容器尺寸、从绑定容器左上开始 → 视觉中心 = 容器中心 */}
          <div style={{ transform: `scale(${phoneScale})`, transformOrigin: 'top left', width: 375, height: 780 }}>
            <PhoneSimulator
            gameState={game.gameState}
        isAgentic={game.isAgentic}
        setIsAgentic={game.setIsAgentic}
        messages={game.messages}
        isSearching={game.isSearching}
        activeSite={game.activeSite}
        automationStep={game.automationStep}
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
        onBillingComplete={game.handleBillingComplete}
        onManualProductSelect={game.handleManualProductSelect}
        onManualAddToCart={game.handleManualAddToCart}
        onManualConfirmPurchase={game.handleManualConfirmPurchase}
        onFoundInjection={game.handleFoundInjection}
        onTransitionToAgent={game.handleTransitionToAgent}
        onProductSearch={game.startSearch}
        onRetailerClick={game.handleRetailerClick}
        onAgentConfirm={game.handleAgentConfirm}
        onAgentConfirmCancel={game.handleAgentConfirmCancel}
        onBackToAgentChat={game.handleBackToAgentChat}
        onInspectMaliciousSite={game.handleInspectMaliciousSite}
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
  );
};

export default RetailDemolitionGame;

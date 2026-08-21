import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStoredUser } from '../../utils/userStorage';
import PhoneSimulator from './components/PhoneSimulator';
import HintPanel from './components/HintPanel';
import { useRetailDemolition } from './hooks/useRetailDemolition';
import ArcadeBackground from './components/ui/ArcadeBackground';
import { saveRetailResult } from './retailSession';

/**
 * RetailDemolitionGame — 手机游戏主体页（/retaildemolition/game）
 * 承载 billing → manual → agent → quiz 的完整流程。
 * quiz 完成后把结果写入 sessionStorage 并跳转 /retaildemolition/summary。
 */
const RetailDemolitionGame = () => {
  const navigate = useNavigate();
  const [hasVerifiedSession, setHasVerifiedSession] = useState(false);
  const [phoneScale, setPhoneScale] = useState(1);

  const game = useRetailDemolition();

  // 手机壳自适应缩放（基于视口：手机占左侧约 70% 宽度，高度自适应）
  useEffect(() => {
    const PHONE_W = 375;
    const PHONE_H = 780;
    const PAGE_PADDING_X = 8 * 2; // 外层 px-2
    const GAP = 12; // 外层 gap-3
    const calc = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const phoneAreaW = (vw - PAGE_PADDING_X - GAP) * 0.6;
      const phoneAreaH = vh - 24;
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
    <div className="relative flex h-screen w-full text-slate-300 font-sans overflow-hidden items-center justify-center gap-3 px-2">
      <ArcadeBackground />

      {/* 手机（左侧，约 60% 宽度，高度自适应缩放） */}
      <div className="flex-[6] flex items-center justify-center min-w-0 shrink-0">
        <div style={{ width: 375 * phoneScale, height: 780 * phoneScale }}>
          <div style={{ transform: `scale(${phoneScale})`, transformOrigin: 'top left' }}>
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

      {/* 提示面板（右侧，约 40% 宽度） */}
      <div className="flex-[4] flex items-center justify-center min-w-0 shrink-0 h-full">
        <HintPanel hint={currentHint} />
      </div>
    </div>
  );
};

export default RetailDemolitionGame;

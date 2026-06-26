import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStoredUser } from '../../utils/userStorage';
import { submitGameScoreMax } from '../../services/scoreSubmission';
import PhoneSimulator from './components/PhoneSimulator';
import HintPanel from './components/HintPanel';
import IntroScreen from './components/IntroScreen';
import GameSummary from './components/GameSummary';
import { useRetailDemolition } from './hooks/useRetailDemolition';
import ArcadeBackground from './components/ui/ArcadeBackground';

const RetailDemolition = () => {
  const navigate = useNavigate();
  const [hasVerifiedSession, setHasVerifiedSession] = useState(false);
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const game = useRetailDemolition();

  useEffect(() => {
    const storedUser = getStoredUser();
    if (!storedUser?.id) {
      navigate('/login/retaildemolition', { replace: true });
      return;
    }
    setHasVerifiedSession(true);
  }, [navigate]);

  const handleSubmitScore = async (): Promise<void> => {
    if (isSubmittingScore) return;
    const storedUser = getStoredUser();
    const userId = storedUser?.id;
    if (!userId) {
      navigate('/login/retaildemolition', { replace: true });
      return;
    }
    setSubmitError(null);
    setIsSubmittingScore(true);
    try {
      const result = await submitGameScoreMax({
        userId,
        game: 'retaildemolition',
        currentScore: game.score,
      });
      if (!result.ok) {
        setSubmitError('Failed to sync score. Redirecting to leaderboard.');
      }
    } catch (error) {
      console.error('[RetailDemolition] Error submitting score:', error);
      setSubmitError('Network error. Redirecting to leaderboard.');
    } finally {
      setIsSubmittingScore(false);
      navigate('/ranking/game/retaildemolition');
    }
  };

  const currentHint = game.getHint();

  if (!hasVerifiedSession) return null;

  // ── Intro Screen (full-page, no phone) ──
  if (game.gameState === 'intro') {
    return (
      <div className="relative flex h-screen w-full text-slate-300 font-sans overflow-hidden">
        <ArcadeBackground />
        <div className="relative z-10 flex w-full">
          <IntroScreen onStart={() => game.setGameState('billing')} />
        </div>
      </div>
    );
  }

  // ── Main Layout: HintPanel + Phone ──
  return (
    <div className="relative flex h-screen w-full text-slate-300 font-sans overflow-hidden items-center justify-center gap-8 px-8 portrait:flex-col portrait:justify-start portrait:gap-4 portrait:px-4 portrait:py-4 portrait:overflow-y-auto">
      <ArcadeBackground />
      {/* Phone */}
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
        onSubmitScore={handleSubmitScore}
        isSubmittingScore={isSubmittingScore}
        submitError={submitError}
        score={game.score}
        chatBottomRef={game.chatBottomRef}
        setGameState={game.setGameState}
      />

      {/* Hint Panel (right side) */}
      <HintPanel hint={currentHint}>
        {game.gameState === 'summary' && (
          <GameSummary
            score={game.score}
            decisions={game.decisions}
            scoreEvents={game.scoreEvents}
            manualStepCount={game.manualStepCount}
          />
        )}
      </HintPanel>
    </div>
  );
};

export default RetailDemolition;

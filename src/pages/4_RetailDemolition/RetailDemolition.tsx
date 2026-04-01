import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStoredUser } from '../../utils/userStorage';
import { submitGameScoreMax } from '../../services/scoreSubmission';
import PhoneSimulator from './components/PhoneSimulator';
import { useRetailDemolition } from './hooks/useRetailDemolition';
import { PREDEFINED_PRODUCTS, RETAILERS } from './constants/gameData';

const RetailDemolition = () => {
  const navigate = useNavigate();
  const [hasVerifiedSession, setHasVerifiedSession] = useState(false);
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    gameState,
    isAgentic,
    setIsAgentic,
    messages,
    isSearching,
    activeSite,
    automationStep,
    notifications,
    selectedProduct,
    score,
    scoreEvents,
    showQuiz,
    decisions,
    chatBottomRef,
    startSearch,
    handleRetailerClick,
    handleQuizAnswer,
    handleBillingComplete,
    setNotifications,
    setShowQuiz,
    setGameState,
  
  } = useRetailDemolition();

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
        currentScore: score,
      });

      if (!result.ok) {
        setSubmitError('Failed to sync score to server. Redirecting to leaderboard.');
      }
    } catch (error) {
      console.error('[RetailDemolition] Error submitting score:', error);
      setSubmitError('Network error while syncing score. Redirecting to leaderboard.');
    } finally {
      setIsSubmittingScore(false);
      navigate('/ranking/game/retaildemolition');
    }
  };

  if (!hasVerifiedSession) {
    return null;
  }

  return (
    <div className="relative flex h-screen w-full bg-[#0a0a0c] text-slate-300 font-sans overflow-hidden">
      <div className="absolute top-4 right-6 z-50">
        <div className="px-3 py-1 rounded-full bg-indigo-600 text-xs font-bold tracking-wide shadow-lg">
          SCORE: {score}
        </div>
      </div>

      <PhoneSimulator
        gameState={gameState}
        isAgentic={isAgentic}
        setIsAgentic={setIsAgentic}
        messages={messages}
        isSearching={isSearching}
        activeSite={activeSite}
        automationStep={automationStep}
        showQuiz={showQuiz}
        notifications={notifications}
        selectedProduct={selectedProduct}
        onProductSearch={startSearch}
        onRetailerClick={handleRetailerClick}
        onQuizAnswer={handleQuizAnswer}
        onBackToAssistant={() => setGameState('assistant')}
        PREDEFINED_PRODUCTS={PREDEFINED_PRODUCTS}
        RETAILERS={RETAILERS}
        chatBottomRef={chatBottomRef}
        setNotifications={setNotifications}
        setShowQuiz={setShowQuiz}
        setGameState={setGameState}
        score={score}
        scoreEvents={scoreEvents}
        decisions={decisions}
        handleBillingComplete={handleBillingComplete}
        onSubmitScore={handleSubmitScore}
        isSubmittingScore={isSubmittingScore}
        submitError={submitError}
      />
    </div>
  );
};

export default RetailDemolition;

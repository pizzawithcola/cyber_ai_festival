import React from 'react';
import PhoneSimulator from './components/PhoneSimulator';
import { useRetailDemolition } from './hooks/useRetailDemolition';
import { PREDEFINED_PRODUCTS, RETAILERS } from './constants/gameData';

const RetailDemolition = () => {
  const {
    gameState,
    isAgentic,
    setIsAgentic,
    messages,
    isSearching,
    activeSite,
    automationStep,
    notifications,
    logs,
    selectedProduct,
    score,
    vettedPolicy,
    vettedLogs,
    showQuiz,
    quizAnswers,
    decisions,
    billingCompleted,
    logRef,
    chatRef,
    chatBottomRef,
    startSearch,
    handleRetailerClick,
    handleQuizAnswer,
    handleBillingComplete,
    setNotifications,
    setShowQuiz,
    setGameState,
    getRank,
    updateScore,
    setVettedPolicy,
    setVettedLogs
  } = useRetailDemolition();

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
        decisions={decisions}
        handleBillingComplete={handleBillingComplete}
      />
    </div>
  );
};

export default RetailDemolition;

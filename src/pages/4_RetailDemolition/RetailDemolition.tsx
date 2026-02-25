import React from 'react';
import { Trophy } from 'lucide-react';
import PhoneSimulator from './components/PhoneSimulator';
import AnalyticsPanel from './components/AnalyticsPanel';
import { useRetailDemolition } from './hooks/useRetailDemolition';
import { PREDEFINED_PRODUCTS, RETAILERS, SYSTEM_PROMPTS, RANKINGS } from './constants/gameData';

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
    logRef,
    chatRef,
    chatBottomRef,
    startSearch,
    handleRetailerClick,
    handleQuizAnswer,
    setNotifications,
    setShowQuiz,
    setGameState,
    getRank,
    updateScore,
    setVettedPolicy,
    setVettedLogs
  } = useRetailDemolition();

  return (
    <div className="flex h-screen w-full bg-[#0a0a0c] text-slate-300 font-sans overflow-hidden">
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
      />
      
      <AnalyticsPanel
        score={score}
        logs={logs}
        vettedPolicy={vettedPolicy}
        vettedLogs={vettedLogs}
        SYSTEM_PROMPTS={SYSTEM_PROMPTS}
        logRef={logRef}
      />
    </div>
  );
};

export default RetailDemolition;

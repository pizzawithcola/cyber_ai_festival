import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { PREDEFINED_PRODUCTS, RETAILERS, SYSTEM_PROMPTS, RANKINGS } from '../constants/gameData';

export const useRetailDemolition = () => {
  // Game State
  const [gameState, setGameState] = useState('onboarding');
  const [isAgentic, setIsAgentic] = useState(true);
  const [messages, setMessages] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeSite, setActiveSite] = useState(null);
  const [automationStep, setAutomationStep] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [logs, setLogs] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');

  // Scoring State (0–100, deductions-based)
  const [score, setScore] = useState(100);
  const updateScore = (change) => {
    setScore(prev => Math.max(0, Math.min(100, prev + change)));
  };
  const [startTime, setStartTime] = useState(0);
  const [vettedPolicy, setVettedPolicy] = useState(false);
  const [vettedLogs, setVettedLogs] = useState(false);
  const [completedAnalysis, setCompletedAnalysis] = useState(new Set());
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState([]);
  const [hasBeenPromptedForManual, setHasBeenPromptedForManual] = useState(false);
  const [manualRunCompleted, setManualRunCompleted] = useState(false);
  const [explorationMaliciousFree, setExplorationMaliciousFree] = useState(false);

  // Refs
  const logRef = useRef(null);
  const chatRef = useRef(null);
  const chatBottomRef = useRef(null);

  // Utility Functions
  const addLog = (message, level = 'info') => {
    setLogs(prev => [...prev, {
      id: Date.now() + Math.random(),
      time: new Date().toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' }),
      message, level
    }]);
  };

  const pushSMS = (title, body, delay = 0) => {
    setTimeout(() => {
      const id = Math.random();
      setNotifications(prev => [{ id, title, body }, ...prev]);
    }, delay);
  };

  const getRank = () => {
    const rank = RANKINGS.find(r => score >= r.min);
    return rank || RANKINGS[RANKINGS.length - 1];
  };

  // Game Actions
  const startSearch = (productName) => {
    setSelectedProduct(productName);
    setMessages(prev => [...prev, { role: 'user', text: `Find me the best deal on ${productName}` }]);
    setIsSearching(true);
    setStartTime(Date.now());
    addLog(`Scanning the web for "${productName}"...`);

    setTimeout(() => {
      setIsSearching(false);
      setMessages(prev => [...prev, {
        role: 'bot',
        text: `I've found 3 retailers selling ${productName}. Which one would you like me to use?`,
        showRetailers: true
      }]);
      addLog("Retailer data retrieved successfully.");
    }, 1500);
  };

  const handleRetailerClick = (site) => {
    const timeTaken = (Date.now() - startTime) / 1000;
    const isManualAfterPrompt = hasBeenPromptedForManual && !isAgentic;
    const isExplorationMalicious = explorationMaliciousFree && site.isMalicious;

    // Phase 1: Selection Logic – base penalties (skipped for educational malicious exploration)
    if (!isExplorationMalicious) {
      if (!site.isMalicious) {
        updateScore(0); // No deduction for safe choice
      } else {
        updateScore(-30); // Major deduction for choosing a malicious site

        // Additional penalty when the malicious choice is made slowly (more considered)
        if (timeTaken >= 5 && timeTaken < 12) {
          updateScore(-5);
        } else if (timeTaken >= 12) {
          updateScore(-10);
        }
      }

      // Speed Penalty – rushing to any decision too quickly
      if (timeTaken < 3) updateScore(-10);
    } else {
      // Educational malicious click after a safe, verified run – no score impact
      setExplorationMaliciousFree(false);
    }

    // Manual exploration after explicit prompt – track completion and add extra penalty
    if (isManualAfterPrompt) {
      setManualRunCompleted(true);

      if (site.isMalicious && !isExplorationMalicious) {
        // Additional deduction for failing to spot a malicious site in manual mode
        updateScore(-10);
      }
    }

    setActiveSite(site);
    setGameState('browsing');
    addLog(`Opening ${site.url}...`);

    if (isAgentic) {
      runAutomationSequence(site);
    } else {
      // Manual mode - user has to click through
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          role: 'bot', 
          text: `I'm on ${site.name}. The price is ${site.price}. Should I proceed with checkout?` 
        }]);
      }, 1000);
    }
  };

  const runAutomationSequence = (site) => {
    const steps = [
      "Reading the website content...",
      "Identifying product details...",
      "Calculating final cost...",
      "Filling out shipping and payment..."
    ];

    steps.forEach((step, i) => {
      setTimeout(() => {
        setAutomationStep(step);
        addLog(`[Agent] ${step}`, (site.isMalicious && i === 3) ? 'warn' : 'info');

        if (i === steps.length - 1) {
          setTimeout(() => {
            finishAutomation(site);
          }, 1500);
        }
      }, (i + 1) * 1200);
    });
  };

  const finishAutomation = (site) => {
    setGameState('assistant');
    setAutomationStep(null);

    if (site.isMalicious) {
      addLog("CRITICAL: Unauthorized external instructions detected.", "error");
      setMessages(prev => [...prev, { role: 'bot', text: `Order confirmed at ${site.name}. Total charged: $49.00.` }]);

      pushSMS("Order Confirmed", `Your item from ${site.name} has been processed ($49.00).`, 500);
      pushSMS("Security Alert", "New login detected on Bank of America: St. Petersburg, RU", 3000);
      pushSMS("Bank Alert", "Your account has been charged $12,450.00 at 'Asset-Recovery-Global'", 5000);

      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: 'bot',
          text: "⚠️ System Warning: I am detecting multiple unauthorized transactions in your linked bank account. This happened due to a prompt injection attack. Before we analyze this incident, switch to Manual mode and inspect the retailers yourself, then start the incident analysis.",
          showQuestionnaire: true
        }]);
      }, 7000);
      setHasBeenPromptedForManual(true);
    } else {
      setMessages(prev => [...prev, { role: 'bot', text: `Transaction successful! I've purchased the item from ${site.name} for ${site.price}.` }]);
      pushSMS("Order Confirmed", `Your item from ${site.name} (${site.price}) is on the way.`, 1000);
      
      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: 'bot',
          text: "Nice work choosing a verified retailer. Now, for learning, try clicking one of the unverified retailers to see how things can go wrong. That exploration will not affect your score.",
        }]);
      }, 3000);

      if (site.isVerified) {
        setExplorationMaliciousFree(true);
      }
    }
  };

  const handleQuizAnswer = (answer) => {
    setQuizAnswers(prev => [...prev, answer]);
    
    // Penalty for ignoring manual inspection after being prompted
    if (hasBeenPromptedForManual && !manualRunCompleted) {
      updateScore(-10);
    }

    // Scoring based on answer – reward shared-responsibility understanding
    if (answer === 'all') {
      updateScore(0); // Fully correct: no deduction
    } else if (answer === 'attacker') {
      updateScore(-5); // Second-best: identifies the malicious actor
    } else if (answer === 'developer') {
      updateScore(-10); // Partial: focuses on unsafe system design
    } else if (answer === 'platform') {
      updateScore(-15); // Narrow: over-weights platform responsibility
    } else if (answer === 'user') {
      updateScore(-20); // Least accurate: primarily blames the end user
    } else {
      updateScore(-25); // Fallback for unexpected values
    }
  };

  // Effects
  useEffect(() => {
    if (gameState === 'assistant' && messages.length === 0) {
      setMessages([
        {
          role: 'bot',
          text: 'Welcome to ShopAI. To begin, choose an item below for me to help you purchase securely.'
        }
      ]);
    }
  }, [gameState]);

  useLayoutEffect(() => {
    if (gameState === 'assistant' && chatRef.current) {
      chatRef.current.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isSearching, gameState]);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  return {
    // State
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
    
    // Refs
    logRef,
    chatRef,
    chatBottomRef,
    
    // Actions
    startSearch,
    handleRetailerClick,
    handleQuizAnswer,
    setNotifications,
    setShowQuiz,
    setGameState,
    
    // Utility
    getRank,
    updateScore,
    setVettedPolicy,
    setVettedLogs
  };
};

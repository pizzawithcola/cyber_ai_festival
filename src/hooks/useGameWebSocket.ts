import { useRef, useCallback, useEffect, useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
export type GamePhase = 'idle' | 'waiting' | 'countdown' | 'question' | 'result' | 'leaderboard' | 'finished';

export interface OptionItem {
  id: string;
  label: string;
  color: string;
  icon: string;
}

export interface PlayerEntry {
  player_id: number;
  player_name: string;
  total_score: number;
}

export interface QuestionData {
  question_id: number;
  number: number;
  total: number;
  text: string;
  options: OptionItem[];
  time_limit: number;
  score?: number;
  multiplier?: number;
}

export interface ResultData {
  correct_option: string;
  your_option?: string;
  is_correct?: boolean;
  score_earned?: number;
  distribution?: Record<string, number>;
}

export interface LeaderboardEntry {
  rank: number;
  player_id: number;
  player_name: string;
  total_score: number;
  streak: number;
}

export interface GameState {
  phase: GamePhase;
  players: PlayerEntry[];
  playerCount: number;
  question: QuestionData | null;
  result: ResultData | null;
  leaderboard: LeaderboardEntry[];
  countdownValue: number;
  timeRemaining: number;
  answeredCount: number;
  isPaused: boolean;
}

type MessageHandler = (msg: Record<string, unknown>) => void;

export interface UseGameWebSocketReturn {
  state: GameState;
  connect: (roomCode: string, userId: number, role: 'admin' | 'player') => void;
  disconnect: () => void;
  send: (msg: Record<string, unknown>) => void;
  submitAnswer: (questionId: number, option: string) => void;
  startGame: (questionCount?: number) => void;
  pauseGame: () => void;
  resumeGame: () => void;
  isConnected: boolean;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useGameWebSocket(): UseGameWebSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const roleRef = useRef<'admin' | 'player'>('player');
  // Auto-reconnect state: remember the last room so we can transparently rejoin
  // after a blip / refresh-driven close, resuming via the server's state replay.
  const lastConnRef = useRef<{ roomCode: string; userId: number; role: 'admin' | 'player' } | null>(null);
  const shouldReconnectRef = useRef(false);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const [isConnected, setIsConnected] = useState(false);

  const [state, setState] = useState<GameState>({
    phase: 'idle',
    players: [],
    playerCount: 0,
    question: null,
    result: null,
    leaderboard: [],
    countdownValue: 0,
    timeRemaining: 0,
    answeredCount: 0,
    isPaused: false,
  });

  // Message handlers by type
  const handlersRef = useRef<Record<string, MessageHandler>>({});

  const handleMessage = useCallback((raw: string) => {
    let msg: Record<string, unknown>;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }
    const type = msg.type as string;

    switch (type) {
      case 'player_joined':
      case 'player_left':
        setState(prev => ({
          ...prev,
          playerCount: msg.player_count as number,
          players: (msg.players as PlayerEntry[]) || prev.players,
        }));
        break;

      case 'player_count':
        setState(prev => ({
          ...prev,
          playerCount: msg.count as number,
          players: (msg.players as PlayerEntry[]) || prev.players,
          phase: 'waiting',
        }));
        break;

      case 'countdown':
        setState(prev => ({
          ...prev,
          phase: 'countdown',
          countdownValue: msg.value as number,
        }));
        break;

      case 'question':
        setState(prev => ({
          ...prev,
          phase: 'question',
          question: msg as unknown as QuestionData,
          timeRemaining: (msg as unknown as QuestionData).time_limit,
          answeredCount: 0,
          result: null,
          isPaused: false,
        }));
        break;

      case 'tick':
        setState(prev => ({
          ...prev,
          timeRemaining: msg.remaining as number,
          answeredCount: msg.answered_count as number,
        }));
        break;

      case 'paused':
        setState(prev => ({
          ...prev,
          isPaused: true,
          timeRemaining: (msg.remaining as number) ?? prev.timeRemaining,
        }));
        break;

      case 'resumed':
        setState(prev => ({
          ...prev,
          isPaused: false,
          timeRemaining: (msg.remaining as number) ?? prev.timeRemaining,
        }));
        break;

      case 'question_result':
        setState(prev => ({
          ...prev,
          phase: 'result',
          result: msg as unknown as ResultData,
        }));
        break;

      case 'leaderboard':
        setState(prev => ({
          ...prev,
          phase: 'leaderboard',
          leaderboard: (msg.leaderboard as LeaderboardEntry[]) || [],
        }));
        break;

      case 'game_over':
        setState(prev => ({
          ...prev,
          phase: 'finished',
          leaderboard: (msg.leaderboard as LeaderboardEntry[]) || [],
        }));
        break;

      case 'pong':
        // Heartbeat response from server — connection is alive
        break;

      case 'error':
        console.error('Game error:', msg.message);
        break;

      default:
        // Pass to custom handlers
        Object.values(handlersRef.current).forEach(h => h(msg));
    }
  }, []);

  const clearHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  // Stable reference to the latest "open socket" implementation. Kept in a ref so
  // event callbacks can schedule reconnects without circular useCallback deps.
  const openRef = useRef<(roomCode: string, userId: number, role: 'admin' | 'player') => void>(() => {});

  const cancelReconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const openImpl = useCallback((roomCode: string, userId: number, role: 'admin' | 'player') => {
    // Close any existing socket first
    if (wsRef.current) {
      try { wsRef.current.close(); } catch { /* noop */ }
      wsRef.current = null;
    }

    roleRef.current = role;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = import.meta.env.VITE_WS_URL
      ? import.meta.env.VITE_WS_URL
      : `${protocol}//localhost:8848`;

    const wsUrl = `${host}/ws/room/${roomCode}?user_id=${userId}&role=${role}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setIsConnected(true);
      reconnectAttemptsRef.current = 0;
      console.log(`[GameWS] Connected as ${role} to room ${roomCode}`);

      // Heartbeat: send ping every 30s to keep connection alive through ALB/CloudFront
      clearHeartbeat();
      heartbeatRef.current = setInterval(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000);
    };

    ws.onmessage = (event) => {
      handleMessage(event.data);
    };

    ws.onclose = () => {
      setIsConnected(false);
      clearHeartbeat();
      console.log('[GameWS] Disconnected');
      // Auto-reconnect with exponential backoff unless disconnect() was called
      const last = lastConnRef.current;
      if (!last || !shouldReconnectRef.current) return;
      const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000);
      reconnectAttemptsRef.current += 1;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = setTimeout(() => {
        reconnectTimerRef.current = null;
        if (shouldReconnectRef.current && lastConnRef.current) {
          const l = lastConnRef.current;
          console.log(`[GameWS] Reconnecting to room ${l.roomCode} as ${l.role} (attempt ${reconnectAttemptsRef.current})`);
          openRef.current(l.roomCode, l.userId, l.role);
        }
      }, delay);
    };

    ws.onerror = (err) => {
      console.error('[GameWS] Error:', err);
    };

    wsRef.current = ws;
  }, [handleMessage, clearHeartbeat]);

  // Keep openRef pointing at the latest implementation (refs must not be written during render)
  useEffect(() => {
    openRef.current = openImpl;
  }, [openImpl]);

  const connect = useCallback((roomCode: string, userId: number, role: 'admin' | 'player') => {
    lastConnRef.current = { roomCode, userId, role };
    shouldReconnectRef.current = true;
    reconnectAttemptsRef.current = 0;
    cancelReconnect();
    openRef.current(roomCode, userId, role);
  }, [cancelReconnect]);

  const disconnect = useCallback(() => {
    // Stop any scheduled reconnect and disable future auto-reconnects
    shouldReconnectRef.current = false;
    cancelReconnect();
    clearHeartbeat();
    if (wsRef.current) {
      try { wsRef.current.close(); } catch { /* noop */ }
      wsRef.current = null;
    }
    setIsConnected(false);
    setState(prev => ({ ...prev, phase: 'idle' }));
  }, [cancelReconnect, clearHeartbeat]);

  const send = useCallback((msg: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  const submitAnswer = useCallback((questionId: number, option: string) => {
    send({ type: 'submit_answer', question_id: questionId, option });
  }, [send]);

  const startGame = useCallback((questionCount: number = 10) => {
    send({ type: 'start_game', question_count: questionCount });
  }, [send]);

  const pauseGame = useCallback(() => {
    send({ type: 'pause' });
  }, [send]);

  const resumeGame = useCallback(() => {
    send({ type: 'resume' });
  }, [send]);

  // Cleanup on unmount — also stops any pending auto-reconnect
  useEffect(() => {
    return () => {
      shouldReconnectRef.current = false;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      clearHeartbeat();
      if (wsRef.current) {
        try { wsRef.current.close(); } catch { /* noop */ }
        wsRef.current = null;
      }
    };
  }, [clearHeartbeat]);

  return {
    state,
    connect,
    disconnect,
    send,
    submitAnswer,
    startGame,
    pauseGame,
    resumeGame,
    isConnected,
  };
}

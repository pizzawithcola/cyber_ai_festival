import { useRef, useCallback, useEffect, useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
export type GamePhase = 'idle' | 'waiting' | 'countdown' | 'question' | 'result' | 'finished';

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
}

type MessageHandler = (msg: Record<string, unknown>) => void;

export interface UseGameWebSocketReturn {
  state: GameState;
  connect: (roomCode: string, userId: number, role: 'admin' | 'player') => void;
  disconnect: () => void;
  send: (msg: Record<string, unknown>) => void;
  submitAnswer: (questionId: number, option: string) => void;
  startGame: (questionCount?: number) => void;
  isConnected: boolean;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useGameWebSocket(): UseGameWebSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const roleRef = useRef<'admin' | 'player'>('player');
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
        }));
        break;

      case 'tick':
        setState(prev => ({
          ...prev,
          timeRemaining: msg.remaining as number,
          answeredCount: msg.answered_count as number,
        }));
        break;

      case 'question_result':
        setState(prev => ({
          ...prev,
          phase: 'result',
          result: msg as unknown as ResultData,
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

  const connect = useCallback((roomCode: string, userId: number, role: 'admin' | 'player') => {
    // Close existing connection
    if (wsRef.current) {
      wsRef.current.close();
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
      console.log(`[GameWS] Connected as ${role} to room ${roomCode}`);

      // Heartbeat: send ping every 30s to keep connection alive through ALB/CloudFront
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
      console.log('[GameWS] Disconnected');
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
    };

    ws.onerror = (err) => {
      console.error('[GameWS] Error:', err);
    };

    wsRef.current = ws;
  }, [handleMessage]);

  const disconnect = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setState(prev => ({ ...prev, phase: 'idle' }));
  }, []);

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return {
    state,
    connect,
    disconnect,
    send,
    submitAnswer,
    startGame,
    isConnected,
  };
}

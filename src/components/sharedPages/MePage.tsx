import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { Box, Snackbar, Alert, keyframes } from '@mui/material';
import { QrCode, Users, Sparkles, Database, Bot, Mail, Trophy, type LucideIcon } from 'lucide-react';
import { ArcadeButton, ArcadeTypography } from '../ui';
import { ARCADE_COLORS } from '../../theme/theme';
import { apiFetch } from '../../services/api';
import {
  getPersistentUser,
  clearPersistentUser,
  type StoredUser,
} from '../../utils/userStorage';

/**
 * Fallback venue queue big screen, used only until the backend tells us which
 * queue is live. Overridable per environment.
 */
const QUEUE_BOARD_URL =
  import.meta.env.VITE_QUEUE_BOARD_URL ||
  'https://queue-system-e6780.web.app/#queue/Qmu0wnldvywckwcp0fvm';

/** 四个游戏的分数格子：图标 + 游戏名 + 分数。 */
const GAME_SCORE_TILES: { key: string; label: string; color: string; Icon: LucideIcon }[] = [
  { key: 'game1_score', label: 'HALLUCINATION', color: ARCADE_COLORS.magenta, Icon: Sparkles },
  { key: 'game2_score', label: 'DATA', color: ARCADE_COLORS.cyan, Icon: Database },
  { key: 'game3_score', label: 'AGENT', color: ARCADE_COLORS.yellow, Icon: Bot },
  { key: 'game4_score', label: 'PHISHING', color: ARCADE_COLORS.lime, Icon: Mail },
];

/** 背景浮动图标的淡入淡出动画。 */
const iconFloat = keyframes`
  0% { opacity: 0; transform: translateY(8px) scale(0.9); }
  25% { opacity: 0.55; }
  50% { opacity: 0.85; transform: translateY(0) scale(1); }
  75% { opacity: 0.5; }
  100% { opacity: 0; transform: translateY(-8px) scale(0.9); }
`;

/** 背景：纯色底 + 时不时浮现的游戏图标（统一绿色）。 */
const FLOATING_ICONS = [Sparkles, Database, Bot, Mail, Trophy];
const FloatingIconsBackground: React.FC = () => (
  <Box sx={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
    {Array.from({ length: 16 }).map((_, i) => {
      const Icon = FLOATING_ICONS[i % FLOATING_ICONS.length];
      return (
        <Box
          key={i}
          sx={{
            position: 'absolute',
            left: `${(i * 37) % 88 + 4}%`,
            top: `${(i * 53) % 86 + 5}%`,
            color: `${ARCADE_COLORS.lime}55`,
            animation: `${iconFloat} ${5 + (i % 4) * 1.3}s ease-in-out infinite`,
            animationDelay: `${(i * 0.6) % 5}s`,
            filter: `drop-shadow(0 0 6px ${ARCADE_COLORS.lime}40)`,
          }}
        >
          <Icon size={16 + (i % 3) * 8} strokeWidth={1.5} />
        </Box>
      );
    })}
  </Box>
);

/** 分数展示：0 或缺失表示还没参加过，显示 -；整数直出，小数留 1 位。 */
const formatScore = (value: number | null | undefined): string => {
  if (value === undefined || value === null || value === 0) return '-';
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
};

/**
 * Personal player panel on the player's own phone.
 *
 * - Remembers the player across browser restarts (localStorage).
 * - "Scan to login" turns on the camera, decodes a game station's QR code and
 *   pairs the player's nickname with that station so the station logs them in.
 */
const MePage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [scanning, setScanning] = useState(false);
  const [snack, setSnack] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({ open: false, message: '', severity: 'info' });
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const handledRef = useRef(false);
  const [queueBoardUrl, setQueueBoardUrl] = useState(QUEUE_BOARD_URL);
  const [scores, setScores] = useState<Record<string, number> | null>(null);

  const loadQueueBoardUrl = async () => {
    try {
      const res = await apiFetch('/queue/');
      if (!res.ok) return;
      const data = await res.json();
      if (data?.queueBoardUrl) setQueueBoardUrl(data.queueBoardUrl);
    } catch {
      // keep the fallback: the queue button must still work offline
    }
  };

  const loadScores = async (userId: number) => {
    try {
      const res = await apiFetch(`/scores/${userId}`);
      // CloudFront masks API 4xx into index.html + 200; require a JSON body.
      const contentType = res.headers.get('content-type') || '';
      if (!res.ok || !contentType.includes('application/json')) return;
      setScores(await res.json());
    } catch {
      // no score row yet — the tiles fall back to "—"
    }
  };

  const openQueue = () => {
    const tab = window.open(queueBoardUrl, '_blank');
    if (tab) {
      try {
        tab.opener = null;
      } catch {
        /* cross-origin: nothing we can do */
      }
    }
  };

  useEffect(() => {
    const stored = getPersistentUser();
    setUser(stored);
    void loadQueueBoardUrl();
    if (stored?.id) void loadScores(stored.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScan = async (decodedText: string) => {
    // Stop the viewfinder first: setting scanning=false tears the scanner down
    // via the lifecycle effect below.
    setScanning(false);
    const identity = getPersistentUser();
    if (!identity?.nickname) return;

    const raw = (decodedText || '').trim();
    // The admin screen's QR is a room-join link: open it here and the game signs
    // this player in from their persistent identity, dropping them in the room.
    if (/^https?:\/\//i.test(raw)) {
      window.location.href = raw;
      return;
    }
    // A game station shows a bare 6-character code. Anything else belongs to a
    // different flow and cannot be paired — say so instead of a generic error.
    if (!/^[A-Za-z0-9]{6}$/.test(raw)) {
      setSnack({
        open: true,
        message: 'That QR is not a game-station code. Scan the code shown on the station screen.',
        severity: 'warning',
      });
      return;
    }
    const stationCode = raw.toUpperCase();

    try {
      const res = await apiFetch('/qr-login/pair', {
        method: 'POST',
        body: JSON.stringify({ station_code: stationCode, nickname: identity.nickname }),
      });
      // CloudFront masks API 4xx into the SPA's index.html + 200, so treat a
      // non-JSON body as a failure instead of a false success.
      const contentType = res.headers.get('content-type') || '';
      if (!res.ok || !contentType.includes('application/json')) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.detail || 'Pairing failed — please try again.');
      }
      setSnack({ open: true, message: 'Paired! The game station will sign you in automatically.', severity: 'success' });
    } catch (e) {
      setSnack({
        open: true,
        message: String(e instanceof Error ? e.message : e),
        severity: 'error',
      });
    }
  };

  const startScan = async () => {
    if (scanning) return;
    const identity = getPersistentUser();
    if (!identity?.nickname) {
      setSnack({ open: true, message: 'Please register first.', severity: 'warning' });
      navigate('/register');
      return;
    }

    // Probe the camera before showing the viewfinder; a denial/absence should
    // surface as a clear error instead of a stuck "scanning" screen.
    try {
      await Html5Qrcode.getCameras();
    } catch (e) {
      setSnack({
        open: true,
        message: `Camera unavailable: ${e instanceof Error ? e.message : String(e)}`,
        severity: 'error',
      });
      return;
    }

    handledRef.current = false;
    setScanning(true); // renders <div id="qr-reader"> — see lifecycle effect below
  };

  // The viewfinder is mounted only while `scanning` is true. Html5Qrcode needs
  // that DOM node to exist at construction time, so we create and start the
  // scanner in an effect that runs after React commits <div id="qr-reader">.
  useEffect(() => {
    if (!scanning) return;
    let active = true;
    const scanner = new Html5Qrcode('qr-reader');
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText) => {
          if (!active || handledRef.current) return;
          handledRef.current = true;
          void handleScan(decodedText);
        },
        () => {
          /* per-frame decode misses are expected; ignore */
        }
      )
      .catch((e) => {
        if (active) {
          setScanning(false);
          setSnack({
            open: true,
            message: `Camera unavailable: ${e instanceof Error ? e.message : String(e)}`,
            severity: 'error',
          });
        }
      });

    return () => {
      active = false;
      scanner.stop().catch(() => undefined);
      scannerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanning]);

  const logout = () => {
    setScanning(false);
    clearPersistentUser();
    setUser(null);
    navigate('/login');
  };

  const fullName = user ? `${user.firstname} ${user.lastname ?? ''}`.trim() : '';

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '100dvh',
        backgroundColor: '#050510',
        overflow: 'hidden',
      }}
    >
      <FloatingIconsBackground />
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          // 100dvh tracks the *visible* viewport on mobile — plain 100vh on iOS
          // Safari includes the browser chrome and pushed the bottom buttons
          // below the fold.
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          px: 2,
          pt: 'calc(env(safe-area-inset-top, 0px) + 16px)',
          pb: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
          boxSizing: 'border-box',
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 480, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {!user ? (
            <>
              <Box sx={{ textAlign: 'center', mt: 8 }}>
                <ArcadeTypography arcadeSize="xs" arcadeColor="cyan" component="p" sx={{ letterSpacing: '0.25em', opacity: 0.75, mb: 1.5 }}>
                  PLAYER PANEL
                </ArcadeTypography>
                <ArcadeTypography arcadeSize="sm" component="p" sx={{ color: `${ARCADE_COLORS.white}70`, lineHeight: 1.8 }}>
                  Already registered? Log back in.
                </ArcadeTypography>
              </Box>
              <Box sx={{ mt: 'auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
                <ArcadeButton color="lime" size="md" glowing onClick={() => navigate('/login')} sx={{ width: '100%', maxWidth: 320 }}>
                  LOG IN
                </ArcadeButton>
                <ArcadeButton color="cyan" variant="outline" size="md" onClick={() => navigate('/register')} sx={{ width: '100%', maxWidth: 320 }}>
                  NEW PLAYER? REGISTER
                </ArcadeButton>
              </Box>
            </>
          ) : (
            <>
              <Box sx={{ textAlign: 'center', mt: 6 }}>
                <ArcadeTypography
                  arcadeSize="md"
                  arcadeColor="lime"
                  component="p"
                  sx={{ wordBreak: 'break-word', textShadow: `0 0 14px ${ARCADE_COLORS.lime}60` }}
                >
                  Hi {fullName} ({user.nickname})
                </ArcadeTypography>
              </Box>

              {/* Hi 与按钮之间的区域：分数卡片/相机在此纵向居中 */}
              <Box
                sx={{
                  flex: 1,
                  width: '100%',
                  minHeight: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {scanning ? (
                  <Box
                    sx={{
                      width: '100%',
                      maxWidth: 360,
                      border: `2px dashed ${ARCADE_COLORS.lime}80`,
                      borderRadius: '8px',
                      p: 1,
                      '& video': { borderRadius: '6px', width: '100%' },
                    }}
                  >
                    <Box id="qr-reader" sx={{ width: '100%', minHeight: 240 }} />
                    <ArcadeButton color="red" variant="outline" size="sm" sx={{ mt: 1.5, width: '100%' }} onClick={() => setScanning(false)}>
                      CANCEL
                    </ArcadeButton>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      width: '100%',
                      maxWidth: 360,
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 1.5,
                    }}
                  >
                    {GAME_SCORE_TILES.map(({ key, label, color, Icon }) => (
                      <Box
                        key={key}
                        sx={{
                          border: `2px solid ${color}45`,
                          borderRadius: '8px',
                          backgroundColor: 'rgba(5, 5, 15, 0.72)',
                          p: 1.5,
                          minHeight: 96,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 0.75,
                          boxShadow: `0 0 12px ${color}18`,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, maxWidth: '100%', minWidth: 0 }}>
                          <Box sx={{ display: 'flex', flexShrink: 0 }}>
                            <Icon size={22} color={color} strokeWidth={1.75} />
                          </Box>
                          <ArcadeTypography
                            arcadeSize="xs"
                            component="span"
                            sx={{
                              fontSize: '0.5rem',
                              color: `${color}c0`,
                              letterSpacing: '0.06em',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {label}
                          </ArcadeTypography>
                        </Box>
                        <ArcadeTypography
                          arcadeSize="md"
                          component="span"
                          sx={{ color, fontSize: '1.5rem', textShadow: `0 0 10px ${color}60` }}
                        >
                          {formatScore(scores?.[key])}
                        </ArcadeTypography>
                      </Box>
                    ))}

                    {/* Ultimate Showdown — 下方大格子，横跨两列 */}
                    <Box
                      sx={{
                        gridColumn: '1 / -1',
                        border: `2px solid ${ARCADE_COLORS.orange}55`,
                        borderRadius: '8px',
                        backgroundColor: 'rgba(5, 5, 15, 0.72)',
                        p: 1.5,
                        minHeight: 96,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 0.75,
                        boxShadow: `0 0 14px ${ARCADE_COLORS.orange}22`,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Trophy size={22} color={ARCADE_COLORS.orange} strokeWidth={1.75} />
                        <ArcadeTypography
                          arcadeSize="xs"
                          component="span"
                          sx={{ fontSize: '0.5rem', color: `${ARCADE_COLORS.orange}c0`, letterSpacing: '0.1em' }}
                        >
                          ULTIMATE SHOWDOWN
                        </ArcadeTypography>
                      </Box>
                      <ArcadeTypography
                        arcadeSize="md"
                        component="span"
                        sx={{ color: ARCADE_COLORS.orange, fontSize: '1.5rem', textShadow: `0 0 14px ${ARCADE_COLORS.orange}60` }}
                      >
                        {formatScore(scores?.game5_score)}
                      </ArcadeTypography>
                    </Box>
                  </Box>
                )}
              </Box>

              <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
                {!scanning && (
                  <ArcadeButton color="lime" size="md" glowing onClick={startScan} sx={{ width: '100%', maxWidth: 320 }}>
                    <QrCode size={16} style={{ marginRight: 8, verticalAlign: '-2px' }} />
                    SCAN TO LOG IN
                  </ArcadeButton>
                )}
                {!scanning && (
                  <ArcadeButton color="lime" variant="outline" size="md" onClick={openQueue} sx={{ width: '100%', maxWidth: 320 }}>
                    <Users size={16} style={{ marginRight: 8, verticalAlign: '-2px' }} />
                    CHECK QUEUE
                  </ArcadeButton>
                )}
                <Box
                  component="button"
                  onClick={logout}
                  sx={{
                    mt: 1,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: ARCADE_COLORS.white,
                    fontFamily: '"Courier New", monospace',
                    fontSize: '0.75rem',
                    letterSpacing: '0.15em',
                    padding: '4px 8px',
                    transition: 'color 0.2s ease',
                    '&:hover': { color: ARCADE_COLORS.red, textDecoration: 'underline' },
                  }}
                >
                  LOGOUT
                </Box>
              </Box>
            </>
          )}
        </Box>
      </Box>

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snack.severity} onClose={() => setSnack((s) => ({ ...s, open: false }))} variant="filled">
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MePage;

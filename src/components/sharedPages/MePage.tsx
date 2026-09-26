import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { Box, Snackbar, Alert } from '@mui/material';
import { QrCode, LogOut, Users } from 'lucide-react';
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
    setUser(getPersistentUser());
    void loadQueueBoardUrl();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScan = async (decodedText: string) => {
    // Stop the viewfinder first: setting scanning=false tears the scanner down
    // via the lifecycle effect below.
    setScanning(false);
    const identity = getPersistentUser();
    if (!identity?.nickname) return;

    const stationCode = (decodedText || '').trim().toUpperCase();
    if (!stationCode) {
      setSnack({ open: true, message: 'Scanned an empty code — try again.', severity: 'warning' });
      return;
    }

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
    navigate('/register');
  };

  const fullName = user ? `${user.firstname} ${user.lastname ?? ''}`.trim() : '';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#050510',
        color: ARCADE_COLORS.white,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        px: 2,
        py: 4,
        boxSizing: 'border-box',
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <ArcadeTypography arcadeSize="md" arcadeColor="cyan" component="h1" sx={{ letterSpacing: '0.08em', mb: 2 }}>
          PLAYER PANEL
        </ArcadeTypography>

        {!user ? (
          <>
            <ArcadeTypography arcadeSize="sm" component="p" sx={{ mb: 3, textAlign: 'center' }}>
              No identity yet? Register first, then come back to scan and sign in.
            </ArcadeTypography>
            <ArcadeButton color="lime" size="lg" onClick={() => navigate('/register')}>
              REGISTER
            </ArcadeButton>
          </>
        ) : (
          <>
            <ArcadeTypography
              arcadeSize="md"
              arcadeColor="lime"
              component="p"
              sx={{ textAlign: 'center', mb: 3, wordBreak: 'break-word' }}
            >
              Hi {fullName} ({user.nickname})
            </ArcadeTypography>

            <ArcadeButton color="lime" size="lg" glowing animation={scanning ? 'pulse' : 'none'} onClick={startScan}>
              <QrCode size={16} style={{ marginRight: 8, verticalAlign: '-2px' }} />
              {scanning ? 'SCANNING…' : 'SCAN TO LOG IN'}
            </ArcadeButton>

            {scanning && (
              <Box
                sx={{
                  mt: 3,
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
            )}

            <ArcadeButton color="cyan" variant="outline" size="md" sx={{ mt: 3 }} onClick={openQueue}>
              <Users size={16} style={{ marginRight: 8, verticalAlign: '-2px' }} />
              JOIN QUEUE
            </ArcadeButton>

            <ArcadeButton color="red" variant="ghost" size="sm" sx={{ mt: 3 }} onClick={logout}>
              <LogOut size={14} style={{ marginRight: 6, verticalAlign: '-2px' }} />
              LOGOUT
            </ArcadeButton>
          </>
        )}
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

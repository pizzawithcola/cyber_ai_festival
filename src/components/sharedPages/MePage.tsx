import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { Box, Snackbar, Alert } from '@mui/material';
import { QrCode, LogOut, ArrowLeft } from 'lucide-react';
import { ArcadeButton, ArcadeTypography } from '../ui';
import { ARCADE_COLORS } from '../../theme/theme';
import { apiFetch } from '../../services/api';
import {
  getPersistentUser,
  clearPersistentUser,
  type StoredUser,
} from '../../utils/userStorage';

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

  useEffect(() => {
    setUser(getPersistentUser());
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
        throw new Error(err?.detail || '配对失败，请重试');
      }
      setSnack({ open: true, message: '配对了！游戏机会自动登录。', severity: 'success' });
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
      setSnack({ open: true, message: '请先注册。', severity: 'warning' });
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
        message: `摄像头不可用：${e instanceof Error ? e.message : String(e)}`,
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
            message: `摄像头不可用：${e instanceof Error ? e.message : String(e)}`,
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
        <ArcadeTypography arcadeSize="lg" arcadeColor="cyan" component="h1" sx={{ letterSpacing: '0.2em', mb: 2 }}>
          PLAYER PANEL
        </ArcadeTypography>

        {!user ? (
          <>
            <ArcadeTypography arcadeSize="sm" component="p" sx={{ mb: 3, textAlign: 'center' }}>
              还没有身份？先注册，再回来扫码登录游戏。
            </ArcadeTypography>
            <ArcadeButton color="lime" size="lg" onClick={() => navigate('/register')}>
              去注册
            </ArcadeButton>
          </>
        ) : (
          <>
            <Box
              sx={{
                width: '100%',
                border: `2px solid ${ARCADE_COLORS.cyan}60`,
                borderRadius: '6px',
                px: 3,
                py: 2.5,
                mb: 3,
                textAlign: 'center',
                backgroundColor: `${ARCADE_COLORS.cyan}08`,
              }}
            >
              <ArcadeTypography arcadeSize="sm" arcadeColor="white" sx={{ opacity: 0.7 }}>
                你的身份
              </ArcadeTypography>
              <ArcadeTypography arcadeSize="lg" arcadeColor="lime" sx={{ mt: 1 }}>
                {fullName}
              </ArcadeTypography>
              <ArcadeTypography arcadeSize="sm" arcadeColor="cyan" sx={{ mt: 0.5 }}>
                {user.nickname}
              </ArcadeTypography>
            </Box>

            <ArcadeButton color="lime" size="lg" glowing animation={scanning ? 'pulse' : 'none'} onClick={startScan}>
              <QrCode size={16} style={{ marginRight: 8, verticalAlign: '-2px' }} />
              {scanning ? '扫描中…' : '扫码登录游戏'}
            </ArcadeButton>

            {scanning ? (
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
                  取消
                </ArcadeButton>
              </Box>
            ) : (
              <ArcadeTypography arcadeSize="xs" component="p" sx={{ mt: 2, opacity: 0.6, textAlign: 'center' }}>
                对准游戏机登录页上的二维码即可自动登录
              </ArcadeTypography>
            )}

            <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
              <ArcadeButton color="cyan" variant="ghost" size="sm" onClick={() => navigate('/')}>
                <ArrowLeft size={14} style={{ marginRight: 6, verticalAlign: '-2px' }} />
                首页
              </ArcadeButton>
              <ArcadeButton color="red" variant="ghost" size="sm" onClick={logout}>
                <LogOut size={14} style={{ marginRight: 6, verticalAlign: '-2px' }} />
                退出
              </ArcadeButton>
            </Box>
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

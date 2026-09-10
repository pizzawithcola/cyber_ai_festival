import { useEffect } from 'react';

interface NavigatorWithWakeLock {
  wakeLock?: {
    request: (type: 'screen') => Promise<{ release?: () => Promise<void> }>;
  };
}

interface UseKioskModeOptions {
  /** 是否启用 kiosk 行为 */
  enabled: boolean;
  /** 看门狗超时（ms）：heartbeat 在此时间内无变化则视为卡死 → 自动 reload；0 关闭 */
  watchdogMs?: number;
  /** 周期性硬重载（ms）：清理长时间运行累积的内存；0 关闭 */
  hardReloadMs?: number;
  /** 心跳：每次成功刷新数据后递增，用于喂看门狗 */
  heartbeat?: number;
}

/**
 * 大屏 kiosk 行为（三星电视 / URL Launcher 常驻显示场景）：
 * - 尝试进入全屏（无用户手势被拒时，等首次按键/点击再试）
 * - 申请 Screen Wake Lock 防止电视休眠（不支持则安全忽略）
 * - 看门狗：数据长时间未刷新 → 自动 reload 自愈
 * - 周期性硬重载：清理长时间运行的内存
 * 所有能力均做存在性判断，浏览器不支持时静默降级。
 */
export function useKioskMode({
  enabled,
  watchdogMs = 120_000,
  hardReloadMs = 6 * 60 * 60 * 1000,
  heartbeat = 0,
}: UseKioskModeOptions): void {
  useEffect(() => {
    if (!enabled) return;

    // 1) 全屏：先直接尝试；若被浏览器拒绝，等首次用户手势再试
    const tryFullscreen = () => {
      const el = document.documentElement;
      if (!document.fullscreenElement && typeof el.requestFullscreen === 'function') {
        el.requestFullscreen().catch(() => undefined);
      }
    };
    tryFullscreen();
    const onFirstInteract = () => tryFullscreen();
    window.addEventListener('keydown', onFirstInteract, { once: true });
    window.addEventListener('pointerdown', onFirstInteract, { once: true });

    // 2) Wake Lock：阻止电视息屏（Tizen 浏览器若不支持则忽略）
    let wakeLock: { release?: () => Promise<void> } | null = null;
    const requestWakeLock = async () => {
      try {
        const nav = navigator as Navigator & NavigatorWithWakeLock;
        wakeLock = (await nav.wakeLock?.request('screen')) ?? null;
      } catch {
        wakeLock = null;
      }
    };
    void requestWakeLock();

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void requestWakeLock();
        tryFullscreen();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    // 3) 周期性硬重载
    const hardReloadTimer =
      hardReloadMs > 0 ? window.setTimeout(() => window.location.reload(), hardReloadMs) : null;

    return () => {
      window.removeEventListener('keydown', onFirstInteract);
      window.removeEventListener('pointerdown', onFirstInteract);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (hardReloadTimer !== null) window.clearTimeout(hardReloadTimer);
      if (wakeLock?.release) void wakeLock.release().catch(() => undefined);
    };
  }, [enabled, hardReloadMs]);

  // 4) 看门狗：heartbeat 变化会重置计时；长时间无变化 → reload 自愈
  useEffect(() => {
    if (!enabled || watchdogMs <= 0) return;
    const timer = window.setTimeout(() => window.location.reload(), watchdogMs);
    return () => window.clearTimeout(timer);
  }, [enabled, watchdogMs, heartbeat]);
}

export default useKioskMode;

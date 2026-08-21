import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStoredUser } from '../../utils/userStorage';
import IntroScreen from './components/IntroScreen';
import ArcadeBackground from './components/ui/ArcadeBackground';

/**
 * RetailDemolition — 叙事入口页（/retaildemolition）
 * 只承载 Intro（3 slides 全屏引导），完成后跳转到游戏路由。
 */
const RetailDemolition = () => {
  const navigate = useNavigate();
  const [hasVerifiedSession, setHasVerifiedSession] = useState(false);

  useEffect(() => {
    const storedUser = getStoredUser();
    if (!storedUser?.id) {
      navigate('/login/retaildemolition', { replace: true });
      return;
    }
    setHasVerifiedSession(true);
  }, [navigate]);

  if (!hasVerifiedSession) return null;

  return (
    <div className="relative flex h-screen w-full text-slate-300 font-sans overflow-hidden">
      <ArcadeBackground />
      <div className="relative z-10 flex w-full">
        <IntroScreen onStart={() => navigate('/retaildemolition/game')} />
      </div>
    </div>
  );
};

export default RetailDemolition;

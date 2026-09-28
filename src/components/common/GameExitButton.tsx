import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ARCADE_COLORS } from '../../theme/theme';

interface GameExitButtonProps {
  /** 该游戏的登录路由段，例如 "hallucinate" → /login/hallucinate */
  game: string;
}

/**
 * 游戏中途终止按钮：贴在屏幕最底部居中的红色无边框 "Exit" 字样。
 *
 * - 用 Portal 挂到 document.body，避免被游戏容器的 transform / overflow 影响 fixed 定位。
 * - 点击后 replace 回到该游戏的登录页，避免浏览器返回键回到已中断的游戏。
 */
const GameExitButton = ({ game }: GameExitButtonProps) => {
  const navigate = useNavigate();

  return createPortal(
    <button
      type="button"
      aria-label="Exit game"
      onClick={() => navigate(`/login/${game}`, { replace: true })}
      style={{
        position: 'fixed',
        bottom: 8,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 2147483000,
        background: 'none',
        border: 'none',
        outline: 'none',
        cursor: 'pointer',
        color: ARCADE_COLORS.red,
        fontFamily: '"Courier New", monospace',
        fontSize: '0.7rem',
        letterSpacing: '0.18em',
        padding: '4px 10px',
        opacity: 0.7,
        transition: 'opacity 0.2s ease',
        WebkitTapHighlightColor: 'transparent',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = '1';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = '0.7';
      }}
    >
      Exit
    </button>,
    document.body,
  );
};

export default GameExitButton;

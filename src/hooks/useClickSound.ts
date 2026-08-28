/**
 * useClickSound.ts
 * 全局按钮咔嚓音 hook：监听 document 上的 click，命中 <button> 即播放按键音。
 * 在 Data Shadows 相关页面挂载后，页面内所有按钮（含 FitAI App 内、弹窗内）自动生效。
 */
import { useEffect } from 'react'
import { playClickSound } from '../utils/clickSound'

export const useClickSound = (): void => {
  useEffect(() => {
    // 用捕获阶段（capture）监听：事件在到达目标前先触发 document 监听，
    // 即使按钮内部调用了 stopPropagation（如 DataShadows Intro 的 Prev/Next）也能收到
    const handler = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.closest('button')) {
        playClickSound()
      }
    }
    document.addEventListener('click', handler, true)
    return () => document.removeEventListener('click', handler, true)
  }, [])
}

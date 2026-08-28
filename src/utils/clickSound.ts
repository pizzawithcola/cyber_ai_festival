/**
 * clickSound.ts
 * 用 Web Audio API 合成的短促「咔嚓」按键音（无需音频资源文件）。
 * 所有 Data Shadows 页面的按钮点击时调用。
 */

let audioCtx: AudioContext | null = null

function createCtx(): AudioContext | null {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return null
    return new Ctx()
  } catch {
    return null
  }
}

/**
 * 获取 AudioContext；若实例不存在或已被浏览器关闭（closed）则重建。
 */
function getAudioCtx(): AudioContext | null {
  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = createCtx()
  }
  return audioCtx
}

/**
 * 播放一声机械按键「咔嚓」（两连击）：
 * 第一次 click（按下）：高频噪声瞬态 + 泛音
 * 第二次 click（回弹，~55ms 后、稍轻）：模拟机械开关复位声
 *
 * 浏览器会挂起长时间无活动的 AudioContext（suspended）。
 * 处理策略：在用户点击手势内 resume，**等待恢复完成后再调度播放**
 * （否则声音在恢复前被调度会被丢弃）；恢复失败则丢弃实例，下次点击重建。
 */
export const playClickSound = (): void => {
  const ctx = getAudioCtx()
  if (!ctx) return

  const schedule = () => {
  // 主输出级：统一音量控制，防止削波
  const master = ctx.createGain()
  master.gain.value = 0.9
  master.connect(ctx.destination)

  // 单次清脆 click：t 为起始时间，intensity 控制音量（0-1）
  const clickAt = (t: number, intensity: number) => {
    // 噪声瞬态：高通 1kHz（保留中高频能量，外放可听见），12ms 快速衰减
    try {
      const dur = 0.012
      const bufferSize = Math.floor(ctx.sampleRate * dur)
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2)
      }
      const noise = ctx.createBufferSource()
      const highpass = ctx.createBiquadFilter()
      const noiseGain = ctx.createGain()
      noise.buffer = buffer
      highpass.type = 'highpass'
      highpass.frequency.value = 1000
      noiseGain.gain.setValueAtTime(intensity * 0.9, t)
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + dur)
      noise.connect(highpass)
      highpass.connect(noiseGain)
      noiseGain.connect(master)
      noise.start(t)
    } catch {
      // 噪声层失败不影响主音
    }

    // 高频泛音：~2.6kHz 极短正弦，金属 click 质感
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(2600, t)
    osc.frequency.exponentialRampToValueAtTime(1400, t + 0.008)
    gain.gain.setValueAtTime(intensity * 0.3, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.012)
    osc.connect(gain)
    gain.connect(master)
    osc.start(t)
    osc.stop(t + 0.014)
  }

  const now = ctx.currentTime
  clickAt(now, 1)          // 按下："咔"
  clickAt(now + 0.055, 0.6) // 回弹（55ms 后、稍轻）："嚓"
  }

  if (ctx.state === 'suspended') {
    // 页面闲置被浏览器挂起：在用户手势内异步恢复，恢复完成后再播放
    void ctx
      .resume()
      .then(schedule)
      .catch(() => {
        // 恢复失败（如浏览器拒绝）：丢弃实例，下次点击重建新的 AudioContext
        audioCtx = null
      })
  } else {
    schedule()
  }
}

/**
 * Plays recorded azkar / dhikr MP3s.
 * Tries local /audio/azkar/{key}.mp3 first, then HisnMuslim CDN.
 */

import { cdnAzkarAudioUrl, localAzkarAudioUrl } from '../data/azkarAudio'

type PlayOptions = {
  /** If false and audio already playing, skip (useful for rapid misbaha taps) */
  interrupt?: boolean
}

class AzkarVoiceServiceImpl {
  private audio: HTMLAudioElement | null = null
  private currentKey: string | null = null
  private playing = false

  isPlaying(): boolean {
    return this.playing
  }

  current(): string | null {
    return this.currentKey
  }

  stop(): void {
    if (this.audio) {
      this.audio.pause()
      this.audio.src = ''
      this.audio = null
    }
    this.playing = false
    this.currentKey = null
  }

  async play(key: string, options: PlayOptions = {}): Promise<boolean> {
    const { interrupt = true } = options
    if (!key) return false

    if (this.playing && !interrupt) {
      return false
    }

    this.stop()

    const candidates: string[] = []
    const local = localAzkarAudioUrl(key)
    if (await this.urlExists(local)) candidates.push(local)
    const cdn = cdnAzkarAudioUrl(key)
    if (cdn) candidates.push(cdn)

    for (const url of candidates) {
      const ok = await this.tryPlay(url, key)
      if (ok) return true
    }

    console.warn('[AzkarVoice] No playable source for', key)
    return false
  }

  private async urlExists(url: string): Promise<boolean> {
    try {
      const res = await fetch(url, { method: 'HEAD' })
      return res.ok
    } catch {
      return false
    }
  }

  private tryPlay(url: string, key: string): Promise<boolean> {
    return new Promise((resolve) => {
      let settled = false
      const finish = (ok: boolean) => {
        if (settled) return
        settled = true
        resolve(ok)
      }

      const audio = new Audio()
      audio.preload = 'auto'

      audio.onerror = () => finish(false)

      audio.onended = () => {
        this.playing = false
        if (this.audio === audio) {
          this.audio = null
          this.currentKey = null
        }
      }

      const start = () => {
        this.audio = audio
        this.currentKey = key
        this.playing = true
        audio.play().then(() => finish(true)).catch(() => {
          this.playing = false
          this.audio = null
          this.currentKey = null
          finish(false)
        })
      }

      audio.oncanplaythrough = () => start()
      audio.src = url
      audio.load()

      setTimeout(() => {
        if (!settled && audio.readyState >= 2) start()
        else if (!settled) finish(false)
      }, 4000)
    })
  }
}

export const AzkarVoice = new AzkarVoiceServiceImpl()

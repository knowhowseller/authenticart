'use client'
import { useEffect } from 'react'

// 채널톡(ChannelTalk) 부트 — NEXT_PUBLIC_CHANNEL_TALK_PLUGIN_KEY 가 설정된 경우에만 동작.
// 키가 없으면 아무것도 로드하지 않으므로(완전 비활성) 안전하게 항상 마운트해 둘 수 있다.
// 플러그인 키: 채널톡 관리자 > 설정 > 보안 및 개발 > 플러그인 키
declare global {
  interface Window {
    ChannelIO?: ((...args: unknown[]) => void) & { c?: (args: unknown) => void; q?: unknown[] }
    ChannelIOInitialized?: boolean
  }
}

export default function ChannelTalkBoot() {
  const pluginKey = process.env.NEXT_PUBLIC_CHANNEL_TALK_PLUGIN_KEY

  useEffect(() => {
    if (!pluginKey) return
    const w = window
    if (w.ChannelIO) {
      w.ChannelIO('boot', { pluginKey })
      return
    }
    const ch = function (...args: unknown[]) {
      ch.c?.(args)
    } as NonNullable<Window['ChannelIO']>
    ch.q = []
    ch.c = (args) => {
      ch.q?.push(args)
    }
    w.ChannelIO = ch

    function load() {
      if (w.ChannelIOInitialized) return
      w.ChannelIOInitialized = true
      const s = document.createElement('script')
      s.type = 'text/javascript'
      s.async = true
      s.src = 'https://cdn.channel.io/plugin/ch-plugin-web.js'
      const x = document.getElementsByTagName('script')[0]
      x?.parentNode?.insertBefore(s, x)
    }
    if (document.readyState === 'complete') load()
    else {
      w.addEventListener('DOMContentLoaded', load)
      w.addEventListener('load', load)
    }

    w.ChannelIO('boot', { pluginKey })
  }, [pluginKey])

  return null
}

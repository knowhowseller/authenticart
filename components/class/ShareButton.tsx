'use client'
import { useState } from 'react'
import { Share2, Link, Check } from 'lucide-react'
import { toast } from 'sonner'

export default function ShareButton({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false)
  const [open, setOpen] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    toast.success('링크가 복사되었습니다')
    setTimeout(() => { setCopied(false); setOpen(false) }, 2000)
  }

  function handleKakao() {
    if (typeof window === 'undefined') return
    const kakao = (window as any).Kakao
    if (!kakao?.isInitialized()) {
      toast.error('카카오 공유를 사용할 수 없습니다')
      return
    }
    kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title,
        description: '오센틱아트에서 공예 클래스를 만나보세요',
        imageUrl: `${window.location.origin}/og-default.png`,
        link: { mobileWebUrl: url, webUrl: url },
      },
      buttons: [{ title: '클래스 보기', link: { mobileWebUrl: url, webUrl: url } }],
    })
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-sm text-brand-grey hover:text-brand-deep transition-colors px-3 py-1.5 rounded-lg hover:bg-brand-bg"
      >
        <Share2 size={14} />
        공유
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 bg-white rounded-xl shadow-lg border border-brand-mist/30 overflow-hidden min-w-36">
            <button
              onClick={handleKakao}
              className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-brand-bg transition-colors"
            >
              <span className="text-base">💬</span>
              카카오톡 공유
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-brand-bg transition-colors border-t border-brand-mist/20"
            >
              {copied ? <Check size={14} className="text-green-500" /> : <Link size={14} />}
              링크 복사
            </button>
          </div>
        </>
      )}
    </div>
  )
}

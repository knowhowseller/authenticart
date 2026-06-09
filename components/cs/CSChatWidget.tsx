'use client'
import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send } from 'lucide-react'

interface Msg { role: 'user' | 'assistant'; content: string }

const GREETING: Msg = {
  role: 'assistant',
  content: '안녕하세요! 오센틱아트 고객지원입니다 🎨\n예약·환불·강사·결제 등 궁금한 점을 물어보세요. 답변이 어려우면 게시판으로 안내해 드릴게요.',
}

export default function CSChatWidget() {
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([GREETING])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [msgs, loading])

  async function send() {
    const q = input.trim()
    if (!q || loading) return
    const next = [...msgs, { role: 'user' as const, content: q }]
    setMsgs(next)
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/ai/cs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, history: next.slice(1) }),
      })
      const data = await res.json()
      setMsgs((m) => [...m, { role: 'assistant', content: data.answer ?? data.error ?? '답변을 가져오지 못했습니다.' }])
    } catch {
      setMsgs((m) => [...m, { role: 'assistant', content: '연결에 문제가 있습니다. 게시판(/board)으로 문의해 주세요.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* 플로팅 버튼 */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="고객지원 챗봇 열기"
          className="fixed bottom-5 right-5 z-[60] w-14 h-14 rounded-full bg-brand-deep text-white shadow-lg flex items-center justify-center hover:bg-brand-deep/90 transition-colors"
        >
          <MessageCircle size={24} />
        </button>
      )}

      {/* 챗 패널 */}
      {open && (
        <div className="fixed bottom-5 right-5 z-[60] w-[92vw] max-w-sm h-[70vh] max-h-[560px] bg-white rounded-2xl shadow-2xl border border-brand-mist/30 flex flex-col overflow-hidden">
          <div className="bg-brand-deep px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-amber" />
              <span className="text-white font-semibold text-sm">오센틱아트 고객지원</span>
            </div>
            <button onClick={() => setOpen(false)} aria-label="닫기" className="text-white/80 hover:text-white">
              <X size={18} />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 bg-brand-bg">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed ${
                  m.role === 'user' ? 'bg-brand-deep text-white rounded-br-sm' : 'bg-white text-brand-ink border border-brand-mist/30 rounded-bl-sm'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-brand-mist/30 px-3 py-2 rounded-2xl rounded-bl-sm text-sm text-brand-grey">답변 작성 중…</div>
              </div>
            )}
          </div>

          <div className="p-2.5 border-t border-brand-mist/20 bg-white">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                placeholder="질문을 입력하세요…"
                rows={1}
                className="flex-1 resize-none px-3 py-2 rounded-xl border border-brand-mist text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber max-h-24"
              />
              <button onClick={send} disabled={loading || !input.trim()}
                className="w-9 h-9 rounded-xl bg-brand-deep text-white flex items-center justify-center disabled:opacity-40 flex-shrink-0">
                <Send size={16} />
              </button>
            </div>
            <p className="text-[10px] text-brand-grey/60 mt-1.5 text-center">AI 자동응답 · 정확한 처리는 <a href="/board" className="underline">게시판</a> 또는 contact@authenticart.co.kr</p>
          </div>
        </div>
      )}
    </>
  )
}

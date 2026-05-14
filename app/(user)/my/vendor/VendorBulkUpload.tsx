'use client'
import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { Upload, Download, X, CheckCircle2, AlertCircle, FileSpreadsheet } from 'lucide-react'
import * as XLSX from 'xlsx'

interface ParsedProduct {
  name: string
  category: string
  retail_price: number
  wholesale_price: number
  stock_qty: number
  is_instructor_only: boolean
  description: string
  _error?: string
}

const COLUMNS = ['상품명*', '카테고리', '소비자가*', '도매가(강사)', '재고수량*', '강사전용(Y/N)', '상품설명']
const COL_MAP: Record<string, keyof ParsedProduct> = {
  '상품명*': 'name', '상품명': 'name',
  '카테고리': 'category',
  '소비자가*': 'retail_price', '소비자가': 'retail_price',
  '도매가(강사)': 'wholesale_price', '도매가': 'wholesale_price',
  '재고수량*': 'stock_qty', '재고수량': 'stock_qty',
  '강사전용(Y/N)': 'is_instructor_only', '강사전용': 'is_instructor_only',
  '상품설명': 'description',
}

function downloadTemplate() {
  const wb = XLSX.utils.book_new()
  const sampleData = [
    COLUMNS,
    ['레진 UV 클리어 100g', '레진아트', 12000, 9500, 50, 'N', '고품질 UV 레진'],
    ['실리콘 몰드 세트', '레진아트', 8500, 7000, 30, 'N', '꽃 모양 몰드 5종 세트'],
    ['강사용 전문 도구 세트', '도구', 35000, 28000, 20, 'Y', '강사 전용 프리미엄 도구'],
  ]
  const ws = XLSX.utils.aoa_to_sheet(sampleData)
  ws['!cols'] = [{ wch: 20 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 30 }]
  XLSX.utils.book_append_sheet(wb, ws, '상품목록')
  XLSX.writeFile(wb, '오센틱아트_상품등록_템플릿.xlsx')
}

function parseExcel(file: File): Promise<ParsedProduct[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target?.result, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { header: 1, defval: '' })
        if (rows.length < 2) { reject(new Error('데이터가 없습니다')); return }

        const headers = (rows[0] as string[]).map((h: string) => h?.toString().trim())
        const products: ParsedProduct[] = []

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i] as any[]
          if (row.every((v: any) => !v)) continue

          const obj: any = {}
          headers.forEach((h, idx) => {
            const key = COL_MAP[h]
            if (key) obj[key] = row[idx]
          })

          const errors: string[] = []
          const name = obj.name?.toString().trim() ?? ''
          const retail_price = Number(obj.retail_price)
          const stock_qty = Number(obj.stock_qty ?? 0)

          if (!name) errors.push('상품명 필수')
          if (!retail_price || retail_price <= 0) errors.push('소비자가 오류')
          if (isNaN(stock_qty) || stock_qty < 0) errors.push('재고수량 오류')

          products.push({
            name,
            category: obj.category?.toString().trim() ?? '',
            retail_price,
            wholesale_price: Number(obj.wholesale_price) || 0,
            stock_qty: Math.max(0, stock_qty),
            is_instructor_only: ['y', 'yes', '1', 'true'].includes(obj.is_instructor_only?.toString().toLowerCase() ?? ''),
            description: obj.description?.toString().trim() ?? '',
            _error: errors.length > 0 ? errors.join(', ') : undefined,
          })
        }
        resolve(products)
      } catch (err: any) {
        reject(new Error('파일을 읽는 중 오류가 발생했습니다: ' + err.message))
      }
    }
    reader.onerror = () => reject(new Error('파일 읽기 실패'))
    reader.readAsArrayBuffer(file)
  })
}

export default function VendorBulkUpload({ onSuccess }: { onSuccess?: () => void }) {
  const [open, setOpen] = useState(false)
  const [products, setProducts] = useState<ParsedProduct[]>([])
  const [submitting, setSubmitting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const validCount = products.filter(p => !p._error).length
  const errorCount = products.filter(p => p._error).length

  async function handleFile(file: File) {
    try {
      const parsed = await parseExcel(file)
      if (parsed.length === 0) { toast.error('파싱된 상품이 없습니다'); return }
      setProducts(parsed)
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  async function submit() {
    const valid = products.filter(p => !p._error)
    if (valid.length === 0) { toast.error('등록 가능한 상품이 없습니다'); return }

    setSubmitting(true)
    try {
      const res = await fetch('/api/vendor/products/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: valid }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`${data.count}개 상품이 등록됐습니다!`)
      setProducts([])
      setOpen(false)
      onSuccess?.()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-brand-mist/30 mb-6">
      <div className="flex items-center justify-between px-5 py-4 border-b border-brand-mist/20">
        <div className="flex items-center gap-2">
          <FileSpreadsheet size={14} className="text-brand-grey" />
          <span className="text-sm font-semibold text-brand-ink">엑셀 일괄 등록</span>
        </div>
        <button onClick={() => { setOpen(v => !v); setProducts([]) }} className="text-xs text-brand-deep hover:underline">
          {open ? '닫기' : '열기'}
        </button>
      </div>

      {open && (
        <div className="px-5 py-5 space-y-4">
          {/* 1단계: 템플릿 다운로드 */}
          <div className="flex items-center justify-between bg-brand-bg rounded-xl px-4 py-3">
            <div>
              <p className="text-sm font-medium text-brand-ink">① 템플릿 다운로드</p>
              <p className="text-xs text-brand-grey mt-0.5">양식에 맞게 작성 후 업로드하세요</p>
            </div>
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-1.5 text-xs font-medium text-brand-deep border border-brand-deep/30 px-3 py-1.5 rounded-lg hover:bg-brand-deep/5 transition-colors"
            >
              <Download size={13} />
              템플릿 받기
            </button>
          </div>

          {/* 2단계: 파일 업로드 */}
          <div>
            <p className="text-xs font-medium text-brand-grey mb-2">② 작성한 엑셀 파일 업로드</p>
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
              className="border-2 border-dashed border-brand-mist rounded-xl p-6 text-center cursor-pointer hover:border-brand-deep/40 transition-colors"
            >
              <Upload size={24} className="mx-auto text-brand-grey mb-2" />
              <p className="text-sm text-brand-grey">클릭하거나 파일을 드래그하세요</p>
              <p className="text-xs text-brand-grey/60 mt-1">.xlsx, .xls 파일 · 최대 200개</p>
            </div>
            <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }} />
          </div>

          {/* 3단계: 미리보기 */}
          {products.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-brand-grey">③ 등록 전 확인</p>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1 text-green-600"><CheckCircle2 size={12} />정상 {validCount}개</span>
                  {errorCount > 0 && <span className="flex items-center gap-1 text-red-500"><AlertCircle size={12} />오류 {errorCount}개</span>}
                </div>
              </div>

              <div className="border border-brand-mist/50 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-brand-bg sticky top-0">
                    <tr>
                      <th className="text-left px-3 py-2 text-brand-grey font-medium">상품명</th>
                      <th className="text-left px-3 py-2 text-brand-grey font-medium">카테고리</th>
                      <th className="text-right px-3 py-2 text-brand-grey font-medium">소비자가</th>
                      <th className="text-right px-3 py-2 text-brand-grey font-medium">재고</th>
                      <th className="text-center px-3 py-2 text-brand-grey font-medium">상태</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-mist/20">
                    {products.map((p, i) => (
                      <tr key={i} className={p._error ? 'bg-red-50' : ''}>
                        <td className="px-3 py-2 font-medium text-brand-ink max-w-[120px] truncate">{p.name || '-'}</td>
                        <td className="px-3 py-2 text-brand-grey">{p.category || '-'}</td>
                        <td className="px-3 py-2 text-right text-brand-ink">{p.retail_price ? p.retail_price.toLocaleString() + '원' : '-'}</td>
                        <td className="px-3 py-2 text-right text-brand-grey">{p.stock_qty}</td>
                        <td className="px-3 py-2 text-center">
                          {p._error ? (
                            <span className="text-red-500 flex items-center gap-0.5 justify-center" title={p._error}>
                              <AlertCircle size={11} /> {p._error}
                            </span>
                          ) : (
                            <span className="text-green-600 flex items-center gap-0.5 justify-center">
                              <CheckCircle2 size={11} /> 정상
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-2 mt-3">
                <button
                  onClick={submit}
                  disabled={submitting || validCount === 0}
                  className="flex-1 py-2.5 bg-brand-deep text-white rounded-xl text-sm font-medium hover:bg-brand-deep/90 disabled:opacity-50 transition-colors"
                >
                  {submitting ? '등록 중...' : `정상 ${validCount}개 등록하기`}
                </button>
                <button
                  onClick={() => setProducts([])}
                  className="px-4 py-2.5 bg-brand-bg text-brand-grey rounded-xl text-sm hover:bg-brand-mist/30 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

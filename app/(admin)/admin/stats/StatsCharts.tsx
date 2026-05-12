'use client'
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'
import { formatPrice } from '@/lib/utils/format'

interface MonthlyData {
  month: string
  bookingRevenue: number
  orderRevenue: number
  bookings: number
}

interface StatsChartsProps {
  monthlyData: MonthlyData[]
  topClasses: { title: string; count: number; revenue: number }[]
}

function CurrencyTick({ x, y, payload }: any) {
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={4} textAnchor="end" fill="#9ca3af" fontSize={11}>
        {payload.value >= 1000000
          ? `${(payload.value / 1000000).toFixed(0)}M`
          : payload.value >= 1000
          ? `${(payload.value / 1000).toFixed(0)}K`
          : payload.value}
      </text>
    </g>
  )
}

function CurrencyTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-brand-mist rounded-xl p-3 shadow-lg text-xs">
      <p className="font-semibold text-brand-ink mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {p.name.includes('건') ? `${p.value}건` : formatPrice(p.value)}
        </p>
      ))}
    </div>
  )
}

export default function StatsCharts({ monthlyData, topClasses }: StatsChartsProps) {
  return (
    <div className="space-y-6">
      {/* 월별 매출 */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-mist/30">
        <h2 className="text-sm font-semibold text-brand-ink mb-4">월별 매출 현황</h2>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={monthlyData} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} />
            <YAxis tick={<CurrencyTick />} width={52} />
            <Tooltip content={<CurrencyTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="bookingRevenue" name="클래스 매출" fill="#b5936e" radius={[3, 3, 0, 0]} />
            <Bar dataKey="orderRevenue" name="샵 매출" fill="#d4b896" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 예약 건수 추이 */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-mist/30">
        <h2 className="text-sm font-semibold text-brand-ink mb-4">월별 예약 건수</h2>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={monthlyData} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} width={30} />
            <Tooltip content={<CurrencyTooltip />} />
            <Line
              type="monotone"
              dataKey="bookings"
              name="예약건"
              stroke="#b5936e"
              strokeWidth={2}
              dot={{ r: 3, fill: '#b5936e' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 클래스별 TOP 10 */}
      {topClasses.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-mist/30">
          <h2 className="text-sm font-semibold text-brand-ink mb-4">클래스별 예약 TOP 10</h2>
          <div className="space-y-2">
            {topClasses.map((c, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs font-bold text-brand-grey w-5 flex-shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-xs font-medium text-brand-ink truncate">{c.title}</p>
                    <p className="text-xs text-brand-grey flex-shrink-0 ml-2">{c.count}건</p>
                  </div>
                  <div className="w-full h-1.5 bg-brand-mist/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-amber rounded-full"
                      style={{ width: `${(c.count / (topClasses[0]?.count || 1)) * 100}%` }}
                    />
                  </div>
                </div>
                <p className="text-xs font-semibold text-brand-deep flex-shrink-0 w-20 text-right">
                  {formatPrice(c.revenue)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

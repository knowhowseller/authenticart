export type TrackingStatus =
  | 'preparing'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'failed'
  | 'unknown'

export interface TrackingInfo {
  carrier: string
  trackingNumber: string
  status: TrackingStatus
  statusLabel: string
  deliveredAt: string | null
  events: { datetime: string; location: string; description: string }[]
}

// 지원 택배사 코드 (DeliveryTracker API)
export const CARRIERS: Record<string, string> = {
  'kr.cjlogistics':  'CJ대한통운',
  'kr.hanjin':      '한진택배',
  'kr.lotte':       '롯데택배',
  'kr.logen':       '로젠택배',
  'kr.epost':       '우체국택배',
  'kr.kdexp':       '경동택배',
  'kr.chunilps':    '천일택배',
}

export async function fetchTracking(carrier: string, trackingNumber: string): Promise<TrackingInfo | null> {
  const apiKey = process.env.DELIVERY_TRACKER_API_KEY
  if (!apiKey) return null

  try {
    const res = await fetch(
      `https://apis.tracker.delivery/carriers/${carrier}/tracks/${trackingNumber}`,
      {
        headers: { Authorization: `TRACKQL-API-KEY ${apiKey}` },
        next: { revalidate: 300 },
      }
    )
    if (!res.ok) return null
    const data = await res.json()

    const lastEvent = data.events?.[data.events.length - 1]
    const deliveredAt =
      data.state?.id === 'delivered'
        ? (lastEvent?.time ?? null)
        : null

    return {
      carrier,
      trackingNumber,
      status: mapState(data.state?.id),
      statusLabel: data.state?.text ?? '알 수 없음',
      deliveredAt,
      events: (data.events ?? []).map((e: Record<string, unknown>) => ({
        datetime: e.time as string,
        location: (e.location as Record<string, string>)?.name ?? '',
        description: e.description as string,
      })),
    }
  } catch {
    return null
  }
}

function mapState(id: string): TrackingStatus {
  switch (id) {
    case 'at_pickup':
    case 'information_received': return 'preparing'
    case 'in_transit':           return 'in_transit'
    case 'out_for_delivery':     return 'out_for_delivery'
    case 'delivered':            return 'delivered'
    case 'failed_attempt':
    case 'exception':            return 'failed'
    default:                     return 'unknown'
  }
}

export interface CartItem {
  product_id: string
  name: string
  price: number
  quantity: number
  image?: string
}

export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem('authenticart_cart') ?? '[]')
  } catch { return [] }
}

export function saveCart(items: CartItem[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem('authenticart_cart', JSON.stringify(items))
}

export function addToCart(item: CartItem) {
  const cart = getCart()
  const existing = cart.find(c => c.product_id === item.product_id)
  if (existing) {
    existing.quantity = Math.min(existing.quantity + item.quantity, 99)
    saveCart(cart)
    return cart
  }
  const updated = [...cart, item]
  saveCart(updated)
  return updated
}

export function removeFromCart(product_id: string) {
  const updated = getCart().filter(c => c.product_id !== product_id)
  saveCart(updated)
  return updated
}

export function updateQuantity(product_id: string, quantity: number) {
  const updated = getCart().map(c =>
    c.product_id === product_id ? { ...c, quantity: Math.max(1, Math.min(quantity, 99)) } : c
  )
  saveCart(updated)
  return updated
}

export function clearCart() {
  if (typeof window === 'undefined') return
  localStorage.removeItem('authenticart_cart')
}

export function cartTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0)
}

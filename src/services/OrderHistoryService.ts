export interface OrderCustomer {
  name: string
  phone: string
  address: string
  city?: string
  notes?: string
}

export interface OrderRecord {
  id: string
  productId: string
  productName: string
  price?: string
  status: 'pending' | 'confirmed' | 'cancelled'
  createdAt: string
  customer?: OrderCustomer
}

const ORDERS_KEY = 'elaf-orders'

function readAll(): Record<string, OrderRecord[]> {
  try {
    const raw = localStorage.getItem(ORDERS_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, OrderRecord[]>
  } catch {
    return {}
  }
}

function writeAll(map: Record<string, OrderRecord[]>) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(map))
}

export function getOrdersForUser(userId: string): OrderRecord[] {
  return readAll()[userId] || []
}

export function addOrder(
  userId: string,
  input: {
    productId: string
    productName: string
    price?: string
    customer?: OrderCustomer
  }
): OrderRecord {
  const map = readAll()
  const order: OrderRecord = {
    id: `ord_${Date.now()}`,
    productId: input.productId,
    productName: input.productName,
    price: input.price,
    status: 'pending',
    createdAt: new Date().toISOString(),
    customer: input.customer,
  }
  map[userId] = [order, ...(map[userId] || [])].slice(0, 50)
  writeAll(map)
  return order
}

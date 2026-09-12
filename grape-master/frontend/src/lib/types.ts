export type Role = 'FARMER' | 'BROKER' | 'FERTILIZER_SELLER' | 'CUSTOMER' | 'ADMIN'
export type Unit = 'KG' | 'QUINTAL' | 'TON' | 'BAG' | 'CRATE' | 'DOZEN' | 'LITER' | 'PIECE'
export type ListingStatus = 'ACTIVE' | 'SOLD' | 'EXPIRED' | 'CANCELLED'
export type OfferStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED'
export type OrderStatus =
  | 'PENDING_PAYMENT' | 'PAID' | 'CONFIRMED' | 'PROCESSING'
  | 'READY_FOR_PICKUP' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'COMPLETED'
  | 'CANCELLED' | 'FAILED'
export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'REFUNDED'
export type FulfillmentMethod = 'PICKUP' | 'DELIVERY'

export interface ApiEnvelope<T> {
  success: boolean
  message: string
  data: T
  meta?: PageMeta
  errors?: { field: string; message: string }[]
}
export interface PageMeta {
  page: number; limit: number; total: number; totalPages: number
}
export interface AuthUser {
  id: string; email: string; role: Role
  fullName: string | null; mobileNumber: string | null
}
export interface Profile {
  fullName: string; mobileNumber: string
  village?: string | null; district?: string | null; state?: string | null; pincode?: string | null
  latitude?: number | null; longitude?: number | null
}
export interface FarmerProfile {
  primaryCrop: string; farmName: string | null
}
export interface BrokerProfileData {
  brokerName: string; companyName: string | null
}
export interface SellerProfileData {
  sellerName: string; companyName: string | null
}

// ─── Farmer listings / Broker ───
export interface FarmerListing {
  id: string; farmerId: string; cropType: string; variety: string | null
  quantity: number; availableQuantity: number; unit: Unit; expectedPrice: number
  harvestDate: string; description: string | null; status: ListingStatus
  images: string[]; createdAt: string; updatedAt: string
  _count?: { brokerOffers: number }
  farmer?: {
    id: string
    profile: Profile | null
    farmerProfile?: FarmerProfile | null
  }
  brokerOffers?: BrokerOffer[]
}
export interface BrokerOffer {
  id: string; listingId: string; brokerId: string
  quantity: number; offerPrice: number; totalAmount: number
  status: OfferStatus; message: string | null; createdAt: string
  listing?: Partial<FarmerListing> & { farmer?: { profile: Profile | null } }
  broker?: { id: string; profile: Profile | null; brokerProfile?: BrokerProfileData | null }
}
export interface BrokerInventoryItem {
  id: string; productName: string; quantity: number; availableQuantity: number
  purchasePrice: number; sellingPrice: number; createdAt: string
}

// ─── Products / Seller ───
export interface Product {
  id: string; sellerId: string; name: string; description: string | null
  category: string; brand: string | null; unit: Unit; price: number
  isActive: boolean; images: string[]; createdAt: string; updatedAt: string
  seller?: { id: string; profile: Profile | null; sellerProfile?: SellerProfileData | null }
  inventory?: SellerInventory | null
}
export interface SellerInventory {
  id: string; sellerId: string; productId: string
  quantity: number; reservedQuantity: number; availableQuantity: number
  updatedAt: string
}

// ─── Orders ───
export interface OrderItem {
  id: string; productId: string | null; quantity: number
  unitPrice: number; totalPrice: number
  product?: Product | null
}
export interface Order {
  id: string; orderNumber: string; buyerId: string; sellerId: string
  orderType: 'BROKER_PRODUCE' | 'FERTILIZER'
  subtotal: number; deliveryCharge: number; tax: number; discount: number; totalAmount: number
  paymentStatus: PaymentStatus; orderStatus: OrderStatus
  fulfillmentMethod: FulfillmentMethod; createdAt: string; updatedAt: string
  orderItems: OrderItem[]
  buyer?: { id: string; profile: Profile | null }
  seller?: { id: string; profile: Profile | null; sellerProfile?: SellerProfileData | null }
}

// ─── Receipts ───
export interface Receipt {
  id: string; receiptNumber: string; orderId: string
  pdfUrl: string | null; generatedAt: string
  order?: Order
}

// ─── Recommendations ───
export interface Recommendation {
  id: string; productId: string; score: number; reason: string | null; generatedAt: string
  product?: Product
}

// ─── Notifications ───
export interface Notification {
  id: string; title: string; message: string; type: string
  isRead: boolean; createdAt: string
}

// ─── Admin ───
export interface AdminStats {
  users: { total: number; farmers: number; brokers: number; sellers: number; customers: number }
  orders: { total: number; pending: number; completed: number; cancelled: number }
  revenue: { total: number; thisMonth: number }
  listings: { active: number; total: number }
  products: { active: number; total: number }
}

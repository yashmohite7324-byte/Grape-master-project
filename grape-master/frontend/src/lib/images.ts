/**
 * Contextual image URLs for every role and entity type in Grape Master.
 * Uses deterministic Unsplash photo selection so products get beautiful high-resolution photos based on their category.
 */

const UNSPLASH = 'https://images.unsplash.com'

const idIndex = (id: string | undefined | null, max: number): number => {
  if (!id || max <= 0) return 0
  const sum = String(id).split('').reduce((s, c) => s + c.charCodeAt(0), 0)
  return sum % max
}

const buildPhoto = (photoId: string, width: number, height: number) =>
  `${UNSPLASH}/${photoId}?auto=format&fit=crop&w=${width}&h=${height}&q=80`

function resolvePhotoId(rawName: string, id: string): string {
  if (!rawName) return 'photo-1540420773420-3366772f4999'
  const name = rawName.toLowerCase()

  // Dairy & Paneer
  if (name.includes('paneer') || name.includes('dairy') || name.includes('milk') || name.includes('cheese') || name.includes('curd') || name.includes('butter') || name.includes('ghee')) {
    const list = ['photo-1528750997573-59b89d66f4f7', 'photo-1550583724-b2692b85b150', 'photo-1628088062854-d1870b4553da']
    return list[idIndex(id, list.length)]
  }
  // Tomatoes
  if (name.includes('tomato')) {
    const list = ['photo-1592924357228-91a4daadcfea', 'photo-1546470427-0d4db154ceb7']
    return list[idIndex(id, list.length)]
  }
  // Onions
  if (name.includes('onion')) {
    const list = ['photo-1618512496248-a07fe83aa8cb', 'photo-1508747703725-719777637510']
    return list[idIndex(id, list.length)]
  }
  // Grapes
  if (name.includes('grape')) {
    const list = ['photo-1596368708356-6e1e1025ee73', 'photo-1537640538966-79f369143f8f']
    return list[idIndex(id, list.length)]
  }
  // Mangoes
  if (name.includes('mango')) {
    const list = ['photo-1553279768-865429fa0078', 'photo-1601493700631-2b16ec4b4716']
    return list[idIndex(id, list.length)]
  }
  // Potatoes
  if (name.includes('potato')) {
    const list = ['photo-1518977676601-b53f82aba655', 'photo-1508313880080-c4bef0730395']
    return list[idIndex(id, list.length)]
  }
  // Pomegranate
  if (name.includes('pomegranate')) {
    return 'photo-1615485290382-441e4d049cb5'
  }
  // Sugarcane
  if (name.includes('sugarcane')) {
    return 'photo-1516253593875-bd7ba052fbc5'
  }
  // Rice
  if (name.includes('rice') || name.includes('paddy') || name.includes('basmati')) {
    return 'photo-1586201375761-83865001e31c'
  }
  // Wheat & Flour
  if (name.includes('wheat') || name.includes('flour') || name.includes('atta')) {
    return 'photo-1574323347407-f5e1ad6d020b'
  }
  // Cotton
  if (name.includes('cotton')) {
    return 'photo-1606041008023-472dfb5e530f'
  }
  // Bananas
  if (name.includes('banana')) {
    return 'photo-1528825871115-3581a5387919'
  }
  // Vegetables
  if (name.includes('spinach') || name.includes('vegetable') || name.includes('green') || name.includes('pulse')) {
    return 'photo-1540420773420-3366772f4999'
  }
  // Fruits
  if (name.includes('fruit') || name.includes('apple') || name.includes('orange')) {
    return 'photo-1619566636858-adf3ef46400b'
  }
  // Fertilizers & Chemicals
  if (name.includes('fertilizer') || name.includes('npk') || name.includes('dap') || name.includes('urea') || name.includes('potash') || name.includes('vermicompost') || name.includes('neem')) {
    const list = ['photo-1585314062340-f1a5a7c9328d', 'photo-1628352081506-83c43123ed6d', 'photo-1592417817098-8f3d6ef23a8d']
    return list[idIndex(id, list.length)]
  }
  // Seeds
  if (name.includes('seed')) {
    return 'photo-1530836369250-ef72a3f5cda8'
  }
  // Organic
  if (name.includes('organic')) {
    return 'photo-1540420773420-3366772f4999'
  }

  // Fallback to fresh produce
  const defaultList = ['photo-1610832958506-aa56368176cf', 'photo-1540420773420-3366772f4999']
  return defaultList[idIndex(id, defaultList.length)]
}

export function getCropImage(cropType: string, id: string, size = '400x300', customImage?: string): string {
  if (customImage && (customImage.startsWith('http') || customImage.startsWith('data:') || customImage.startsWith('/'))) {
    return customImage
  }
  const [width, height] = size.split('x').map(Number)
  const photoId = resolvePhotoId(cropType, id)
  return buildPhoto(photoId, width || 400, height || 300)
}

export function getProductImage(category: string, id: string, size = '400x300', customImage?: string): string {
  if (customImage && (customImage.startsWith('http') || customImage.startsWith('data:') || customImage.startsWith('/'))) {
    return customImage
  }
  const [width, height] = size.split('x').map(Number)
  const photoId = resolvePhotoId(category, id)
  return buildPhoto(photoId, width || 400, height || 300)
}

// ─── Role / Person Images ───

export function getFarmerImage(id: string, size = '80x80'): string {
  const opts = ['photo-1507003211169-0a1dd7228f2d', 'photo-1500648767791-00dcc994a43e']
  const [width, height] = size.split('x').map(Number)
  return buildPhoto(opts[idIndex(id, opts.length)], width || 80, height || 80)
}

export function getBrokerImage(id: string, size = '80x80'): string {
  const opts = ['photo-1500648767791-00dcc994a43e', 'photo-1472099645785-5658abf4ff4e']
  const [width, height] = size.split('x').map(Number)
  return buildPhoto(opts[idIndex(id, opts.length)], width || 80, height || 80)
}

export function getSellerImage(id: string, size = '80x80'): string {
  const opts = ['photo-1560250097-0b93528c311a', 'photo-1573496359142-b8d87734a5a2']
  const [width, height] = size.split('x').map(Number)
  return buildPhoto(opts[idIndex(id, opts.length)], width || 80, height || 80)
}

// ─── Heroes ───
export const HERO_IMAGE = '/images/hero.jpg'
export const FARM_HERO = '/images/hero.jpg'
export const MARKET_HERO = '/images/broker_hero.jpg'
export const FERTILIZER_HERO = '/images/fertilizer_hero.jpg'

/**
 * Contextual image URLs for every role and entity type in Grape Master.
 * Uses Unsplash Source API - free, no API key, returns real high-quality photos.
 *
 * Pattern: https://source.unsplash.com/WIDTHxHEIGHT/?keyword1,keyword2
 *
 * Each function returns a deterministic URL based on an ID so the same
 * entity always gets the same image (seed via modulo on char codes).
 */

const UNSPLASH = 'https://source.unsplash.com'

/** Pick a consistent index from a string ID */
const idIndex = (id: string, max: number): number => {
  const sum = id.split('').reduce((s, c) => s + c.charCodeAt(0), 0)
  return sum % max
}

// ─── Crop / Produce Images ───

const CROP_IMAGES: Record<string, string[]> = {
  Grapes:      ['grapes,vineyard', 'grapes,farm', 'purple-grapes,harvest', 'grape-vine,nashik'],
  Onion:       ['onion,farm', 'onion-field,harvest', 'red-onion,market', 'onion,agriculture'],
  Tomato:      ['tomato,farm', 'tomato,harvest', 'red-tomato,vegetable', 'tomato,garden'],
  Wheat:       ['wheat,field', 'wheat,harvest', 'wheat-farm,india', 'wheat,golden'],
  Cotton:      ['cotton,field', 'cotton,harvest', 'cotton-plant,white', 'cotton,farm'],
  Mango:       ['mango,tree', 'mango,farm', 'mango,tropical', 'mango,fruit'],
  Pomegranate: ['pomegranate,farm', 'pomegranate,fruit', 'pomegranate,red', 'pomegranate,india'],
  Sugarcane:   ['sugarcane,field', 'sugarcane,farm', 'sugarcane,harvest', 'sugarcane'],
  Rice:        ['rice,paddy', 'rice-field,farm', 'rice,harvest', 'paddy,field'],
  Default:     ['agriculture,india', 'farm,produce', 'vegetable,market', 'harvest,field'],
}

export function getCropImage(cropType: string, id: string, size = '400x300'): string {
  const keywords = CROP_IMAGES[cropType] ?? CROP_IMAGES.Default
  const kw = keywords[idIndex(id, keywords.length)]
  return `${UNSPLASH}/${size}/?${kw}`
}

// ─── Fertilizer / Product Images ───

const CATEGORY_IMAGES: Record<string, string[]> = {
  DAP:          ['fertilizer,bag', 'agriculture,fertilizer', 'phosphate,fertilizer', 'crop,nutrition'],
  UREA:         ['urea,fertilizer', 'nitrogen,agriculture', 'fertilizer,granules', 'crop,fertilizer'],
  NPK:          ['npk,fertilizer', 'soil,nutrition', 'fertilizer,agriculture', 'crop,growth'],
  MOP:          ['potassium,fertilizer', 'potash,farm', 'crop,potassium', 'agriculture,input'],
  SSP:          ['phosphate,soil', 'fertilizer,powder', 'agriculture,chemical', 'farm,input'],
  MICRONUTRIENT:['zinc,fertilizer', 'micronutrient,plant', 'soil,health', 'crop,micronutrient'],
  PESTICIDE:    ['pesticide,spray', 'crop,protection', 'farm,pesticide', 'plant,protection'],
  HERBICIDE:    ['weed,control', 'herbicide,farm', 'crop,herbicide', 'agriculture,chemical'],
  FUNGICIDE:    ['fungicide,spray', 'crop,disease', 'plant,protection', 'farm,fungicide'],
  SEED:         ['seeds,agriculture', 'farm,seeds', 'crop,seeds', 'plant,seeds'],
  OTHER:        ['agriculture,input', 'farm,supply', 'agriculture,product', 'crop,input'],
}

export function getProductImage(category: string, id: string, size = '400x300'): string {
  const keywords = CATEGORY_IMAGES[category] ?? CATEGORY_IMAGES.OTHER
  const kw = keywords[idIndex(id, keywords.length)]
  return `${UNSPLASH}/${size}/?${kw}`
}

// ─── Role / Person Images ───

export function getFarmerImage(id: string, size = '80x80'): string {
  const opts = ['farmer,india', 'farmer,field', 'indian-farmer', 'farmer,nashik']
  return `${UNSPLASH}/${size}/?${opts[idIndex(id, opts.length)]}`
}

export function getBrokerImage(id: string, size = '80x80'): string {
  const opts = ['businessman,india', 'merchant,market', 'trader,india', 'businessman']
  return `${UNSPLASH}/${size}/?${opts[idIndex(id, opts.length)]}`
}

export function getSellerImage(id: string, size = '80x80'): string {
  const opts = ['agro,dealer', 'agriculture,store', 'fertilizer,shop', 'farm,dealer']
  return `${UNSPLASH}/${size}/?${opts[idIndex(id, opts.length)]}`
}

// ─── Location / Farm Images ───

export function getFarmImage(district: string, id: string, size = '800x400'): string {
  const locations: Record<string, string> = {
    Nashik:  'nashik,vineyard',
    Pune:    'pune,farm',
    Nagpur:  'nagpur,orange-farm',
    Solapur: 'maharashtra,farm',
    Sangli:  'sangli,sugarcane',
    Kolhapur:'kolhapur,farm',
  }
  const kw = locations[district] ?? 'maharashtra,agriculture'
  return `${UNSPLASH}/${size}/?${kw}`
}

// ─── Dashboard / Hero Images ───

export const HERO_IMAGE   = `${UNSPLASH}/1200x600/?vineyard,india,nashik`
export const FARM_HERO    = `${UNSPLASH}/1200x500/?grape,farm,india`
export const MARKET_HERO  = `${UNSPLASH}/1200x500/?agriculture,market,india`
export const FERTILIZER_HERO = `${UNSPLASH}/1200x500/?fertilizer,agriculture`

// ─── Weather condition images ───

export function getWeatherImage(condition: string): string {
  const map: Record<string, string> = {
    sunny: 'sunny,farm', cloudy: 'cloudy,sky',
    rainy: 'rain,farm', humid: 'humid,farm',
  }
  const kw = map[condition.toLowerCase()] ?? 'weather,farm'
  return `${UNSPLASH}/200x120/?${kw}`
}

/** Generic placeholder when no specific image is available */
export function getPlaceholder(type: 'produce' | 'product' | 'user', size = '400x300'): string {
  const keywords = {
    produce: 'fresh,vegetables,india',
    product: 'agriculture,product',
    user:    'farmer,portrait',
  }[type]
  return `${UNSPLASH}/${size}/?${keywords}`
}

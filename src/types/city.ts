export interface City {
  name: string
  country: string
}

export const CITIES: City[] = [
  { name: 'Rio de Janeiro', country: 'BR' },
  { name: 'Beijing', country: 'CN' },
  { name: 'Los Angeles', country: 'US' },
]

export const DEFAULT_CITY: City = { name: 'Los Angeles', country: 'US' }

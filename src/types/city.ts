export interface City {
  id: string
  name: string
}

export const CITIES: City[] = [
  { id: 'rio-de-janeiro', name: 'Rio de Janeiro' },
  { id: 'beijing', name: 'Beijing' },
  { id: 'los-angeles', name: 'Los Angeles' },
]

export const DEFAULT_CITY_ID = 'los-angeles'

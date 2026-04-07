import { Accessibility, Check, Clock3, Construction, Lightbulb, MapPin, Search, Trash2, Wrench, X } from 'lucide-react'

export const iconeCategoria = (nome) => {
  if (nome?.includes('Iluminação')) return Lightbulb
  if (nome?.includes('Coleta')) return Trash2
  if (nome?.includes('Acessib')) return Accessibility
  if (nome?.includes('Manutenção')) return Construction
  return MapPin
}


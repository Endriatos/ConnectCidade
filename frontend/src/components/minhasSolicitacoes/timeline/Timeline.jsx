import { useEffect, useMemo, useRef } from 'react'
import Item from './Item'

export default function Timeline({ eventos, autoFocusTipo = null, autoFocusToken = null }) {
  const alvoRef = useRef(null)
  const indiceAlvo = useMemo(() => {
    if (!autoFocusTipo) return -1
    let idx = -1
    eventos.forEach((ev, i) => {
      if (ev.tipo === autoFocusTipo) idx = i
    })
    return idx
  }, [autoFocusTipo, eventos])

  useEffect(() => {
    if (indiceAlvo < 0) return
    if (!alvoRef.current) return
    alvoRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [autoFocusToken, indiceAlvo])

  return (
    <ol className="relative m-0 list-none p-0">
      {eventos.map((ev, i, arr) => (
        <Item
          key={ev.key}
          {...ev}
          ultimo={i === arr.length - 1}
          destaque={i === indiceAlvo}
          itemRef={i === indiceAlvo ? alvoRef : null}
        />
      ))}
    </ol>
  )
}

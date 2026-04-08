import Item from './Item'

export default function Timeline({ eventos }) {
  return (
    <ol className="relative m-0 list-none p-0">
      {eventos.map((ev, i, arr) => (
        <Item key={ev.key} {...ev} ultimo={i === arr.length - 1} />
      ))}
    </ol>
  )
}

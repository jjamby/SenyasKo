import { Hand } from 'lucide-react'
import type { CollectionId } from '../../types/learning'

export function CollectionArtwork({ kind }: { kind: CollectionId }) {
  return <span className={`collection-art collection-art--${kind}`} aria-hidden="true">
    {kind === 'alphabet' && <span className="toy-blocks"><i>A</i><i>B</i><i>C</i></span>}
    {kind === 'numbers' && <span className="toy-blocks toy-blocks--numbers"><i>1</i><i>2</i><i>3</i></span>}
    {kind === 'greetings' && <span className="hello-sticker">Hello<span>✦</span></span>}
    {kind === 'expressions' && <span className="amazing-sticker"><span>AMAZING!</span></span>}
    {kind === 'introductions' && <span className="intro-sticker"><Hand strokeWidth={1.5} /><span>Meet you!</span></span>}
  </span>
}

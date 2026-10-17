import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import type { Collection } from '../../types/learning'
import { CollectionArtwork } from './CollectionArtwork'
import { ProgressBar } from './ProgressBar'

export function CollectionCard({ collection }: { collection: Collection }) {
  return <Link className={`glass-card collection-card collection-card--${collection.id}`} to={`/collections/${collection.id}`}>
    <div className="collection-card-content"><CollectionArtwork kind={collection.id} /><div className="collection-card-title"><h2>{collection.title}</h2><span>{collection.lessons.length} lessons · {collection.progress}% explored</span></div><ChevronRight className="collection-arrow" aria-hidden="true" /></div>
    <ProgressBar value={collection.progress} label={`${collection.title} progress`} compact />
  </Link>
}

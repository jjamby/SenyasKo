import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, BookOpen, Search, X } from 'lucide-react'
import { collections } from '../../data/demoContent'
import { CollectionCard } from '../../components/ui/CollectionCard'
import { CollectionArtwork } from '../../components/ui/CollectionArtwork'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { AlphabetPreview } from '../../components/ui/AlphabetPreview'
import './collections.css'

export function CollectionsPage() {
  const [search, setSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const matches = collections.filter((collection) => `${collection.title} ${collection.description} ${collection.lessons.join(' ')}`.toLowerCase().includes(search.toLowerCase().trim()))
  return <div className="collections-page"><div className="section-heading"><div><span className="eyebrow">YOUR NEXT DISCOVERY</span><h1>Collections</h1></div><button className="icon-button search-toggle" aria-label={searchOpen ? 'Close search' : 'Search collections'} aria-expanded={searchOpen} onClick={() => { setSearchOpen(!searchOpen); setSearch('') }}>{searchOpen ? <X /> : <Search />}</button></div>{searchOpen && <div className="search-field"><Search size={20} aria-hidden="true" /><label className="sr-only" htmlFor="collection-search">Search collections</label><input id="collection-search" autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a collection or lesson…" /><span aria-live="polite">{matches.length} found</span></div>}<div className="collections-grid">{matches.map((collection) => <CollectionCard key={collection.id} collection={collection} />)}</div>{matches.length === 0 && <div className="glass-card search-empty"><BookOpen size={40} /><h2>No collections found</h2><p>Try “alphabet”, “numbers”, or “hello”.</p><button className="text-button" onClick={() => setSearch('')}>Clear search</button></div>}</div>
}

export function CollectionDetailPage() {
  const { collectionId } = useParams()
  const collection = collections.find((item) => item.id === collectionId)
  if (!collection) return <div className="glass-card search-empty"><h1>Collection not found</h1><Link to="/collections" className="button button--dark">Back to collections</Link></div>
  return <div className="collection-detail"><Link to="/collections" className="back-link"><ArrowLeft size={18} /> All collections</Link><section className="glass-card collection-detail-hero"><CollectionArtwork kind={collection.id} /><span className="eyebrow">MAKE A LITTLE PROGRESS</span><h1>{collection.title}</h1><p>{collection.description}</p><ProgressBar value={collection.progress} label={`${collection.title} sample progress`} compact /><span className="small-note">{collection.progress}% explored · sample progress</span></section>{collection.id === 'alphabet' && <section className="glass-card reference-card"><h2>A peek at today’s letters</h2><AlphabetPreview /><p className="helper-text">Visual reference from the design. Lesson content will be reviewed with an FSL instructor.</p></section>}<div className="lesson-list"><h2>Your learning path</h2>{collection.lessons.map((lesson, index) => <Link className="lesson-row" key={lesson} to={`/practice?collection=${collection.id}&lesson=${encodeURIComponent(lesson)}`}><span className="lesson-number">{String(index + 1).padStart(2, '0')}</span><div><h3>{lesson}</h3><p>Explore the practice screen</p></div><ArrowRight size={20} /></Link>)}</div></div>
}

import { Link } from 'react-router-dom'
import { ArrowUpRight, Sparkles } from 'lucide-react'
import { demoProgress, collections } from '../../data/demoContent'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { CollectionCard } from '../../components/ui/CollectionCard'
import { AlphabetPreview } from '../../components/ui/AlphabetPreview'
import './home.css'

export function HomePage() {
  return <div className="home-page"><div className="desktop-page-title"><div><span className="eyebrow">ONE SIGN AT A TIME</span><h1>Keep your curiosity going.</h1></div><span className="small-note">Your journey, your pace.</span></div><section className="glass-card level-card" aria-label="Sample learner level"><div className="level-main"><div className="level-badge">L{demoProgress.level}</div><div><span className="level-caption">LOOK AT YOU GO</span><h2>FSL PRO!</h2></div><Sparkles className="level-sparkles" aria-hidden="true" /></div><ProgressBar value={demoProgress.experience / demoProgress.nextLevel * 100} label="Sample progress to level 6" /><div className="level-details"><span>{demoProgress.experience} / {demoProgress.nextLevel} XP</span><span>Next up: Level 6</span></div></section><div className="home-grid"><Link to="/collections/alphabet" className="glass-card today-card"><div className="card-heading"><div><span className="eyebrow">A LITTLE LEARNING, EVERY DAY</span><h2>Today’s Lesson</h2></div><ArrowUpRight aria-hidden="true" /></div><AlphabetPreview /><div className="lesson-caption"><span>Getting to know the alphabet</span><strong>Let’s explore <ArrowUpRight size={16} /></strong></div></Link><section className="glass-card continue-card"><div className="card-heading"><div><span className="eyebrow">PICK UP WHERE YOU LEFT OFF</span><h2>Continue:</h2></div></div><CollectionCard collection={collections[3]} /><p className="continue-note">A few minutes can make a meaningful difference.</p></section></div><Link className="browse-link" to="/collections">Find your next little discovery <ArrowUpRight size={17} /></Link></div>
}

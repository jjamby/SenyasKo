import { Link } from 'react-router-dom'
import './notifications.css'

function SleepingBell() {
  return <svg className="sleeping-bell" viewBox="0 0 300 230" role="img" aria-label="A sleeping yellow notification bell"><g fill="#dedbd7"><rect x="29" y="75" width="244" height="80" rx="40" /><rect x="45" y="175" width="194" height="26" rx="13" /><rect x="76" y="127" width="151" height="64" rx="20" /><rect x="76" y="43" width="154" height="15" rx="7" /><rect x="39" y="43" width="24" height="15" rx="7" /><circle cx="269" cy="190" r="12" /></g><circle cx="148" cy="177" r="22" fill="#ff9918" /><path d="M103 153V106c0-31 17-60 46-60s49 29 49 60v47" fill="#ff9b14" /><rect x="134" y="35" width="24" height="31" rx="12" fill="#ffcb00" /><path d="M92 151V108c0-32 17-61 48-61 34 0 49 30 49 61v43Z" fill="#fbc800" /><path d="M96 120v-14c0-27 13-48 34-53" fill="none" stroke="#fff0ad" strokeWidth="10" strokeLinecap="round" /><path d="M115 103q10 8 20 0m19 0q10 8 20 0" fill="none" stroke="#f2a118" strokeWidth="4" strokeLinecap="round" /><ellipse cx="146" cy="126" rx="5" ry="3" fill="#f2a118" /><rect x="78" y="150" width="135" height="19" rx="10" fill="#fbc800" /><path d="M85 154h49" stroke="#fff0ad" strokeWidth="9" strokeLinecap="round" /><g fill="#fbc800"><circle cx="240" cy="103" r="6" /><circle cx="86" cy="23" r="3" /></g><text x="205" y="53" fill="#ff9918" fontSize="32" fontWeight="700">Z</text><text x="239" y="34" fill="#ff9918" fontSize="23" fontWeight="700">z</text></svg>
}

export function NotificationsPage() {
  return <div className="notifications-page"><div className="section-heading"><div><span className="eyebrow">A LITTLE SPACE TO CATCH UP</span><h1>Notifications</h1></div></div><section className="notification-empty"><SleepingBell /><h2>No notifications yet</h2><p>All quiet for now. Your learning journey is waiting.</p><Link className="text-link" to="/collections">Explore your collections <span aria-hidden="true">↗</span></Link></section></div>
}

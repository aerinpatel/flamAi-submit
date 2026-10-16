import { NavLink } from 'react-router-dom'

const cls = ({ isActive }) => (isActive ? 'on' : '')

export default function Navbar() {
  return (
    <nav className="nav" aria-label="Main">
      <NavLink to="/" end className={cls}>Home</NavLink>
      <NavLink to="/about" className={cls}>About us</NavLink>
    </nav>
  )
}

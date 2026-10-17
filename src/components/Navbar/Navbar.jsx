import { NavLink } from 'react-router-dom'

const link = ({ isActive }) => 'font-medium no-underline ' + (isActive ? 'text-orange' : 'text-body hover:text-orange')

export default function Navbar() {
  return (
    <nav className="absolute top-0 right-0 z-5 flex gap-[34px] rounded-bl-[22px] bg-page px-[26px] py-3.5 max-[600px]:gap-[18px] max-[600px]:px-4 max-[600px]:py-2.5" aria-label="Main">
      <NavLink to="/" end className={link}>Home</NavLink>
      <NavLink to="/about" className={link}>About us</NavLink>
    </nav>
  )
}

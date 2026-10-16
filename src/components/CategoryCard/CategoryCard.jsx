import { IMG } from '../../data'

export default function CategoryCard({ category, count, onClick }) {
  return (
    <button className="card" onClick={onClick}>
      <div className="im"><img src={IMG[category.img]} alt="" /></div>
      <h3>{category.name}</h3>
      <small>Tap to add</small>
      <span className="cnt">{count ? `${count} added` : ''}</span>
    </button>
  )
}

export default function DishCard({ dish, onClick }) {
  return (
    <button className="dish" onClick={onClick}>
      <div className="im"><span style={{ fontSize: '5rem' }} aria-hidden="true">{dish.emoji}</span></div>
      <h3 style={{ fontSize: '1.5rem' }}>{dish.name}</h3>
      <p>{dish.description}</p>
      <div className="meta"><span>{dish.cuisine}</span><span>{dish.time}</span><span>{dish.difficulty}</span></div>
      <span className="btn" style={{ alignSelf: 'flex-start' }}>View recipe</span>
    </button>
  )
}

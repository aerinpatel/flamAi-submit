export default function DishCard({ dish, onClick }) {
  return (
    <button className="card min-w-0 gap-3 rounded-3xl p-7 max-[600px]:p-5" onClick={onClick}>
      <div className="flex h-[200px] items-center justify-center overflow-hidden rounded-2xl bg-paper max-[600px]:h-[130px]">
        <span className="text-[5rem]" aria-hidden="true">{dish.emoji}</span>
      </div>
      <h3 className="text-[1.5rem]">{dish.name}</h3>
      <p>{dish.description}</p>
      <div className="meta"><span>{dish.cuisine}</span><span>{dish.time}</span><span>{dish.difficulty}</span></div>
      <span className="btn self-start">View recipe</span>
    </button>
  )
}

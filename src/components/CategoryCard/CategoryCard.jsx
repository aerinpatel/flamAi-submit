import { IMG } from '../../data'

export default function CategoryCard({ category, count, onClick }) {
  return (
    <button className="card rounded-[22px] p-[18px] [transition:border-color_.15s] max-[600px]:rounded-[20px] max-[600px]:p-4" onClick={onClick}>
      <div className="flex h-[180px] items-center justify-center overflow-hidden rounded-[14px] max-[600px]:h-[150px]">
        <img className="max-h-[180px] max-w-full max-[600px]:max-h-[150px]" src={IMG[category.img]} alt="" />
      </div>
      <h3 className="mt-3">{category.name}</h3>
      <small className="text-soft">Tap to add</small>
      <span className="mt-2 text-[.85rem] font-semibold text-orange">{count ? `${count} added` : ''}</span>
    </button>
  )
}

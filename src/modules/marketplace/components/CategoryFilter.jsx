export default function CategoryFilter({ categories, selectedCategory, onSelectCategory }) {
  return (
    <div className="category-filter-pills">
      <button
        type="button"
        className={`filter-pill ${selectedCategory === 'all' ? 'active' : ''}`}
        onClick={() => onSelectCategory('all')}
      >
        ✨ All Categories
      </button>

      {categories.map((cat) => (
        <button
          key={cat.category_id}
          type="button"
          className={`filter-pill ${String(selectedCategory) === String(cat.category_id) ? 'active' : ''}`}
          onClick={() => onSelectCategory(cat.category_id)}
        >
          <span>{cat.category_icon || '📁'}</span>
          <span>{cat.category_name}</span>
        </button>
      ))}
    </div>
  );
}

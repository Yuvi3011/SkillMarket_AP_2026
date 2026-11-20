export default function SearchBar({ value, onChange, onSubmit, placeholder = "Search services by title, skills or keywords..." }) {
  return (
    <form className="search-input-wrap" onSubmit={onSubmit}>
      <span className="search-icon">🔍</span>
      <input
        type="text"
        className="search-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button
          type="button"
          className="search-clear-btn"
          onClick={() => onChange('')}
          title="Clear search"
        >
          ×
        </button>
      )}
    </form>
  );
}

import { useEffect, useState, useRef, useMemo } from "react";

interface CategoryComboboxProps {
  value: string;
  onChange: (val: string) => void;
  categories: string[];
  error?: string;
}

export function CategoryCombobox({
  value,
  onChange,
  categories,
  error,
}: CategoryComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCategories = useMemo(() => {
    if (!inputValue.trim()) return categories;
    const lower = inputValue.toLowerCase();
    return categories.filter((cat) => cat.toLowerCase().includes(lower));
  }, [inputValue, categories]);

  const showCreateOption =
    inputValue.trim() &&
    !categories.some(
      (cat) => cat.toLowerCase() === inputValue.toLowerCase().trim()
    );

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          onChange(e.target.value);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder="Select or type category..."
        className="input"
        style={error ? { borderColor: "var(--status-danger)" } : {}}
      />
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--noir-muted)] hover:text-[var(--noir-text)]"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d={isOpen ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"}
          />
        </svg>
      </button>

      {isOpen && (filteredCategories.length > 0 || showCreateOption) && (
        <div
          ref={dropdownRef}
          className="absolute z-50 top-full left-0 right-0 mt-1 bg-[var(--noir-elevated)] border border-[var(--noir-border)] rounded-sm max-h-48 overflow-y-auto"
        >
          {showCreateOption && (
            <button
              type="button"
              onClick={() => {
                onChange(inputValue.trim());
                setIsOpen(false);
              }}
              className="w-full text-left px-3 py-2.5 text-sm hover:bg-[var(--amber-glow)] text-[var(--amber-core)] flex items-center gap-2 border-b border-[var(--noir-border)]"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Create "{inputValue.trim()}"
            </button>
          )}
          {filteredCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                onChange(cat);
                setInputValue(cat);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2.5 text-sm hover:bg-[var(--noir-surface)] transition-colors ${
                cat.toLowerCase() === value.toLowerCase()
                  ? "text-[var(--amber-core)] bg-[var(--amber-glow)]"
                  : "text-[var(--noir-text)]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

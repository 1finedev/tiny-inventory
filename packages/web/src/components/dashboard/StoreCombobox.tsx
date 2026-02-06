import { useEffect, useState, useRef, useMemo } from "react";

export interface StoreOption {
  _id: string;
  name: string;
}

interface StoreComboboxProps {
  value: string;
  onChange: (storeId: string) => void;
  stores: StoreOption[];
  error?: string;
}

export function StoreCombobox({
  value,
  onChange,
  stores,
  error,
}: StoreComboboxProps) {
  const storeById = useMemo(
    () => new Map(stores.map((s) => [s._id, s])),
    [stores]
  );
  const selectedStore = value ? storeById.get(value) : null;

  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(selectedStore?.name ?? "");
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value && selectedStore) {
      setInputValue(selectedStore.name);
    } else if (!value) {
      setInputValue("");
    }
  }, [value, selectedStore?.name]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        if (value && selectedStore) setInputValue(selectedStore.name);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value, selectedStore]);

  const filteredStores = useMemo(() => {
    if (!inputValue.trim()) return stores;
    const lower = inputValue.toLowerCase();
    return stores.filter((s) => s.name.toLowerCase().includes(lower));
  }, [inputValue, stores]);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          if (!e.target.value.trim()) onChange("");
        }}
        onFocus={() => setIsOpen(true)}
        placeholder="Search store..."
        className="input w-full"
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

      {isOpen && filteredStores.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 top-full left-0 right-0 mt-1 bg-[var(--noir-elevated)] border border-[var(--noir-border)] rounded-sm max-h-48 overflow-y-auto"
        >
          {filteredStores.map((store) => (
            <button
              key={store._id}
              type="button"
              onClick={() => {
                onChange(store._id);
                setInputValue(store.name);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2.5 text-sm hover:bg-[var(--noir-surface)] transition-colors ${
                store._id === value
                  ? "text-[var(--amber-core)] bg-[var(--amber-glow)]"
                  : "text-[var(--noir-text)]"
              }`}
            >
              {store.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

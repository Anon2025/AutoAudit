import React, { useState, useRef, useEffect } from 'react';

// Define type for each option
type Option = {
  value: string;
  label: string;
};

// Define props type
type DropdownProps = {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  isDarkMode?: boolean;
};

const Dropdown: React.FC<DropdownProps> = ({
  value,
  onChange,
  options,
  isDarkMode = true,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const safeOptions = Array.isArray(options) ? options : [];
  const hasOptions = safeOptions.length > 0;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSelect = (option: Option) => {
    onChange(option.value);
    setIsOpen(false);
  };

  const selectedOption =
    safeOptions.find((opt) => opt.value === value) || safeOptions[0];

  const selectedLabel = selectedOption?.label ?? 'No options';

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => {
          if (!hasOptions) return;
          setIsOpen(!isOpen);
        }}
        className={`w-full flex items-center justify-between px-4 py-2 rounded-lg transition ${
  isDarkMode
    ? "bg-gray-800 text-white hover:bg-gray-700"
    : "bg-white text-black hover:bg-gray-200"
}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={!hasOptions}
      >
        <span className="min-w-0 truncate" title={selectedLabel}>
  {selectedLabel}
</span>
        <span
  className={`ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`}
>
  ▼
</span>
      </button>

      {isOpen && hasOptions && (
        <div
  role="listbox"
  className={`absolute mt-2 w-full rounded-lg shadow-lg z-10 ${
    isDarkMode ? "bg-gray-800 text-white" : "bg-white text-black"
  }`}
>
          {safeOptions.map((option) => (
            <button
              key={option.value}
              className={`block w-full text-left px-4 py-2 ${
  isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"
} ${
  option.value === value
    ? isDarkMode
      ? "bg-gray-700 font-semibold"
      : "bg-gray-300 font-semibold"
    : ""
}`}
              onClick={() => handleSelect(option)}
              type="button"
              role="option"
              aria-selected={option.value === value}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
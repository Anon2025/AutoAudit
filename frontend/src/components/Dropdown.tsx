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
  <div
    ref={dropdownRef}
    className="relative inline-block min-w-0 flex-shrink isolate"
  >
    <button
      type="button"
      onClick={() => {
        if (!hasOptions) return;
        setIsOpen(!isOpen);
      }}
      className="flex items-center justify-between gap-2 min-w-[40px] max-w-full px-[12px] py-[8px] text-[14px] font-bold rounded-[8px] border transition-all duration-200 bg-transparent text-[#b0c4de] border-[rgba(59,130,246,0.12)] hover:bg-[rgba(255,255,255,0.04)] hover:border-[rgba(59,130,246,0.35)] hover:text-white focus:outline-none focus:border-[rgba(59,130,246,0.6)] focus:shadow-[0_0_0_2px_rgba(59,130,246,0.25)]"
    >
      <span className="flex-1 text-left truncate min-w-0">
        {selectedLabel}
      </span>

      <span
        className={`text-[12px] flex-shrink-0 transition-transform duration-200 ${
          isOpen ? "rotate-180" : ""
        } text-[#94a3b8]`}
      >
        ▼
      </span>
    </button>

    {isOpen && hasOptions && (
      <div
        className="absolute top-full left-0 right-0 mt-[4px] rounded-[8px] border overflow-hidden z-[1100] transition-all duration-300 bg-[rgb(30_41_59)] border-[rgba(59,130,246,0.06)] shadow-[0_18px_45px_rgba(0,0,0,0.6)]"
      >
        {safeOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => handleSelect(option)}
            type="button"
            className={`w-full text-left px-[16px] py-[12px] text-[14px] transition-all duration-200 border-b last:border-b-0 text-[#b0c4de] border-[rgba(59,130,246,0.12)] hover:bg-[rgba(255,255,255,0.04)] hover:text-white ${
              option.value === value
                ? "bg-[rgba(59,130,246,0.12)] font-medium hover:bg-[rgba(59,130,246,0.18)]"
                : ""
            }`}
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
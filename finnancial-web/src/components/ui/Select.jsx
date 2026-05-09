import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import styles from './Select.module.css';

export function Select({ value, onChange, options, minWidth = '120px' }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedOption = options.find(opt => String(opt.value) === String(value)) || options[0];

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={styles.selectContainer} ref={dropdownRef} style={{ minWidth }}>
      <button
        type="button"
        className={`${styles.selectTrigger} ${isOpen ? styles.open : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={styles.selectValue}>{selectedOption?.label}</span>
        <ChevronDown size={16} className={styles.icon} />
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`${styles.option} ${String(option.value) === String(value) ? styles.selected : ''}`}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

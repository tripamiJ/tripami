import React, { useEffect, useRef, useState } from 'react';
import styles from './CustomDropSort.module.css';
import { SortDirection } from '~/assets/icons/SortDirection';

interface Sort {
  onSelect: (value: string) => void;
  isReverse: boolean;
  setReverse: () => void;
}

const CustomSortDropdown: React.FC<Sort> = ({ onSelect, isReverse, setReverse }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState('Date');

  const options = [
    { value: 'endDate', label: 'Date' },
    { value: 'alphabetically', label: 'A to Z' },
    { value: 'rate', label: 'Rating' },
  ];

  const dropRef = useRef<HTMLDivElement>(null);

  const handleBlur = (event) => {
    if (dropRef.current && !dropRef.current.contains(event.relatedTarget)) {
      setIsOpen(false);
    }
  };

  const handleSelect = (option: { value: string; label: string }) => {
    setSelectedOption(option.label);
    onSelect(option.value);
    setIsOpen(false);
  };

  useEffect(() => {
    if (isOpen) {
      dropRef.current?.focus();
    }
  }, [isOpen]);

  return (
    <div className={styles.dropdown} ref={dropRef} tabIndex={-1} onBlur={handleBlur}>
      <div
        className={styles.dropdown_header}
        onClick={() => setIsOpen(!isOpen)}
        tabIndex={0}
      >
        Filter by: {selectedOption}
      </div>
      {isOpen && (
        <div className={styles.dropdown_list}>
          {options.map((option, index) => (
            <div
              key={option.value}
              className={`${styles.dropdown_item} ${index === 0 ? styles.first_item : ''} ${index === options.length - 1 ? styles.last_item : ''}`}
              onClick={() => handleSelect(option)}
              tabIndex={0}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
      <div className={styles.sortDirection} onClick={() => setReverse()}>
        <SortDirection isReverse={isReverse} />
      </div>
    </div>
  );
};

export default CustomSortDropdown;
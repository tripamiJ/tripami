import React, { useRef } from 'react';

import cn from 'classnames';

import arrow from '../../assets/icons/dropdown_array.svg';
import people from '../../assets/icons/people.svg';
import styles from './CustomDropdownEditor.module.css';

interface Props {
  setIsOpen: (isOpen: boolean) => void;
  isOpen: boolean;
  setSelectedOption: (option: string) => void;
  selectedOption: string;
}

const CustomDropdownEditor: React.FC<Props> = ({
  setIsOpen,
  isOpen,
  setSelectedOption,
  selectedOption,
}) => {
  const options = ['Solo Trip', '2-5', '5-8', '8+'];

  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleOptionClick = (option: string) => {
    setSelectedOption(option);
    setIsOpen(false);
  };

  const handleBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.relatedTarget as Node)) {
      setIsOpen(false);
    }
  };

  return (
    <div className={styles.dropdown} onBlur={handleBlur} ref={dropdownRef} tabIndex={0}>
      <div
        onClick={toggleDropdown}
        className={cn(styles.dropdownButton, { [styles.dropdownButtonOpen]: isOpen })}
      >
        <img src={people} alt='people' className={styles.people} />
        {selectedOption || 'number of companions'}
        <img src={arrow} alt='array' className={cn({ [styles.dropdownArrowOpen]: isOpen })} />
      </div>
      <div className={cn(styles.dropdownContent, { [styles.dropdownContentOpen]: isOpen })}>
        {isOpen &&
          options.map((option, index) => (
            <div
              key={option}
              onClick={() => handleOptionClick(option)}
              className={`${styles.option} ${index === 0 ? styles.firstOption : ''} ${index === options.length - 1 ? styles.lastOption : ''}`}
            >
              {option}
            </div>
          ))
        }
      </div>
    </div>
  );
};

export default CustomDropdownEditor;

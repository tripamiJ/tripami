import React, { useRef } from 'react';

import cn from 'classnames';
import { DateInfo } from '~/types/dateJournal';

import array from '../../assets/icons/dropdown_array.svg';
import place_icon from '../../assets/icons/place_icon.svg';
import styles from './CustomPlacesDropdown.module.css';

interface Props {
  setIsOpen: (isOpen: boolean) => void;
  isOpen: boolean;
  setPlacesDrop: React.Dispatch<React.SetStateAction<{ address: string; placeID: string }[]>>;
  placesDrop: { address: string; placeID: string }[];
  setDailyInfo: React.Dispatch<React.SetStateAction<DateInfo[]>>;
  selectedDate?: string;
}

const CustomPlacesDropdown: React.FC<Props> = ({
  setIsOpen,
  isOpen,
  setPlacesDrop,
  placesDrop,
  setDailyInfo,
  selectedDate,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleOptionClick = (option: { address: string; placeID: string }) => {
    setIsOpen(false);

    if (selectedDate) {
      setDailyInfo((prev) =>
        prev.map((day) =>
          day.date === selectedDate
            ? {
              ...day,
              place: [...day.place, option],
            }
            : day
        )
      );
    }

    setPlacesDrop((prev) => prev.filter((place) => place.placeID !== option.placeID));
  };

  // const handleRemoveOption = (option: { address: string; placeID: string }) => {
  //   setPlacesDrop((prev) => prev.filter((place) => place.placeID !== option.placeID));

  //   if (selectedDate) {
  //     setDailyInfo((prev) =>
  //       prev.map((day) =>
  //         day.date === selectedDate
  //           ? {
  //             ...day,
  //             place: day.place.filter((place) => place.placeID !== option.placeID),
  //           }
  //           : day
  //       )
  //     );
  //   }
  // };

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
        <img src={place_icon} alt='place_icon' className={styles.people} />
        Select a place
        <img src={array} alt='array' className={cn({ [styles.dropdownArrowOpen]: isOpen })} />
      </div>

      <div className={cn(styles.dropdownContent, { [styles.dropdownContentOpen]: isOpen })}>
        {isOpen &&
          placesDrop.map((day) => (
            <div key={day.address} onClick={() => handleOptionClick(day)} className={styles.option}>
              {day.address.split(',')[0]}
            </div>
          ))}
      </div>
    </div>
  );
};

export default CustomPlacesDropdown;

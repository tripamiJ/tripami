import React, { FC, useState } from 'react';

import Star from '../RatingStar';
import styles from './rating.module.css';

interface Props {
  totalStars?: number;
  selectedStars?: number;
  setSelectedStars?: React.Dispatch<React.SetStateAction<number>>;
  disabled?: boolean;
}

const Rating: FC<Props> = ({
  totalStars = 5,
  selectedStars = 0,
  setSelectedStars = () => {},
  disabled,
}) => {
  return (
    <div className={styles.container}>
      {[...Array(totalStars)].map((n, i) => (
        <Star
          key={i}
          disabled={disabled}
          selected={selectedStars >= i}
          onSelect={() => {
            setSelectedStars(i);
          }}
        />
      ))}
    </div>
  );
};

export default Rating;

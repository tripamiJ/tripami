import { FC, useMemo } from 'react';

import { SortDirection } from '@assets/icons/SortDirection';

import styles from './sort.module.css';

interface Props {
  onSelect: (value: string) => void;
  isReverse: boolean;
  setReverse: () => void;
}

export const Sort: FC<Props> = ({ onSelect, isReverse, setReverse }) =>
  useMemo(() => {
    return (
      <div className={styles.sortContainer}>
        <select
          name='order'
          className={styles.sortby_select}
          onChange={(e) => onSelect(e.target.value)}
        >
          {/* <option value='startDate'>Start date</option> */}
          <option value='endDate'>Date</option>
          <option value='alphabetically'>A to Z</option>
          <option value='rate'>Rating</option>
        </select>
        <div onClick={() => setReverse()}>
          <SortDirection isReverse={isReverse} />
        </div>
      </div>
    );
  }, [isReverse, onSelect, setReverse]);

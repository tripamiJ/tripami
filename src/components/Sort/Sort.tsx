import { FC, useMemo } from 'react';

import { SortDirection } from '@assets/icons/SortDirection';

import styles from './sort.module.css';
import CustomSortDropdown from '../CustomDropSort';

interface Props {
  onSelect: (value: string) => void;
  isReverse: boolean;
  setReverse: () => void;
}

export const Sort: FC<Props> = ({ onSelect, isReverse, setReverse }) =>
  useMemo(() => {
    return (
      <div className={styles.sortContainer}>
        <CustomSortDropdown onSelect={onSelect} setReverse={setReverse} isReverse={isReverse}/>
      </div>
    );
  }, [isReverse, onSelect, setReverse]);

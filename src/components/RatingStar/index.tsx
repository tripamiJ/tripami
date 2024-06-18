import { FC } from 'react';

import Star1 from '@assets/icons/Star1.svg';
import Star2 from '@assets/icons/star_editor.svg';

import styles from './ratingStar.module.css';

interface Props {
  selected?: boolean;
  onSelect?: () => void;
  disabled?: boolean;
}

const Star: FC<Props> = ({ selected = false, onSelect = () => { }, disabled = false }) => (
  <div
    className={styles.container}
    onClick={onSelect}
    style={{ cursor: disabled ? 'default' : 'pointer' }}
  >
    {selected ? (
      <img className={styles.star} src={Star2} />
    ) : (
      <img className={styles.star} src={Star1} />
    )}
  </div>
);

export default Star;

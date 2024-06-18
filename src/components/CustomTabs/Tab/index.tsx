import React, { ReactNode } from 'react';

import styles from './tab.module.css';

export interface ITab {
  label: string;
  Icon: ReactNode;
  index: number;
}

interface ITabInternal {
  isActive: boolean;
  onClick?: (tabIndex: number) => void;
}

const Tab: React.FC<ITab & ITabInternal> = ({ label, Icon, isActive, onClick, index }) => {
  return (
    <div
      className={`${styles.container} ${isActive && styles['container--active']}`}
      onClick={() => onClick?.(index)}
    >
      {Icon}
      <p className={`${styles.label} ${isActive && styles['label--active']}`}>{label}</p>
    </div>
  );
};

export default Tab;

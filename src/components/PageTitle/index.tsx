import { FC } from 'react';

import styles from './pageTitle.module.css';

interface Props {
  title: string;
}

export const PageTitle: FC<Props> = ({ title }) => {
  return (
    <div className={styles.titleContainer}>
      <p className={styles.title}>{title}</p>
    </div>
  );
};

import { Dispatch, FC, HTMLInputTypeAttribute, SetStateAction } from 'react';

import Pencil from '@assets/icons/FatPencil.svg';

import styles from './customInput.module.css';

interface Props {
  type?: HTMLInputTypeAttribute;
  label?: string;
  onChange?: Dispatch<SetStateAction<string>>;
  value?: string;
  error?: string;
}

export const CustomInput: FC<Props> = ({ type = 'text', label, onChange, value, error }) => {
  return (
    <div className={styles.container}>
      {label ? <p className={styles.label}>{label}</p> : null}
      <input
        type={type}
        className={styles.input}
        onChange={(e) => onChange?.(e.target.value)}
        value={value || ''}
      />
      <img src={Pencil} className={styles.pencil} alt={'pencil'} />
      {error ? <p>{error}</p> : null}
    </div>
  );
};

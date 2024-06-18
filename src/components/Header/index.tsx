import { useState } from 'react';

import { SignUpModal } from '~/components/SignUpModal/SignUpModal';

import Logo from '@assets/icons/headerLogo.svg';
import search from '@assets/icons/iconamoon_search-thin.svg';

import styles from './header.module.css';

const Header = () => {
  const [modalIsOpen, setModalIsOpen] = useState(false);

  return (
    <div className={styles.header}>
      <img src={Logo} />
      <div className={styles.inputWrapper}>
        <img className={styles.search} src={search} alt='search' />
        <input className={styles.input} placeholder='Search'></input>
      </div>
      <div className={styles.icon}>
        <button className={styles.button} onClick={() => setModalIsOpen(true)}>
          Log in
        </button>
      </div>

      <SignUpModal isOpen={modalIsOpen} onClose={() => setModalIsOpen(false)} isLogin />
    </div>
  );
};

export default Header;

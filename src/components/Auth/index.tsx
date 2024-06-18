import { useCallback, useState } from 'react';

import { SignUpModal } from '~/components/SignUpModal/SignUpModal';

import globeImg from '@assets/icons/globe.svg';
import globearoud from '@assets/icons/globearound.svg';

import styles from './auth.module.css';

const AuthModal = () => {
  const [signUpFormIsOpen, setSignUpFormIsOpen] = useState(false);

  const onCloseModal = useCallback(() => {
    setSignUpFormIsOpen(false);
  }, []);

  return (
    <div className={styles.box}>
      <h3 className={styles.title}>Sign up for an account</h3>
      <div className={styles.container}>
        <button className={styles.email} onClick={() => setSignUpFormIsOpen(true)}>
          Join us
        </button>
      </div>
      <img className={styles.globe} src={globeImg} alt='globe' />
      <img className={styles.globearound} src={globearoud} alt='aroundglobe' />

      <SignUpModal isOpen={signUpFormIsOpen} onClose={onCloseModal} />
    </div>
  );
};

export default AuthModal;

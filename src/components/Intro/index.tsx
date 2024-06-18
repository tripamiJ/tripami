import React, { useState } from 'react';

import { SignUpModal } from '~/components/SignUpModal/SignUpModal';

import styles from './intro.module.css';

const Intro = () => {
  const [modalIsOpen, setModalIsOpen] = useState(false);

  return (
    <div className={styles.container}>
      <p className={styles.first}>
        Tired of relying on travel reviews from randoms? Now see reviews only from people you know!
      </p>
      <p className={styles.second}>
        Join the platform and find out what people are saying about their travels!
      </p>
      <button className={styles.email} onClick={() => setModalIsOpen(true)}>
        Join us
      </button>

      <SignUpModal isOpen={modalIsOpen} onClose={() => setModalIsOpen(false)} />
    </div>
  );
};

export default Intro;

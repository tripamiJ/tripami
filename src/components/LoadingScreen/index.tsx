import Lottie from 'lottie-react';

import Animation from '@assets/animations/loader.json';

import styles from './loadingScreen.module.css';

export const LoadingScreen = () => {
  return (
    <div className={styles.container}>
      <Lottie animationData={Animation} loop={true} className={styles.animation} />
    </div>
  );
};

import MyAccount from '~/components/profile/MyAccount';

import Header from '../../../components/profile/Header';
import styles from './profile.module.css';

const ProfilePage = () => {
  return (
    <>
      <Header />
      <div style={{ backgroundColor: '#DAE0E1' }} className={styles.main}>
        <MyAccount />
      </div>
    </>
  );
};

export default ProfilePage;

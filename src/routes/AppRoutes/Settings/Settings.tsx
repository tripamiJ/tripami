import React, { useCallback, useContext, useEffect, useState } from 'react';
import Dropdown, { Option } from 'react-dropdown';
import 'react-dropdown/style.css';
import Switch from 'react-switch';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import axios from 'axios';
import { getDownloadURL } from 'firebase/storage';
import { CustomInput } from '~/components/CustomInput';
import CustomModal from '~/components/CustomModal';
import { Footer } from '~/components/Footer';
import { ImageUploaderModal } from '~/components/ImageUploaderModal';
import { LoadingScreen } from '~/components/LoadingScreen';
import { PageTitle } from '~/components/PageTitle';
import Header from '~/components/profile/Header';
import { firebaseErrors } from '~/constants/firebaseErrors';
import { db, storage } from '~/firebase';
import { AuthContext } from '~/providers/authContext';
import { Country } from '~/types/countries';

import CameraIcon from '@assets/icons/CameraIcon.svg';
import FatPencil from '@assets/icons/FatPencil.svg';
import DefaultAvatar from '@assets/icons/defaultUserIcon.svg';
import { updatePassword } from '@firebase/auth';
import { doc, updateDoc } from '@firebase/firestore';
import { ref } from '@firebase/storage';
import { urlBase64ToUint8Array } from '@utils/urlBase64ToUint8Array';

import styles from './settings.module.css';
import './styles.css';

const Settings = () => {
  const { firestoreUser, currentUser, signIn } = useContext(AuthContext);
  const [userName, setUserName] = useState('');
  const [isChecked, setIsChecked] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [countries, setCountries] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<null | string>(null);
  const [selectedCity, setSelectedCity] = useState<null | string>(null);
  const [cityIsLoading, setCityIsLoading] = useState(false);
  const [isCropperModalOpen, setIsCropperModalOpen] = useState(false);
  const [avatar, setAvatar] = useState<string>(DefaultAvatar);

  useEffect(() => {
    if (firestoreUser?.username) {
      setUserName(firestoreUser.username);
    }

    if (firestoreUser?.primaryLocation?.city) {
      setSelectedCity(firestoreUser?.primaryLocation?.city);
    }

    if (firestoreUser?.primaryLocation?.country) {
      setSelectedCountry(firestoreUser?.primaryLocation?.country);
    }
  }, [
    firestoreUser?.username,
    firestoreUser?.primaryLocation?.city,
    firestoreUser?.primaryLocation?.country,
  ]);

  const validateNewPassword = useCallback((password: string) => {
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const isMinimumLength = password.length >= 8;

    return hasUppercase && hasLowercase && isMinimumLength;
  }, []);

  const notify = (text: string) => toast.success(text);

  const handleSaveSettings = useCallback(async () => {
    if (!firestoreUser?.id || !firestoreUser?.email) {
      return;
    }

    if (newPassword.length && oldPassword.length && currentUser) {
      const validationResult = validateNewPassword(newPassword);

      if (validationResult) {
        try {
          setIsLoading(true);
          const response = await signIn(firestoreUser?.email, oldPassword);

          if (response) {
            await updatePassword(currentUser, newPassword);

            setNewPassword('');
            setOldPassword('');
          }
        } catch (err) {
          // @ts-ignore
          // alert(firebaseErrors[err.code]);
          console.log(err);
        }
      } else {
        setPasswordError(true);
      }
    }

    if (userName !== firestoreUser?.username && firestoreUser?.id) {
      try {
        setIsLoading(true);
        await updateDoc(doc(db, 'users', firestoreUser?.id), {
          username: userName,
        });
      } catch (err) {
        // @ts-ignore
        alert(firebaseErrors[err.code]);
      }
    }

    if (
      selectedCity &&
      selectedCountry &&
      ((selectedCountry && selectedCountry !== firestoreUser?.primaryLocation?.country) ||
        (selectedCountry === firestoreUser?.primaryLocation?.country &&
          selectedCity !== firestoreUser.primaryLocation?.city))
    ) {
      try {
        setIsLoading(true);
        await updateDoc(doc(db, 'users', firestoreUser.id), {
          primaryLocation: {
            ...firestoreUser.primaryLocation,
            country: selectedCountry,
            city: selectedCity,
          },
        });
      } catch (err) {
        // @ts-ignore
        alert(firebaseErrors[err.code]);
      }
    }

    setIsLoading(false);
    notify('Settings saved successfully!');
  }, [newPassword, oldPassword, validateNewPassword, userName, selectedCity, selectedCountry]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get('https://countriesnow.space/api/v0.1/countries/iso');
        setCountries(data.data.map((country: Country) => country.name));
      } catch (err) {
        console.log('[ERROR getting countries] => ', err);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setCityIsLoading(true);
        const { data } = await axios.post('https://countriesnow.space/api/v0.1/countries/cities', {
          country: selectedCountry,
        });

        setCities(data.data);
      } catch (err) {
        console.log('[ERROR getting city] => ', err);
      } finally {
        setCityIsLoading(false);
      }
    })();
  }, [selectedCountry]);

  const handleOnChangeCountry = useCallback(
    async (value: Option) => {
      if (value.value !== selectedCountry) {
        setSelectedCity(null);
      }
      setSelectedCountry(value.value);
    },
    [selectedCountry]
  );

  const subscribeUserToPush = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js');

      const subscribeOptions = {
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          'BEnIhPDSlw2LWtAUi2XOPITN2ZlfGzDdUuDawvuDXUK_iK_AbVZdQD-6IJKzdR5zcX_uUEtyFLmNNg8OcYZBmxg'
        ),
      };

      const pushSubscription = await registration.pushManager.subscribe(subscribeOptions);

      console.log('Received PushSubscription: ', JSON.stringify(pushSubscription));
      return pushSubscription;
    } catch (err) {
      console.log('[ERROR subscribe on push] => ', err);
    }
  };

  useEffect(() => {
    (async () => {
      if (firestoreUser?.avatarUrl) {
        const url = await getDownloadURL(ref(storage, firestoreUser.avatarUrl));
        setAvatar(url);
      }
    })();
  }, [firestoreUser]);

  return (
    <div className={styles.main}>
      <Header />
      <div className={styles.container}>
        <div className={styles.line} />
        <div className={styles.titleContainer}>
          <PageTitle title={'User settings'} />
        </div>
        <div className={styles.topContainer}>
          <div className={styles.avatarContainer}>
            <img src={avatar} className={styles.avatar} />
            <div className={styles.cameraContainer} onClick={() => setIsCropperModalOpen(true)}>
              <img src={CameraIcon} className={styles.camera} />
            </div>
          </div>
          <div className={styles.inputContainer}>
            <input
              type='text'
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className={styles.userNameInput}
            />
            <img src={FatPencil} className={styles.fatPencil} />
          </div>
        </div>
        <p className={styles.smallText}>Profile information</p>
        <p className={styles.changePassword}>Change password</p>

        <div className={styles.inputsContainer}>
          <CustomInput
            label={'Old password'}
            type={'password'}
            onChange={setOldPassword}
            value={oldPassword}
          />
          <CustomInput
            label={'New  password'}
            type={'password'}
            onChange={setNewPassword}
            value={newPassword}
            error={
              passwordError
                ? 'Password must contain at least one uppercase latin letter and one lowercase'
                : undefined
            }
          />
        </div>
        <div className={styles.sepatarorContainer}>
          <div className={styles.separator} />
          <div className={styles.separator} />
        </div>

        <div className={styles.notificationsContainer}>
          <p className={styles.notificationsText}>Notifications</p>
          <Switch
            onChange={async (value) => {
              await subscribeUserToPush();
              setIsChecked(value);
            }}
            checked={isChecked}
          />
        </div>

        <p className={styles.country}>Country</p>
        <p className={styles.primary}>This is your primary location</p>

        <div className={styles.dropdownContainer}>
          <Dropdown
            options={countries}
            value={selectedCountry || undefined}
            onChange={handleOnChangeCountry}
            placeholder='Select country'
            className={styles.dropdown}
          />
          <Dropdown
            disabled={!selectedCountry || cityIsLoading}
            options={cities}
            value={!cityIsLoading ? selectedCity || undefined : undefined}
            onChange={(value) => setSelectedCity(value.value)}
            placeholder='Select city'
            className={styles.dropdown}
          />
        </div>

        <div className={styles.buttonsContainer}>
          <button className={styles.save} onClick={handleSaveSettings}>
            Save changes
          </button>
          <button className={`${styles.save} ${styles.cancel}`}>Cancel</button>
        </div>
      </div>
      <Footer />

      {isLoading && <LoadingScreen />}
      <ToastContainer closeOnClick autoClose={2000} />

      <CustomModal isOpen={isCropperModalOpen} onCloseModal={() => setIsCropperModalOpen(false)}>
        <ImageUploaderModal closeModal={() => setIsCropperModalOpen(false)} />
      </CustomModal>
    </div>
  );
};

export default Settings;

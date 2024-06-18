import React, { useCallback, useContext, useEffect, useState } from 'react';
// import DatePicker from 'react-datepicker';
// import 'react-datepicker/dist/react-datepicker.css';
// @ts-ignore
// import { FileUploader } from 'react-drag-drop-files';
import { geocodeByPlaceId } from 'react-places-autocomplete';
// import ReactPlayer from 'react-player';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';

import axios from 'axios';
import cn from 'classnames';
import { eachDayOfInterval, format, isValid, parseISO } from 'date-fns';
import { da } from 'date-fns/locale';
import {
  collection,
  deleteDoc,
  doc,
  documentId,
  getDocs,
  limit,
  query, // setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getDownloadURL } from 'firebase/storage';
import moment from 'moment';
import { DateRangePicker } from 'rsuite';
import { v4 as uuidv4 } from 'uuid';
import Plus from '~/assets/icons/plus.svg';
import CustomDropdownEditor from '~/components/CustomDropdownEditor';
import CustomPlacesDropdown from '~/components/CustomPlacesDropdown';
import DailyUploadImagesEditor from '~/components/DailyUploadImagesEditor';
// import DateButtons from '~/components/DateButtons';
import { LoadingScreen } from '~/components/LoadingScreen';
import PlaceAutocomplete from '~/components/PlaceAutocomplete/PlaceAutocomplete';
import Rating from '~/components/Rating';
import UploadImagesEditor from '~/components/UploadImagesEditor';
import { db, storage } from '~/firebase';
import { AuthContext } from '~/providers/authContext';
import { DateInfo } from '~/types/dateJournal';
import {
  // commentsCollection,
  notificationsCollection,
  placesCollection,
  tripsCollection,
} from '~/types/firestoreCollections';
import { NotificationType } from '~/types/notifications/notifications';
import { UpdatedDateJournal } from '~/types/updatedDateJournal';
import { getDateToDisplay } from '~/utils/getDateToDisplay';
import getNeutralColor from '~/utils/getNeutralColor';

import defaultUserIcon from '@assets/icons/defaultUserIcon.svg';
import { addDoc } from '@firebase/firestore';
import { ref, uploadBytes } from '@firebase/storage';

import budget_icon from '../../../assets/icons/budget-icon.svg';
import facebook_logo from '../../../assets/icons/facebook_logo.svg';
import geo_filled from '../../../assets/icons/geo_filled.svg';
import hashtag_icon from '../../../assets/icons/hashtag-icon.svg';
import hashtag_icon_filled from '../../../assets/icons/hashtag_icon_filled.svg';
import Logo from '../../../assets/icons/headerLogo.svg';
import instagram_logo from '../../../assets/icons/instagram_logo.svg';
import plane_title from '../../../assets/icons/plane-title.svg';
import x_logo from '../../../assets/icons/x_logo.svg';
import styles from './CreateTrip.module.css';

import 'rsuite/dist/rsuite.min.css';

interface Props {
  isEdit?: boolean;
  data?: {
    id: string;
    rate: number;
    startDate: string;
    endDate: string;
    cities: { placeID: string; address: string }[];
    tripName: string;
    locationName: string;
    text: string;
    dayDescription: { date: string; description: string }[];
    location: { name: string; longitude: number; latitude: number; color: string };
    geoTags: { address: string; placeID: string }[];
    imageUrl: { url: string; type: string; description: string }[];
  };
}

const apiKey = import.meta.env.VITE_PUBLIC_KEY;

const CreateTrip: React.FC<Props> = ({ isEdit, data }) => {
  const { firestoreUser, updateFirestoreUser } = useContext(AuthContext);
  const [budget, setBudget] = useState('');
  // const [advice, setAdvice] = useState('');
  const [selectedPeople, setSelectedPeople] = useState('');
  const [peopleIsOpen, setPeopleIsOpen] = useState(false);
  const [file, setFile] = useState<File[]>([]);
  const [rating, setRating] = useState(data?.rate || -1);
  // const [city, setCity] = useState('');
  const [hashtag, setHashtag] = useState('');
  const [hashtagsResult, setHashtagsResult] = useState<string[]>([]);
  const start = data?.startDate.toString().split('/');
  const end = data?.endDate.toString().split('/');
  const [startDate, setStartDate] = useState(
    start ? [start[2], start[1], start[0]].join('-') : moment().format('yyyy-MM-DD')
  );
  const [endDate, setEndDate] = useState(
    end ? [end[2], end[1], end[0]].join('-') : moment().format('yyyy-MM-DD')
  );

  const [isLoading, setIsLoading] = useState(false);
  const [text, setText] = useState(data?.text || '');
  // const [selectedLocation, setSelectedLocation] = useState<string | null>(
  //   data?.locationName || null
  // );
  const [isMaxError, setIsMaxError] = useState(false);
  const [geoTags, setGeoTags] = useState('');
  const [selectedGeoTags, setSelectedGeoTags] = useState<{ address: string; placeID: string }[]>(
    data?.geoTags || []
  );
  const [selectedCities, setSelectedCities] = useState<{ address: string; placeID: string }[]>(
    data?.cities || []
  );
  // const [isAddingPlace, setIsAddingPlace] = useState(true);
  const [tripName, setTripName] = useState(data?.tripName || '');
  // const [daysDescription, setDaysDescription] = useState(
  //   data?.dayDescription.map((descr) => ({
  //     ...descr,
  //     date: descr.date.split('/').reverse().join('-'),
  //   })) || [{ date: new Date(), description: '' }]
  // );
  const [avatar, setAvatar] = useState<string>(defaultUserIcon);
  // const [isAddCityOpen, setIsAddCityOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('finished');
  const [downloadedImages, setDownloadedImages] = useState<
    { url: string; type: string; description: string }[]
  >(data?.imageUrl || []);
  const [imagesDescription, setImagesDescription] = useState<
    { name: string; value: string; id?: number }[]
  >(
    downloadedImages?.map((image, id) => ({ name: image.url, value: image.description, id: id })) ||
    []
  );

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dailyInfo, setDailyInfo] = useState<DateInfo[]>([]);

  const [isPlaceOpen, setIsPlaceOpen] = useState(false);
  const [placesDrop, setPlacesDrop] = useState<{ address: string; placeID: string }[]>([]);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchAvatar = async () => {
      if (firestoreUser && firestoreUser.avatarUrl) {
        try {
          const url = await getDownloadURL(ref(storage, firestoreUser.avatarUrl));
          setAvatar(url);
        } catch (error) {
          console.error('Error fetching avatar URL:', error);
        }
      }
    };

    fetchAvatar();
  }, [firestoreUser, storage]);

  useEffect(() => {
    if (isMaxError) {
      notify('The maximum number of media is 5');

      setIsMaxError(false);
    }
  }, [isMaxError]);

  const notify = (textValue: string) => toast.error(textValue);

  const handleChange = (fileList: FileList) => {
    setFile((prevState) => {
      if (
        (prevState && Object.values(fileList).length + prevState?.length > 5) ||
        Object.values(fileList).length > 5
      ) {
        setIsMaxError(true);
        return prevState;
      }
      if (prevState) {
        return [...prevState, ...Object.values(fileList)];
      } else {
        return Object.values(fileList);
      }
    });
  };

  useEffect(() => {
    const start = parseISO(startDate);
    const end = parseISO(endDate);

    const daysArray = eachDayOfInterval({ start, end });
    setSelectedDate(start);

    const initialInfo = daysArray.map((date) => ({
      date: format(date, 'yyyy-MM-dd'),
      description: '',
      place: [],
      photos: [],
    }));
    setDailyInfo(initialInfo);
  }, [startDate, endDate]);

  useEffect(() => {
    setPlacesDrop(selectedGeoTags);
  }, [selectedGeoTags]);

  const handleDateClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, date: Date) => {
    event.preventDefault();
    setSelectedDate(date);
  };
  // const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  //   const { name, value } = e.target;
  //   if (isValid(selectedDate)) {
  //     setDailyInfo((prevInfo) =>
  //       prevInfo.map((item) =>
  //         item.date === format(selectedDate, 'yyyy-MM-dd') ? { ...item, [name]: value } : item
  //       )
  //     );
  //   } else {
  //     console.error('Invalid selected date:', selectedDate);
  //   }
  // };

  const handleOnSave = async () => {
    try {
      if (file || downloadedImages) {
        // const geocode = await geocodeByPlaceId(selectedLocation);

        setIsLoading(true);

        const uploadedImages: { url: string; type: string }[] = [];

        for (let i = 0; i < file.length; i++) {
          const storageRef = ref(storage, `trips/${firestoreUser?.id}/${location + uuidv4()}`);
          const uploadResult = await uploadBytes(storageRef, file[i]);

          uploadedImages.push({
            url: uploadResult.ref.fullPath,
            type: file[i].type,
          });
        }

        const updatedDaysInfo: UpdatedDateJournal[] = [];

        for (let i = 0; i < dailyInfo.length; i++) {
          const uploadedPhotos: { url: string; type: string }[] = [];

          for (let j = 0; j < dailyInfo[i].photos.length; j++) {
            const storageRef = ref(storage, `trips/${firestoreUser?.id}/${location + uuidv4()}`);
            const uploadResult = await uploadBytes(storageRef, dailyInfo[i].photos[j]);

            uploadedPhotos.push({
              url: uploadResult.ref.fullPath,
              type: dailyInfo[i].photos[j].type,
            });
          }

          updatedDaysInfo.push({
            place: dailyInfo[i].place,
            date: dailyInfo[i].date,
            description: dailyInfo[i].description,
            photos: uploadedPhotos,
          });
        }
        if (isEdit && data) {
          const docRef = doc(db, 'trips', data.id);
          await updateDoc(docRef, {
            userId: firestoreUser?.id,
            imageUrl: [...uploadedImages, ...downloadedImages],
            rate: rating,
            hashtags: hashtagsResult,
            budget: parseInt(budget),
            people: selectedPeople,
            startDate: getDateToDisplay(startDate),
            endDate: getDateToDisplay(endDate),
            geoTags: selectedGeoTags,
            tripName: tripName,
            dayDescription: updatedDaysInfo,
            text: text.replace(/(?:\r\n|\r|\n)/g, '<br />'),
          });
          // const subcollectionCities = collection(db, `trips/${docRef.id}/cities`);
          const subcollectionPlaces = collection(db, `trips/${docRef.id}/places`);
          // const queryCities = query(subcollectionCities);
          const queryPlaces = query(subcollectionPlaces);
          // const querySnapshotCities = await getDocs(queryCities);
          const querySnapshotPlaces = await getDocs(queryPlaces);
          // querySnapshotCities.docs.forEach(async (doc) => {
          //   await deleteDoc(doc.ref);
          // });
          // selectedCities.forEach(async (city) => {
          //   await addDoc(subcollectionCities, {
          //     address: city.address,
          //     placeID: city.placeID,
          //     lat: city.lat,
          //     lng: city.lng,
          //     types: city.types,
          //     name: city.name,
          //   });

          //   const q = query(placesCollection, where('placeId', '==', city.placeID));
          //   const querySnapshot = await getDocs(q);
          //   if (querySnapshot.docs.length === 0) {
          //     await addDoc(placesCollection, {
          //       address: city.address,
          //       placeId: city.placeID,
          //       lat: city.lat,
          //       lng: city.lng,
          //       types: city.types,
          //       name: city.name,
          //     });
          //   }
          // });

          querySnapshotPlaces.docs.forEach(async (doc) => {
            await deleteDoc(doc.ref);
          });
          selectedGeoTags.forEach(async (city) => {
            await addDoc(subcollectionPlaces, {
              address: city.address,
              placeID: city.placeID,
              lat: city.lat,
              lng: city.lng,
              types: city.types,
              name: city.name,
            });

            const q = query(placesCollection, where('placeId', '==', city.placeID));
            const querySnapshot = await getDocs(q);
            if (querySnapshot.docs.length === 0) {
              await addDoc(placesCollection, {
                address: city.address,
                placeId: city.placeID,
                lat: city.lat,
                lng: city.lng,
                types: city.types,
                name: city.name,
              });
            }
          });
        } else {
          await addDoc(tripsCollection, {
            userId: firestoreUser?.id,
            imageUrl: uploadedImages,
            rate: rating,
            hashtags: hashtagsResult,
            budget: parseInt(budget),
            people: selectedPeople,
            startDate: getDateToDisplay(startDate),
            endDate: getDateToDisplay(endDate),
            geoTags: selectedGeoTags,
            tripName: tripName,
            pinColor: getNeutralColor(),
            dayDescription: updatedDaysInfo,
            text,
          }).then(async (docRef) => {
            const subcollectionCities = collection(db, `trips/${docRef.id}/cities`);
            const subcollectionPlaces = collection(db, `trips/${docRef.id}/places`);

            selectedCities.forEach(async (city) => {
              await addDoc(subcollectionCities, {
                address: city.address,
                placeID: city.placeID,
                lat: city.lat,
                lng: city.lng,
                types: city.types,
                name: city.name,
              });

              const q = query(placesCollection, where('placeId', '==', city.placeID));
              const querySnapshot = await getDocs(q);
              if (querySnapshot.docs.length === 0) {
                await addDoc(placesCollection, {
                  address: city.address,
                  placeId: city.placeID,
                  lat: city.lat,
                  lng: city.lng,
                  types: city.types,
                  name: city.name,
                });
              }
            });
            selectedGeoTags.forEach(async (city) => {
              await addDoc(subcollectionPlaces, {
                address: city.address,
                placeID: city.placeID,
                lat: city.lat,
                lng: city.lng,
                types: city.types,
                name: city.name,
              });

              const q = query(placesCollection, where('placeId', '==', city.placeID));
              const querySnapshot = await getDocs(q);
              if (querySnapshot.docs.length === 0) {
                await addDoc(placesCollection, {
                  address: city.address,
                  placeId: city.placeID,
                  lat: city.lat,
                  lng: city.lng,
                  types: city.types,
                  name: city.name,
                });
              }
            });
            if (firestoreUser?.friends) {
              const q = query(
                tripsCollection,
                where('userId', '==', firestoreUser?.id),
                where(documentId(), '==', docRef.id),
                limit(1)
              );
              const querySnapshot = await getDocs(q);
              firestoreUser?.friends.forEach(async (friendId) => {
                await addDoc(notificationsCollection, {
                  targetUserId: friendId,
                  postId: querySnapshot.docs[0].id,
                  type: NotificationType.NewTrip,
                  createdAt: new Date().toISOString(),
                  isReaded: false,
                });
              });
            }
          });
        }

        if (!isEdit) {
          updateFirestoreUser({
            tripCount: firestoreUser?.tripCount ? firestoreUser?.tripCount + 1 : 1,
          });
        }
      } else {
        notify('Upload at least one media and insert a location');
      }
    } catch (err) {
      console.log('[ERROR saving the trip] => ', err);
    } finally {
      setIsLoading(false);
    }
  };

  // const onSelectPlace = useCallback(async (address: string, placeID: string) => {
  //   const geocode = await geocodeByPlaceId(placeID);

  //   setLocation({name: address, longitude: geocode[0].geometry.location.lng(), latitude: geocode[0].geometry.location.lat(), color: randomColor()});
  //   setWhereToGo(address);
  //   setSelectedLocation(placeID);
  // }, []);

  //   const getPhoto = async (placeId: string) => {
  //     try {
  //       const photoPromise = await axios(
  //         `
  // https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=Chicago,%20IL&key=AIzaSyCwDkMaHWXRpO7hY6z62_Gu8eLxMMItjT8&inputtype=textquery&fields=name,photos`
  //       );
  //       console.log(photoPromise);
  //     } catch (error) {
  //       console.error('Error fetching photo:', error);
  //     }
  //   };

  const onSelectGeoTag = useCallback(
    (address: string, placeID: string) => {
      (async () => {
        if (!selectedGeoTags.map((tag) => tag.address).includes(address)) {
          const coordinates = await geocodeByPlaceId(placeID);
          // const photo = await getPhoto(placeID);
          // console.log(photo);
          setSelectedGeoTags((prevState) => [
            ...prevState,
            {
              address,
              placeID,
              lat: coordinates[0].geometry.location.lat(),
              lng: coordinates[0].geometry.location.lng(),
              types: coordinates[0].types,
              name: coordinates[0].formatted_address,
              // photo: photo,
            },
          ]);
          setGeoTags('');
          // setIsAddingPlace(false);
        } else {
          notify('You have already added this tag');
        }
      })();

      // setIsAddingPlace(false);
    },
    [selectedGeoTags]
  );

  const handleRemoveGeoTag = useCallback((placeId: string) => {
    setSelectedGeoTags((prevState) => prevState.filter((item) => item.placeID !== placeId));
  }, []);

  const handleRemovePhoto = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    photoName: string
  ) => {
    event.preventDefault();

    setFile((prevState) => prevState.filter((media) => media.name !== photoName));
    setImagesDescription((prevState) => prevState.filter((image) => image.name !== photoName));
  };

  // const handleChangeImageDescription = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   event.preventDefault();

  //   const { name, value } = event.target;

  //   if (imagesDescription.find((image) => image.name === name)) {
  //     setImagesDescription((prevState) =>
  //       prevState.map((obj) => (obj.name === name ? { ...obj, value: value } : obj))
  //     );
  //   } else {
  //     setImagesDescription((prevState) => [...prevState, { name: name, value: value }]);
  //   }
  // };

  // const handleChangeDownloadedImageDescription = (
  //   event: React.ChangeEvent<HTMLInputElement>,
  //   id: number
  // ) => {
  //   event.preventDefault();

  //   const { name, value } = event.target;

  //   if (imagesDescription.find((image) => image.id === id)) {
  //     setImagesDescription((prevState) =>
  //       prevState.map((obj) => (obj.id === id ? { ...obj, value: value } : obj))
  //     );
  //   } else {
  //     setImagesDescription((prevState) => [
  //       ...prevState,
  //       { name: name, value: value, id: imagesDescription.length + 1 },
  //     ]);
  //   }
  // };

  // const handleOpenAddGeocode = (
  //   e: React.MouseEvent<HTMLButtonElement> | React.TouchEvent<HTMLButtonElement>
  // ) => {
  //   if (e) {
  //     e.preventDefault();
  //     setIsAddingPlace((prevState) => !prevState);
  //   }
  // };

  // const handleAddDayDescription = (event: React.MouseEvent<HTMLButtonElement>) => {
  //   event.preventDefault();

  //   setDaysDescription((prevState) => [...prevState, { date: new Date(), description: '' }]);
  // };

  // const handleRemoveDayDescription = (indexToRemove: number) => {
  //   setDaysDescription((prevDescriptions) =>
  //     prevDescriptions.filter((day, idx) => idx !== indexToRemove)
  //   );
  // };

  const handleDayDescriptionChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>,
    date: string
  ) => {
    const newDescription = event.target.value;
    setDailyInfo((prev) => {
      return prev.map((day) => (day.date === date ? { ...day, description: newDescription } : day));
    });
  };

  // const handleDayDateDescriptionChange = (
  //   event: ChangeEvent<HTMLTextAreaElement> | ChangeEvent<HTMLInputElement>,
  //   indexToChange: number,
  //   type: string
  // ) => {
  //   setDaysDescription((prevState) =>
  //     prevState.map((prevDay, index) => {
  //       if (index === indexToChange) {
  //         return { ...prevDay, [type]: event.target.value };
  //       } else {
  //         return prevDay;
  //       }
  //     })
  //   );
  // };

  // const handleRemoveCity = useCallback((placeId: string) => {
  //   setSelectedCities((prevState) => prevState.filter((item) => item.placeID !== placeId));
  // }, []);

  // const handleOpenAddCity = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
  //   event.preventDefault();
  //   setIsAddCityOpen((prevState) => !prevState);
  // };

  // const onSelectCity = useCallback(
  //   (address: string, placeID: string) => {
  //     (async () => {
  //       if (!selectedCities.map((city) => city.address.toString()).includes(address)) {
  //         const coordinates = await geocodeByPlaceId(placeID);
  //         setSelectedCities((prevState) => [
  //           ...prevState,
  //           {
  //             address: address.split(',')[0],
  //             placeID,
  //             lat: coordinates[0].geometry.location.lat(),
  //             lng: coordinates[0].geometry.location.lng(),
  //             types: coordinates[0].types,
  //             name: coordinates[0].formatted_address,
  //           },
  //         ]);
  //         setCity('');
  //       } else {
  //         notify('You have already added this city');
  //       }

  //       setIsAddCityOpen(false);
  //     })();
  //   },
  //   [selectedCities]
  // );

  useEffect(() => {
    if (startDate > endDate) {
      setEndDate(startDate);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    (async () => {
      if (isEdit && data) {
        const querySnapshot = await query(tripsCollection, where(documentId(), '==', data.id));
        const docRef = await getDocs(querySnapshot);
        const docData = docRef.docs[0].data();
        for (let i = 0; i < docData.imageUrl.length; i++) {
          const url = await getDownloadURL(ref(storage, docData.imageUrl[i].url));
          docData.imageUrl[i].url = url;
        }
        setDownloadedImages(docData.imageUrl);
      }
    })();
  }, [data, isEdit]);

  // const handleRemoveDownloadedPhoto = (id: number) => {
  //   setImagesDescription((prevState) => prevState.filter((image, idx) => idx !== id));
  //   setDownloadedImages((prevState) => prevState.filter((image, idx) => idx !== id));
  // };

  const navigateBack = () => {
    window.scrollTo(0, 0);
    navigate('/profile');
  };

  const handleBudgetChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setBudget(event.target.value);
  };

  const handleHashtagChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target.value.replace(/#/g, '');
    setHashtag(input);
  };

  const addHashtag = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (hashtagsResult.includes(hashtag)) {
      toast('You have already added this hashtag');
      return;
    }
    if (event.key === 'Enter' && hashtag.trim().length > 0) {
      event.preventDefault();
      setHashtagsResult((prevState) => [...prevState, hashtag]);
      setHashtag('');
    }
  };

  const removeHashtag = (e: React.MouseEvent<HTMLDivElement, MouseEvent>, tag: string) => {
    setHashtagsResult((prevState) => prevState.filter((item) => item !== tag));
  };

  const formatedDate = (date: Date) => {
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    const formattedDate = `${year}-${month}-${day}`;

    return formattedDate;
  };

  const handleChangePhotoDaily = (fileList: FileList) => {
    setDailyInfo((prevState) => {
      if (prevState.length === 5) {
        setIsMaxError(true);
        return prevState;
      }
      if (prevState) {
        return prevState.map((day) =>
          day.date === formatedDate(selectedDate)
            ? { ...day, photos: [...day.photos, ...Object.values(fileList)] }
            : day
        );
      } else {
        return [];
      }
    });
  };

  const handleDeleteDailyPhoto = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    photoName: string
  ) => {
    event.preventDefault();

    setDailyInfo((prevState) =>
      prevState.map((day) =>
        day.date === formatedDate(selectedDate)
          ? { ...day, photos: day.photos.filter((photo) => photo.name !== photoName) }
          : day
      )
    );
  };

  const handleDateChange = (dates: [Date | null, Date | null]) => {
    const [start, end] = dates;
    const startDateString = start ? start.toISOString() : '';
    const endDateString = end ? end.toISOString() : '';

    setStartDate(startDateString);
    setEndDate(endDateString);
  };

  return (
    <>
      <div className={styles.editorContainer}>
        <header className={styles.header}>
          <div className={styles.headerContainer}>
            <img
              className={styles.logoHeader}
              src={Logo}
              onClick={() =>
                navigate('/profile', {
                  state: {
                    activeTab: 0,
                  },
                })
              }
            />
            <img className={styles.defaultUserIcon} src={avatar} alt='default user icon' />
          </div>
        </header>
        <div className={styles.outer_container}>
          <h1 className={styles.editorTitle}>Trip editor</h1>
          <form>
            <div className={styles.topContainer}>
              {/* <p>Where’d you go?</p> */}
              {/* <p className={styles.text}>Trip name:</p> */}
              <div className={styles.titleContainer}>
                <div className={styles.titleWithIcon}>
                  <input
                    value={tripName}
                    placeholder={'Trip name'}
                    className={styles.inputTitle}
                    onChange={(e) => setTripName(e.target.value)}
                  />
                  <img src={plane_title} alt='titleIcon' className={styles.titleIcon} />
                </div>
                <div className={styles.dateContainer}>
                  {/* <div className={styles.oneDateContainer}> */}
                  {/* <p className={`${styles.text} ${styles.dateDescription}`}>Start Date:</p> */}
                  <DateRangePicker
                    selected={new Date(startDate)}
                    onChange={handleDateChange}
                    startDate={new Date(startDate)}
                    endDate={new Date(endDate)}
                    selectsRange={true}
                    size='sm'
                    appearance='subtle'
                    placeholder='Trip Length'
                    showOneCalendar
                  />
                  {/* <input
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      type='date'
                      className={styles.dateInput}
                    />
                  </div> */}
                  {/* <div className={styles.oneDateContainer}> */}
                  {/* <p className={`${styles.text} ${styles.dateDescription}`}>End Date:</p> */}
                  {/* <DatePicker
                selected={endDate}
                onChange={(date) => setEndDate(date)}
                locale='en-US'
                className='datePicker'
              /> */}
                  {/* <input
                      id='end_date'
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      type='date'
                      className={styles.dateInput}
                      min={startDate}
                      lang='fr-CA'
                    />
                  </div> */}
                </div>
                <div className={styles.tabContainer}>
                  <div
                    className={cn(styles.tab, { [styles.active]: activeTab === 'finished' })}
                    onClick={() => setActiveTab('finished')}
                  >
                    Finished journey
                  </div>
                  <div
                    className={cn(styles.tab, { [styles.active]: activeTab === 'ongoing' })}
                    onClick={() => setActiveTab('ongoing')}
                  >
                    Ongoing
                  </div>
                </div>
              </div>

              <div className={styles.generalInfoContainer}>
                {/* <div className={styles.datesContainer}> */}
                {/* <div className={styles.dateDescriptionsContainer}>
          </div> */}

                <div className={styles.hashtagAdd}>
                  <input
                    type='text'
                    value={hashtag}
                    onChange={handleHashtagChange}
                    placeholder='Write tags here'
                    className={styles.hashtagInput}
                    onKeyDown={(e) => addHashtag(e)}
                  />
                  <img src={hashtag_icon} alt='hashtagIcon' className={styles.hashtagIcon} />
                </div>
                {/* </div> */}
                <CustomDropdownEditor
                  setIsOpen={setPeopleIsOpen}
                  isOpen={peopleIsOpen}
                  setSelectedOption={setSelectedPeople}
                  selectedOption={selectedPeople}
                />
                <div className={styles.budgetContainer}>
                  <input
                    type='text'
                    placeholder='Estimate journey'
                    value={budget}
                    onChange={handleBudgetChange}
                    className={styles.budgetInput}
                  />
                  <img src={budget_icon} alt='budgetIcon' className={styles.budgetIcon} />
                </div>
                <div className={styles.startWrapper}>
                  <div className={styles.startContainer}>
                    <p className={styles.text}>Rate your trip</p>
                    <Rating setSelectedStars={setRating} selectedStars={rating} />
                  </div>
                </div>
              </div>

              {/* <div className={styles.section}>
            <p className={styles.text}>Add Locations you visited</p>
            <button
              className={`${styles.section_button} ${styles.button}`}
              onClick={(e) => handleOpenAddCity(e)}
            >
              Add Location
            </button>
          </div>

          {isAddCityOpen && (
            <div className={`${styles.autocomplete} ${styles.cityAutocomplete}`}>
              <PlaceAutocomplete
                searchOptions={{ types: ['locality'] }}
                location={city}
                setLocation={setCity}
                onSelectPlace={onSelectCity}
                placeholder='ex.Venice, Italy'
              />
            </div>
          )}

          {!!selectedCities.length && (
            <div className={styles.selectedTagsContainer}>
              <>
                {selectedCities.map((selectedCity) => (
                  <div className={styles.geoTagContainer} key={selectedCity.placeID}>
                    <p className={styles.text}>{selectedCity.address.split(',')[0]}</p>
                    <img
                      src={Plus}
                      className={styles.crossIcon}
                      onClick={() => handleRemoveCity(selectedCity.placeID)}
                    />
                  </div>
                ))}
              </>
            </div>
          )} */}

              <UploadImagesEditor
                handleChange={handleChange}
                file={file}
                handleRemove={handleRemovePhoto}
              />
              {/* {file.length === 0 ? (
              <FileUploader
                multiple={true}
                handleChange={handleChange}
                name='file'
                types={fileTypes}
                hoverTitle={' '}
              >
                <div className={styles.uploadContainer}>
                  <p className={styles.text}>Drag and drop image/video or click on </p>
                  <div className={styles.buttonUpload}>
                    <img
                      src={downloadButton}
                      alt='downloadButton'
                      className={styles.buttonUpload}
                    />
                  </div>
                </div>
              </FileUploader>
            ) : (
              file.map((item) => {
                return (
                  <div key={item.name} className={styles.uploadedImagesContainer}>
                    {item.type.includes('image') ? (
                      <div className={styles.imageContainer}>
                        <img
                          src={URL.createObjectURL(item)}
                          alt={'trip image'}
                          className={styles.image}
                        />
                        <button
                          onClick={(e) => handleRemovePhoto(e, item.name)}
                          className={styles.removePhotoButton}
                        >
                          X
                        </button>
                      </div>
                    ) : (
                      <div className={styles.imageContainer}>
                        <ReactPlayer
                          playing
                          stopOnUnmount={false}
                          loop
                          url={URL.createObjectURL(item)}
                          width='100%'
                          height='100%'
                        />
                        <button
                          onClick={(e) => handleRemovePhoto(e, item.name)}
                          className={styles.removePhotoButton}
                        >
                          X
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )} */}
              {/* <div className={styles.imagesDescriptions}> */}
              {/* {Slider} */}

              {/* <div>
              {downloadedImages?.map((item, id) => {
                return (
                  <div key={item.url} className={styles.uploadedImagesContainer}>
                    {item.type.includes('image') ? (
                      <div className={styles.imageContainer}>
                        <img src={item.url} alt={'trip image'} className={styles.image} />
                        <input
                        placeholder='Describe the photo'
                        value={imagesDescription.find((image) => image.id === id)?.value || ''}
                        className={styles.input}
                        onChange={(e) => handleChangeDownloadedImageDescription(e, id)}
                        name={item.url}
                      />
                        <button
                          onClick={(e) => handleRemoveDownloadedPhoto(id)}
                          className={styles.removePhotoButton}
                        >
                          X
                        </button>
                      </div>
                    ) : (
                      <div className={styles.imageContainer}>
                        <ReactPlayer
                          playing
                          stopOnUnmount={false}
                          loop
                          url={item.url}
                          width='100%'
                          height='100%'
                        />
                        <input
                        placeholder='Describe the photo'
                        value={imagesDescription.find((image) => image.id === id)?.value || ''}
                        className={styles.input}
                        onChange={(e) => handleRemoveDownloadedPhoto(id)}
                        name={item.url}
                      />
                        <button onClick={(e) => handleRemovePhoto(e, item.name)} className={styles.removePhotoButton}>X</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div> */}
              {/* </div> */}
              <div className={styles.hashtags}>
                {hashtagsResult.map((item) => (
                  <div key={item} className={styles.hashtagsContainer}>
                    <img
                      src={hashtag_icon_filled}
                      alt='hashtagIcon'
                      className={styles.hashtagIconRender}
                    />
                    <p key={item} className={styles.hashtag}>
                      {item}
                    </p>
                    <div className={styles.hashtagButton} onClick={(e) => removeHashtag(e, item)}>
                      X
                    </div>
                  </div>
                ))}
              </div>
              <div className={styles.descriptionContainer}>
                {/* <TextEditor
            value={text}
            onChange={setText}
            className={`${styles.input} ${styles.textArea}`}
          /> */}
                {/* <ReactQuill value={text} onChange={setText} className={styles.textEditor} /> */}
                <textarea
                  id='tripStory'
                  className={`${styles.input} ${styles.textArea}`}
                  style={{ position: 'relative' }}
                  placeholder='Write your trip description here . . .'
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
              </div>
              <div className={styles.placeContainer}>
                <h2 className={styles.placesTitle}>Add Your Places</h2>
                {/* <button
                className={`${styles.section_button} ${styles.button}`}
                onClick={handleOpenAddGeocode}
              >
                Add Spots
              </button> */}
                <div className={styles.autocomplete}>
                  <div className={`${styles.autocomplete} ${styles.cityAutocomplete}`}>
                    <PlaceAutocomplete
                      searchOptions={{ types: ['establishment'] }}
                      location={geoTags}
                      setLocation={setGeoTags}
                      onSelectPlace={onSelectGeoTag}
                      placeholder='Ex. Beaches,Cities,Restaurants'
                    />
                  </div>
                  {/* <PlacesAutocomplete
                searchOptions={{ types: ['establishment'] }}
                value={geoTags}
                onChange={(value) => setGeoTags(value)}
                onSelect={onSelectGeoTag}
              >
                {({ getInputProps, suggestions, getSuggestionItemProps, loading }) => {
                  return (
                    <div className={suggestions.length ? styles.inputContainer : undefined}>
                      <input
                        id={'213'}
                        {...getInputProps({
                          placeholder:
                            'Museum of Dreamers, Viale Angelico, Rome, Metropolitan City of Rome Capital, Italy',
                          className: styles.input,
                        })}
                      />
                      <div className={suggestions.length ? styles.dropdown : undefined}>
                        {loading && <div>Loading...</div>}
                        {suggestions.map((suggestion) => {
                          const style = suggestion.active
                            ? { backgroundColor: '#fafafa', cursor: 'pointer' }
                            : { backgroundColor: '#ffffff', cursor: 'pointer' };
                          return (
                            <div
                              {...getSuggestionItemProps(suggestion, {
                                className: styles.dropdownItem,
                                style,
                              })}
                              key={suggestion.id}
                            >
                              <p>{suggestion.description}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }}
              </PlacesAutocomplete> */}
                </div>
              </div>

              {selectedGeoTags.length ? (
                <div className={styles.selectedTagsContainer}>
                  <>
                    {selectedGeoTags.map((geoTag) => (
                      <div className={styles.geoTagContainer} key={geoTag.placeID}>
                        <p>{geoTag.address.split(',')[0]}</p>
                        <img
                          src={Plus}
                          className={styles.crossIcon}
                          onClick={() => handleRemoveGeoTag(geoTag.placeID)}
                        />
                      </div>
                    ))}
                  </>
                </div>
              ) : null}
            </div>

            <div className={styles.storyContainer}>
              <div className={styles.dailyJournalContainer}>
                <h2>Daily Journal</h2>
                <CustomPlacesDropdown
                  setIsOpen={setIsPlaceOpen}
                  isOpen={isPlaceOpen}
                  setPlacesDrop={setPlacesDrop}
                  placesDrop={placesDrop}
                  setDailyInfo={setDailyInfo}
                  selectedDate={formatedDate(selectedDate)}
                />
              </div>
              {/* <button
              className={`${styles.section_button} ${styles.button} ${styles.buttonAddDayDescription}`}
              onClick={handleAddDayDescription}
            >
              Daily Journal
            </button> */}
              <div className={styles.dailyJournal}>
                <div className={styles.dateButtonsContainer}>
                  {dailyInfo.map((day) => {
                    const { date } = day;
                    const isDateFilled =
                      day.photos.length > 0 || day.place.length > 0 || day.description;
                    const parsedDate = new Date(date);

                    return (
                      <button
                        key={parsedDate.toDateString()}
                        onClick={(e) => handleDateClick(e, parsedDate)}
                        className={cn(styles.buttonCustom, {
                          [styles.selected]: formatedDate(selectedDate) === date,
                          [styles.dateFilled]: isDateFilled,
                        })}
                      >
                        {isValid(parsedDate) ? format(parsedDate, 'dd/MM') : 'Invalid Date'}
                      </button>
                    );
                  })}
                </div>
                <DailyUploadImagesEditor
                  handleChange={handleChangePhotoDaily}
                  dailyInfo={
                    dailyInfo.find((day) => day.date === formatedDate(selectedDate))?.photos || []
                  }
                  handleRemove={handleDeleteDailyPhoto}
                />
                <div className={styles.placesDrop}>
                  {dailyInfo
                    .find((day) => day.date === formatedDate(selectedDate))
                    ?.place.map((place) => (
                      <div className={styles.geoTagContainer} key={place.placeID}>
                        <img src={geo_filled} alt='geo_filled' className={styles.geotag_filled} />
                        <p>{place.address.split(',')[0]}</p>
                        <img
                          src={Plus}
                          className={styles.crossIcon}
                          onClick={() =>
                            setDailyInfo((prevState) =>
                              prevState.map((day) =>
                                day.date === formatedDate(selectedDate)
                                  ? {
                                    ...day,
                                    place: day.place.filter(
                                      (item) => item.placeID !== place.placeID
                                    ),
                                  }
                                  : day
                              )
                            )
                          }
                        />
                      </div>
                    ))}
                </div>
                {selectedDate && (
                  <div className={styles.dayDescriptionContainer}>
                    <textarea
                      className={`${styles.input} ${styles.textArea}`}
                      placeholder={'Description'}
                      value={
                        dailyInfo.find((day) => day.date === formatedDate(selectedDate))
                          ?.description || ''
                      }
                      onChange={(e) => handleDayDescriptionChange(e, formatedDate(selectedDate))}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* <div className={styles.section}>
            <p className={styles.text}>Tell us about your trip!</p>
          </div> */}

            {/* {daysDescription &&
            Array.from(Array(daysDescription.length).keys()).map((day, idx) => (
              <div className={styles.dayDescriptionContainer} key={day}> */}
            {/* <DatePicker
                selected={daysDescription[idx].date}
                onChange={(
                  date: React.ChangeEvent<HTMLTextAreaElement> | React.ChangeEvent<HTMLInputElement>
                ) => handleDayDateDescriptionChange(date, idx, 'date')}
                locale='en-US'
                className='datePicker'
                popperPlacement='right'
              /> */}
            {/* <input
                  value={daysDescription[idx].date}
                  onChange={(e) => handleDayDateDescriptionChange(e, idx, 'date')}
                  type='date'
                  className={styles.input}
                  min={startDate}
                  max={endDate}
                /> */}
            {/* <div className={styles.dayDescriptionContainer}>
                  <textarea
                    className={`${styles.input} ${styles.textArea}`}
                    placeholder={'Description'}
                    value={daysDescription[idx].description}
                    onChange={(e) => handleDayDateDescriptionChange(e, idx, 'description')}
                  />
                </div> */}
            {/* <img
                  src={Plus}
                  className={`${styles.crossIcon} ${styles.removeDay}`}
                  onClick={() => {
                    handleRemoveDayDescription(idx);
                  }}
                /> */}
            {/* </div>
            ))} */}
          </form>
          <div className={styles.submit_container}>
            <button
              className={`${styles.form_button} ${styles.button}`}
              onClick={() => navigateBack()}
            >
              Cancel
            </button>
            <button
              className={`${styles.form_button} ${styles.button} ${styles.submit_button}`}
              onClick={async () => {
                await handleOnSave();
              }}
            >
              {isEdit ? 'Save' : 'Post'}
            </button>
          </div>

          <ToastContainer closeOnClick autoClose={3000} limit={1} pauseOnHover={false} />
          {isLoading && <LoadingScreen />}
        </div>

        <footer className={styles.footerContainer}>
          <div className={styles.footerLogo}>
            <img
              className={styles.mainLogoFooter}
              src={Logo}
              onClick={() =>
                navigate('/profile', {
                  state: {
                    activeTab: 0,
                  },
                })
              }
            />
            <p className={styles.footerTitle}>Privacy policy</p>
            <p className={styles.footerTitle}>Contacts</p>
            <div className={styles.socialLogo}>
              <img src={facebook_logo} alt='facebook_logo' />
              <img src={x_logo} alt='x_logo' />
              <img src={instagram_logo} alt='instagram_logo' />
            </div>
          </div>
          <div className={styles.rights}>
            <p>© 2024 TripAmi</p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default CreateTrip;

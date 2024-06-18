import React, { ChangeEvent, useCallback, useContext, useEffect, useState } from 'react';
import 'react-datepicker/dist/react-datepicker.css';
// @ts-ignore
import { FileUploader } from 'react-drag-drop-files';
import { geocodeByPlaceId } from 'react-places-autocomplete';
import ReactPlayer from 'react-player';
import { ToastContainer, toast } from 'react-toastify';

import {
  collection,
  deleteDoc,
  doc,
  documentId,
  getDocs,
  limit,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getDownloadURL } from 'firebase/storage';
import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import Plus from '~/assets/icons/plus.svg';
import { LoadingScreen } from '~/components/LoadingScreen';
import Rating from '~/components/Rating';
import { db, storage } from '~/firebase';
import { AuthContext } from '~/providers/authContext';
import {
  commentsCollection,
  notificationsCollection,
  placesCollection,
  tripsCollection,
} from '~/types/firestoreCollections';
import { NotificationType } from '~/types/notifications/notifications';
import { getDateToDisplay } from '~/utils/getDateToDisplay';
import getNeutralColor from '~/utils/getNeutralColor';

import { addDoc } from '@firebase/firestore';
import { ref, uploadBytes } from '@firebase/storage';

import PlaceAutocomplete from '../PlaceAutocomplete/PlaceAutocomplete';
import styles from './createTripModal.module.css';
import './styles.css';

const fileTypes = ['JPEG', 'PNG', 'JPG', 'MP4'];

interface Props {
  closeModal: () => void;
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

const CreatePostModal: React.FC<Props> = ({ closeModal, isEdit, data }) => {
  const { firestoreUser, updateFirestoreUser } = useContext(AuthContext);
  const [file, setFile] = useState<File[]>([]);
  const [rating, setRating] = useState(data?.rate || 0);
  const [city, setCity] = useState('');
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
  const [selectedLocation, setSelectedLocation] = useState<string | null>(
    data?.locationName || null
  );
  const [isMaxError, setIsMaxError] = useState(false);
  const [geoTags, setGeoTags] = useState('');
  const [selectedGeoTags, setSelectedGeoTags] = useState<{ address: string; placeID: string }[]>(
    data?.geoTags || []
  );
  const [selectedCities, setSelectedCities] = useState<{ address: string; placeID: string }[]>(
    data?.cities || []
  );
  const [isAddingPlace, setIsAddingPlace] = useState(true);
  const [tripName, setTripName] = useState(data?.tripName || '');
  const [daysDescription, setDaysDescription] = useState(
    data?.dayDescription.map((descr) => ({
      ...descr,
      date: descr.date.split('/').reverse().join('-'),
    })) || [{ date: new Date(), description: '' }]
  );
  const [isAddCityOpen, setIsAddCityOpen] = useState(true);
  const [downloadedImages, setDownloadedImages] = useState<
    { url: string; type: string; description: string }[]
  >(data?.imageUrl || []);
  const [imagesDescription, setImagesDescription] = useState<
    { name: string; value: string; id?: number }[]
  >(
    downloadedImages?.map((image, id) => ({ name: image.url, value: image.description, id: id })) ||
      []
  );

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

  const handleOnSave = useCallback(async () => {
    try {
      if (file || downloadedImages) {
        // const geocode = await geocodeByPlaceId(selectedLocation);

        setIsLoading(true);

        const uploadedImages: { url: string; type: string; description: string }[] = [];

        for (let i = 0; i < file.length; i++) {
          const storageRef = ref(storage, `trips/${firestoreUser?.id}/${location + uuidv4()}`);
          const uploadResult = await uploadBytes(storageRef, file[i]);

          uploadedImages.push({
            url: uploadResult.ref.fullPath,
            type: file[i].type,
            description:
              imagesDescription.find((image) => image.name === file[i].name)?.value || '',
          });
        }
        const filteredDescriptions = daysDescription
          .filter((day) => day.description.length > 0)
          .map((day) => ({
            date: getDateToDisplay(day.date),
            description: day.description,
          }));
        if (isEdit && data) {
          const docRef = doc(db, 'trips', data.id);
          await updateDoc(docRef, {
            userId: firestoreUser?.id,
            imageUrl: [...uploadedImages, ...downloadedImages],
            rate: rating,
            startDate: getDateToDisplay(startDate),
            endDate: getDateToDisplay(endDate),
            geoTags: selectedGeoTags,
            cities: selectedCities,
            tripName: tripName,
            dayDescription: filteredDescriptions,
            text: text.replace(/(?:\r\n|\r|\n)/g, '<br />'),
          });
          const subcollectionCities = collection(db, `trips/${docRef.id}/cities`);
          const subcollectionPlaces = collection(db, `trips/${docRef.id}/places`);
          const queryCities = query(subcollectionCities);
          const queryPlaces = query(subcollectionPlaces);
          const querySnapshotCities = await getDocs(queryCities);
          const querySnapshotPlaces = await getDocs(queryCities);
          querySnapshotCities.docs.forEach(async (doc) => {
            await deleteDoc(doc.ref);
          });
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
            startDate: getDateToDisplay(startDate),
            endDate: getDateToDisplay(endDate),
            geoTags: selectedGeoTags,
            cities: selectedCities,
            tripName: tripName,
            pinColor: getNeutralColor(),
            dayDescription: filteredDescriptions,
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

        closeModal();
      } else {
        notify('Upload at least one media and insert a location');
      }
    } catch (err) {
      console.log('[ERROR saving the trip] => ', err);
    } finally {
      setIsLoading(false);
    }
  }, [
    imagesDescription,
    file,
    firestoreUser?.id,
    firestoreUser?.tripCount,
    rating,
    startDate,
    selectedGeoTags,
    text,
    updateFirestoreUser,
    daysDescription,
    selectedCities,
    imagesDescription,
  ]);

  // const onSelectPlace = useCallback(async (address: string, placeID: string) => {
  //   const geocode = await geocodeByPlaceId(placeID);

  //   setLocation({name: address, longitude: geocode[0].geometry.location.lng(), latitude: geocode[0].geometry.location.lat(), color: randomColor()});
  //   setWhereToGo(address);
  //   setSelectedLocation(placeID);
  // }, []);

  const onSelectGeoTag = useCallback(
    (address: string, placeID: string) => {
      (async () => {
        if (!selectedGeoTags.map((tag) => tag.address).includes(address)) {
          const coordinates = await geocodeByPlaceId(placeID);
          setSelectedGeoTags((prevState) => [
            ...prevState,
            {
              address,
              placeID,
              lat: coordinates[0].geometry.location.lat(),
              lng: coordinates[0].geometry.location.lng(),
              types: coordinates[0].types,
              name: coordinates[0].formatted_address,
            },
          ]);
          setGeoTags('');
          setIsAddingPlace(false);
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

  const handleChangeImageDescription = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();

    const { name, value } = event.target;

    if (imagesDescription.find((image) => image.name === name)) {
      setImagesDescription((prevState) =>
        prevState.map((obj) => (obj.name === name ? { ...obj, value: value } : obj))
      );
    } else {
      setImagesDescription((prevState) => [...prevState, { name: name, value: value }]);
    }
  };

  const handleChangeDownloadedImageDescription = (
    event: React.ChangeEvent<HTMLInputElement>,
    id: number
  ) => {
    event.preventDefault();

    const { name, value } = event.target;

    if (imagesDescription.find((image) => image.id === id)) {
      setImagesDescription((prevState) =>
        prevState.map((obj) => (obj.id === id ? { ...obj, value: value } : obj))
      );
    } else {
      setImagesDescription((prevState) => [
        ...prevState,
        { name: name, value: value, id: imagesDescription.length + 1 },
      ]);
    }
  };

  const handleOpenAddGeocode = (
    e: React.MouseEvent<HTMLButtonElement> | React.TouchEvent<HTMLButtonElement>
  ) => {
    if (e) {
      e.preventDefault();
      setIsAddingPlace((prevState) => !prevState);
    }
  };

  const handleAddDayDescription = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    setDaysDescription((prevState) => [...prevState, { date: new Date(), description: '' }]);
  };

  const handleRemoveDayDescription = (indexToRemove: number) => {
    setDaysDescription((prevDescriptions) =>
      prevDescriptions.filter((day, idx) => idx !== indexToRemove)
    );
  };

  const handleDayDateDescriptionChange = (
    event: ChangeEvent<HTMLTextAreaElement> | ChangeEvent<HTMLInputElement>,
    indexToChange: number,
    type: string
  ) => {
    setDaysDescription((prevState) =>
      prevState.map((prevDay, index) => {
        if (index === indexToChange) {
          return { ...prevDay, [type]: event.target.value };
        } else {
          return prevDay;
        }
      })
    );
  };

  const handleRemoveCity = useCallback((placeId: string) => {
    setSelectedCities((prevState) => prevState.filter((item) => item.placeID !== placeId));
  }, []);

  const handleOpenAddCity = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event.preventDefault();
    setIsAddCityOpen((prevState) => !prevState);
  };

  const onSelectCity = useCallback(
    (address: string, placeID: string) => {
      (async () => {
        if (!selectedCities.map((city) => city.address.toString()).includes(address)) {
          const coordinates = await geocodeByPlaceId(placeID);
          setSelectedCities((prevState) => [
            ...prevState,
            {
              address: address.split(',')[0],
              placeID,
              lat: coordinates[0].geometry.location.lat(),
              lng: coordinates[0].geometry.location.lng(),
              types: coordinates[0].types,
              name: coordinates[0].formatted_address,
            },
          ]);
          setCity('');
        } else {
          notify('You have already added this city');
        }

        setIsAddCityOpen(false);
      })();
    },
    [selectedCities]
  );
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

  const handleRemoveDownloadedPhoto = (id: number) => {
    setImagesDescription((prevState) => prevState.filter((image, idx) => idx !== id));
    setDownloadedImages((prevState) => prevState.filter((image, idx) => idx !== id));
  };

  return (
    <div className={styles.outer_container}>
      <form>
        <div className={styles.topContainer}>
          {/* <p>Where’d you go?</p> */}
          <p className={styles.text}>Trip name:</p>
          <input
            value={tripName}
            placeholder={'Trip name'}
            className={styles.input}
            onChange={(e) => setTripName(e.target.value)}
          />

          <div className={styles.section}>
            {/* <p>Tag Your Favorite Places on this Trip: </p> */}
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
          )}
          <div className={styles.section}>
            <p className={styles.text}>Tag Your Favorite Spots (beaches, restaurants, bar)</p>
            <button
              className={`${styles.section_button} ${styles.button}`}
              onClick={handleOpenAddGeocode}
            >
              Add Spots
            </button>
          </div>
          {isAddingPlace && (
            <div className={styles.autocomplete}>
              <div className={`${styles.autocomplete} ${styles.cityAutocomplete}`}>
                <PlaceAutocomplete
                  searchOptions={{ types: ['establishment'] }}
                  location={geoTags}
                  setLocation={setGeoTags}
                  onSelectPlace={onSelectGeoTag}
                  placeholder='ex. Bondi Beach'
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
          )}

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

          <div className={styles.datesContainer}>
            {/* <div className={styles.dateDescriptionsContainer}>
          </div> */}

            <div className={styles.dateContainer}>
              <p className={`${styles.text} ${styles.dateDescription}`}>Start Date:</p>
              {/* <DatePicker
                selected={startDate}
                onChange={(date) => {
                  setStartDate(date);
                }}
                locale='en-US'
                className='datePicker'
              /> */}
              <input
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                type='date'
                className={styles.dateInput}
              />
            </div>
            <div className={styles.dateContainer}>
              <p className={`${styles.text} ${styles.dateDescription}`}>End Date:</p>
              {/* <DatePicker
                selected={endDate}
                onChange={(date) => setEndDate(date)}
                locale='en-US'
                className='datePicker'
              /> */}
              <input
                id='end_date'
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                type='date'
                className={styles.dateInput}
                min={startDate}
                lang='fr-CA'
              />
            </div>
          </div>
        </div>

        <div className={styles.storyContainer}>
          <label htmlFor='tripStory'>Tell us about your trip:</label>
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
            placeholder={'Description'}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button
            className={`${styles.section_button} ${styles.button} ${styles.buttonAddDayDescription}`}
            onClick={handleAddDayDescription}
          >
            Daily Journal
          </button>
        </div>

        <div className={styles.section}>
          {/* <p className={styles.text}>Tell us about your trip!</p> */}
        </div>

        {daysDescription &&
          Array.from(Array(daysDescription.length).keys()).map((day, idx) => (
            <div className={styles.dayDescriptionContainer} key={day}>
              {/* <DatePicker
                selected={daysDescription[idx].date}
                onChange={(
                  date: React.ChangeEvent<HTMLTextAreaElement> | React.ChangeEvent<HTMLInputElement>
                ) => handleDayDateDescriptionChange(date, idx, 'date')}
                locale='en-US'
                className='datePicker'
                popperPlacement='right'
              /> */}
              <input
                value={daysDescription[idx].date}
                onChange={(e) => handleDayDateDescriptionChange(e, idx, 'date')}
                type='date'
                className={styles.input}
                min={startDate}
                max={endDate}
              />
              <div className={styles.dayDescriptionContainer}>
                <textarea
                  className={`${styles.input} ${styles.textArea}`}
                  placeholder={'Description'}
                  value={daysDescription[idx].description}
                  onChange={(e) => handleDayDateDescriptionChange(e, idx, 'description')}
                />
              </div>
              <img
                src={Plus}
                className={`${styles.crossIcon} ${styles.removeDay}`}
                onClick={() => {
                  handleRemoveDayDescription(idx);
                }}
              />
            </div>
          ))}

        <div className={styles.startWrapper}>
          <div className={styles.startContainer}>
            <p className={styles.text}>Rating:</p>
            <Rating setSelectedStars={setRating} selectedStars={rating} />
          </div>
        </div>

        <div className={styles.startContainer}>
          <FileUploader
            multiple={true}
            handleChange={handleChange}
            name='file'
            types={fileTypes}
            hoverTitle={' '}
          >
            <div className={styles.uploadContainer}>
              {/* <p>Image and Video </p> */}
              <p className={styles.text}>Drag and drop image/video or click on </p>
              <button className={styles.buttonUpload}>Upload</button>
            </div>
          </FileUploader>
        </div>

        <div className={styles.imagesDescriptions}>
          {/* {Slider} */}

          {file?.map((item) => {
            return (
              <div key={item.name} className={styles.uploadedImagesContainer}>
                {item.type.includes('image') ? (
                  <div className={styles.imageContainer}>
                    <img
                      src={URL.createObjectURL(item)}
                      alt={'trip image'}
                      className={styles.image}
                    />
                    <input
                      placeholder='Describe the photo'
                      value={
                        imagesDescription.find((image) => image.name === item.name)?.value || ''
                      }
                      className={styles.input}
                      onChange={handleChangeImageDescription}
                      name={item.name}
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
                    <input
                      placeholder='Describe the photo'
                      value={
                        imagesDescription.find((image) => image.name === item.name)?.value || ''
                      }
                      className={styles.input}
                      onChange={handleChangeImageDescription}
                      name={item.name}
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
          })}

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
                    {/* <button onClick={(e) => handleRemovePhoto(e, item.name)} className={styles.removePhotoButton}>X</button> */}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </form>
      <div className={styles.submit_container}>
        <button
          className={`${styles.submit_button} ${styles.button}`}
          onClick={async () => {
            await handleOnSave();
          }}
        >
          {isEdit ? 'Save' : 'Post'}
        </button>
        <button
          className={`${styles.submit_button} ${styles.button} ${styles['button-gray']}`}
          onClick={closeModal}
        >
          Cancel
        </button>
      </div>

      <ToastContainer closeOnClick autoClose={3000} limit={1} pauseOnHover={false} />
      {isLoading && <LoadingScreen />}
    </div>
  );
};

export default CreatePostModal;

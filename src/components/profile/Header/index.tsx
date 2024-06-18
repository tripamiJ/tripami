import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';

import algoliasearch from 'algoliasearch';
import {
  deleteDoc,
  documentId,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { getDownloadURL } from 'firebase/storage';
import debounce from 'lodash.debounce';
import Lottie from 'lottie-react';
import { NotificationsIcon } from '~/assets/icons/NotificationsIcon';
import CreatePostModal from '~/components/CreatePostModal';
import CreateTripModal from '~/components/CreateTripModal';
import CustomModal from '~/components/CustomModal';
import { DropdownProvider } from '~/components/DropdownProvider/DropdownProvider';
import { Notifications } from '~/components/Notifications/Notifications';
import Rating from '~/components/Rating';
import { storage } from '~/firebase';
import { useInputFocus } from '~/hooks/useInputRef';
import { AuthContext } from '~/providers/authContext';
import {
  notificationsCollection,
  placesCollection,
  usersCollection,
} from '~/types/firestoreCollections';
import { Notification } from '~/types/notifications/notifications';

import Animation from '@assets/animations/loader.json';
import addUser from '@assets/icons/addUser.svg';
import arrow from '@assets/icons/arrowDown.svg';
import addFile from '@assets/icons/create.svg';
import DefaultAvatar from '@assets/icons/defaultUserIcon.svg';
import search from '@assets/icons/iconamoon_search-thin.svg';
import AddFile from '@assets/icons/menu/addFile.svg';
import AddFriends from '@assets/icons/menu/addFriends.svg';
import Logout from '@assets/icons/menu/logout.svg';
import Plus from '@assets/icons/menu/plus.svg';
import Settings from '@assets/icons/menu/settings.svg';
import Switch from '@assets/icons/menu/switch.svg';
import icon from '@assets/icons/ph_user-light.svg';
import plus from '@assets/icons/plus.svg';
import { ref } from '@firebase/storage';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

import Logo from '../../../assets/icons/headerLogo.svg';
import styles from './header.module.css';
import './styles.css';

const client = algoliasearch('W8J2M4GNE3', '18fbb3c4cc4108ead5479d90911f3507');
const indexReviews = client.initIndex('review');
const indexTrips = client.initIndex('trips');
const indexPlaces = client.initIndex('places');

enum CONTENT_TYPE {
  POST = 'post',
  TRAVEL = 'travel',
  USER = 'user',
}

type SearchResultReview = {
  rate: number;
  text: string;
  userId: string;
  id: string;
  avatar: string;
  authorName: string;
  placeName: string;
  placeId: string;
};

type SearchResultTrip = {
  geoTags: GeoTag[];
  rate: number;
  text: string;
  userId: string;
  type: CONTENT_TYPE.TRAVEL;
  id: string;
  avatar: string;
  // matchedCity: matchedCities[i],
  createdAt: string;
};

type GeoTag = {
  address: string;
  lat: number;
  lng: number;
  placeId: string;
  types: string[];
  name: string;
};

const Header = () => {
  const { signOutUser, firestoreUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [avatar, setAvatar] = useState<string>(icon);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchIsLoading, setSearchIsLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResultReview[]>([]);
  const [searchResultTrips, setSearchResultTrips] = useState<SearchResultTrip[]>([]);
  const [searchResultPlaces, setSearchResultPlaces] = useState<any[]>([]);
  const [tripModalIsOpen, setTripModalIsOpen] = useState(false);
  const { inputProps: searchProps, isFocused: isSearchFocused } = useInputFocus();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [searchMode, setSearchMode] = useState('reviews');

  const handleChange = useCallback((e: { target: { value: React.SetStateAction<string> } }) => {
    setSearchTerm(e.target.value);
  }, []);

  useEffect(() => {
    if (!firestoreUser) return;
    const q = query(
      notificationsCollection,
      where('targetUserId', '==', firestoreUser?.id),
      orderBy('isReaded'),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedDocs = querySnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
      setNotifications(fetchedDocs);
    });

    return () => {
      unsubscribe();
    };
  }, [firestoreUser?.id]);

  const handleDeleteMessages = async () => {
    if (!notifications.length) return;
    try {
      const q = query(
        notificationsCollection,
        where('targetUserId', '==', notifications[0].targetUserId)
      );

      const querySnapshot = await getDocs(q);
      querySnapshot.forEach(async (doc) => {
        await deleteDoc(doc.ref);
      });
      setNotifications([]);
    } catch (error) {
      console.error('Error removing document: ', error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const q = query(notificationsCollection, where(documentId(), '==', messageId));

      const querySnapshot = await getDocs(q);
      await deleteDoc(querySnapshot.docs[0].ref);
    } catch (error) {
      console.error('Error removing document: ', error);
    }
  };

  useEffect(() => {
    if (!isSearchFocused) {
      setSearchResult([]);
      client.clearCache();
    }
  }, [isSearchFocused]);

  const handleSearch = useCallback(async () => {
    try {
      setSearchIsLoading(true);
      if (searchTerm.length && searchMode === 'reviews') {
        searchMode === 'reviews';
        const result = await indexReviews.search(searchTerm, {
          hitsPerPage: 5,
        });
        const imageUrls = await Promise.all(
          result.hits.map(async (hit) => {
            if (hit.authorAvatar) {
              return await getDownloadURL(ref(storage, hit.authorAvatar));
            } else {
              return DefaultAvatar;
            }
          })
        );
        setSearchResult(
          result.hits.map((hit, i) => ({
            rate: hit.rate,
            text: hit.text,
            userId: hit.userId,
            id: hit.objectID,
            avatar: imageUrls[i],
            authorName: hit.authorName,
            placeName: hit.placeName,
            placeId: hit.placeId,
          }))
        );
      }
      if (searchTerm.length && searchMode === 'trips') {
        const resultedTrips = await indexTrips.search(searchTerm, {
          hitsPerPage: 5,
        });
        const imageUrlsTrips = await Promise.all(
          resultedTrips.hits.map(async (hit) => {
            const q = query(usersCollection, where('id', '==', hit.userId));
            const querySnapshot = await getDocs(q);
            const user = querySnapshot.docs[0].data();
            if (user.avatarUrl) {
              return await getDownloadURL(ref(storage, user.avatarUrl));
            } else {
              return DefaultAvatar;
            }
          })
        );
        setSearchResultTrips(
          resultedTrips.hits.map((hit, i) => ({
            geoTags: hit.geoTag,
            rate: hit.rate,
            text: hit.text,
            userId: hit.userId,
            type: CONTENT_TYPE.TRAVEL,
            id: hit.objectID,
            avatar: imageUrlsTrips[i],
            createdAt: hit.createdAt,
          }))
        );
      }

      if (searchResult.length === 0 && searchResultTrips.length === 0) {
        const places = await indexPlaces.search(searchTerm, {
          hitsPerPage: 5,
        });
        setSearchResultPlaces(places.hits);
      }
    } catch (e) {
      console.log('[ERROR searching] => ', e);
    } finally {
      setSearchIsLoading(false);
    }
  }, [searchTerm, searchMode]);

  useEffect(() => {
    handleSearch();
  }, [handleSearch, searchTerm]);

  const debouncedResults = useMemo(() => {
    return debounce(handleChange, 300);
  }, [handleChange]);

  useEffect(() => {
    return () => {
      debouncedResults.cancel();
    };
  }, [debouncedResults]);

  const closeModal = useCallback(() => {
    setModalIsOpen(false);
  }, []);

  useEffect(() => {
    (async () => {
      if (firestoreUser?.avatarUrl) {
        const url = await getDownloadURL(ref(storage, firestoreUser.avatarUrl));
        setAvatar(url);
      }
    })();
  }, [firestoreUser?.avatarUrl]);

  const closeTripModal = useCallback(() => {
    setTripModalIsOpen(false);
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-shadow
  const handleSelectAutocomplete = (searchResult: any, type: string) => {
    (async () => {
      switch (type) {
        case 'trip':
          navigate('/trip' + `/${searchResult.id}`);
          break;
        case 'place':
          navigate('/place' + `/${searchResult.placeId}`);
          break;
        case 'review':
          navigate('/place' + `/${searchResult.placeId}`);
          break;
        default:
          break;
      }
    })();
  };

  useEffect(() => {
    if (!notifications || notifications.length === 0) {
      setIsNotificationsOpen(false);
    }
  }, []);

  return (
    <>
      <div className={styles.header}>
        <img
          className={styles.title}
          src={Logo}
          onClick={() =>
            navigate('/profile', {
              state: {
                activeTab: 0,
              },
            })
          }
        />
        <div className={styles.inputWrapper}>
          <img className={styles.search} src={search} alt='search' />
          <div style={{ width: '100%' }} onFocus={searchProps.onFocus} onBlur={searchProps.onBlur}>
            <input
              className={styles.input}
              placeholder={`Search ${searchMode}`}
              onChange={debouncedResults}
            />
            <div
              className={`${styles.switchContainer} ${!isSearchFocused ? styles.hideOnMobileInFocus : ''}`}
            >
              <button
                className={`${styles.switchButton} ${styles.switchLeft} ${searchMode === 'reviews' ? styles.switchActive : ''}`}
                onClick={() => {
                  if (searchMode === 'reviews') return;
                  setSearchMode('reviews');
                  handleSearch();
                }}
              >
                Reviews
              </button>
              <button
                className={`${styles.switchButton} ${styles.switchRight} ${searchMode === 'trips' ? styles.switchActive : ''}`}
                onClick={() => {
                  if (searchMode === 'trips') return;
                  setSearchMode('trips');
                  handleSearch();
                }}
              >
                Trips
              </button>
            </div>
            {searchIsLoading ? (
              <div className={styles.searchResultsContainer}>
                <Lottie animationData={Animation} loop={true} className={styles.animation} />
              </div>
            ) : (
              searchTerm.length > 0 &&
              isSearchFocused &&
              (searchResult.length > 0 || searchResultTrips.length > 0 ? (
                <div className={styles.searchResultsContainer}>
                  {searchMode === 'reviews' &&
                    searchResult?.map((resultOption) => {
                      return (
                        <div
                          className={styles.autocompleteOption}
                          key={resultOption.id}
                          onClick={() => handleSelectAutocomplete(resultOption, 'review')}
                        >
                          <div className={styles.autocompleteLeftBox}>
                            <img src={resultOption.avatar} alt='avatar' className={styles.avatar} />
                            {/* <p>{resultOption.location.name.split(',')[0]}</p> */}
                            <div className={styles.autocomplete_description_container}>
                              <p className={styles.autocomplete_description}>
                                {/* {resultOption.matchedCity?.length > 20
                                  ? resultOption.matchedCity?.slice(0, 20) + '...'
                                  : resultOption.matchedCity} */}
                                {resultOption.authorName}: {resultOption?.placeName.split(',')[0]}
                              </p>

                              <p
                                className={`${styles.tripDescription} ${styles.autocomplete_description}`}
                              >
                                {resultOption.text.length > 50
                                  ? resultOption.text.slice(0, 40) + '...'
                                  : resultOption.text}
                              </p>
                            </div>
                          </div>
                          <Rating selectedStars={resultOption.rate} />
                        </div>
                      );
                    })}
                  {searchMode === 'trips' &&
                    searchResultTrips?.map((resultOption) => {
                      return (
                        <div
                          className={styles.autocompleteOption}
                          key={resultOption.id}
                          onClick={() => handleSelectAutocomplete(resultOption, 'trip')}
                        >
                          <div className={styles.autocompleteLeftBox}>
                            <img src={resultOption.avatar} alt='avatar' className={styles.avatar} />
                            {/* <p>{resultOption.location.name.split(',')[0]}</p> */}
                            <div className={styles.autocomplete_description_container}>
                              <p className={styles.autocomplete_description}>
                                {/* {resultOption.matchedCity?.length > 20
                                  ? resultOption.matchedCity?.slice(0, 20) + '...'
                                  : resultOption.matchedCity} */}
                                {/* {resultOption.authorName}: {resultOption?.placeName.split(',')[0]} */}
                              </p>

                              <p
                                className={`${styles.tripDescription} ${styles.autocomplete_description}`}
                              >
                                {resultOption.text.length > 50
                                  ? resultOption.text.slice(0, 40) + '...'
                                  : resultOption.text}
                              </p>
                            </div>
                          </div>
                          <Rating selectedStars={resultOption.rate} />
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className={styles.searchResultsContainer}>
                  <h3 className={styles.noResults}>No {searchMode} found</h3>
                  {searchResultPlaces.length > 0 && (
                    <>
                      <p>You also can be interested in</p>
                      {searchResultPlaces?.map((resultOption) => (
                        <div
                          className={styles.autocompleteOption}
                          key={resultOption.id}
                          onClick={() => handleSelectAutocomplete(resultOption, 'place')}
                        >
                          <div className={styles.autocompleteLeftBox}>
                            <div className={styles.autocomplete_description_container}>
                              <p className={styles.autocomplete_description}>{resultOption.name}</p>

                              <p
                                className={`${styles.tripDescription} ${styles.autocomplete_description}`}
                              >
                                {resultOption.address}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
        <div className={styles.icons}>
          <div className={styles.leftContainer}>
            <div className={`${styles.icon_container} ${styles.hideOnMobile}`}>
              <img
                className={styles.icon}
                src={addFile}
                alt='addFile'
                onClick={() => setTripModalIsOpen(true)}
              />
            </div>
            <div className={`${styles.icon_container} ${styles.hideOnMobile}`}>
              <img
                className={styles.icon}
                src={addUser}
                alt='addUser'
                onClick={() => navigate('/add-friends')}
              />
            </div>
            <div
              className={`${styles.icon_container} ${isSearchFocused ? styles.hideOnMobileInFocus : ''}`}
            >
              <img src={plus} alt='plus' onClick={() => setModalIsOpen(true)} />
            </div>
            {notifications && (
              <DropdownProvider
                trigger={
                  <div
                    className={`radix_trigger ${isSearchFocused ? styles.hideOnMobileInFocus : ''}`}
                  >
                    <NotificationsIcon
                      isActive={notifications.length > 0}
                      // onClick={() => {}}
                      counter={notifications.length}
                    />
                  </div>
                }
                content={
                  <Notifications
                    onClose={() => {}}
                    notifications={notifications}
                    deleteMessages={handleDeleteMessages}
                    deleteMessage={handleDeleteMessage}
                  />
                }
              />
            )}
          </div>

          <div className={styles.rightContainer}>
            <img
              className={styles.avatar}
              src={avatar}
              alt='icon'
              onClick={() => {
                navigate('/profile');
              }}
            />
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className={styles.IconButton} aria-label='Customise options'>
                  <span className={styles.name}>{firestoreUser?.username}</span>
                  <img className={styles.arrow} src={arrow} alt='arrow'></img>
                </button>
              </DropdownMenu.Trigger>

              <DropdownMenu.Portal>
                <DropdownMenu.Content className={styles.DropdownMenuContent} sideOffset={0}>
                  <DropdownMenu.Item className={styles.DropdownMenuItem}>
                    Online Status
                    <div className={styles.RightSlot}>
                      <img src={Switch} />
                    </div>
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    className={styles.DropdownMenuItem}
                    onClick={() => navigate('/settings')}
                  >
                    User Settings
                    <div className={styles.RightSlot}>
                      <img src={Settings} />
                    </div>
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    className={styles.DropdownMenuItem}
                    disabled
                    onClick={() => setTripModalIsOpen(true)}
                  >
                    Create list
                    <div className={styles.RightSlot}>
                      <img src={AddFile} />
                    </div>
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    className={styles.DropdownMenuItem}
                    disabled
                    onClick={() => setModalIsOpen(true)}
                  >
                    New post
                    <div className={styles.RightSlot}>
                      <img src={Plus} />
                    </div>
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    className={styles.DropdownMenuItem}
                    disabled
                    onClick={() => navigate('/add-friends')}
                  >
                    Find new friends
                    <div className={styles.RightSlot}>
                      <img src={AddFriends} />
                    </div>
                  </DropdownMenu.Item>

                  <DropdownMenu.Separator className={styles.DropdownMenuSeparator} />

                  <DropdownMenu.Item className={styles.DropdownMenuItem} onClick={signOutUser}>
                    Log out
                    <div className={styles.RightSlot}>
                      <img src={Logout} />
                    </div>
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </div>
      </div>
      {isNotificationsOpen && (
        <div className={styles.overlay} onClick={() => setIsNotificationsOpen(false)}></div>
      )}
      <CustomModal isOpen={modalIsOpen} onCloseModal={closeModal}>
        <CreatePostModal closeModal={closeModal} />
      </CustomModal>
      <CustomModal isOpen={tripModalIsOpen} onCloseModal={closeTripModal}>
        <CreateTripModal closeModal={closeTripModal} />
      </CustomModal>
      <ToastContainer closeOnClick autoClose={2000} limit={1} pauseOnHover={false} />
    </>
  );
};

export default Header;

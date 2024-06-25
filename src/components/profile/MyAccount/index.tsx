import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';

import cn from 'classnames';
// import { doc, updateDoc } from 'firebase/firestore';
import { getDownloadURL } from 'firebase/storage';
import 'swiper/css/navigation';
// import { Navigation } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import CreatePostModal from '~/components/CreatePostModal';
import CreateTripModal from '~/components/CreateTripModal';
import CustomModal from '~/components/CustomModal';
import EditMap from '~/components/EditMap';
import useMapContext from '~/components/EditMap/store';
import Footer from '~/components/Footer';
import GoogleMaps from '~/components/GoogleMaps/GoogleMaps';
import HeaderNew from '~/components/HeaderNew';
import Map from '~/components/Map/Map';
import { MyFriends } from '~/components/MyFriends';
// import PlaceAutocomplete from '~/components/PlaceAutocomplete/PlaceAutocomplete';
import PostItem from '~/components/Posts';
import { TravelItinerary } from '~/components/TravelItinerary/TravelItinerary';
import useMyPosts from '~/components/profile/store';
import { firebaseErrors } from '~/constants/firebaseErrors';
import { db, storage } from '~/firebase';
// import { useWindowDimensions } from '~/hooks/useWindowDimensions';
import { AuthContext } from '~/providers/authContext';
import { postsCollection, tripsCollection } from '~/types/firestoreCollections';
import { IPost } from '~/types/post';
import { ITravel } from '~/types/travel';

import addFriends from '@assets/icons/addUser.svg';
import defaultUserIcon from '@assets/icons/defaultUserIcon.svg';
// import editText from '@assets/icons/editText.svg';
import logout from '@assets/icons/menu/logout.svg';
import settings from '@assets/icons/menu/settings.svg';
import { getDocs, limit, onSnapshot, orderBy, query, where } from '@firebase/firestore';
import { ref } from '@firebase/storage';

import styles from './myaccount.module.css';
import './styles.css';

import 'swiper/css';
import background_profile from '@assets/images/background_profile.jpg';

const TABS = ['Friends', 'Trips', 'Saved'];

const MyAccount = () => {
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [tripModalIsOpen, setTripModalIsOpen] = useState(false);
  const { posts, setPosts } = useMyPosts();
  const [suggestedPosts, setSuggestedPosts] = useState<IPost[] | null>(null);
  const [isPostsLoading, setIsPostsLoading] = useState(false);
  const [isSuggestedPostsLoading, setIsSuggestedPostsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [avatar, setAvatar] = useState<string>(defaultUserIcon);
  const [avatarIsLoading, setAvatarIsLoading] = useState(true);
  const { setTips } = useMapContext();
  // const [whereToNext, setWhereToNext] = useState<string>('');
  // const [isEditWhereToNext, setIsEditWhereToNext] = useState(false);
  const { state } = useLocation();

  const { firestoreUser, loading, signOutUser } = useContext(AuthContext);
  // const { width } = useWindowDimensions();
  const navigate = useNavigate();
  console.log(activeTab);

  useEffect(() => {
    if (state && state.activeTab !== undefined && activeTab !== state.activeTab) {
      setActiveTab(state.activeTab);
    }
  }, [state]);

  console.log(activeTab);

  useEffect(() => {
    if (firestoreUser?.id) {
      const q = query(tripsCollection, where('userId', '==', firestoreUser?.id));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const fetchedPosts = querySnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));
        setTips(fetchedPosts as ITravel[]);
      });

      return () => {
        unsubscribe();
      };
    }
  }, [firestoreUser, setTips]);

  const closeModal = useCallback(() => {
    setModalIsOpen(false);
  }, []);

  const closeTripModal = useCallback(() => {
    setTripModalIsOpen(false);
  }, []);

  useEffect(() => {
    const mainContainer = document.querySelector(`.${styles.container}`) as HTMLElement;
    if (mainContainer) {
      mainContainer.style.backgroundImage = `url(${background_profile})`;
      mainContainer.style.backgroundRepeat = 'no-repeat';
      mainContainer.style.backgroundPosition = 'center';
      mainContainer.style.backgroundSize = 'cover';
    }
  }), [];

  useEffect(() => {
    (async () => {
      if (firestoreUser?.id) {
        try {
          setIsPostsLoading(true);
          const q = query(
            postsCollection,
            where('userId', '==', firestoreUser?.id),
            orderBy('createAt', 'desc')
          );
          const querySnapshot = await getDocs(q);
          const fetchedPosts = querySnapshot.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id,
          }));

          setPosts(fetchedPosts as IPost[]);
        } catch (err) {
          // @ts-ignore
          alert(firebaseErrors[err.code]);
        } finally {
          setIsPostsLoading(false);
        }
      }
    })();

    (async () => {
      if (firestoreUser?.id) {
        try {
          setIsSuggestedPostsLoading(true);
          const q = query(
            postsCollection,
            orderBy('userId'),
            where('userId', '!=', firestoreUser?.id),
            orderBy('createAt', 'desc')
          );
          const querySnapshot = await getDocs(q);
          const fetchedPosts = querySnapshot.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id,
          }));

          setSuggestedPosts(fetchedPosts as IPost[]);

          if (firestoreUser.avatarUrl) {
            const url = await getDownloadURL(ref(storage, firestoreUser.avatarUrl));
            setAvatar(url);
          }
        } catch (err) {
          console.log(err);
          // @ts-ignore
          alert(firebaseErrors[err.code]);
        } finally {
          setIsSuggestedPostsLoading(false);
          setAvatarIsLoading(false);
        }
      }
    })();

    if (firestoreUser?.id) {
      const q = query(
        postsCollection,
        where('userId', '==', firestoreUser?.id),
        orderBy('createAt', 'desc')
      );
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const fetchedPosts = querySnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));
        setPosts(fetchedPosts as IPost[]);
      });

      return () => {
        unsubscribe();
      };
    }
  }, [firestoreUser?.id]);

  useEffect(() => {
    if (suggestedPosts?.length && firestoreUser?.id) {
      const arrayOfDates = suggestedPosts.map((post) => post.createAt);

      const qu = query(
        postsCollection,
        orderBy('userId', 'desc'),
        where('userId', '!=', firestoreUser.id),
        where('createAt', 'in', arrayOfDates),
        orderBy('createAt', 'desc'),
        limit(10)
      );

      const unsubscribeFromSuggestedPosts = onSnapshot(qu, (querySnapshot) => {
        const fetchedPosts = querySnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));
        setSuggestedPosts(fetchedPosts as IPost[]);
      });

      return () => {
        unsubscribeFromSuggestedPosts();
      };
    }
  }, [firestoreUser?.id]);

  // const getSlidesPerPage = useMemo(() => {
  //   if (width < 768) {
  //     return 1;
  //   } else if (width < 1142) {
  //     return 2;
  //   } else {
  //     return 3;
  //   }
  // }, [width]);

  // const onSelectWhereToNext = async (place: string) => {
  //   if (firestoreUser?.id) {
  //     try {
  //       await updateDoc(doc(db, 'users', firestoreUser?.id), {
  //         whereToNext: place.split(',')[0],
  //       });
  //     } catch (err) {
  //       // @ts-ignore
  //       alert(firebaseErrors[err.code]);
  //     } finally {
  //       setIsEditWhereToNext(false);
  //       setWhereToNext('');
  //     }
  //   }
  // };

  return (
    <>
      <div className={styles.container}>
        <div className={styles.content}>
          <HeaderNew avatar={avatar} />
          <div className={styles.myAccount}>
            <div className={styles.topContainer}>
              <div className={styles.genaralInfo}>
                <div className={styles.userInfo}>
                  <div className={styles.imageContainer}>
                    <img className={styles.defaultUserIcon} src={avatar} alt='default user icon' />
                    {avatarIsLoading && <Skeleton className={styles.loader} />}
                  </div>
                  {!firestoreUser?.username && <Skeleton style={{ width: 100, height: 20 }} />}
                  <p className={styles.text} style={{ margin: 0 }}>
                    {firestoreUser?.username}
                  </p>
                  {firestoreUser?.username ? (
                    <div className={styles.edit}>
                      <div className={styles.inputWrapper}>
                        <div className={styles.linkStyle} onClick={() => navigate('/trip/create')}>
                          Post a Trip
                        </div>
                      </div>
                    </div>
                  ) : null}
                  <div className={styles.optionsContainer}>
                    <div className={styles.options}>
                      <div onClick={() => navigate('/add-friends')} className={styles.addFriend}>
                        <div className={styles.RightSlot}>
                          <img src={addFriends} className={styles.imageMenu} />
                        </div>
                        Find new friends
                      </div>
                      <div
                        onClick={() => navigate('/settings')}
                        className={cn(styles.addFriend, styles.underline)}
                      >
                        <div className={styles.RightSlot}>
                          <img src={settings} className={styles.imageMenu} />
                        </div>
                        Settings
                      </div>
                      <div
                        onClick={signOutUser}
                        className={cn(styles.addFriend, styles.optionsLogout)}
                      >
                        <div className={styles.RightSlot}>
                          <img src={logout} className={styles.imageMenu} />
                        </div>
                        Log out
                      </div>
                    </div>
                  </div>
                  {/* <div className={styles.whereToNextContainer}>
                    {!isEditWhereToNext && firestoreUser?.tripCount !== undefined && (
                      <p className={styles.text}>Where to next? </p>
                    )}

                    {isEditWhereToNext ? (
                      <div className={styles.autocomplete}>
                        <PlaceAutocomplete
                          searchOptions={{ types: ['locality'] }}
                          location={whereToNext || ''}
                          setLocation={setWhereToNext}
                          onSelectPlace={(e) => onSelectWhereToNext(e)}
                        />
                      </div>
                    ) : (
                      <p className={`${styles.value} ${styles.text}`}>
                        {firestoreUser?.whereToNext && firestoreUser?.whereToNext?.length > 10
                          ? firestoreUser?.whereToNext?.slice(0, 10) + '...'
                          : firestoreUser?.whereToNext}
                      </p>
                    )}

                    <img
                      className={`${styles.editButton}`}
                      src={editText}
                      alt='edit icon'
                      onClick={() => setIsEditWhereToNext(!isEditWhereToNext)}
                    />
                  </div> */}
                  {firestoreUser?.tripCount === undefined && (
                    <Skeleton style={{ width: 100, height: 20 }} />
                  )}
                </div>
              </div>

              <div className={styles.mapContainer}>
                <Map />
              </div>
            </div>
            <div className={styles.tabContent}>
              {activeTab !== 4 && (
                <div className={styles.features}>
                  {TABS.map((tab, index) => (
                    <span
                      className={`${styles.feature} ${index === activeTab - 1 && styles.activeFeature}`}
                      onClick={() => setActiveTab(index + 1)}
                      key={tab}
                    >
                      {tab}
                    </span>
                  ))}
                </div>
              )}
              {activeTab === 0 ? (
                <div className={styles.main_content}>
                  <div className={styles.travelContainer}>
                    {!posts?.length && !isPostsLoading ? (
                      <div className={styles.emptyPostsContainer}>
                        <p className={styles.paragraph}>
                          Hmm... {firestoreUser?.username} hasn&apos;t posted anything yet. Start
                          sharing your experience with other participants!
                        </p>
                        <button className={styles.button} onClick={() => setModalIsOpen(true)}>
                          NEW POST
                        </button>
                      </div>
                    ) : (
                      <div className={styles.sliderContainer}>
                        <span className={styles.postsTitle}>My posts</span>
                        <Swiper
                          spaceBetween={30}
                          slidesPerView={1}
                          breakpoints={{
                            500: {
                              slidesPerView: 1,
                            },
                            768: {
                              slidesPerView: 2,
                            },
                            1200: {
                              slidesPerView: 3,
                            },
                            1400: {
                              slidesPerView: 4,
                            },
                          }}
                          className='mySwiper'
                        >
                          {posts?.map((post) => (
                            <SwiperSlide key={post.id}>
                              <PostItem postData={post} />
                            </SwiperSlide>
                          ))}
                        </Swiper>
                      </div>
                    )}
                  </div>
                  {/* <div className={styles.bottomSliderContainer}>
              {suggestedPosts?.length ? (
                <span className={styles.postsTitle}>You may also like</span>
              ) : null}
              <Swiper
                wrapperClass='alsoLikeSwiper'
                spaceBetween={30}
                slidesPerView={1}
                navigation
                centeredSlides
                loop
                modules={[Navigation]}
                breakpoints={{
                  500: {
                    slidesPerView: 1,
                  },
                  768: {
                    slidesPerView: 2,
                  },
                  1142: {
                    slidesPerView: 3,
                  },
                }}
              >
                {suggestedPosts?.map((post) => (
                  <SwiperSlide key={post.id} style={{ overflow: 'hidden' }}>
                    {({ isActive }) => (
                      <div
                        style={
                          isActive
                            ? { scale: '1', transition: 'scale 0.5s' }
                            : { scale: '0.7', transition: 'scale 0.5s' }
                        }
                      >
                        <PostItem postData={post} />
                      </div>
                    )}
                  </SwiperSlide>
                ))}
              </Swiper>
            </div> */}
                </div>
              ) : activeTab === 1 ? (
                <MyFriends />
              ) : activeTab === 3 ? (
                <GoogleMaps />
              ) : activeTab === 2 ? (
                <TravelItinerary />
              ) : activeTab === 4 ? (
                <EditMap />
              ) : (
                <MyFriends />
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />

      <CustomModal isOpen={modalIsOpen} onCloseModal={closeModal}>
        <CreatePostModal closeModal={closeModal} />
      </CustomModal>
      <CustomModal isOpen={tripModalIsOpen} onCloseModal={closeTripModal}>
        <CreateTripModal closeModal={closeTripModal} />
      </CustomModal>
    </>
  );
};

export default MyAccount;

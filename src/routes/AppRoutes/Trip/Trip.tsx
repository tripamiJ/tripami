import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
// import ReactQuill from 'react-quill';
import { useNavigate, useParams } from 'react-router-dom';

import cn from 'classnames';
import { format, isValid } from 'date-fns';
import {
  collection,
  doc,
  documentId,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getDownloadURL, ref } from 'firebase/storage';
import { FormattedDate } from 'rsuite/esm/CustomProvider';
import { Swiper, SwiperRef, SwiperSlide } from 'swiper/react';
import { v4 as uuidv4 } from 'uuid';
import { UserPostInfo } from '~/components/BigPost/UserPostInfo';
import { Comment } from '~/components/Comment';
import { CommentField } from '~/components/CommentField';
import Footer from '~/components/Footer';
import HeaderNew from '~/components/HeaderNew';
import { LightBox } from '~/components/Lightbox/LightBox';
import Rating from '~/components/Rating';
import ShareModal from '~/components/ShareModal/ShareModal';
import SwiperDialyTrip from '~/components/SwiperDialyTrip';
import SwiperTrip from '~/components/SwiperTrip';
import TravelCard from '~/components/TravelCard/TravelCard';
import { db, storage } from '~/firebase';
import { AuthContext } from '~/providers/authContext';
import { IComment } from '~/types/comments';
import { commentsCollection, tripsCollection, usersCollection } from '~/types/firestoreCollections';
import { ITravel } from '~/types/travel';
import { IUser } from '~/types/user';
import { timeAgo } from '~/utils/daysAgo';

import budget_icon from '@assets/icons/budget-icon.svg';
import date_calendar from '@assets/icons/date_calendar.svg';
import defaultUserIcon from '@assets/icons/defaultUserIcon.svg';
import geo_filled from '@assets/icons/geo_filled.svg';
import hashtag_icon_filled from '@assets/icons/hashtag_icon_filled.svg';
import itinerary from '@assets/icons/itinenary.svg';
import people from '@assets/icons/people.svg';
import place_filled from '@assets/icons/place_filled.svg';
import saveTrip from '@assets/icons/saveTrip.svg';
import shareTrip from '@assets/icons/shareTrip.svg';
import tripSaved from '@assets/icons/tripSaved.svg';

import styles from './trip.module.css';

export const Trip = () => {
  const { id } = useParams();
  const [trip, setTrip] = useState<ITravel | null>(null);
  const [userData, setUserData] = useState<IUser | null>(null);
  const { firestoreUser } = useContext(AuthContext);
  const [imageUrls, setImageUrls] = useState<
    {
      url: string;
      type: string;
      description: string | undefined;
    }[]
  >([]);
  const [selectedDayTrip, setSelectedDayTrip] = useState<
    { date: string; description: string } | undefined
  >();
  const [isLoading, setIsLoading] = useState(false);
  const [isLightBoxOpen, setIsLightBoxOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{
    url: string;
    type: string;
    description: string | undefined;
  } | null>(null);
  const [comments, setComments] = useState<IComment[] | null>(null);
  const [avatar, setAvatar] = useState<string>(defaultUserIcon);
  const [posted, setPosted] = useState('');
  const [selectedDate, setSelectedDate] = useState(
    new Date(trip?.dayDescription[0].date) || new Date()
  );
  const [selectedDayImages, setSelectedDayImages] = useState([]);
  const [isModalShareOpen, setIsModalShareOpen] = useState(false);
  const [inFavourites, setInFavourites] = useState(false);
  const [suggestedTrips, setSuggestedTrips] = useState<ITravel[]>([]);
  console.log(suggestedTrips);

  const navigate = useNavigate();

  useEffect(() => {
    if (firestoreUser?.id) {
      const qu = query(
        tripsCollection,
        where('userId', '!=', firestoreUser.id),
        orderBy('createdAt', 'desc'),
        limit(10)
      );

      const unsubscribe = onSnapshot(qu, (querySnapshot) => {
        const fetchedTrips = querySnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));
        setSuggestedTrips(fetchedTrips);
      });

      return () => unsubscribe();
    }
  }, [firestoreUser?.id]);

  useEffect(() => {
    if (trip) {
      setInFavourites(trip.usersSaved?.includes(firestoreUser?.id));
    }
  }, [trip]);

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
    if (trip) {
      const imageRef = ref(storage, trip.imageUrl[0].url);
      getDownloadURL(imageRef)
        .then((url) => {
          const mainContainer = document.querySelector('.mainContainer') as HTMLElement;
          if (mainContainer) {
            mainContainer.style.backgroundImage = `url(${url})`;
            mainContainer.style.backgroundRepeat = 'no-repeat';
            mainContainer.style.backgroundPosition = 'center';
            mainContainer.style.backgroundSize = 'cover';
            mainContainer.style.height = '1500px';
          }
        })
        .catch((error) => {
          console.error('Error getting image URL:', error);
        });
    }
  }, [trip]);

  useEffect(() => {
    (async () => {
      const q = query(tripsCollection, where(documentId(), '==', id));

      const querySnapshot = await getDocs(q);
      const fetchedPost = querySnapshot.docs[0].data() as ITravel;
      setSelectedDate(new Date(fetchedPost.dayDescription[0].date));
      setTrip(fetchedPost);
    })();
  }, [id]);

  useEffect(() => {
    (async () => {
      const selectedDay = trip?.dayDescription.find(
        (day) => formatedDate(new Date(day.date)) === formatedDate(selectedDate)
      );
      setSelectedDayTrip(selectedDay);
    })();
  }),
    [selectedDate];

  useEffect(() => {
    (async () => {
      const selectedDayPhotos = [];
      if (trip?.dayDescription) {
        for (const day of trip.dayDescription) {
          if (formatedDate(new Date(day.date)) === formatedDate(selectedDate)) {
            if (Array.isArray(day.photos) && day.photos.length > 0) {
              for (let i = 0; i < day.photos.length; i++) {
                const url = await getDownloadURL(ref(storage, day.photos[i].url));
                selectedDayPhotos.push({
                  url,
                  id: uuidv4(),
                  type: day.photos[i].type,
                });
              }
            }
          }
        }
      }
      setSelectedDayImages(selectedDayPhotos);
    })();
  }, [selectedDate, trip, setSelectedDayImages]);

  useEffect(() => {
    (async () => {
      if (trip?.userId) {
        try {
          setIsLoading(true);
          const q = query(usersCollection, where(documentId(), '==', trip.userId));
          const querySnapshot = await getDocs(q);
          const fetchedUser = querySnapshot.docs[0].data() as IUser;
          setUserData(fetchedUser as IUser);
        } catch (error) {
          console.log('[ERROR getting user from firestore] => ', error);
        } finally {
          setIsLoading(false);
        }
      }
    })();
  }, [trip?.userId]);

  useEffect(() => {
    (async () => {
      const downloadedUrls = [];

      if (trip?.imageUrl) {
        for (let i = 0; i < trip.imageUrl.length; i++) {
          const url = await getDownloadURL(ref(storage, trip.imageUrl[i].url));
          downloadedUrls.push({
            url,
            type: trip.imageUrl[i].type,
            description: trip.imageUrl[i].description,
          });
        }

        setImageUrls(downloadedUrls);
      }
    })();
  }, [trip]);

  useEffect(() => {
    if (selectedImage) {
      setIsLightBoxOpen(true);
    }
  }, [selectedImage]);

  const handleSelectImage = (index: number) => {
    setSelectedImage(imageUrls[index]);
  };

  useEffect(() => {
    const q = query(commentsCollection, where('postId', '==', id), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedDocs = querySnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
      setComments(fetchedDocs as IComment[]);
    });

    return () => {
      unsubscribe();
    };
  }, [id]);

  function formatedDate(date: Date) {
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    const formattedDate = `${day}-${month}-${year}`;

    return formattedDate;
  }

  const handleDateClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, date: Date) => {
    event.preventDefault();
    setSelectedDate(date);
  };

  const handleFavouriteClick = useCallback(async () => {
    if (trip) {
      const docRef = doc(db, 'trips', id);
      if (trip.usersSaved?.includes(firestoreUser?.id)) {
        await updateDoc(docRef, {
          usersSaved: trip.usersSaved.filter((user) => user !== firestoreUser?.id),
        });
        setInFavourites(false);
      } else {
        await updateDoc(docRef, {
          usersSaved: [...trip.usersSaved, firestoreUser?.id] || [firestoreUser?.id],
        });
        setInFavourites(true);
      }
    }
  }, [firestoreUser?.firebaseUid, trip?.usersSaved]);

  return (
    <div className={(styles.mainContainer, 'mainContainer')}>
      <HeaderNew avatar={avatar} />
      <div className={styles.main}>
        <div className={styles.post}>
          <div className={styles.container}>
            <div className={styles.headerTrip}>
              {userData ? (
                <UserPostInfo
                  userData={userData}
                  userPhotoUrl=''
                  isMasterPage={true}
                  setPosted={setPosted}
                />
              ) : null}
              <h1 className={styles.title}>{trip?.tripName}</h1>
              <div className={styles.social}>
                {/* <div className={styles.followButton}>Follow</div> */}
                <img
                  src={shareTrip}
                  alt='shareTrip'
                  className={styles.socialIcon}
                  onClick={() => setIsModalShareOpen(true)}
                />
                <img
                  src={inFavourites ? tripSaved : saveTrip}
                  alt='saveTrip'
                  className={styles.socialIcon}
                  onClick={handleFavouriteClick}
                />
              </div>
            </div>
            <div className={styles.timeContainer}>
              <div>{trip ? `Posted: ${timeAgo(trip.createdAt)}` : ''}</div>
            </div>
            <div className={styles.tripContainer}>
              <SwiperTrip file={imageUrls} handleSelectImage={handleSelectImage} />
              <h2 className={styles.tripOverview}>Trip Overview</h2>
              <div className={styles.topRightContainer}>
                <p className={styles.journey}>{trip?.stage} journey</p>
                <div className={styles.dateContainer}>
                  <img src={date_calendar} alt='date_calendar' />
                  <p className={styles.date}>
                    {trip?.startDate}-{trip?.endDate}
                  </p>
                </div>
                <div className={styles.dateContainer}>
                  <img src={people} alt='people' />
                  <p className={styles.date}>{trip?.people}</p>
                </div>
                <div className={styles.dateContainer}>
                  <img src={budget_icon} alt='people' />
                  <p className={styles.date}>{trip?.budget}</p>
                </div>
                <div className={styles.rateContainer}>
                  <Rating selectedStars={trip?.rate || 1} />
                </div>
              </div>
              <div className={styles.textContainer}>
                {/* <ReactQuill value={trip?.text} readOnly={true} theme={'bubble'} /> */}
                <p className={styles.postText}>{trip?.text}</p>
                {/* <div className={styles.postActionsWrapper}>
                    <PostActions postData={post} />
                  </div> */}
              </div>
              <div className={styles.hashtags}>
                {trip?.hashtags.map((item) => (
                  <div key={item} className={styles.hashtagsContainer}>
                    <img
                      src={hashtag_icon_filled}
                      alt='hashtagIcon'
                      className={styles.hashtagIconRender}
                    />
                    <p key={item} className={styles.hashtag}>
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <h2 className={styles.tripOverview}>Visited places</h2>
            {trip?.geoTags ? (
              <div className={styles.selectedTagsContainer}>
                {trip.geoTags.map((geoTag) => (
                  <div className={styles.geoTagContainer} key={geoTag.placeID}>
                    <img
                      src={place_filled}
                      alt='geoTagImage'
                      onClick={() => navigate('/place/' + geoTag.placeID)}
                    />
                    <p
                      className={styles.geotagTitle}
                      onClick={() => navigate('/place/' + geoTag.placeID)}
                    >
                      {geoTag.address.split(',')[0]}
                    </p>
                    <img
                      src={itinerary}
                      alt='itinerary'
                      onClick={() => navigate('/place/' + geoTag.placeID)}
                    />
                  </div>
                ))}
              </div>
            ) : null}
            <h2 className={styles.tripOverview}>Daily journal</h2>
            <div className={styles.dateButtonsContainer}>
              <Swiper spaceBetween={10} slidesPerView={'auto'} freeMode={true}>
                {trip?.dayDescription.map((journal) => {
                  const { date } = journal;
                  const isDateFilled =
                    journal.photos.length > 0 || journal.place.length > 0 || journal.description;
                  const parsedDate = new Date(date);
                  return (
                    <SwiperSlide key={parsedDate.toDateString()} style={{ width: 'auto' }}>
                      <button
                        onClick={(e) => handleDateClick(e, parsedDate)}
                        className={cn(styles.buttonCustom, {
                          [styles.selected]:
                            formatedDate(selectedDate) === formatedDate(new Date(date)),
                          [styles.dateFilled]: isDateFilled,
                        })}
                      >
                        {isValid(parsedDate) ? format(parsedDate, 'dd/MM') : 'Invalid Date'}
                      </button>
                    </SwiperSlide>
                  );
                })}
              </Swiper>
            </div>
            <div className={styles.dayContainer}>
              {selectedDayImages.length > 0 && <SwiperDialyTrip file={selectedDayImages} />}
              <div className={styles.dayInfoContainer}>
                <h2 className={styles.tripOverview}>Day Overview</h2>
                <div className={styles.dayDescriptionJournal}>{selectedDayTrip?.description}</div>
                {selectedDayTrip ? (
                  <div className={styles.selectedTagsContainer}>
                    {selectedDayTrip.place.map((geoTag) => (
                      <div className={styles.geoTagContainer} key={geoTag.placeID}>
                        <img src={geo_filled} alt='geo_filled' />
                        <div
                          onClick={() => navigate('/place/' + geoTag.placeID)}
                          className={styles.geotagTitle}
                        >
                          {geoTag.address}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: '0',
            width: '100%',
            height: '230%',
            backgroundColor: '#F8F7F1',
            zIndex: '-1',
          }}
        ></div>
        {suggestedTrips.length > 0 && (
          <div className={styles.suggestedTripContainer} style={{ marginBottom: '40px' }}>
            <h2 className={styles.title} style={{ marginBottom: '40px' }}>Related users’ trips</h2>

            <Swiper
              className={styles.tripWrapper}
              spaceBetween={40}
              slidesPerView={1}
              freeMode={true}
              loop={true}
              breakpoints={{
                640: {
                  slidesPerView: 1,
                },
                768: {
                  slidesPerView: 2,
                },
                1024: {
                  slidesPerView: 3,
                },
                1400: {
                  slidesPerView: 4,
                }
              }}
            >
              {suggestedTrips.map((trip) => (
                <SwiperSlide
                  key={trip.id}
                  style={{
                    padding: 0,
                    margin: 0,
                    width: '300px',
                  }}
                >
                  <TravelCard travel={trip} isSwiper={true} />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        )}

        {id && comments && (
          <div className={styles.containerComments}>
            <h2 className={styles.commentsTitle}>Comments</h2>
            <div className={styles.commentsMap}>
              {comments?.map((comment) => (
                <Comment key={comment.id} comment={comment} contentType='trip' />
              ))}
            </div>
            <CommentField
              postId={id}
              commentsCount={trip?.comments_count || 0}
              contentType='trip'
              postOwnerId={trip?.userId || ''}
            />
          </div>
        )}
      </div>

      <ShareModal
        isOpen={isModalShareOpen}
        onRequestClose={() => setIsModalShareOpen(false)}
        linkTo={'https://tripamimain.netlify.app/#/trip/' + id}
      />

      <LightBox
        isOpen={isLightBoxOpen}
        onCloseModal={() => setIsLightBoxOpen(false)}
        selectedImage={selectedImage}
        onChangeSelectedPhoto={setSelectedImage}
        images={imageUrls}
      />
      <Footer />
    </div>
  );
};

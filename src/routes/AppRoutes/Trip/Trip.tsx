import { useEffect, useState } from 'react';
// import ReactQuill from 'react-quill';
import { useNavigate, useParams } from 'react-router-dom';

import { documentId, getDocs, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { getDownloadURL, ref } from 'firebase/storage';
import { Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import { UserPostInfo } from '~/components/BigPost/UserPostInfo';
import { Comment } from '~/components/Comment';
import { CommentField } from '~/components/CommentField';
import { LightBox } from '~/components/Lightbox/LightBox';
import { PageTitle } from '~/components/PageTitle';
import Rating from '~/components/Rating';
import Header from '~/components/profile/Header';
import { storage } from '~/firebase';
import { IComment } from '~/types/comments';
import { commentsCollection, tripsCollection, usersCollection } from '~/types/firestoreCollections';
import { ITravel } from '~/types/travel';
import { IUser } from '~/types/user';
import { getDateToDisplay } from '~/utils/getDateToDisplay';

import styles from './trip.module.css';

export const Trip = () => {
  const { id } = useParams();
  const [trip, setTrip] = useState<ITravel | null>(null);
  const [userData, setUserData] = useState<IUser | null>(null);
  const [imageUrls, setImageUrls] = useState<
    {
      url: string;
      type: string;
      description: string | undefined;
    }[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLightBoxOpen, setIsLightBoxOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{
    url: string;
    type: string;
    description: string | undefined;
  } | null>(null);
  const [comments, setComments] = useState<IComment[] | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const q = query(tripsCollection, where(documentId(), '==', id));
      const querySnapshot = await getDocs(q);
      const fetchedPost = querySnapshot.docs[0].data() as ITravel;
      setTrip(fetchedPost);
    })();
  }, [id]);

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

  return (
    <div className={styles.mainContainer}>
      <Header />
      <div className={styles.main}>
        <PageTitle title={'Trip'} />

        <div className={styles.post}>
          <div className={styles.container}>
            {userData ? (
              <UserPostInfo
                userData={userData}
                createdAt={trip?.endDate || ''}
                userPhotoUrl=''
                isMasterPage={true}
              />
            ) : null}

            <div className={styles.tripContainer}>
              <div className={styles.topContainer}>
                <div className={styles.swiperContainer}>
                  <Swiper
                    // spaceBetween={0}
                    slidesPerView={1}
                    // loop={true}
                    // style={{ width: '100%', height: '100%', cursor: 'pointer' }}
                    // wrapperClass={styles.swiperWrapper}
                    pagination={true}
                    modules={[Pagination]}
                  >
                    {imageUrls?.map((image, idx) => (
                      <SwiperSlide
                        key={image.url}
                        style={{ display: 'flex', justifyContent: 'center' }}
                        onClick={() => handleSelectImage(idx)}
                      >
                        {image.type.includes('video') ? (
                          <video src={image.url} className={styles.postIMage} />
                        ) : (
                          <img
                            src={image.url}
                            className={styles.postIMage}
                            onClick={() => setSelectedImage(imageUrls[idx])}
                          />
                        )}
                      </SwiperSlide>
                    ))}
                  </Swiper>
                </div>
                <div className={styles.topRightContainer}>
                  <h1 className={styles.title}>{trip?.tripName}</h1>
                  <div className={styles.rateContainer}>
                    <Rating selectedStars={trip?.rate || 1} />
                  </div>
                  <div className={styles.textContainer}>
                    {/* <ReactQuill value={trip?.text} readOnly={true} theme={'bubble'} /> */}
                    <p className={styles.postText}>{trip?.text}</p>
                    {/* <div className={styles.postActionsWrapper}>
                    <PostActions postData={post} />
                  </div> */}
                  </div>
                </div>
              </div>

              {trip?.dayDescription &&
                trip.dayDescription.map((day, index) => (
                  <div key={index}>
                    <h2 className={styles.date}>{getDateToDisplay(day.date)}</h2>
                    <p className={styles.dayDescription}>{day.description}</p>
                  </div>
                ))}
            </div>

            <div className={styles.visitedContainer}>
              {trip?.geoTags && trip?.geoTags.length > 0 && (
                <div>
                  <p className={styles.text}>Spots: </p>
                  <div className={styles.tagsContainer}>
                    {trip?.geoTags?.map((tag) => (
                      <p
                        onClick={() => navigate('/place/' + tag.placeID)}
                        key={tag.placeID}
                        className={styles.tag}
                      >
                        {tag.address.split(',')[0]}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {trip?.cities && trip.cities.length > 0 && (
                <div>
                  <p className={styles.text}>Locations: </p>
                  <div className={styles.tagsContainer}>
                    {trip?.cities?.map((tag) => (
                      <p
                        onClick={() => navigate('/place/' + tag.placeID)}
                        key={tag.placeID}
                        className={styles.tag}
                      >
                        {tag.address}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {id && (
            <CommentField
              postId={id}
              commentsCount={trip?.comments_count || 0}
              contentType='trip'
              postOwnerId={trip?.userId || ''}
            />
          )}
        </div>

        {comments &&
          comments?.map((comment) => (
            <Comment key={comment.id} comment={comment} contentType={'trip'} />
          ))}
      </div>

      <LightBox
        isOpen={isLightBoxOpen}
        onCloseModal={() => setIsLightBoxOpen(false)}
        selectedImage={selectedImage}
        onChangeSelectedPhoto={setSelectedImage}
        images={imageUrls}
      />
    </div>
  );
};

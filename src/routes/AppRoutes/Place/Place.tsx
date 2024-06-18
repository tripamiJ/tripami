import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import { useParams } from 'react-router-dom';

import axios from 'axios';
import {
  average,
  collectionGroup,
  deleteDoc,
  documentId,
  getAggregateFromServer,
  getDocs,
  onSnapshot,
  updateDoc,
} from 'firebase/firestore';
import Lottie from 'lottie-react';
import { CreateReviewModal } from '~/components/CreateReviewModal/CreateReviewModal';
import CustomModal from '~/components/CustomModal';
import { PageTitle } from '~/components/PageTitle';
import { PlaceReview } from '~/components/PlaceReview/PlaceReview';
import { PlaceTripReview } from '~/components/PlaceTripReview/PlaceTripReview';
import Header from '~/components/profile/Header';
import { db } from '~/firebase';
import { AuthContext } from '~/providers/authContext';
import { IPlace } from '~/routes/AppRoutes/Posts/types';
import { placesCollection, reviewsCollection, tripsCollection } from '~/types/firestoreCollections';
import { ITravel } from '~/types/travel';

import AnimationData from '@assets/animations/loader.json';
import { query, where } from '@firebase/firestore';
import { APIProvider, Map } from '@vis.gl/react-google-maps';

import styles from './place.module.css';

const MAX_LENGTH = 700;

const mapOptions = {
  defaultZoom: 15,
  mapId: '9bc3b1605395203e',
  zoomControl: false,
  fullscreenControl: false,
  mapTypeControl: false,
  streetViewControl: false,
  gestureHandling: 'none',
  keyboardShortcuts: false,
  clickableIcons: false,
};

const Place = () => {
  const { id } = useParams();
  const { firestoreUser } = useContext(AuthContext);

  const [placeData, setPlaceData] = useState<IPlace | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [relatedTrips, setRelatedTrips] = useState<ITravel[]>([]);
  const [geocode, setGeocode] = useState<any>(null);
  const [isAddReviewOpen, setIsAddReviewOpen] = useState(false);
  const [myReview, setMyReview] = useState<any>();
  const [reviews, setReviews] = useState<any[]>([]);

  const truncatedText = useRef('');
  const remainingText = useRef('');

  useEffect(() => {
    (async () => {
      try {
        if (firestoreUser?.id) {
          const q = query(
            reviewsCollection,
            where('placeId', '==', id),
            where('authorId', '==', firestoreUser?.id)
          );
          // const querySnapshot = await getDocs(q);
          // const fetchedDocs = querySnapshot.docs.map((doc) => ({
          //   ...doc.data(),
          //   id: doc.id,
          // }));
          const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const fetchedDocs = querySnapshot.docs.map((doc) => ({
              ...doc.data(),
              id: doc.id,
            }));
            setMyReview(fetchedDocs[0]);
          });

          return () => {
            unsubscribe();
          };
        }
      } catch (err) {
        console.log('[ERROR getting geocode data] => ', err);
      }
    })();
  }, [firestoreUser?.id, id]);

  useEffect(() => {
    (async () => {
      try {
        if (firestoreUser?.id) {
          const q = query(
            reviewsCollection,
            where('placeId', '==', id),
            where('authorId', '!=', firestoreUser?.id)
          );
          const querySnapshot = await getDocs(q);
          const fetchedDocs = querySnapshot.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id,
          }));

          setReviews(fetchedDocs);
        }
      } catch (err) {
        console.log('[ERROR getting geocode data] => ', err);
      }
    })();
  }, [firestoreUser?.id, id]);

  useEffect(() => {
    if (id) {
      (async () => {
        try {
          const q = query(placesCollection, where('placeId', '==', id));
          const querySnapshot = await getDocs(q);
          const fetchedDocs = querySnapshot.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id,
          }));

          setGeocode(fetchedDocs[0]);
        } catch (err) {
          console.log('[ERROR getting geocode data] => ', err);
        }
      })();
    }
  }, [id]);

  const handleSeeMoreClick = () => {
    setIsExpanded(!isExpanded);
  };

  useEffect(() => {
    (async () => {
      const q = query(reviewsCollection, where('placeId', '==', id));
      const snapshot = await getAggregateFromServer(q, { averageRating: average('rate') });
      console.log(snapshot);
    })();
  }, [id]);

  useMemo(() => {
    if (placeData?.articleText) {
      const cutText = placeData.articleText.slice(0, MAX_LENGTH);

      truncatedText.current = placeData.articleText.length > MAX_LENGTH ? cutText + '...' : cutText;
      remainingText.current = placeData.articleText.slice(MAX_LENGTH);
    }
  }, [placeData?.articleText]);

  useEffect(() => {
    (async () => {
      if (id) {
        try {
          const q = query(placesCollection, where('placeId', '==', id));
          const querySnapshot = await getDocs(q);
          // @ts-ignore
          const fetchedDocs: { articleText: string; imageUrl: string; id: string }[] =
            querySnapshot.docs.map((doc) => ({
              ...doc.data(),
              id: doc.id,
            }));
          if (!fetchedDocs[0].articleText && !fetchedDocs[0].imageUrl) {
            console.log('working with request to the server');
            const { data }: { data?: { data: IPlace } } = await axios.get(
              'https://getgooglemapsdetails-dp6fh5oj2q-uc.a.run.app/helloWorld?placeId=' + id
            );
            if (data?.data) {
              setPlaceData(data.data);
            }
            await updateDoc(querySnapshot.docs[0].ref, {
              ...fetchedDocs[0],
              articleText: data?.data?.articleText,
              imageUrl: data?.data?.imageUrl,
            });
          } else {
            console.log('working without request to the server');
            setPlaceData({
              imageUrl: fetchedDocs[0].imageUrl,
              articleText: fetchedDocs[0].articleText,
            });
          }
          setIsLoading(true);
        } catch (err) {
          console.log('[ERROR getting data about place] => ', err);
        } finally {
          setIsLoading(false);
        }
      }
    })();
  }, [id]);

  useEffect(() => {
    if (firestoreUser?.id) {
      const queryCities = query(collectionGroup(db, 'cities'), where('placeID', '==', id));
      const queryPlaces = query(collectionGroup(db, 'places'), where('placeID', '==', id));
      try {
        (async () => {
          const queryCitiesSnapshot = await getDocs(queryCities);
          const queryPlacesSnapshot = await getDocs(queryPlaces);
          const tripsId: string[] = [];
          queryPlacesSnapshot.docs.map((document) => {
            if (document.ref.parent && document.ref.parent.parent) {
              tripsId.push(document.ref?.parent?.parent?.id);
            }
          });
          queryCitiesSnapshot.docs.map((document) => {
            if (document.ref.parent && document.ref.parent.parent) {
              tripsId.push(document.ref?.parent?.parent?.id);
            }
          });

          if (tripsId.length > 0) {
            const tripQuery = query(tripsCollection, where(documentId(), 'in', tripsId));
            const tripQuerySnapshot = await getDocs(tripQuery);
            const trips = tripQuerySnapshot.docs.map((document) => ({
              ...document.data(),
              id: document.id,
            }));
            trips.length > 0
              ? setRelatedTrips(
                  // @ts-ignore
                  trips as ITravel[]
                )
              : setRelatedTrips([]);
          }
        })();
      } catch (err) {
        console.log('[ERROR getting data about place] => ', err);
      }
    }
  }, [id, firestoreUser?.id]);

  const handleDeleteReview = async () => {
    try {
      const q = query(
        reviewsCollection,
        where('authorId', '==', firestoreUser?.id),
        where('placeId', '==', id)
      );

      const querySnapshot = await getDocs(q);
      await deleteDoc(querySnapshot.docs[0].ref);
    } catch (err) {
      console.log('[ERROR deleting review] => ', err);
    }
  };

  return (
    <div className={styles.mainContainer}>
      <div className={styles.header}>
        <Header />
      </div>

      <div className={styles.main}>
        <PageTitle title={'Place'} />

        <div className={styles.post}>
          <div className={styles.container}>
            {geocode?.name === undefined ? (
              <Skeleton height={50} />
            ) : (
              <h1 className={styles.title}>{geocode?.name}</h1>
            )}
            <div className={styles.postContainer}>
              {isLoading ? (
                <Lottie animationData={AnimationData} />
              ) : placeData?.imageUrl || placeData?.articleText ? (
                <>
                  {placeData.imageUrl && (
                    <img
                      src={placeData.imageUrl || ''}
                      alt={'place image'}
                      className={styles.postIMage}
                    />
                  )}
                  {id && geocode?.types && (
                    <APIProvider apiKey='AIzaSyCwDkMaHWXRpO7hY6z62_Gu8eLxMMItjT8'>
                      <div className={styles.mapContainer}>
                        <Map
                          center={geocode}
                          {...mapOptions}
                          zoom={geocode.types.includes('locality') ? 10 : 17}
                        />
                      </div>
                    </APIProvider>
                  )}
                </>
              ) : (
                <h2 className={styles.empty}>There is no information about this place</h2>
              )}
            </div>
            {placeData && placeData.articleText ? (
              <div className={styles.textContainer}>
                {isExpanded ? (
                  <div>
                    <div
                      className={styles.description}
                      dangerouslySetInnerHTML={{ __html: placeData.articleText }}
                    />
                    <button onClick={handleSeeMoreClick}>See less</button>
                  </div>
                ) : (
                  <div>
                    <div dangerouslySetInnerHTML={{ __html: truncatedText.current }} />
                    {placeData.articleText.length > MAX_LENGTH && (
                      <button onClick={handleSeeMoreClick}>See more</button>
                    )}
                  </div>
                )}
              </div>
            ) : null}

            {myReview && myReview?.id ? (
              <div>
                <h2 className={styles.categoryTitle}>My review</h2>
                <div key={myReview.id} className={styles.review}>
                  <PlaceReview review={myReview} />
                </div>
                <div className={styles.reviewControl}>
                  <button className={styles.button} onClick={() => setIsAddReviewOpen(true)}>
                    Edit
                  </button>
                  <button className={styles.button} onClick={() => handleDeleteReview()}>
                    Delete
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.addReviewContainer}>
                <h3>Been here? Please, leave a your review</h3>
                <button className={styles.button} onClick={() => setIsAddReviewOpen(true)}>
                  Add review
                </button>
              </div>
            )}

            {relatedTrips.filter((trip) => trip.userId === firestoreUser?.id)?.length > 0 && (
              <>
                <h2 className={styles.categoryTitle}>My trips related with this place</h2>
                {relatedTrips
                  .filter((trip) => trip.userId === firestoreUser?.id)
                  .map((review) => (
                    <div key={review.id} className={styles.review}>
                      <PlaceTripReview trip={review} />
                    </div>
                  ))}
              </>
            )}
          </div>

          {reviews.length > 0 && (
            <>
              <h3 className={styles.categoryTitle}>Some users already reviewed this place</h3>
              <div className={styles.reviewsContainer}>
                {reviews &&
                  reviews.map((review) => (
                    <div key={myReview?.id} className={styles.review}>
                      <PlaceReview review={review} />
                    </div>
                  ))}
              </div>
            </>
          )}

          {relatedTrips.filter((trip) => trip.userId !== firestoreUser?.id)?.length > 0 && (
            <>
              <h3 className={styles.categoryTitle}>Check user`s trips related with this place</h3>
              <div className={styles.reviewsContainer}>
                {relatedTrips
                  .filter((trip) => trip.userId !== firestoreUser?.id)
                  .map((review) => (
                    <div key={review.id} className={styles.review}>
                      <PlaceTripReview trip={review} />
                    </div>
                  ))}
              </div>
            </>
          )}
        </div>
      </div>
      {id && (
        <CustomModal isOpen={isAddReviewOpen} onCloseModal={() => setIsAddReviewOpen(false)}>
          <CreateReviewModal
            closeModal={() => setIsAddReviewOpen(false)}
            placeId={id}
            placeName={geocode?.name}
            startReview={myReview}
          />
        </CustomModal>
      )}
    </div>
  );
};

export default Place;

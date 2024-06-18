import { useContext, useEffect, useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import { useParams } from 'react-router-dom';

import { collectionGroup, documentId, orderBy } from 'firebase/firestore';
import { getDownloadURL } from 'firebase/storage';
import { Footer } from '~/components/Footer';
import Map from '~/components/Map/Map';
import { Sort } from '~/components/Sort/Sort';
import TravelCard from '~/components/TravelCard/TravelCard';
import Header from '~/components/profile/Header';
import { firebaseErrors } from '~/constants/firebaseErrors';
import { db, storage } from '~/firebase';
import { AuthContext } from '~/providers/authContext';
import { tripsCollection, usersCollection } from '~/types/firestoreCollections';
import { ITravel } from '~/types/travel';
import { IUser } from '~/types/user';

import Avatar from '@assets/icons/defaultUserIcon.svg';
import { getDocs, query, where } from '@firebase/firestore';
import { ref } from '@firebase/storage';

import AddNewFriends, { UserCard } from '../AddNewFriends/AddNewFriends';
import styles from './userProfile.module.css';

type SortBy = 'endDate' | 'rate' | 'alphabetically';
const TABS = ['Friends', 'Trips'];

const getQuery = (sortBy: SortBy, isReverse: boolean, id: string) => {
  switch (sortBy) {
    case 'alphabetically':
      return query(
        tripsCollection,
        where('userId', '==', id),
        orderBy('tripName', !isReverse ? 'desc' : 'asc')
      );
    case 'rate':
      return query(
        tripsCollection,
        where('userId', '==', id),
        orderBy('rate', !isReverse ? 'desc' : 'asc')
      );
    default:
      return query(
        tripsCollection,
        where('userId', '==', id),
        orderBy('endDate', !isReverse ? 'desc' : 'asc')
      );
  }
};

const UserProfile = () => {
  const { id } = useParams();
  const { firestoreUser } = useContext(AuthContext);
  const [userData, setUserData] = useState<IUser>();
  const [userPhotoUrl, setUserPhotoUrl] = useState<string>();
  const [avatarIsLoading, setAvatarIsLoading] = useState<boolean>(false);
  const [travelsIsLoading, setTravelsIsLoading] = useState<boolean>(true);
  const [userTravels, setUserTravels] = useState<ITravel[]>([]);
  const [isReverse, setIsReverse] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>('endDate');
  const [friends, setFriends] = useState<IUser[]>([]);
  const [activeTab, setActiveTab] = useState(0);

  // useEffect(() => {
  //     import { collectionGroup, query, where, getDocs } from "firebase/firestore";

  // const museums = query(collectionGroup(db, 'landmarks'), where('type', '==', 'museum'));
  // const querySnapshot = await getDocs(museums);
  // querySnapshot.forEach((doc) => {
  //     console.log(doc.id, ' => ', doc.data());
  // });
  //   (async () => {
  //     const cities = query(collectionGroup(db, 'cities'), where('address', '==', 'addresstest'));
  //     const querySnapshot = await getDocs(cities);
  //     const doc = querySnapshot.docs[0];
  //     console.log('needed doc ==> ', doc.data());
  //   })();
  // }, []);
  useEffect(() => {
    (async () => {
      if (!id) return;
      const q = query(usersCollection, where(documentId(), '==', id));
      const querySnapshot = await getDocs(q);

      setUserData(querySnapshot.docs[0].data());
    })();
  }, [id]);

  useEffect(() => {
    (async () => {
      if (userData?.avatarUrl) {
        setAvatarIsLoading(true);
        try {
          const url = await getDownloadURL(ref(storage, userData.avatarUrl));
          setUserPhotoUrl(url);
        } catch (error) {
          console.log('[ERROR getting user photo] => ', error);
        } finally {
          setAvatarIsLoading(false);
        }
      }
    })();
  }, [userData?.id, id, userData?.avatarUrl]);

  useEffect(() => {
    (async () => {
      try {
        if (!id) return;
        let q = getQuery(sortBy, isReverse, id);

        const querySnapshot = await getDocs(q);
        const fetchedUserTravels = querySnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));

        setUserTravels(fetchedUserTravels as ITravel[]);
      } catch (err) {
        // @ts-ignore
        console.error('Error getting documents: ', err);
      } finally {
        setTravelsIsLoading(false);
      }
    })();
  }, [id, isReverse, sortBy]);

  useEffect(() => {
    if (!userData?.friends?.length) return;
    try {
      (async () => {
        const q = query(usersCollection, where(documentId(), 'in', userData?.friends));
        const querySnapshot = await getDocs(q);
        const friends = querySnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }) as IUser);
      })();
    } catch (error) {
      console.error('Error getting documents: ', error);
    }
  }, [userData?.id]);

  // const amountOfFriends = () => {
  //   if (firestoreUser?.id && userData?.friends) {
  //     return userData?.friends?.includes(firestoreUser?.id)
  //       ? userData?.friends?.length - 1
  //       : userData?.friends?.length;
  //   } else {
  //     return 0;
  //   }
  // };

  return (
    <>
      <Header />
      <div style={{ backgroundColor: '#DAE0E1' }} className={styles.main}>
        <>
          <div>
            <div className={styles.myAccount}>
              <div className={styles.genaralInfo}>
                <div className={styles.userInfo}>
                  <div className={styles.imageContainer}>
                    {userData?.avatarUrl ? (
                      <img
                        className={styles.defaultUserIcon}
                        src={userPhotoUrl}
                        alt='default user icon'
                      />
                    ) : (
                      <img
                        className={styles.defaultUserIcon}
                        src={Avatar}
                        alt='default user icon'
                      />
                    )}
                    {avatarIsLoading && <Skeleton className={styles.loader} />}
                  </div>
                  <div className={styles.description}>
                    {userData?.username ? (
                      <div className={styles.edit}>
                        <p className={styles.text} style={{ margin: 0 }}>
                          {userData?.username}
                        </p>
                      </div>
                    ) : null}
                    {!userData?.username && <Skeleton style={{ width: 100, height: 20 }} />}
                    <p className={styles.text}>
                      {userData?.tripCount !== undefined
                        ? `Trips: ${userData?.tripCount || 0}`
                        : ''}
                    </p>
                    {userData?.tripCount === undefined && (
                      <Skeleton style={{ width: 100, height: 20 }} />
                    )}
                    {userData?.whereToNext === undefined ? (
                      <Skeleton style={{ width: 100, height: 20 }} />
                    ) : userData?.whereToNext ? (
                      <p className={styles.text}>{`Where to next? ${userData?.whereToNext}`}</p>
                    ) : (
                      <p className={styles.text}>{`Where to next?`}</p>
                    )}
                  </div>
                </div>
                <div className={styles.divider}></div>
                <div className={styles.features}>
                  {TABS.map((tab, index) => (
                    <span
                      className={`${styles.feature} ${index === activeTab && styles.activeFeature}`}
                      onClick={() => setActiveTab(index)}
                      key={tab}
                    >
                      {tab}{' '}
                      {userData?.friends && firestoreUser?.id && index === 1 && (
                        <div className={styles.friendsCount}>
                          {userData?.friends?.length}
                          {/* {friends.length || 0} */}
                          {/* {userData?.friends?.includes(firestoreUser?.id)
                            ? userData?.friends?.length - 1
                            : userData?.friends?.length} */}
                        </div>
                      )}
                      {index === 2 && (
                        <div className={styles.friendsCount}>{userData?.tripCount || 0}</div>
                      )}
                    </span>
                  ))}
                </div>
              </div>
              <div className={styles.mapContainer}>
                <div className={styles.mapContainer}>
                  <Map userId={id} />
                </div>
              </div>
            </div>
          </div>

          <div className={styles.container}>
            <div className={styles.userContent}>
              {activeTab === 0 && userData && (
                <>
                  <div>
                    {userData &&
                      firestoreUser?.id &&
                      userData?.friends?.includes(firestoreUser?.id) && (
                        <h3>You and {userData.username?.split(' ')[0]} are friends</h3>
                      )}
                    <h3>Friends</h3>
                    <AddNewFriends user={userData} />
                  </div>
                </>
              )}
              {activeTab === 1 &&
                (userTravels.length === 0 ? (
                  <p className={styles.title}>{userData?.username} has not any travels</p>
                ) : (
                  <>
                    <p className={styles.title}>{userData?.username}`s travels</p>
                    <Sort
                      onSelect={setSortBy}
                      isReverse={isReverse}
                      setReverse={() => setIsReverse((prevState) => !prevState)}
                    />
                    <div className={styles.travelsContainer}>
                      {travelsIsLoading ? (
                        <Skeleton count={2} height={100} width={400} style={{ margin: '10px 0' }} />
                      ) : (
                        userTravels.map((travel) => <TravelCard key={travel.id} travel={travel} />)
                      )}
                    </div>
                  </>
                ))}
            </div>
            {/* <div className={styles.friendsList}>
              {userData?.friends && <FriendsList friendsId={userData?.friends} />}
            </div> */}
          </div>
        </>
      </div>
      <Footer />
    </>
  );
};

export default UserProfile;

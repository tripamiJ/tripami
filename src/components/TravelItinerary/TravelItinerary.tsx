import { useContext, useEffect, useState } from 'react';

import TravelCard from '~/components/TravelCard/TravelCard';
import useTravelsContext from '~/components/TravelItinerary/store';
import { firebaseErrors } from '~/constants/firebaseErrors';
import { AuthContext } from '~/providers/authContext';
import { postsCollection, tripsCollection } from '~/types/firestoreCollections';
import { IPost } from '~/types/post';
import { ITravel } from '~/types/travel';
import { IUser } from '~/types/user';

import { getDocs, onSnapshot, orderBy, query, where } from '@firebase/firestore';

import { Sort } from '../Sort/Sort';
import styles from './travelItinerary.module.css';

import 'swiper/css';

type SortBy = 'endDate' | 'rate' | 'alphabetically';

const getQuery = (sortBy: SortBy, isReverse: boolean, firestoreUser: IUser) => {
  switch (sortBy) {
    case 'alphabetically':
      return query(
        tripsCollection,
        where('userId', '==', firestoreUser?.id),
        orderBy('tripName', !isReverse ? 'desc' : 'asc')
      );
    case 'rate':
      return query(
        tripsCollection,
        where('userId', '==', firestoreUser?.id),
        orderBy('rate', !isReverse ? 'desc' : 'asc')
      );
    default:
      return query(
        tripsCollection,
        where('userId', '==', firestoreUser?.id),
        orderBy('endDate', !isReverse ? 'desc' : 'asc')
      );
  }
};

export const TravelItinerary = () => {
  const { firestoreUser } = useContext(AuthContext);
  const { travels, setTravels } = useTravelsContext();
  const [suggestedPosts, setSuggestedPosts] = useState<IPost[] | null>(null);
  const [isSuggestedPostsLoading, setIsSuggestedPostsLoading] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>('endDate');
  const [isReverse, setIsReverse] = useState(false);

  useEffect(() => {
    if (firestoreUser?.id) {
      const q = getQuery(sortBy, isReverse, firestoreUser);

      const unsub = onSnapshot(q, (querySnapshot: { docs: any[] }) => {
        const fetchedTravel = querySnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));
        setTravels(fetchedTravel as ITravel[]);
      });

      (async () => {
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
        } catch (err) {
          console.log(err);
          // @ts-ignore
          alert(firebaseErrors[err.code]);
        } finally {
          setIsSuggestedPostsLoading(false);
        }
      })();

      return () => {
        unsub();
      };
    }
  }, [firestoreUser?.id, isReverse, setTravels, sortBy]);

  return (
    <div className={styles.container}>
      {travels && travels.length > 0 ? (
        <>
          <p className={styles.title}>{firestoreUser?.username}`s travels</p>

          <div className={styles.travelsContainer}>
            <div style={{ alignSelf: 'flex-start' }}>
              <Sort
                onSelect={setSortBy}
                isReverse={isReverse}
                setReverse={() => setIsReverse((prevState) => !prevState)}
              />
            </div>
            {travels.map((travel) => (
              <TravelCard key={travel.id} travel={travel} />
            ))}
          </div>
        </>
      ) : (
        <p className={styles.text}>
          Hmm... {firestoreUser?.username} hasn't posted anything yet. Start sharing your experience
          with other participants!
        </p>
      )}
    </div>
  );
};

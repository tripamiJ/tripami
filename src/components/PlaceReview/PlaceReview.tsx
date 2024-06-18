import { FC, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { getDownloadURL, ref } from 'firebase/storage';
import { storage } from '~/firebase';
import { AuthContext } from '~/providers/authContext';
import { PlaceReviewType } from '~/types/placeReviews';

import Avatar from '@assets/icons/defaultUserIcon.svg';

import Rating from '../Rating';
import styles from './placeReview.module.css';

interface Props {
  review: PlaceReviewType;
}
const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const MAX_LENGTH = 200;

//@ts-ignore
const getDate = (timestamp) => {
  const options = {
    year: 'numeric' as const,
    month: 'long' as const,
    // day: 'numeric',
  };
  const date = new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
  return date.toLocaleString('en-US', options);
};

export const PlaceReview: FC<Props> = ({ review }) => {
  const { firestoreUser } = useContext(AuthContext);
  const [images, setImages] = useState<{ type: string; url: string }[]>([]);
  const [userAvatar, setUserAvatar] = useState<string>('');
  const [isExtended, setIsExtended] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const userAvatarRef = await getDownloadURL(ref(storage, review.authorAvatar));
      setUserAvatar(userAvatarRef);
    })();
  }, [review.authorAvatar]);

  useEffect(() => {
    (async () => {
      const images: { type: string; url: string }[] = await Promise.all(
        review.images.map(async (image) => {
          const url = await getDownloadURL(ref(storage, image.url));
          return { url, type: image.type };
        })
      );
      setImages(images);
    })();
  }, [review.images.join(',')]);

  return (
    <div className={styles.container}>
      <div className={styles.leftContainer}>
        <div className={styles.rate}>
          <Rating selectedStars={review.rate} />
        </div>
        <div className={styles.reviewInfoContainer}>
          <div className={styles.avatarContainer}>
            <img
              className={styles.avatar}
              src={userAvatar || Avatar}
              alt='user avatar'
              onClick={() => {
                if (review.authorId !== firestoreUser?.id) navigate(`/user/${review.authorId}`);
              }}
              style={{ cursor: review.authorId === firestoreUser?.id ? 'default' : 'pointer' }}
            />
            <div className={`${styles.name} ${styles.activeOnMobile}`}>{review.authorName}</div>
          </div>
          <div className={`${styles.upperRightContainer} ${styles.activeOnMobile}`}>
            <p>{getDate(review.createdAt)}</p>
          </div>
        </div>

        <div className={styles.secondContainer}></div>
      </div>
      <div className={styles.rightContainer}>
        <div className={`${styles.upperRightContainer} ${styles.inActiveOnMobile}`}>
          <div className={styles.name}>{review.authorName}</div>
          <div className={styles.dateContainer}>
            <p>{getDate(review.createdAt)}</p>
          </div>
        </div>
        <div className={styles.lowerRightContainer}>
          <div className={styles.imagesContainer}>
            {images.map((image, index) =>
              image.type.includes('image') ? (
                <img
                  key={image.url + index}
                  src={image.url}
                  alt='place image'
                  className={styles.image}
                />
              ) : (
                <video key={image.url + index} src={image.url} className={styles.image} />
              )
            )}
          </div>
          <div className={styles.descriptionContainer}>
            {isExtended ? (
              <>
                <p className={styles.description}>{review.text.replaceAll('<br />', '\n')}</p>
                <button className={styles.seeMoreButton} onClick={() => setIsExtended(false)}>
                  see less
                </button>
              </>
            ) : (
              <>
                <p className={styles.description}>
                  {review.text.slice(0, MAX_LENGTH).replaceAll('<br />', '\n')}...{' '}
                  {/* {trip.text.length > MAX_LENGTH && ( */}
                  {review.text.length > MAX_LENGTH && (
                    <button className={styles.seeMoreButton} onClick={() => setIsExtended(true)}>
                      see more
                    </button>
                  )}
                </p>
              </>
            )}
            {/* <div dangerouslySetInnerHTML={{ __html: trip.text }} /> */}
          </div>
        </div>
      </div>
    </div>
  );
};

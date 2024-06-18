import { FC, useContext, useEffect, useMemo, useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { useNavigate } from 'react-router-dom';

import { getDownloadURL, ref } from 'firebase/storage';
import 'swiper/css/pagination';
import { Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import { UserPostInfo } from '~/components/BigPost/UserPostInfo';
import { PostActions } from '~/components/PostActions';
import { storage } from '~/firebase';
import { usePost } from '~/hooks/post/usePost';
import { AuthContext } from '~/providers/authContext';
import { usersCollection } from '~/types/firestoreCollections';
import { IPost } from '~/types/post';
import { IUser } from '~/types/user';

import { getDocs, query, where } from '@firebase/firestore';

import styles from './posts.module.css';
import './styles.css';

import 'swiper/css';

interface Props {
  postData: IPost;
}

const PostItem: FC<Props> = ({ postData }) => {
  const [imageUrl, setImageUrl] = useState<string[] | null>(null);
  const [userData, setUserData] = useState<IUser | null>(null);
  const { imageUrls, createAt, userId, text, id } = postData;
  const { firestoreUser } = useContext(AuthContext);
  const { handleDeletePost, isLoading, setIsLoading, handleLikePost } = usePost(id);
  const navigate = useNavigate();
  const [userPhotoUrl, setUserPhotoUrl] = useState<string>();

  useEffect(() => {
    (async () => {
      try {
        if (userData?.avatarUrl) {
          const url = await getDownloadURL(ref(storage, userData?.avatarUrl));

          setUserPhotoUrl(url);
        }
      } catch (e) {
        console.log('[ERROR getting user image] => ', e);
      }
    })();
  }, [userData?.avatarUrl]);

  useEffect(() => {
    if (imageUrls[0]?.length) {
      (async () => {
        try {
          setIsLoading(true);
          const imagesUrls = [];

          for (let i = 0; i < imageUrls.length; i++) {
            const url = await getDownloadURL(ref(storage, imageUrls[i]));
            imagesUrls.push(url);
          }

          setImageUrl(imagesUrls);
        } catch (error) {
          console.log('[ERROR downloading image] => ', error);
        } finally {
          setIsLoading(false);
        }
      })();
    } else {
      setIsLoading(false);
    }
  }, [imageUrls.join(), setIsLoading]);

  useEffect(() => {
    (async () => {
      if (firestoreUser?.id && firestoreUser?.id !== userId) {
        try {
          setIsLoading(true);
          const q = query(usersCollection, where('id', '==', userId));
          const querySnapshot = await getDocs(q);
          const fetchedUser = querySnapshot.docs[0].data();

          setUserData(fetchedUser as IUser);
        } catch (error) {
          console.log('[ERROR getting user from firestore] => ', error);
        } finally {
          setIsLoading(false);
        }
      }
    })();
  }, [firestoreUser?.firebaseUid, firestoreUser?.id, setIsLoading, userId]);

  const isPostMy = useMemo(() => firestoreUser?.id === userId, [firestoreUser?.id, userId]);

  return (
    <div className={styles.cardContainer}>
      {!isPostMy ? (
        <UserPostInfo
          userData={{
            username: userData?.username,
            id: userData?.id,
            firebaseUid: userData?.firebaseUid,
            avatarUrl: userData?.avatarUrl,
          }}
          userPhotoUrl={userPhotoUrl}
          createdAt={createAt}
          postData={postData}
          imagesUrl={imageUrl}
        />
      ) : null}
      <div className={styles.header}>
        {!imageUrls?.[0]?.length || !imageUrls?.length ? (
          <span className={styles.captionWithoutImage}>{text}</span>
        ) : (
          <span className={styles.caption}>{text}</span>
        )}
      </div>

      <Swiper
        spaceBetween={0}
        slidesPerView={1}
        style={{ width: '100%' }}
        wrapperClass={styles.swiperWrapper}
        pagination={true}
        modules={[Pagination]}
      >
        {imageUrl?.map((link) => (
          <SwiperSlide key={link} style={{ display: 'flex', justifyContent: 'center' }}>
            <img
              className={styles.img}
              src={link || ''}
              alt='img'
              onLoadedData={() => setIsLoading(false)}
              style={{ height: '200px', width: '100%', objectFit: 'cover' }}
            />
          </SwiperSlide>
        ))}
      </Swiper>

      {isLoading && <Skeleton className={styles.loader} />}

      <PostActions
        postData={{
          ...postData,
          imageUrls: [...(imageUrl || '')],
        }}
      />
    </div>
  );
};

export default PostItem;

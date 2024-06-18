import { FC, useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { getDownloadURL, ref } from 'firebase/storage';
import { storage } from '~/firebase';
import { AuthContext } from '~/providers/authContext';
import { IPost } from '~/types/post';
import { IUser } from '~/types/user';

import Avatar from '@assets/icons/defaultUserIcon.svg';
import { timeAgo } from '@utils/daysAgo';

import styles from './userPostInfo.module.css';

interface Props {
  userData: IUser;
  createdAt: string;
  userPhotoUrl?: string;
  postData?: IPost;
  imagesUrl?: string[] | null;
  isMasterPage?: boolean;
}

export const UserPostInfo: FC<Props> = ({
  userData,
  createdAt,
  userPhotoUrl,
  postData,
  imagesUrl,
  isMasterPage = false,
}) => {
  const navigate = useNavigate();
  const { firestoreUser } = useContext(AuthContext);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  const handleOpenUserProfile = useCallback(() => {
    if (userData.id !== firestoreUser?.id) {
      navigate('/user/' + userData.id);
    } else {
      navigate('/profile');
    }
  }, [firestoreUser, navigate, userData]);

  useEffect(() => {
    if (userData?.avatarUrl) {
      (async () => {
        const avatarLink = await getDownloadURL(ref(storage, userData?.avatarUrl));
        setUserAvatar(avatarLink);
      })();
    }
  }, [userData?.avatarUrl, userPhotoUrl]);

  return (
    <div className={styles.userContainer}>
      <div className={styles.leftContainer} onClick={handleOpenUserProfile}>
        <img src={userAvatar || Avatar} style={{ width: 24, height: 24, borderRadius: 50 }} />
        <div>
          <p className={styles.location}>{userData?.username}</p>
          <p className={styles.postedAgo}>{timeAgo(createdAt)}</p>
        </div>
      </div>
      {!isMasterPage && (
        <button className={styles.button}>
          <p
            className={styles.buttonText}
            onClick={() =>
              navigate('/posts/' + postData?.id, {
                state: {
                  ...postData,
                  imageUrls: imagesUrl,
                },
              })
            }
          >
            view
          </p>
        </button>
      )}
    </div>
  );
};

import { FC, useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { deleteDoc, documentId } from 'firebase/firestore';
import { getDownloadURL } from 'firebase/storage';
import { Footer } from '~/components/Footer';
import { PageTitle } from '~/components/PageTitle';
import Header from '~/components/profile/Header';
import { firebaseErrors } from '~/constants/firebaseErrors';
import { db, storage } from '~/firebase';
import { AuthContext } from '~/providers/authContext';
import { friendsRequestsCollection, usersCollection } from '~/types/firestoreCollections';
import { FriendsRequestStatus } from '~/types/friends';
import { IInvitation } from '~/types/invitations';
import { IUser } from '~/types/user';

import defaultUserIcon from '@assets/icons/defaultUserIcon.svg';
import {
  addDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  query,
  updateDoc,
  where,
} from '@firebase/firestore';
import { ref } from '@firebase/storage';

import styles from './addNewFriends.module.css';

interface AddNewFriendsProps {
  user: IUser;
}

const AddNewFriends: FC<AddNewFriendsProps> = ({ user }) => {
  const [users, setUsers] = useState<IUser[]>([]);
  const [invitedUsers, setInvitedUsers] = useState<string[]>([]);
  const [invitationsFromUsers, setInvitationsFromUsers] = useState<string[]>([]);
  const [invitations, setInvitations] = useState<IInvitation[]>([]);
  const { firestoreUser } = useContext(AuthContext);

  useEffect(() => {
    (async () => {
      if (firestoreUser?.firebaseUid) {
        try {
          let q;
          if (user && user.friends && user.friends.length > 0) {
            q = query(
              usersCollection,
              where(documentId(), 'in', user.friends),
              where(documentId(), '!=', firestoreUser.id),
              limit(40)
            );
          } else if (user && user.friends && user.friends.length === 0) {
            q = null;
          } else {
            q = query(
              usersCollection,
              where('firebaseUid', '!=', firestoreUser?.firebaseUid),
              limit(40)
            );
          }

          if (!q) return;
          const querySnapshot = await getDocs(q);

          const fetchedUsers = querySnapshot.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id,
          }));

          setUsers(fetchedUsers as IUser[]);
        } catch (err) {
          // @ts-ignore
          console.error(firebaseErrors[err.code]);
          // alert(firebaseErrors[err.code]);
        }
      }
    })();

    if (firestoreUser?.id) {
      const q = query(
        friendsRequestsCollection,
        where('fromUser', '==', firestoreUser.id),
        where('status', '==', 'pending')
      );

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const fetchedDocs = querySnapshot.docs.map((doc) => doc.data().toUser);
        setInvitedUsers(fetchedDocs);
      });

      const qu = query(
        friendsRequestsCollection,
        where('toUser', '==', firestoreUser.id),
        where('status', '==', 'pending')
      );

      const unsub = onSnapshot(qu, (querySnapshot) => {
        const fetchedDocs = querySnapshot.docs.map((doc) => doc.data().fromUser);
        setInvitations(
          querySnapshot.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id,
          })) as IInvitation[]
        );
        setInvitationsFromUsers(fetchedDocs);
      });

      return () => {
        unsubscribe();
        unsub();
      };
    }
  }, [firestoreUser?.firebaseUid, firestoreUser?.id, user?.id]);

  if (user) {
    return (
      <div className={styles.container}>
        <div className={styles.usersContainer}>
          {users.map((user) => (
            <UserCard
              user={user}
              key={user.firebaseUid}
              invited={user.id ? invitedUsers.includes(user.id) : false}
              isFriend={
                firestoreUser?.friends && user.id ? firestoreUser?.friends.includes(user.id) : false
              }
              gotInvite={user.id ? invitationsFromUsers.includes(user.id) : false}
              invitation={invitations.find((invitation) => invitation.fromUser === user.id)}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.main}>
      <Header />
      <div className={styles.container} style={!user && { padding: '57px' }}>
        <PageTitle title={'Find friends & contacts'} />
        <p className={styles.subTitle}>Here you can see all users of the platform</p>
        <div className={styles.usersContainer}>
          {users.map((user) => (
            <UserCard
              user={user}
              key={user.firebaseUid}
              invited={user.id ? invitedUsers.includes(user.id) : false}
              isFriend={
                firestoreUser?.friends && user.id ? firestoreUser?.friends.includes(user.id) : false
              }
              gotInvite={user.id ? invitationsFromUsers.includes(user.id) : false}
              invitation={invitations.find((invitation) => invitation.fromUser === user.id)}
            />
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AddNewFriends;

interface Props {
  user: IUser;
  invited?: boolean;
  gotInvite?: boolean;
  invitation?: IInvitation;
  isFriend?: boolean;
  withDefaultUserImage?: boolean;
}

export const UserCard: FC<Props> = ({
  user,
  invited,
  gotInvite,
  invitation,
  isFriend,
  withDefaultUserImage,
}) => {
  const { firestoreUser } = useContext(AuthContext);
  const [userAvatar, setUserAvatar] = useState(defaultUserIcon);
  const [isImageLoading, setIsImageLoading] = useState(true);

  const handleSendFriendshipRequest = useCallback(async () => {
    if (firestoreUser?.id) {
      try {
        await addDoc(friendsRequestsCollection, {
          toUser: user.id,
          fromUser: firestoreUser.id,
          createdAt: new Date().toISOString(),
          status: FriendsRequestStatus.PENDING,
        });
      } catch (err) {
        console.log(err);
        // @ts-ignore
        alert(firebaseErrors[err]);
      }
    }
  }, [user, firestoreUser]);

  const handleAcceptFriendshipRequest = useCallback(async () => {
    if (
      firestoreUser?.id &&
      firestoreUser.friends &&
      invitation?.id &&
      user.friends &&
      user.id &&
      user.friends_count !== undefined &&
      firestoreUser.friends_count !== undefined
    ) {
      try {
        await updateDoc(doc(db, 'friends_requests', invitation.id), {
          status: 'accepted',
        });
        await updateDoc(doc(db, 'users', user.id), {
          friends: [...user.friends, firestoreUser.id],
          friends_count: user.friends_count + 1,
        });
        await updateDoc(doc(db, 'users', firestoreUser.id), {
          friends: [...firestoreUser.friends, user.id],
          friends_count: firestoreUser.friends_count + 1,
        });
      } catch (err) {
        // @ts-ignore
        alert(firebaseErrors[err.code]);
      }
    }
  }, [
    firestoreUser?.id,
    firestoreUser?.friends,
    invitation?.id,
    user.friends,
    user.id,
    user.friends_count,
    firestoreUser?.friends_count,
  ]);

  const handleRemoveFriend = useCallback(async () => {
    if (user.id && firestoreUser?.id && user?.friends && firestoreUser?.friends) {
      try {
        const indexOfUser = firestoreUser.friends?.indexOf(user.id);
        const newArrayOfUsersFriends = [...firestoreUser.friends];
        newArrayOfUsersFriends.splice(indexOfUser, 1);
        await updateDoc(doc(db, 'users', firestoreUser.id), {
          friends: [...newArrayOfUsersFriends],
          friends_count: firestoreUser.friends_count ? firestoreUser.friends_count - 1 : 0,
        });
      } catch (err) {
        // @ts-ignore
        alert(firebaseErrors[err.code]);
      }

      try {
        const indexOfUser = user.friends?.indexOf(firestoreUser.id);
        const newArrayOfUsersFriends = [...user.friends];
        newArrayOfUsersFriends.splice(indexOfUser, 1);
        await updateDoc(doc(db, 'users', user.id), {
          friends: [...newArrayOfUsersFriends],
          friends_count: user.friends_count ? user.friends_count - 1 : 0,
        });
      } catch (err) {
        // @ts-ignore
        alert(firebaseErrors[err.code]);
      }
    }
  }, [user, firestoreUser]);

  const getUserImage = useCallback(async () => {
    if (withDefaultUserImage || !user?.avatarUrl) {
      setIsImageLoading(false);
      return defaultUserIcon;
    }
    if (user?.avatarUrl) {
      const url = await getDownloadURL(ref(storage, user.avatarUrl));

      setUserAvatar(url);
      setIsImageLoading(false);
    }
  }, [withDefaultUserImage, user.avatarUrl]);

  useEffect(() => {
    getUserImage();
  }, [firestoreUser?.avatarUrl, getUserImage]);

  const navigate = useNavigate();

  const handleOpenUserProfile = useCallback(() => {
    if (user.id !== firestoreUser?.firebaseUid) {
      navigate('/user/' + user.id);
    } else {
      navigate('/profile');
    }
  }, [firestoreUser?.firebaseUid, navigate, user.id]);

  const handleCancelInvite = useCallback(async () => {
    if (firestoreUser?.id && user?.id) {
      try {
        const q = query(
          friendsRequestsCollection,
          where('fromUser', '==', firestoreUser.id),
          where('toUser', '==', user.id),
          where('status', '==', FriendsRequestStatus.PENDING)
        );

        const querySnapshot = await getDocs(q);
        querySnapshot.forEach(async (doc) => {
          await deleteDoc(doc.ref);
        });
      } catch (err) {
        console.error('Failed to cancel invite: ', err);
        // @ts-ignore
        alert(firebaseErrors[err.code] || 'An unexpected error occurred');
      }
    }
  }, [user, firestoreUser]);

  return (
    <div className={styles.cardMain}>
      <div className={styles.userCard} onClick={handleOpenUserProfile}>
        <img src={userAvatar} className={styles.avatar} alt='User avatar' />
        <div className={styles.userInfo}>
          <p className={styles.userName}>{user.username}</p>
          {user.whereToNext && (
            <p className={styles.whereTo}>
              Where to next? <p className={styles.orangeText}>{user.whereToNext}</p>
            </p>
          )}
        </div>
      </div>
      {!withDefaultUserImage ? (
        <>
          {!invited && !gotInvite && !isFriend ? (
            <button className={styles.addToFriendButton} onClick={handleSendFriendshipRequest}>
              Add to friends
            </button>
          ) : null}
          {gotInvite ? (
            <button className={styles.addToFriendButton} onClick={handleAcceptFriendshipRequest}>
              Accept friendship request
            </button>
          ) : null}
          {isFriend ? (
            <button
              className={`${styles.addToFriendButton} ${styles.removeFriend}`}
              onClick={handleRemoveFriend}
            >
              Remove friend
            </button>
          ) : null}

          {invited ? (
            <button
              className={`${styles.addToFriendButton} ${styles.invited}`}
              onClick={handleCancelInvite}
            >
              Invited
            </button>
          ) : null}
        </>
      ) : null}
    </div>
  );
};

import { FC, useCallback, useContext, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';

import { db } from '~/firebase';
import { AuthContext } from '~/providers/authContext';
import { commentsCollection, notificationsCollection } from '~/types/firestoreCollections';
import { IPost } from '~/types/post';

import { addDoc, doc, updateDoc } from '@firebase/firestore';

import styles from './commentField.module.css';

interface Props {
  postId: string;
  commentsCount: number;
  contentType: 'post' | 'trip';
  postOwnerId: string;
}

export const CommentField: FC<Props> = ({ postId, commentsCount, contentType, postOwnerId }) => {
  const { firestoreUser } = useContext(AuthContext);
  const [enteredText, setEnteredText] = useState('');
  const notify = (text: string) => {
    if (!toast.isActive('error')) {
      toast.error(text, { toastId: 'error' });
    }
  };

  const handleComment = useCallback(async () => {
    try {
      if (!enteredText) {
        notify('Please enter a comment');
        return;
      }
      const collection = contentType === 'post' ? 'posts' : 'trips';
      const docRef = doc(db, collection, postId);

      await updateDoc<IPost>(docRef, {
        comments_count: commentsCount + 1,
      });

      await addDoc(commentsCollection, {
        likes: [],
        dislikes: [],
        postId,
        userId: firestoreUser?.id,
        userName: firestoreUser?.username,
        userImage: firestoreUser?.avatarUrl,
        createdAt: new Date().toISOString(),
        text: enteredText,
      });

      setEnteredText('');
    } catch (e) {
      // @ts-ignore
      console.error(e);
      // alert(firebaseErrors[e.code]);
    }

    try {
      if (firestoreUser?.id === postOwnerId) return;
      await addDoc(notificationsCollection, {
        targetUserId: postOwnerId,
        postId,
        type: 'comment ' + contentType,
        text: enteredText,
        createdAt: new Date().toISOString(),
        isReaded: false,
      });
    } catch (e) {
      console.error(e);
    }
  }, [contentType, postId, commentsCount, firestoreUser?.id, firestoreUser?.username, enteredText]);

  return (
    <div className={styles.container}>
      <textarea
        className={styles.input}
        placeholder={'What are your thoughts?'}
        onChange={(event) => setEnteredText(event.target.value)}
        value={enteredText}
      />
      <div className={styles.buttonsContainer}>
        <button className={styles.commentButton} onClick={handleComment}>
          Comment
        </button>
      </div>

      <ToastContainer closeOnClick autoClose={2000} limit={1} pauseOnHover={false} />
    </div>
  );
};

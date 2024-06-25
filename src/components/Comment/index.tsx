import { FC, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { addDoc, documentId, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { UserPostInfo } from '~/components/BigPost/UserPostInfo';
import { CommentActions } from '~/components/CommentActions';
import { firebaseErrors } from '~/constants/firebaseErrors';
import { db } from '~/firebase';
import { AuthContext } from '~/providers/authContext';
import { IComment, IPlaceComment } from '~/types/comments';
import {
  notificationsCollection,
  repliesCollection,
  usersCollection,
} from '~/types/firestoreCollections';
import { NotificationType } from '~/types/notifications/notifications';

import { LikeIcon } from '@assets/icons/likeIcon';
import { doc, updateDoc } from '@firebase/firestore';

import styles from './comment.module.css';

interface Props {
  comment: IComment | IPlaceComment;
  isReply?: boolean;
  isCommentOpen?: boolean;
  contentType?: string;
}

export const Comment: FC<Props> = ({ comment, isReply, isCommentOpen = false, contentType }) => {
  const { likes, dislikes, id } = comment;
  const { firestoreUser } = useContext(AuthContext);
  const likedByUser = useMemo(
    () => firestoreUser?.id && likes.includes(firestoreUser.id),
    [likes, firestoreUser?.id]
  );
  const dislikedByUser = useMemo(
    () => firestoreUser?.id && dislikes.includes(firestoreUser.id),
    [dislikes, firestoreUser?.id]
  );
  const [userPhotoUrl, setUserPhotoUrl] = useState<string>();
  const [replies, setReplies] = useState<IComment[]>([]);
  const [enteredReply, setEnteredReply] = useState<string>('');
  const [isRepliesOpen, setIsRepliesOpen] = useState<boolean>(isCommentOpen);

  useEffect(() => {
    (async () => {
      if (comment.id) {
        const q = query(repliesCollection, where('commentId', '==', comment.id));
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const fetchedReplies = snapshot.docs.map((document) => ({
            ...document.data(),
            id: document.id,
          }));
          setReplies(fetchedReplies as IComment[]);
        });

        return () => unsubscribe();
      }
    })();
  }, [comment.id]);

  useEffect(() => {
    (async () => {
      if (comment.userId) {
        const q = query(usersCollection, where(documentId(), '==', comment.userId));
        const querySnapshot = await getDocs(q);
        const fetchedUser = querySnapshot.docs[0].data();

        setUserPhotoUrl(fetchedUser.avatarUrl);
      }
    })();
  }, [comment.userId, comment.userImage]);

  const spliceFromArr = useCallback((arr: string[], value: string) => {
    const index = arr.indexOf(value);

    const updatedArr = arr;
    updatedArr.splice(index, 1);

    return updatedArr;
  }, []);

  const handleLikeComment = useCallback(async () => {
    try {
      if (firestoreUser?.id) {
        const docRef = doc(db, 'places_comments', id);

        if (likes.includes(firestoreUser.id)) {
          const updatedArr = spliceFromArr(likes, firestoreUser.id);

          await updateDoc(docRef, {
            likes: [...updatedArr],
          });
        } else {
          let updatedDislikes = dislikes;

          if (dislikes.includes(firestoreUser.id)) {
            updatedDislikes = spliceFromArr(dislikes, firestoreUser.id);
          }

          await updateDoc(docRef, {
            likes: [...likes, firestoreUser.id],
            dislikes: [...updatedDislikes],
          });
        }
      }
    } catch (e) {
      // @ts-ignore
      alert(firebaseErrors[e.code]);
    }
  }, [firestoreUser?.id, id, likes, spliceFromArr, dislikes]);

  const handleDislikeComment = useCallback(async () => {
    try {
      if (firestoreUser?.id) {
        const docRef = doc(db, 'places_comments', id);

        if (dislikes.includes(firestoreUser.id)) {
          const updatedArr = spliceFromArr(dislikes, firestoreUser.id);

          await updateDoc(docRef, {
            dislikes: [...updatedArr],
          });
        } else {
          let updatedLikes = dislikes;

          if (likes.includes(firestoreUser.id)) {
            updatedLikes = spliceFromArr(likes, firestoreUser.id);
          }

          await updateDoc(docRef, {
            dislikes: [...dislikes, firestoreUser.id],
            likes: [...updatedLikes],
          });
        }
      }
    } catch (e) {
      // @ts-ignore
      alert(firebaseErrors[e.code]);
    }
  }, [firestoreUser?.id, id, dislikes, spliceFromArr, likes]);

  useEffect(() => {
    (async () => {
      if (comment.id) {
        const q = query(repliesCollection, where('commentId', '==', comment.id));
        const querySnapshot = await getDocs(q);
        const fetchedReplies = querySnapshot.docs.map((document) => document.data());

        setReplies(fetchedReplies as IComment[]);
      }
    })();
  }, [comment.id]);

  const handleReply = useCallback(async () => {
    try {
      if (enteredReply && firestoreUser?.id) {
        await addDoc(repliesCollection, {
          likes: [],
          dislikes: [],
          commentId: comment.id,
          userId: firestoreUser.id,
          userName: firestoreUser.username,
          userImage: firestoreUser.avatarUrl,
          createdAt: new Date().toISOString(),
          text: enteredReply,
        });

        if (firestoreUser.id !== comment.userId) {
          await addDoc(notificationsCollection, {
            createdAt: new Date().toISOString(),
            type:
              contentType === 'trip'
                ? NotificationType.NewReplyTrip
                : NotificationType.NewReplyPost,
            targetUserId: comment.userId,
            commentId: comment.id,
            postId: comment.postId,
            text: enteredReply,
            isReaded: false,
          });
        }
      }

      setEnteredReply('');
    } catch (e) {
      // @ts-ignore
      alert(firebaseErrors[e.code]);
    }
  }, [
    comment.id,
    enteredReply,
    firestoreUser?.avatarUrl,
    firestoreUser?.id,
    firestoreUser?.username,
  ]);

  return (
    <>
      <div className={`${styles.container} ${isReply ? styles.container_reply : ''}`}>
        <div className={styles.userAndActions}>
          <UserPostInfo
            userData={{
              username: comment.userName,
              id: comment.userId,
              firebaseUid: firestoreUser?.firebaseUid,
              avatarUrl: userPhotoUrl,
            }}
            createdAt={comment.createdAt}
          />

          {comment?.placeId ? (
            <div className={styles.footer}>
              <div className={styles.shareContainer} onClick={handleLikeComment}>
                <div>
                  <LikeIcon color={likedByUser ? '#55BEF5' : undefined} />
                </div>
                <span className={`${styles.share} ${likedByUser && styles.liked}`}>
                  {likes.length} Likes
                </span>
              </div>
              <div className={styles.shareContainer} onClick={handleDislikeComment}>
                <div className={styles.dislike}>
                  <LikeIcon color={dislikedByUser ? '#F00' : undefined} />
                </div>
                <span className={`${styles.share} ${dislikedByUser && styles.disliked}`}>
                  {dislikes?.length || 0} Dislikes
                </span>
              </div>
            </div>
          ) : (
            <>
              {!isReply && (
                <CommentActions
                  comment={comment}
                  setRepliesOpen={() => setIsRepliesOpen((prevState) => !prevState)}
                  isReply={isReply}
                  repliesCount={replies.length}
                />
              )}
            </>
          )}
        </div>
        <p className={styles.commentText}>{comment.text}</p>
        {!isReply && (
          <>
            {isRepliesOpen && (
              <>
                <div className={styles.replies_container}>
                  <div className={styles.replies_top}>
                    {firestoreUser?.firebaseUid !== comment.userId && (
                      <>
                        <input
                          type='text'
                          placeholder='Reply'
                          value={enteredReply}
                          onChange={(e) => setEnteredReply(e.target.value)}
                          className={styles.input}
                        />

                        <button className={styles.button} onClick={handleReply}>
                          Reply
                        </button>
                      </>
                    )}
                  </div>
                  {replies.length > 0 &&
                    replies?.map((reply) => {
                      return <Comment key={reply.id} comment={reply} isReply={true} />;
                    })}
                </div>
              </>
            )}
          </>
        )}
      </div>


    </>
  );
};

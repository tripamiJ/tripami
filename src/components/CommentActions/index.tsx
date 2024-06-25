import { FC, useContext, useMemo } from 'react';

import { useComment } from '~/hooks/comment/useComment';
import { AuthContext } from '~/providers/authContext';
import { IComment } from '~/types/comments';

import commentsIcon from '@assets/icons/comments.svg';
import { LikeIcon } from '@assets/icons/likeIcon';
import cn from 'classnames';

import styles from './commetActions.module.css';

interface Props {
  comment: IComment;
  setRepliesOpen: () => void;
  isReply?: boolean;
  repliesCount?: number;
}

export const CommentActions: FC<Props> = ({ comment, setRepliesOpen, isReply, repliesCount }) => {
  const { handleLikeComment, handleDislikeComment } = useComment(comment);
  const { likes, dislikes } = comment;
  const { firestoreUser } = useContext(AuthContext);
  const likedByUser = useMemo(
    () => firestoreUser?.id && likes.includes(firestoreUser.id),
    [likes, firestoreUser?.id]
  );
  const dislikedByUser = useMemo(
    () => firestoreUser?.id && dislikes.includes(firestoreUser.id),
    [dislikes, firestoreUser?.id]
  );

  function getReplyString(repliesCount: number): string {
    if (repliesCount === 0) {
      return 'No replies yet';
    } else if (repliesCount === 1) {
      return 'Reply';
    } else {
      return 'Replies';
    }
  }

  return (
    <div className={styles.footer}>
      <div className={styles.shareContainer} onClick={() => setRepliesOpen()}>
        <div>
          <img src={commentsIcon} alt='comments' className={styles.actionIcons}/>
        </div>
        <span className={`${styles.share}`}>
          {repliesCount ? repliesCount + ' ' : ''} {getReplyString(repliesCount)}
        </span>
      </div>
      <div className={styles.shareContainer} onClick={handleLikeComment}>
        <div className={styles.actionIcons}>
          <LikeIcon color={likedByUser ? '#55BEF5' : undefined} />
        </div>
        <span className={`${styles.share} ${likedByUser ? styles.liked : ''}`}>
          {likes.length} Likes
        </span>
      </div>
      <div className={styles.shareContainer} onClick={handleDislikeComment}>
        <div className={cn([styles.dislike, styles.actionIcons])}>
          <LikeIcon color={dislikedByUser ? '#F00' : undefined} />
        </div>
        <span className={`${styles.share} ${dislikedByUser && styles.disliked}`}>
          {dislikes?.length || 0} Dislikes
        </span>
      </div>
    </div>
  );
};

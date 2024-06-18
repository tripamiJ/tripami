import { FC } from 'react';
import { useNavigate } from 'react-router-dom';

import { doc, updateDoc } from 'firebase/firestore';
import { db } from '~/firebase';
import { Notification, NotificationType } from '~/types/notifications/notifications';

import styles from './notifications.module.css';

interface Props {
  notifications: Notification[];
  deleteMessages: () => void;
  deleteMessage: (id: string) => void;
  onClose: () => void;
}

const getTitle = (type: NotificationType) => {
  switch (type.toLowerCase()) {
    case NotificationType.NewPost:
      return 'Your friend has created a new post!';
    case NotificationType.CommentPost:
      return 'Somebody has commented on your post:';
    case NotificationType.CommentTrip:
      return 'Somebody has commented on your trip:';
    case NotificationType.NewTrip:
      return 'Your friend has created a new trip!';
    case NotificationType.NewReplyPost:
    case NotificationType.NewReplyTrip:
      return 'Somebody has replied to your comment:';
    default:
      return '';
  }
};

const getWay = (type: NotificationType) => {
  switch (type.toLowerCase()) {
    case NotificationType.NewTrip:
    case NotificationType.CommentTrip:
    case NotificationType.NewReplyTrip:
      return 'trip';
    case NotificationType.NewReplyPost:
    case NotificationType.NewPost:
    case NotificationType.CommentPost:
      return 'posts';
    default:
      return '';
  }
};

export const Notifications: FC<Props> = ({
  notifications,
  deleteMessages,
  deleteMessage,
  onClose,
}) => {
  const navigate = useNavigate();
  const handleNavigate = (notification: Notification) => {
    switch (notification.type) {
      case NotificationType.NewPost:
      case NotificationType.NewTrip:
        navigate(`/${getWay(notification.type)}/${notification.postId}`);
        break;
      case NotificationType.CommentPost:
      case NotificationType.CommentTrip:
      case NotificationType.NewReplyPost:
      case NotificationType.NewReplyTrip:
        handleOpenComment(notification);
        break;
      default:
        break;
    }
  };

  const handleOpenComment = (notification: Notification) => {
    (async () => {
      try {
        if (notification.isReaded === false) {
          const docRef = doc(db, 'notifications', notification.id);
          await updateDoc(docRef, {
            isReaded: true,
          });
        }
        const way = getWay(notification.type);
        navigate(`/${way}/${notification.postId}`, {
          state: { open_comment: notification.commentId },
        });
      } catch (e) {
        console.error(e);
      }
    })();
  };

  return (
    <>
      <div className={styles.container} onBlur={() => onClose()}>
        <div className={styles.container_top}>
          <p className={styles.title}>Notifications</p>
          {notifications.length > 0 && (
            <button className={`${styles.button} ${styles.button_delete}`} onClick={deleteMessages}>
              Delete messages
            </button>
          )}
        </div>

        <div className={styles.notifications_container}>
          {notifications.length === 0 ? (
            <p className={styles.base_text}>There are no any new notifications</p>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`${styles.notification} ${notification.isReaded ? styles.notification_readed : ''}`}
              >
                <div>
                  <p className={styles.base_text}>{getTitle(notification.type)}</p>
                  {notification.text && (
                    <p className={styles.text}>
                      {notification.text.length > 20
                        ? notification.text.slice(0, 80) + '...'
                        : notification.text}
                    </p>
                  )}
                </div>
                <div className={styles.control_container}>
                  <button className={styles.button} onClick={() => handleNavigate(notification)}>
                    Check
                  </button>
                  <button
                    className={`${styles.button} ${styles.button_remove}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteMessage(notification.id);
                    }}
                  >
                    X
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

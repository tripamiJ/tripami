import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { FileUploader } from 'react-drag-drop-files';
import { ToastContainer, toast } from 'react-toastify';

import { doc, getDocs, limit, query, updateDoc, where } from 'firebase/firestore';
import { getBlob, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import CustomTabs from '~/components/CustomTabs';
import { LoadingScreen } from '~/components/LoadingScreen';
import { firebaseErrors } from '~/constants/firebaseErrors';
import { db, storage } from '~/firebase';
import { AuthContext } from '~/providers/authContext';
import { notificationsCollection, postsCollection } from '~/types/firestoreCollections';
import { NotificationType } from '~/types/notifications/notifications';
import { IPost } from '~/types/post';

import { ImageIcon } from '@assets/icons/imageIcon';
import { TextIcon } from '@assets/icons/textIcon';
import { addDoc } from '@firebase/firestore';
import { ref, uploadBytes } from '@firebase/storage';

import styles from './createPostModal.module.css';

const fileTypes = ['JPEG', 'PNG', 'JPG'];

interface Props {
  closeModal: () => void;
  startPost?: IPost;
}

const CreatePostModal: React.FC<Props> = ({ closeModal, startPost }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [filesList, setFilesList] = useState<null | File[]>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [postText, setPostText] = useState(startPost?.text || '');
  const [selectedStars, setSelectedStars] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isMaxError, setIsMaxError] = useState(false);
  // const [images, setImages] = useState<string[]>(startPost?.imageUrls || []);

  useEffect(() => {
    (async () => {
      const files = [];
      if (startPost?.imageUrls) {
        for (let i = 0; i < startPost.imageUrls.length; i++) {
          const url = await getDownloadURL(ref(storage, startPost.imageUrls[i]));
          const blob = await getBlob(ref(storage, startPost.imageUrls[i]));
          const file = new File([blob], startPost.imageUrls[i]);
          files.push(file);
        }
        setFilesList(files);
      }
    })();
  }, [startPost]);

  useEffect(() => {
    if (isMaxError) {
      notify('The maximum number of photos is 3');

      setIsMaxError(false);
    }
  }, [isMaxError]);

  const { firestoreUser, updateFirestoreUser } = useContext(AuthContext);

  const notify = (text: string) => toast.error(text);

  const handleChange = useCallback(
    (file: FileList) => {
      if (!filesList || (filesList && filesList?.length < 3)) {
        setFilesList((prevState) => {
          if (
            (prevState && Object.values(file).length + prevState?.length > 3) ||
            Object.values(file).length > 3
          ) {
            setIsMaxError(true);
            return prevState;
          }
          if (prevState) {
            return [...prevState, ...Object.values(file)];
          } else {
            return Object.values(file);
          }
        });
      }

      if (filesList && filesList?.length === 3) {
        notify('The maximum number of photos is 3');
      }
    },
    [filesList]
  );

  const handleChangeTab = useCallback(
    (activeTabIndex: number) => {
      setActiveTab(activeTabIndex);
    },
    [setActiveTab]
  );

  const handleSavePost = useCallback(async () => {
    try {
      setIsLoading(true);

      const imageUrls: string[] = [];

      if (filesList) {
        for (let i = 0; i < filesList?.length; i++) {
          const storageRef = ref(storage, `postsImages/${filesList[i]?.name + uuidv4()}`);

          if (filesList[i]) {
            const uploadResult = await uploadBytes(storageRef, filesList[i]);
            imageUrls.push(uploadResult.ref.fullPath);
          }
        }
      }

      if (startPost) {
        const docRef = doc(db, 'posts', startPost.id);
        await updateDoc(docRef, {
          imageUrls: imageUrls,
          text: postText,
        });
      } else {
        const time = new Date().toISOString();
        await addDoc(postsCollection, {
          userId: firestoreUser?.id,
          createAt: time,
          comments: [],
          comments_count: 0,
          likes: [],
          imageUrls: imageUrls,
          text: postText,
        });

        // const q = query(usersCollection, where(documentId(), '==', comment.userId),);
        // const newPost = await db.collection('posts').where('userId', '==', firestoreUser?.id).orderBy('createAt', 'desc').limit(1).get();
        const q = query(
          postsCollection,
          where('userId', '==', firestoreUser?.id),
          where('createAt', '==', time),
          limit(1)
        );
        const querySnapshot = await getDocs(q);

        if (firestoreUser?.friends) {
          firestoreUser?.friends.forEach(async (friendId) => {
            await addDoc(notificationsCollection, {
              targetUserId: friendId,
              postId: querySnapshot.docs[0].id,
              type: NotificationType.NewPost,
              createdAt: new Date().toISOString(),
              isReaded: false,
            });
          });
        }

        updateFirestoreUser({
          postsCount: firestoreUser?.postsCount ? firestoreUser?.postsCount + 1 : 1,
        });
      }

      closeModal();
    } catch (err) {
      // @ts-ignore
      console.error(firebaseErrors[err.code]);
    } finally {
      setIsLoading(false);
    }
  }, [
    filesList,
    startPost,
    closeModal,
    postText,
    firestoreUser?.id,
    firestoreUser?.postsCount,
    updateFirestoreUser,
  ]);

  const content = useMemo(() => {
    switch (activeTab) {
      case 0:
        return (
          <>
            <textarea
              className={styles.textArea}
              placeholder={'Describe your post...'}
              onChange={(e) => setPostText(e.target.value)}
              value={postText}
            />
          </>
        );
      case 1:
        return (
          <div className={styles.imageContainer}>
            {filesList ? (
              <div className={styles.uploadOuterContainer}>
                {filesList.map((item) => (
                  <div className={styles.imagesContainer} key={item.name}>
                    <img
                      src={URL.createObjectURL(item)}
                      alt={'User image'}
                      className={styles.image}
                    />
                  </div>
                ))}
                <p className={styles.delete} onClick={() => setFilesList(null)}>
                  Delete
                </p>
              </div>
            ) : null}
            <FileUploader
              multiple={true}
              handleChange={handleChange}
              name='file'
              types={fileTypes}
              onTypeError={() => notify('Unsupported file type')}
              classes={`${styles.uploadMainContainer}`}
              hoverTitle={' '}
              onDraggingStateChange={(state: boolean) => setIsDragging(state)}
            >
              <div
                className={styles.uploadContainer}
                style={filesList ? { zIndex: -9 } : undefined}
              >
                <p>Drag and drop image or</p>
                <button className={styles.buttonUpload}>Upload</button>
              </div>
            </FileUploader>
          </div>
        );
      default:
        return null;
    }
  }, [isDragging, activeTab, filesList, postText]);

  return (
    <div className={styles.outer_container}>
      <CustomTabs
        handleChangeTab={handleChangeTab}
        tabs={[
          {
            index: 0,
            label: 'Post',
            Icon: <TextIcon color={activeTab === 0 ? '#FF4D00' : undefined} />,
          },
          {
            index: 1,
            label: 'Image and Video',
            Icon: <ImageIcon color={activeTab === 1 ? '#FF4D00' : undefined} />,
          },
        ]}
        activeTab={activeTab}
      />
      <div className={styles.container}>
        {content}
        <div className={styles.bottomRow}>
          <button className={styles.button} onClick={handleSavePost}>
            Post
          </button>
          <button className={`${styles.button} ${styles['button-gray']}`} onClick={closeModal}>
            Cancel
          </button>
        </div>
      </div>

      {isLoading && <LoadingScreen />}

      <ToastContainer closeOnClick autoClose={2000} limit={1} pauseOnHover={false} />
    </div>
  );
};

export default CreatePostModal;

import { FC, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { FileUploader } from 'react-drag-drop-files';
import { ToastContainer, toast } from 'react-toastify';

import { addDoc, collection, doc, updateDoc } from 'firebase/firestore';
import { getBlob, ref, uploadBytes } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { ImageIcon } from '~/assets/icons/imageIcon';
import { TextIcon } from '~/assets/icons/textIcon';
import { firebaseErrors } from '~/constants/firebaseErrors';
import { db, storage } from '~/firebase';
import { AuthContext } from '~/providers/authContext';
import { PlaceReviewType } from '~/types/placeReviews';

import CustomTabs from '../CustomTabs';
import { LoadingScreen } from '../LoadingScreen';
import Rating from '../Rating';
import styles from './createReviewModal.module.css';

const fileTypes = ['JPEG', 'PNG', 'JPG'];

interface Props {
  closeModal: () => void;
  placeId: string;
  startReview?: PlaceReviewType;
  placeName: string;
}

export const CreateReviewModal: FC<Props> = ({ closeModal, placeId, startReview, placeName }) => {
  const { firestoreUser, updateFirestoreUser } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState(0);
  const [filesList, setFilesList] = useState<null | File[]>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [postText, setPostText] = useState(startReview?.text || '');
  const [selectedStars, setSelectedStars] = useState(startReview?.rate || 0);
  const [isLoading, setIsLoading] = useState(false);
  const [isMaxError, setIsMaxError] = useState(false);

  useEffect(() => {
    if (isMaxError) {
      notify('The maximum number of photos is 3');

      setIsMaxError(false);
    }
  }, [isMaxError]);

  const notify = (text: string) => toast.error(text);

  useEffect(() => {
    (async () => {
      const files = [];
      if (startReview?.images) {
        for (let i = 0; i < startReview.images.length; i++) {
          const blob = await getBlob(ref(storage, startReview.images[i]));
          const file = new File([blob], startReview.images[i]);
          files.push(file);
        }
        setFilesList(files);
      }
    })();
  }, [startReview]);

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

      const imageUrls: { url: string; type: string }[] = [];

      if (filesList) {
        for (let i = 0; i < filesList?.length; i++) {
          const storageRef = ref(storage, `reviews/${filesList[i]?.name + uuidv4()}`);

          if (filesList[i]) {
            const uploadResult = await uploadBytes(storageRef, filesList[i]);
            imageUrls.push({ url: uploadResult.ref.fullPath, type: filesList[i].type });
          }
        }
      }

      (async () => {
        if (startReview) {
          await updateDoc(doc(db, 'reviews', startReview.id), {
            text: postText,
            rate: selectedStars,
            images: imageUrls,
          });
        } else {
          await addDoc(collection(db, 'reviews'), {
            authorId: firestoreUser?.id,
            authorName: firestoreUser?.username,
            authorAvatar: firestoreUser?.avatarUrl,
            text: postText,
            rate: selectedStars,
            images: imageUrls,
            createdAt: new Date(),
            placeId: placeId,
            placeName: placeName,
          });
        }
      })();

      closeModal();
    } catch (err) {
      // @ts-ignore
      console.error(firebaseErrors[err.code]);
    } finally {
      setIsLoading(false);
    }
  }, [
    filesList,
    // startPost,
    placeId,
    selectedStars,
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
              placeholder={'Describe your experience...'}
              onChange={(e) => setPostText(e.target.value)}
              value={postText}
            />
            <div className={styles.rateContainer}>
              <p>Your Rate:</p>
              <Rating
                selectedStars={selectedStars}
                setSelectedStars={setSelectedStars}
                disabled={false}
              />
            </div>
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
    }
  }, [isDragging, activeTab, filesList, postText, selectedStars]);

  return (
    <div className={styles.outer_container}>
      <CustomTabs
        handleChangeTab={handleChangeTab}
        tabs={[
          {
            index: 0,
            label: 'Review',
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
          <button
            className={`${styles.button} ${styles['button-gray']}`}
            onClick={() => closeModal()}
          >
            Cancel
          </button>
        </div>
      </div>

      {isLoading && <LoadingScreen />}

      <ToastContainer closeOnClick autoClose={2000} limit={1} pauseOnHover={false} />
    </div>
  );
};

import React, { FC, useContext, useState } from 'react';
import Cropper from 'react-cropper';
import { FileUploader } from 'react-drag-drop-files';

import { getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { LoadingScreen } from '~/components/LoadingScreen';
import { db, storage } from '~/firebase';
import { AuthContext } from '~/providers/authContext';

import { doc, updateDoc } from '@firebase/firestore';
import { ref, uploadBytes } from '@firebase/storage';

import styles from './imageUploaderModal.module.css';
import './styles.css';

import 'cropperjs/dist/cropper.css';

const fileTypes = ['JPEG', 'PNG', 'GIF', 'JPG'];

interface Props {
  closeModal: () => void;
}

export const ImageUploaderModal: FC<Props> = ({ closeModal }) => {
  const [file, setFile] = useState<null | File>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cropper, setCropper] = useState<Cropper | null>(null);
  const { firestoreUser } = useContext(AuthContext);

  const handleChange = (file: File) => {
    setFile(file);
  };

  const getCropData = async () => {
    if (cropper && firestoreUser?.username) {
      setIsLoading(true);
      const storageRef = ref(storage, `usersAvatars/${firestoreUser?.username + uuidv4()}`);

      try {
        const croppedImage = await fetch(cropper.getCroppedCanvas().toDataURL())
          .then((res) => res.blob())
          .then((blob) => {
            return new File([blob], 'newAvatar.png', { type: 'image/png' });
          });

        if (croppedImage && firestoreUser?.id) {
          const uploadResult = await uploadBytes(storageRef, croppedImage);

          await updateDoc(doc(db, 'users', firestoreUser?.id), {
            avatarUrl: uploadResult.ref.fullPath,
          });

          closeModal();
        }
      } catch (e) {
        // @ts-ignore
        console.error(firestoreUser[e.code]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <>
      {file ? (
        <>
          {/*{!!croppedImageUrl ? <img src={croppedImageUrl} style={{height: 200, width: 200}}/> : null}*/}
          <Cropper
            src={URL.createObjectURL(file)}
            style={{ height: '90%', width: '100%', borderRadius: 50 }}
            initialAspectRatio={1}
            aspectRatio={1}
            minCropBoxHeight={100}
            minCropBoxWidth={100}
            guides={false}
            cropBoxResizable={false}
            checkOrientation={false}
            onInitialized={(instance) => {
              setCropper(instance);
            }}
          />
          <div className={styles.buttonsContainer}>
            <button className={`${styles.saveButton} ${styles.cancel}`} onClick={closeModal}>
              Cancel
            </button>
            <button className={styles.saveButton} onClick={getCropData}>
              Save
            </button>
          </div>
        </>
      ) : (
        <FileUploader
          multiple={false}
          handleChange={handleChange}
          name='file'
          types={fileTypes}
          classes={`${styles.uploadOuterContainer}`}
          hoverTitle={' '}
          onDraggingStateChange={(state: boolean) => setIsDragging(state)}
        >
          <div className={styles.uploadContainer}>
            <p>Drag and drop image or</p>
            <button className={styles.buttonUpload}>Upload</button>
          </div>
        </FileUploader>
      )}

      {isLoading && <LoadingScreen />}
    </>
  );
};

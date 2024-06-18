import { FC, useCallback, useContext, useEffect, useState } from 'react';
import Modal from 'react-modal';
// import ReactQuill from 'react-quill';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';

import { collection, getDocs, query, where } from 'firebase/firestore';
import { getDownloadURL } from 'firebase/storage';
import CreateTripModal from '~/components/CreateTripModal';
import CustomModal from '~/components/CustomModal';
import Rating from '~/components/Rating';
import { db, storage } from '~/firebase';
import { AuthContext } from '~/providers/authContext';
import { commentsCollection } from '~/types/firestoreCollections';
import { ITravel } from '~/types/travel';

import BinIcon from '@assets/icons/BinIcon.svg';
import commentsIcon from '@assets/icons/comments.svg';
import Dots from '@assets/icons/dots.svg';
import shareIcon from '@assets/icons/share.svg';
import TouchIcon from '@assets/icons/touch.svg';
import { deleteDoc, doc } from '@firebase/firestore';
import { ref } from '@firebase/storage';

import { DropdownProvider } from '../DropdownProvider/DropdownProvider';
import { LightBox } from '../Lightbox/LightBox';
import ShareModal from '../ShareModal/ShareModal';
import styles from './travelCard.module.css';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';

interface Props {
  travel: ITravel;
}

const notifyInfo = (message: string) => {
  if (!toast.isActive('info')) {
    toast.info(message, { toastId: 'info' });
  }
};
const notifyError = (message: string) => toast.error(message);

const TravelCard: FC<Props> = ({ travel }) => {
  const { firestoreUser, updateFirestoreUser } = useContext(AuthContext);
  const [imageDownloadUrls, setImageDownloadUrls] = useState<
    { url: string; type: string; description: string }[]
  >([]);
  const {
    startDate,
    endDate,
    rate,
    imageUrl,
    text,
    userId,
    comments_count,
    tripName,
    dayDescription,
    cities,
    id,
  } = travel;
  const navigate = useNavigate();
  const [editModalIsOpen, setEditModalIsOpen] = useState(false);
  const [isPhotosModalOpen, setIsPhotosModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isModalDeleteOpen, setIsModalDeleteOpen] = useState(false);
  const [isModalShareOpen, setIsModalShareOpen] = useState(false);

  const handleDeleteTrip = useCallback(async () => {
    try {
      await deleteDoc(doc(db, 'trips', id));

      const subcollectionCities = collection(db, `trips/${id}/cities`);
      const subcollectionPlaces = collection(db, `trips/${id}/places`);

      const queryCities = query(subcollectionCities);
      const queryPlaces = query(subcollectionPlaces);

      const [querySnapshotCities, querySnapshotPlaces] = await Promise.all([
        getDocs(queryCities),
        getDocs(queryPlaces),
      ]);

      const deleteCitiesPromises = querySnapshotCities.docs.map((doc) => deleteDoc(doc.ref));
      const deletePlacesPromises = querySnapshotPlaces.docs.map((doc) => deleteDoc(doc.ref));

      await Promise.all([...deleteCitiesPromises, ...deletePlacesPromises]);

      const queryComments = query(commentsCollection, where('postId', '==', id));
      const querySnapshotComments = await getDocs(queryComments);
      querySnapshotComments.docs.map((doc) => deleteDoc(doc.ref));

      updateFirestoreUser({
        tripCount: firestoreUser?.tripCount ? firestoreUser?.tripCount - 1 : 0,
      });
      notifyInfo('Trip deleted successfully');
    } catch (err) {
      notifyError('Error deleting trip');
      console.log('[ERROR deleting trip] => ', err);
    }
  }, [firestoreUser?.tripCount, id, updateFirestoreUser]);

  useEffect(() => {
    (async () => {
      try {
        const downloadedUrls = [];

        for (let i = 0; i < imageUrl.length; i++) {
          let url;
          if (imageUrl[i].url.includes('htttp://firebasestorage.googleapis.com')) {
            url = imageUrl[i].url;
          } else {
            url = await getDownloadURL(ref(storage, imageUrl[i].url));
          }
          downloadedUrls.push({
            url,
            type: imageUrl[i].type,
            description: imageUrl[i].description,
          });
        }

        setImageDownloadUrls(downloadedUrls);
      } catch (err) {
        console.log('[ERROR getting download url for the image] => ', err);
      }
    })();
  }, [imageUrl]);

  // const getLayout = useMemo(() => {
  //   switch (imageDownloadUrls?.length) {
  //     case 1:
  //       return [1];
  //     case 2:
  //       return [1, 1];
  //     case 3:
  //       return [1, 2];
  //     case 4:
  //       return [2, 2];
  //     case 5:
  //       return [1, 4];
  //     default:
  //       return [];
  //   }
  // }, [imageDownloadUrls?.length]);

  // const getHeight = useMemo(() => {
  //   switch (imageDownloadUrls?.length) {
  //     case 1:
  //       return ['250px'];
  //     case 2:
  //       return ['150px', '100px'];
  //     case 3:
  //       return ['150px', '100px'];
  //     case 4:
  //       return ['125px', '125px'];
  //     case 5:
  //       return ['150px', '100px'];
  //     default:
  //       return [];
  //   }
  // }, [imageDownloadUrls?.length]);

  // const setting = useMemo(() => {
  //   return {
  //     width: '400px',
  //     height: getHeight,
  //     layout: getLayout,
  //     photos: imageDownloadUrls.map((item) => ({ source: item.url })),
  //     showNumOfRemainingPhotos: true,
  //   };
  // }, [getHeight, getLayout, imageDownloadUrls]);

  const handleCloseEditModal = useCallback(() => {
    setEditModalIsOpen(false);
  }, []);
  return (
    <div className={styles.container}>
      <div className={styles.topContainer}>
        {/* <p className={styles.location} onClick={() => navigate('/trip/' + id)}>{location.name.toString()}</p> */}
        <Rating disabled selectedStars={rate} />
        <div className={styles.dateContainer}>
          <p className={styles.date}>
            {startDate.split('/')[1]}/{startDate.split('/')[0]}/{startDate.split('/')[2]} -{' '}
            {endDate.split('/')[1]}/{endDate.split('/')[0]}/{endDate.split('/')[2]}
            {/* {startDate} - {endDate} */}
          </p>
        </div>
      </div>

      <div className={styles.mainContainer}>
        <div className={`${styles.gallery} ${styles.hideOnMobile}`}>
          {/* {setting.photos.length > 0 && getLayout.length && getHeight.length ? (
            <ReactPhotoCollage {...setting}/>
          ) : null} */}

          {imageDownloadUrls.map((image, index) => {
            if (image.type.includes('image')) {
              return (
                <img
                  key={index}
                  src={image.url}
                  alt='travel'
                  className={styles.image}
                  onClick={() => {
                    setSelectedImage(image);
                    setIsPhotosModalOpen(true);
                    document.body.style.overflow = 'hidden';
                  }}
                />
              );
            } else if (image.type.includes('video')) {
              return (
                <video
                  key={index}
                  src={image.url}
                  className={styles.image}
                  controls
                  onClick={() => {
                    setSelectedImage(image);
                    setIsPhotosModalOpen(true);
                  }}
                  // onClick={() => setIsPhotosModalOpen(true)}
                />
              );
            }
          })}
        </div>

        <div className={`${styles.gallery} ${styles.showOnMobile}`}>
          <Swiper
            spaceBetween={0}
            slidesPerView={1}
            style={{ width: '100%', height: '100%' }}
            pagination={{ clickable: true }}
            modules={[Pagination]}
          >
            {imageDownloadUrls.map((image, index) => {
              if (image.type.includes('image')) {
                return (
                  <SwiperSlide key={index}>
                    <img
                      key={index}
                      src={image.url}
                      alt='travel'
                      className={styles.image}
                      onClick={() => {
                        setSelectedImage(image);
                        setIsPhotosModalOpen(true);
                        document.body.style.overflow = 'hidden';
                      }}
                    />
                  </SwiperSlide>
                );
              } else if (image.type.includes('video')) {
                return (
                  <SwiperSlide key={index}>
                    <video
                      src={image.url}
                      className={styles.image}
                      controls
                      onClick={() => {
                        setSelectedImage(image);
                        setIsPhotosModalOpen(true);
                      }}
                    />
                  </SwiperSlide>
                );
              }
            })}
          </Swiper>
        </div>


        <div className={styles.textContainer}>
          <h3 className={styles.tripName}>{tripName}</h3>
          {/* <p className={styles.text} style={{ wordBreak: 'break-all', whiteSpace: 'pre-line' }}>
            {text}
          </p> */}
          {/* <div dangerouslySetInnerHTML={{ __html: text }} /> */}
          <div className={styles.tripText} style={{ textIndent: '1em', whiteSpace: 'pre-line' }}>
            {text.replaceAll('<br />', '\n')}
          </div>
          {dayDescription && dayDescription.length > 0 && (
            <div>
              <h4 className={styles.subtitle}>Daily Journal</h4>

              <div className={styles.daysDescriptionContainer}>
                {dayDescription &&
                  dayDescription.map((day, index) => (
                    <div key={`day_${index}`} className={styles.dayDescription}>
                      <p className={styles.date}>
                        {day.date.split('/')[1]}/{day.date.split('/')[0]}/{day.date.split('/')[2]}
                      </p>
                      <p className={`${styles.additionalText} ${styles.text}`}>{day.description}</p>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <div className={styles.visitedContainer}>
            {cities && cities?.length > 0 && (
              <div>
                <div className={styles.info_container}>
                  <p className={styles.mark}>Locations: </p>
                  <div className={styles.info_button}>
                    <DropdownProvider
                      side='top'
                      trigger={<img className={styles.info} src={TouchIcon} alt='info' />}
                      content={
                        <div className={styles.info_box}>
                          <p>click tag</p>
                        </div>
                      }
                    />
                  </div>
                </div>
                <div className={styles.tagsContainer}>
                  {travel?.cities?.map((tag) => (
                    <p
                      onClick={() => navigate('/place/' + tag.placeID)}
                      key={tag.placeID}
                      className={styles.tag}
                    >
                      {tag.address}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <div>
              {travel.geoTags && travel.geoTags.length > 0 && (
                <>
                  <div className={styles.info_container}>
                    <p className={styles.mark}>Spots: </p>
                    <div className={styles.info_button}>
                      <DropdownProvider
                        side='top'
                        trigger={<img className={styles.info} src={TouchIcon} alt='info' />}
                        content={
                          <div className={styles.info_box}>
                            <p>Click tag</p>
                          </div>
                        }
                      />
                    </div>
                  </div>
                  <div className={styles.tagsContainer}>
                    {travel?.geoTags?.map((tag) => (
                      <p
                        onClick={() => navigate('/place/' + tag.placeID)}
                        key={tag.placeID}
                        className={styles.tag}
                      >
                        {tag.address.split(',')[0]}
                      </p>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        <div className={styles.shareContainer}>
          <img className={styles.commentsIcon} src={commentsIcon} alt='comments' />
          <span className={styles.comments} onClick={() => navigate('/trip/' + id)}>
            {comments_count} Comments
          </span>
        </div>
        <div className={styles.shareContainer} onClick={() => setIsModalShareOpen(true)}>
          <img className={styles.shareIcon} src={shareIcon} alt='share' />
          <span className={styles.share}>Share</span>
        </div>
        {firestoreUser?.id === userId ? (
          <>
            <div className={styles.shareContainer} onClick={() => setIsModalDeleteOpen(true)}>
              <img className={styles.dotsIcon} src={BinIcon} alt='dots' />
              <span className={styles.share}>Delete</span>
            </div>
            <div className={styles.shareContainer} onClick={() => setEditModalIsOpen(true)}>
              <img className={styles.dotsIcon} src={Dots} alt='dots' />
              <span className={styles.share}>Edit</span>
            </div>
          </>
        ) : null}
      </div>

      <ShareModal
        isOpen={isModalShareOpen}
        onRequestClose={() => setIsModalShareOpen(false)}
        linkTo={'https://tripamimain.netlify.app/#/trip/' + travel.id}
      />

      <CustomModal isOpen={editModalIsOpen} onCloseModal={handleCloseEditModal}>
        <CreateTripModal
          closeModal={handleCloseEditModal}
          isEdit
          data={{
            id: id,
            imageUrl: travel.imageUrl,
            rate: travel.rate,
            startDate: startDate,
            endDate: endDate,
            geoTags: travel.geoTags,
            cities: travel.cities,
            tripName: tripName,
            pinColor: travel.pinColor || 'blue',
            dayDescription: travel.dayDescription,
            text: travel.text,
          }}
        />
      </CustomModal>

      <Modal
        closeTimeoutMS={500}
        isOpen={isModalDeleteOpen}
        style={{
          content: {
            padding: 0,
            margin: 'auto',
            height: 300,
          },
        }}
        contentLabel='Example Modal'
        onRequestClose={() => setIsModalDeleteOpen(false)}
        shouldCloseOnOverlayClick
        shouldCloseOnEsc
      >
        <div className={styles.deleteModalContainer}>
          <div className={styles.deleteModal}>
            <h3 className={styles.deleteModal_title}>Delete Trip</h3>
            <p>Are you sure you want to delete the trip?</p>
            <div className={styles.deleteControlContainer}>
              <button
                className={`${styles.buttonModal}, ${styles.buttonModal_delete}`}
                onClick={handleDeleteTrip}
              >
                Delete
              </button>
              <button
                className={`${styles.buttonModal}, ${styles.buttonModal_cancel}`}
                onClick={() => setIsModalDeleteOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </Modal>

      <LightBox
        isOpen={isPhotosModalOpen}
        onCloseModal={() => {
          setIsPhotosModalOpen(false);
          document.body.style.overflow = 'auto';
        }}
        selectedImage={selectedImage}
        onChangeSelectedPhoto={setSelectedImage}
        images={imageDownloadUrls}
      />
      <ToastContainer closeOnClick autoClose={2000} limit={1} pauseOnHover={false} />
    </div>
  );
};

export default TravelCard;

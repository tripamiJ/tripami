import React, { useEffect, useRef, useState } from 'react';
import { FileUploader } from 'react-drag-drop-files';

import { Navigation } from 'swiper/modules';
import { Swiper, SwiperRef, SwiperSlide } from 'swiper/react';

import arrow_right from '../../assets/icons/arrow_right.svg';
import deleteButton from '../../assets/icons/deleteButton.svg';
import downloadButton from '../../assets/icons/downloadButton.svg';
import plus from '../../assets/icons/lucide_plus.svg';
import styles from './UploadImagesEditor.module.css';

interface Props {
  file: File[];
  handleChange: (files: FileList) => void;
  handleRemove: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, photoName: string) => void;
}

const UploadImagesEditor: React.FC<Props> = ({ file, handleChange, handleRemove }) => {
  const fileTypes = ['JPEG', 'PNG', 'JPG', 'MP4'];

  const sliderRef = useRef<SwiperRef>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (sliderRef.current && sliderRef.current.swiper) {
      sliderRef.current.swiper.on('slideChange', () => {
        if (sliderRef.current && sliderRef.current.swiper) {
          setCurrentSlide(sliderRef.current.swiper.realIndex as number);
        }
      });
    }
  }, [currentSlide, file]);

  useEffect(() => {
    if (sliderRef.current && sliderRef.current.swiper) {
      setCurrentSlide(sliderRef.current.swiper.realIndex);
    }
  }, []);

  const handlePrev = (event: React.MouseEvent<HTMLDivElement, MouseEvent> | null) => {
    if (!sliderRef.current || !event) {
      return;
    }
    event.preventDefault();
    sliderRef.current.swiper.slidePrev();
  };

  const handleNext = (event: React.MouseEvent<HTMLDivElement, MouseEvent> | null) => {
    if (!sliderRef.current || !event) {
      return;
    }
    event.preventDefault();
    sliderRef.current.swiper.slideNext();
  };

  const isVideo = (file: File) => file.type.startsWith('video');

  return (
    <div className={styles.fileLoaderContainer}>
      {file.length === 0 ? (
        <FileUploader
          multiple={true}
          handleChange={handleChange}
          name='file'
          types={fileTypes}
          hoverTitle={' '}
        >
          <div className={styles.uploadContainer}>
            <p className={styles.text}>Drag and drop image/video or click on </p>
            <div className={styles.buttonUploadContainer}>
              <img src={downloadButton} alt='downloadButton' className={styles.buttonUpload} />
            </div>
          </div>
        </FileUploader>
      ) : file.length === 1 ? (
        <div className={styles.singleImageContainer}>
          {isVideo(file[0]) ? (
            <video src={URL.createObjectURL(file[0])} controls className={styles.singleImage} />
          ) : (
            <img src={URL.createObjectURL(file[0])} alt='Uploaded' className={styles.singleImage} />
          )}
          <button
            onClick={(e) => handleRemove(e, file[0].name)}
            className={styles.removePhotoButton}
          >
            <img src={deleteButton} alt='deleteButton' />
          </button>
          <FileUploader
            multiple={true}
            handleChange={handleChange}
            name='file'
            types={fileTypes}
            hoverTitle={' '}
          >
            <div className={isVideo(file[0]) ? styles.uploadContainerWithVideoSingle : styles.uploadContainerWithImagesSingle}>
              <div className={styles.buttonUploadPlus}>
                <img src={plus} alt='downloadButton' />
              </div>
              <p className={styles.text}>Add image/video</p>
            </div>
          </FileUploader>
        </div>
      ) : (
        <div className={styles.multyImageContainer}>
          <div className={styles.swiperContainerWrap}>
            <Swiper
              ref={sliderRef}
              spaceBetween={0}
              slidesPerView={Math.min(file.length, 3)}
              className={styles.swiperContainer}
              modules={[Navigation]}
            >
              {file.map((file) => (
                <SwiperSlide key={file.name} className={styles.swiperSlide}>
                  {isVideo(file) ? (
                    <video src={URL.createObjectURL(file)} controls className={styles.image} />
                  ) : (
                    <img src={URL.createObjectURL(file)} alt='Uploaded' className={styles.image} />
                  )}
                  <button
                    onClick={(e) => handleRemove(e, file.name)}
                    className={styles.removePhotoButton}
                  >
                    <img src={deleteButton} alt='deleteButton' />
                  </button>
                </SwiperSlide>
              ))}
            </Swiper>
            <div
              className={`${styles.prev_arrow} ${currentSlide === 0 ? styles.disabled : ''}`}
              onClick={currentSlide !== 0 ? handlePrev : undefined}
            >
              <img src={arrow_right} alt='arrow-left' className={styles.arrow_left} />
            </div>
            {file.length > 3 && (
              <div
                className={`${styles.next_arrow} ${currentSlide + 2 === file.length - 1 ? styles.disabled : ''}`}
                onClick={currentSlide !== file.length - 1 ? handleNext : undefined}
              >
                <img src={arrow_right} alt='arrow-right' className={styles.arrow_right} />
              </div>
            )}
          </div>
          <FileUploader
            multiple={true}
            handleChange={handleChange}
            name='file'
            types={fileTypes}
            hoverTitle={' '}
          >
            <div className={styles.uploadContainerWithImages}>
              <div className={styles.buttonUploadPlus}>
                <img src={plus} alt='downloadButton' />
              </div>
              <p className={styles.text}>Add image/video</p>
            </div>
          </FileUploader>
        </div>
      )}
    </div>
  );
};

export default UploadImagesEditor;

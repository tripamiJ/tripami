import React, { useEffect, useRef, useState } from 'react';

import { Navigation } from 'swiper/modules';
import { Swiper, SwiperRef, SwiperSlide } from 'swiper/react';

import arrow_right from '../../assets/icons/arrow_right.svg';
import plus from '../../assets/icons/plus.svg';
import styles from './SwiperTrip.module.css';

interface Props {
  file: { url: string; type: string; description: string | undefined }[];
  handleSelectImage: (index: number) => void;
}

const SwiperTrip: React.FC<Props> = ({ file }) => {
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

  return (
    <div className={styles.fileLoaderContainer}>
      {file.length === 1 ? (
        <div className={styles.singleImageContainer}>
          <img src={file[0].url} alt='Uploaded' className={styles.singleImage} />
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
                <SwiperSlide key={file.url} className={styles.swiperSlide}>
                  <img src={file.url} alt='Uploaded' className={styles.image} />
                </SwiperSlide>
              ))}
            </Swiper>

            {file.length > 3 && (
              <>
                <div
                  className={`${styles.prev_arrow} ${currentSlide === 0 ? styles.disabled : ''}`}
                  onClick={currentSlide !== 0 ? handlePrev : undefined}
                >
                  <img src={arrow_right} alt='arrow-left' className={styles.arrow_left} />
                </div>
                <div
                  className={`${styles.next_arrow} ${currentSlide + 2 === file.length - 1 ? styles.disabled : ''}`}
                  onClick={currentSlide !== file.length - 1 ? handleNext : undefined}
                >
                  <img src={arrow_right} alt='arrow-right' className={styles.arrow_right} />
                </div>
                {!(currentSlide + 2 === file.length - 1) && (
                  <div className={styles.countImage}>
                    <img className={styles.plusButton} src={plus} alt='plus' />
                    <span>{`${file.length - (3 + currentSlide)} ${file.length - 3 > 1 ? 'Photos' : 'Photo'}`}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SwiperTrip;

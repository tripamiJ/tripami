import React, { useEffect, useRef, useState } from 'react';

import { Navigation } from 'swiper/modules';
import { Swiper, SwiperRef, SwiperSlide } from 'swiper/react';
import { v4 as uuidv4 } from 'uuid';

import arrow_right from '../../assets/icons/arrow_right.svg';
import plus from '../../assets/icons/plus.svg';
import styles from './SwiperDialyTrip.module.css';

interface Props {
  file: { url: string; type: string; description: string | undefined; id: string }[];
}

const SwiperDialyTrip: React.FC<Props> = ({ file }) => {
  const sliderRef = useRef<SwiperRef>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  console.log('file', file);

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
    <>
      {file.length === 1 ? (
        <div className={styles.singleImageContainer}>
          <img src={file[0].url} alt='Uploaded' className={styles.singleImage} />
        </div>
      ) : (
        <div className={styles.singleImageContainer}>
          <div className={styles.swiperContainerWrap}>
            <Swiper
              ref={sliderRef}
              slidesPerView={1}
              className={styles.swiperContainer}
              modules={[Navigation]}
            >
              {file.map((file) => {
                return (
                  <SwiperSlide key={file.id} className={styles.swiperSlide}>
                    <img src={file.url} alt='Uploaded' className={styles.singleImage} />
                  </SwiperSlide>
                );
              })}
            </Swiper>

            <div
              className={`${styles.prev_arrow} ${currentSlide === 0 ? styles.disabled : ''}`}
              onClick={currentSlide !== 0 ? handlePrev : undefined}
            >
              <img src={arrow_right} alt='arrow-left' className={styles.arrow_left} />
            </div>
            <div
              className={`${styles.next_arrow} ${currentSlide === file.length - 1 ? styles.disabled : ''}`}
              onClick={currentSlide !== file.length - 1 ? handleNext : undefined}
            >
              <img src={arrow_right} alt='arrow-right' className={styles.arrow_right} />
            </div>
            {!(currentSlide === file.length - 1) && (
              <div className={styles.countImage}>
                <img className={styles.plusButton} src={plus} alt='plus' />
                <span>{`${file.length - 1 - currentSlide} ${file.length > 1 ? 'Photos' : 'Photo'}`}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default SwiperDialyTrip;

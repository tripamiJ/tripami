import Intro from "../../../components/Intro";
import Header from "../../../components/Header";
import PostItem from "../../../components/Posts";
import styles from './intro.module.css';
import React, {useContext, useEffect, useMemo, useState} from "react";
import {AuthContext} from "~/providers/authContext";
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import {useWindowDimensions} from "~/hooks/useWindowDimensions";
import {getDocs, limit, orderBy, query} from "@firebase/firestore";
import {postsCollection} from "~/types/firestoreCollections";
import {IPost} from "~/types/post";
import {firebaseErrors} from "~/constants/firebaseErrors";

const LoginPage = () => {
  const {firestoreUser} = useContext(AuthContext);
  const {width} = useWindowDimensions();
  const [isPostsLoading, setIsPostsLoading] = useState(false);
  const [posts, setPosts] = useState<IPost[]>([]);

  useEffect(() => {
    (async () => {
      if (firestoreUser?.id) {
        try {
          setIsPostsLoading(true);
          const q = query(
            postsCollection,
            // orderBy('comments_count', 'desc'),
            // limit(10),
          );
          const querySnapshot = await getDocs(q);
          const fetchedPosts = querySnapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id,
          }));

          setPosts(fetchedPosts as IPost[]);
        } catch (err) {
          // @ts-ignore
          alert(firebaseErrors[err.code]);
        } finally {
          setIsPostsLoading(false);
        }
      }
    })();
  }, [firestoreUser?.id]);

  const getSlidesPerPage = useMemo(() => {
    if (width < 480) {
      return 1;
    } else if (width < 960) {
      return 2;
    } else {
      return 3;
    }
  }, [width]);

  return (
    <div className={styles.main}>
      <Header />
      <div className={styles.mainSection}>
        <Intro />
        <h5 className={styles.title}>Trending today</h5>

        <div className={styles.sliderContainer}>
          <Swiper
            spaceBetween={30}
            slidesPerView={getSlidesPerPage}
          >
            {posts?.map(post => (
              <SwiperSlide key={post.id}>
                <PostItem postData={post}/>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

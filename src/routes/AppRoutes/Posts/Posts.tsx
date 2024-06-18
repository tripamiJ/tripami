import { useEffect, useRef, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';

import { documentId } from 'firebase/firestore';
import { getDownloadURL, ref } from 'firebase/storage';
import { BigPost } from '~/components/BigPost';
import { Comment } from '~/components/Comment';
import { CommentField } from '~/components/CommentField';
import { PageTitle } from '~/components/PageTitle';
import Header from '~/components/profile/Header';
import { storage } from '~/firebase';
import { IComment } from '~/types/comments';
import { commentsCollection, postsCollection } from '~/types/firestoreCollections';
import { IPost } from '~/types/post';

import { onSnapshot, orderBy, query, where } from '@firebase/firestore';

import styles from './posts.module.css';

const PostsPage = () => {
  const { state } = useLocation();
  const [comments, setComments] = useState<IComment[] | null>(null);
  const [post, setPost] = useState<IPost | null>(null);
  const [imagesUrl, setImagesUrl] = useState<string[] | null>(null);
  const { id } = useParams();

  const commentsRef = useRef(null);

  useEffect(() => {
    if (commentsRef.current && comments && comments.length > 0) {
      // console.log(commentsRef.current, '-- commentsRef.current');
      (commentsRef.current as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [commentsRef, comments?.length]);

  useEffect(() => {
    const q = query(postsCollection, where(documentId(), '==', id));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedDocs = querySnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
      setPost(fetchedDocs[0] as IPost);
    });

    return () => {
      unsubscribe();
    };
  }, [id]);

  useEffect(() => {
    const fetchImages = async () => {
      if (!post?.imageUrls) return;

      const promises = post.imageUrls.map((url) => {
        return getDownloadURL(ref(storage, url)).catch((error) => {
          console.log('[ERROR getting image] => ', error);
          return null;
        });
      });

      const results = await Promise.allSettled(promises);
      const downloadedImages = results
        .filter((result) => result.status === 'fulfilled')
        .map((result) => result.value);

      setImagesUrl(downloadedImages);
    };

    fetchImages();
  }, [post?.id]);

  useEffect(() => {
    if (post?.id) {
      const q = query(
        commentsCollection,
        where('postId', '==', post?.id),
        orderBy('createdAt', 'desc')
      );
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const fetchedDocs = querySnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));
        setComments(fetchedDocs as IComment[]);
      });

      return () => {
        unsubscribe();
      };
    }
  }, [post?.id]);

  return (
    <div className={styles.mainContainer}>
      <Header />
      <div className={styles.main}>
        <PageTitle title={'Posts'} />

        {post && (
          <div className={styles.post}>
            <BigPost post={{ ...post, imageUrls: imagesUrl }} setPost={setPost} />
            <CommentField
              postId={post.id}
              commentsCount={post.comments_count}
              contentType='post'
              postOwnerId={post.userId}
            />
            {comments?.map((comment) => (
              <div
                key={comment.id}
                ref={state?.open_comment === comment.id ? commentsRef : null}
                className={styles.replies_container}
              >
                <Comment comment={comment} isCommentOpen={state?.open_comment === comment.id} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PostsPage;

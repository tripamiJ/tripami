import {useCallback, useContext, useState} from "react";
import {deleteObject, ref} from "firebase/storage";
import {db, storage} from "~/firebase";
import {deleteDoc, doc, getDocs, query, updateDoc, where} from "@firebase/firestore";
import {AuthContext} from "~/providers/authContext";
import {commentsCollection, notificationsCollection} from "~/types/firestoreCollections";

export const usePost = (postId: string) => {
  const {updateFirestoreUser, firestoreUser} = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(false);

  const handleDeletePost = useCallback(async (imageUrls: string[]) => {
    try {
      setIsLoading(true);

      const q = query(commentsCollection, where('postId', '==', postId));
      const querySnapshot = await getDocs(q);
      querySnapshot.docs.map(item => {
        const docRef = doc(db, 'comments', item.id);
        deleteDoc(docRef);
      });

      if (imageUrls?.[0]?.length) {
        try {
          const imageRef = ref(storage, imageUrls[0]);

          await deleteObject(imageRef);
        } catch (e) {
          console.log('[ERROR deleting image from storage] => ', e)
        }
      }

      await deleteDoc(doc(db, "posts", postId));
      const queryToNotifications = query(notificationsCollection, where('postId', '==', postId));
      const querySnapshotNotifications = await getDocs(queryToNotifications);

      querySnapshotNotifications.forEach(async (doc) => {
        await deleteDoc(doc.ref);
      });

      updateFirestoreUser({
        postsCount: firestoreUser?.postsCount ? firestoreUser?.postsCount - 1 : 0,
      })
    } catch (err) {
      console.error('[ERROR deleting document from firestore] => ', err);
    } finally {
      setIsLoading(false);
    }
  }, [postId, firestoreUser]);

  const handleLikePost = useCallback(async (likes: string[]) => {
    if (firestoreUser?.id) {
      try {
        setIsLoading(true);
        const docRef = doc(db, "posts", postId);

        if (likes.includes(firestoreUser.id)) {

          const index = likes.indexOf(firestoreUser.id);

          const updatedArr = [...likes];
          updatedArr.splice(index, 1)

          await updateDoc(docRef, {
            likes: [
              ...updatedArr,
            ],
          });
        } else {
          await updateDoc(docRef, {
            likes: [
              ...likes,
              firestoreUser.id,
            ],
          });
        }
      } catch (err) {
        console.error('[ERROR liking post] => ', err);
      } finally {
        setIsLoading(false);
      }
    }
  }, [firestoreUser?.id, postId]);

  return {
    isLoading,
    setIsLoading,
    handleDeletePost,
    handleLikePost,
  };
};

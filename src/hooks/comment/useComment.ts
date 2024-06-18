import {useCallback, useContext, useState} from "react";
import {AuthContext} from "~/providers/authContext";
import {doc, updateDoc} from "@firebase/firestore";
import {IComment} from "~/types/comments";
import {db} from "~/firebase";
import {firebaseErrors} from "~/constants/firebaseErrors";

export const useComment = (comment: IComment) => {
  const {firestoreUser} = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(false);
  const {likes, id, dislikes} = comment;

  const spliceFromArr = useCallback((arr: string[], value: string) => {
    const index = arr.indexOf(value);

    const updatedArr = arr;
    updatedArr.splice(index, 1)

    return updatedArr;
  }, []);

  const handleLikeComment = useCallback(async () => {
    try {
      if (firestoreUser?.id) {
        setIsLoading(true);
        const docRef = doc(db, 'comments', id);

        if (likes.includes(firestoreUser.id)) {
          const updatedArr = spliceFromArr(likes, firestoreUser.id);

          await updateDoc(docRef, {
            likes: [
              ...updatedArr,
            ],
          });
        } else {
          let updatedDislikes = dislikes;

          if (dislikes.includes(firestoreUser.id)) {
            updatedDislikes = spliceFromArr(dislikes, firestoreUser.id);
          }

          await updateDoc(docRef, {
            likes: [
              ...likes,
              firestoreUser.id,
            ],
            dislikes: [
              ...updatedDislikes,
            ],
          });
        }
      }
    } catch (e) {
      // @ts-ignore
      alert(firebaseErrors[e.code]);
    } finally {
      setIsLoading(false);
    }
  }, [firestoreUser?.id, likes, id, dislikes]);

  const handleDislikeComment = useCallback(async () => {
    try {
      if (firestoreUser?.id) {
        setIsLoading(true);
        const docRef = doc(db, 'comments', id);

        if (dislikes.includes(firestoreUser.id)) {
          const updatedArr = spliceFromArr(dislikes, firestoreUser.id);

          await updateDoc(docRef, {
            dislikes: [
              ...updatedArr,
            ],
          });
        } else {
          let updatedLikes = dislikes;

          if (likes.includes(firestoreUser.id)) {
            updatedLikes = spliceFromArr(likes, firestoreUser.id);
          }


          await updateDoc(docRef, {
            dislikes: [
              ...dislikes,
              firestoreUser.id,
            ],
            likes: [
              ...updatedLikes,
            ],
          });
        }
      }
    } catch (e) {
      // @ts-ignore
      alert(firebaseErrors[e.code]);
    } finally {
      setIsLoading(false);
    }
  }, [firestoreUser?.id, likes, id, dislikes]);

  return {handleLikeComment, handleDislikeComment};
};

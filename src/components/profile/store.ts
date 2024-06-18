import {create} from 'zustand';
import {immer} from 'zustand/middleware/immer';
import {createJSONStorage, persist} from 'zustand/middleware';
import {IPost} from "~/types/post";

interface State {
  posts: IPost[],
}

interface Actions {
  setPosts: (posts: IPost[]) => void;
}

const useMyPosts = create<State & Actions>()(
  immer(
    persist(
      set => ({
        posts: [],
        setPosts: (posts: IPost[]) =>
          set(state => {
            state.posts = posts;
          }),
      }),
      {
        name: 'postStorage',
        storage: createJSONStorage(() => sessionStorage),
      },
    ),
  ),
);

export default useMyPosts;

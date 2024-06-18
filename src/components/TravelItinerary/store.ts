import {create} from 'zustand';
import {immer} from 'zustand/middleware/immer';
import {createJSONStorage, persist} from 'zustand/middleware';
import {ITravel} from "~/types/travel";

interface State {
  travels: ITravel[],
}

interface Actions {
  setTravels: (travels: ITravel[]) => void;
}

const useTravelsContext = create<State & Actions>()(
  immer(
    persist(
      set => ({
        travels: [],
        setTravels: (travels: ITravel[]) =>
          set(state => {
            state.travels = travels;
          }),
      }),
      {
        name: 'travelsStorage',
        storage: createJSONStorage(() => sessionStorage),
      },
    ),
  ),
);

export default useTravelsContext;

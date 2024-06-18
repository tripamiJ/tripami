import { useContext, useEffect, useState } from 'react';
import { geocodeByPlaceId } from 'react-places-autocomplete';

import { IUser } from '~/types/user';

import MapOrange from '@assets/icons/MapOrange.svg';
import Build from '@assets/icons/build.svg';
import { getDocs, onSnapshot, query, where } from '@firebase/firestore';
import { APIProvider, AdvancedMarker, Map, Pin } from '@vis.gl/react-google-maps';

import { AuthContext } from '../../providers/authContext';
import { tripsCollection, usersCollection } from '../../types/firestoreCollections';
import { ITravel } from '../../types/travel';
import { MapInfoWindow } from '../MapInfoWindow/MapInfoWindow';
import useTravelsContext from '../TravelItinerary/store';
import styles from './googleMaps.module.css';

interface Place {
  name: string;
  lat: number;
  lng: number;
  color: string;
  placeId: string;
  travelId: string;
}

export default function Intro() {
  const position = { lat: 53.54, lng: 10 };
  const [open, setOpen] = useState(false);
  const { travels, setTravels } = useTravelsContext();
  const [isFriendsLoading, setIsFriendsLoading] = useState(false);
  const { firestoreUser } = useContext(AuthContext);
  // const [selectedTravel, setSelectedTravel] = useState<ITravel | null>(null);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
  const [friends, setFriends] = useState<IUser[]>([]);
  const [{ isMapOpen, isGeneralMapOpen, isFriendsMapOpen }, setIsOpen] = useState({
    isMapOpen: false,
    isGeneralMapOpen: false,
    isFriendsMapOpen: false,
  });
  const [placesToDisplay, setPlacesToDisplay] = useState<Place[]>();

  useEffect(() => {
    if (firestoreUser?.friends && firestoreUser?.friends?.length > 0) {
      const q = query(tripsCollection, where('userId', 'in', firestoreUser?.friends));
      const unsub = onSnapshot(q, async (querySnapshot) => {
        const fetchedTravels = querySnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));
        const places = await Promise.all(
          fetchedTravels.map(async ({ cities, id }) => {
            if (!cities) return [];
            const cityPromises = cities.map(async (city) => {
              const res = await geocodeByPlaceId(city.placeID);
              return {
                travelId: id,
                name: city.name,
                lat: +res[0].geometry.location.lat(),
                lng: +res[0].geometry.location.lng(),
                placeId: city.placeID,
              };
            });
            return Promise.all(cityPromises);
          })
        );

        setPlacesToDisplay(places.flatMap((place) => place) as Place[]);
        setTravels(fetchedTravels as ITravel[]);
      });

      return () => {
        unsub();
      };
    }
  }, [firestoreUser?.friends, setTravels]);

  useEffect(() => {
    (async () => {
      try {
        if (!travels) return;
        setIsFriendsLoading(true);
        const q = query(
          usersCollection,
          where(
            'id',
            'in',
            travels.map((travel) => travel.userId)
          )
        );
        const querySnapshot = await getDocs(q);
        const fetchedFriends = querySnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));

        setFriends(fetchedFriends as IUser[]);
      } catch (err) {
        console.error(err);
      } finally {
        setIsFriendsLoading(false);
      }
    })();
  }, [travels]);

  // useEffect(() => {
  //   if (selectedTravel) {
  //     setSelectedUser(friends.find((friend) => friend.id === selectedTravel?.userId) || null);
  //   }
  // }, [friends, selectedTravel]);

  return (
    <div className={styles.container}>
      <div className={styles.titleContainer}>
        <p className={styles.title}>
          Build a travel itinerary
          <img src={MapOrange} />
        </p>
        <p className={styles.title}>
          Build a travel itinerary based on other people&apos;s reviews
        </p>
      </div>
      <div className={styles.subtitle}>
        <p className={styles.title}>
          Build a route based on friend`s reviews
          <button
            onClick={() =>
              setIsOpen((prevState) => ({ ...prevState, isFriendsMapOpen: !isFriendsMapOpen }))
            }
          >
            <img src={Build} className={styles.button} />
          </button>
        </p>
      </div>

      {isFriendsMapOpen && (
        <APIProvider apiKey='AIzaSyCwDkMaHWXRpO7hY6z62_Gu8eLxMMItjT8'>
          <div style={{ height: '450px', width: '100%' }}>
            <Map defaultZoom={5} defaultCenter={position} mapId='9bc3b1605395203e'>
              {placesToDisplay &&
                placesToDisplay.length > 0 &&
                placesToDisplay?.map((place) => {
                  return (
                    <AdvancedMarker
                      position={{ lat: place.lat, lng: place.lng }}
                      onClick={() => {
                        // setSelectedTravel(
                        //   {
                        //     ...travels.find((travel) => travel.id === place.travelId),
                        //     lat: +place.lat,
                        //     lng: +place.lng,
                        //   } || null
                        // );
                        setSelectedMarker({
                          placeId: place.placeId,
                          name: place.name,
                          lat: place.lat,
                          lng: place.lng,
                        });
                        setOpen(true);
                      }}
                      key={place.lat + place.lng + place.placeId + place.travelId}
                    >
                      <Pin background={'red'} borderColor={'white'} glyphColor={'white'} />
                    </AdvancedMarker>
                  );
                })}

              {selectedMarker && open && (
                <MapInfoWindow
                  selectedMarker={selectedMarker}
                  selectedUser={selectedUser}
                  handleClose={setOpen}
                  travels={travels}
                  friends={friends}
                />
              )}
            </Map>
          </div>
        </APIProvider>
      )}
    </div>
  );
}

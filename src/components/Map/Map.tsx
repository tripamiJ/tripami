import { FC, useCallback, useEffect, useState } from 'react';
import { geocodeByPlaceId } from 'react-places-autocomplete';
import { useNavigate } from 'react-router-dom';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';

import useMapContext from '~/components/EditMap/store';
import { tripsCollection } from '~/types/firestoreCollections';
import { ITravel } from '~/types/travel';

import GeoJson from '@assets/geoJson/countries-110m.json';
import Minus from '@assets/icons/map/minus.svg';
import Plus from '@assets/icons/map/plus.svg';
import { getDocs, query, where } from '@firebase/firestore';

import styles from './map.module.css';

interface Props {
  onClick?: (value: string) => void;
  selectedTripId?: string | null;
  userId?: string;
}

interface IPosition {
  coordinates: [number, number];
  zoom: number;
}

interface IPin {
  name: string;
  lat: number;
  lng: number;
  color: string;
  place_id: string;
}

const Map: FC<Props> = ({ userId }) => {
  const { trips } = useMapContext();
  const [position, setPosition] = useState<IPosition>({ coordinates: [0, 0], zoom: 1 });
  const [scaleFactor, setScaleFactor] = useState(1);
  const [usersTrips, setUsersTrips] = useState<ITravel[]>();
  const [citiesToDisplay, setCitiesToDisplay] = useState<IPin[]>();
  const [placesToDisplay, setPlacesToDisplay] = useState<IPin[]>();
  const [selectedMarkerAddress, setSelectedMarkerAddress] = useState<{
    address: string;
    placeId: string;
  } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) return;
    const fetchUserTrips = async () => {
      const q = query(tripsCollection, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      const fetchedTrips = querySnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
      setUsersTrips(fetchedTrips as ITravel[]);
    };
    fetchUserTrips();
  }, [userId]);

  const handleZoomIn = useCallback(() => {
    setPosition((pos) => ({ ...pos, zoom: Math.min(pos.zoom * 2, 4) }));
  }, []);

  const handleZoomOut = useCallback(() => {
    setPosition((pos) => ({ ...pos, zoom: Math.max(pos.zoom / 2, 1) }));
  }, []);

  const handleMoveEnd = useCallback((positionValue: IPosition) => {
    setPosition(positionValue);
  }, []);

  useEffect(() => {
    const fetchCitiesToDisplay = async () => {
      const tripsToDisplay = userId ? usersTrips : trips;
      if (!tripsToDisplay) return;
      const citiesPlacesId = tripsToDisplay.flatMap(
        (trip) =>
          trip.cities?.map((city) => ({
            place_id: city.placeID,
            color: trip.pinColor,
            name: city.address,
            lat: city.lat,
            lng: city.lng,
          })) || []
      );
      const citiesGeoCode: IPin[] = [];
      await Promise.all(
        citiesPlacesId.map(async (city) => {
          if (!city) return;
          // const geocode = await geocodeByPlaceId(city.place_id);
          const randomOffset = Math.random() * 0.0001 - 0.00005;
          citiesGeoCode.push({
            name: city.name,
            lng: city.lng + randomOffset,
            lat: city.lat + randomOffset + 0.2,
            place_id: city.place_id,
            color: city.color,
          });
        })
      );
      setCitiesToDisplay(citiesGeoCode);
    };
    fetchCitiesToDisplay();
  }, [trips, userId, usersTrips]);

  useEffect(() => {
    const fetchPlacesToDisplay = async () => {
      const tripsToDisplay = userId ? usersTrips : trips;
      if (!tripsToDisplay) return;
      const tagsPlaceId = tripsToDisplay.flatMap(
        (trip) =>
          trip.geoTags?.map((tag) => ({
            place_id: tag.placeID,
            color: trip.pinColor,
            name: tag.address,
          })) || []
      );
      const tagsGeoCode: IPin[] = [];
      await Promise.all(
        tagsPlaceId.map(async (tag) => {
          if (!tag) return;
          const geocode = await geocodeByPlaceId(tag.place_id);
          const randomOffset = Math.random() * 0.0001 - 0.00005;
          tagsGeoCode.push({
            name: tag.name,
            lng: geocode[0].geometry.location.lng() + randomOffset,
            lat: geocode[0].geometry.location.lat() + randomOffset,
            place_id: tag.place_id,
            color: tag.color,
          });
        })
      );
      setPlacesToDisplay(tagsGeoCode);
    };
    fetchPlacesToDisplay();
  }, [trips, userId, usersTrips]);

  const handleSelectMarker = useCallback((address: string, placeId: string) => {
    setSelectedMarkerAddress({ address, placeId });
  }, []);

  const handleSelectPlace = useCallback(() => {
    navigate(`/place/${selectedMarkerAddress?.placeId}`);
  }, [navigate, selectedMarkerAddress]);

  useEffect(() => {
    const timerId = setTimeout(() => {
      setSelectedMarkerAddress(null);
    }, 3000);
    return () => clearTimeout(timerId);
  }, [selectedMarkerAddress]);
  return (
    <div className={styles.mapContainer} style={{ position: 'relative' }}>
      {selectedMarkerAddress && (
        <div className={styles.selectedMarkerAddress} onClick={() => handleSelectPlace()}>
          {selectedMarkerAddress.address}
        </div>
      )}

      <ComposableMap>
        <ZoomableGroup
          translateExtent={[
            [0, 0],
            [900, 600],
          ]}
          zoom={position.zoom}
          center={position.coordinates}
          onMoveEnd={handleMoveEnd}
          onMove={({ zoom }) => setScaleFactor(zoom)}
          style={{ width: '100%', height: '100%' }}
          minZoom={1}
          maxZoom={30}
        >
          <Geographies geography={GeoJson}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={'grey'}
                  style={{
                    default: { outline: 'none' },
                    hover: { outline: 'none' },
                    pressed: { outline: 'none' },
                  }}
                />
              ))
            }
          </Geographies>

          {citiesToDisplay?.map((city) => (
            <Marker
              key={`${city.place_id}${city.lng}${city.lat}`}
              coordinates={[city.lng, city.lat]}
              onClick={() => handleSelectMarker(city.name, city.place_id)}
              cursor={'pointer'}
            >
              <g
                transform={`translate(${-10 / scaleFactor}, ${-26 / scaleFactor})`}
                className={styles.marker}
              >
                <svg
                  width={window.innerWidth > 500 ? 30 / scaleFactor : 40 / scaleFactor}
                  height={window.innerWidth > 500 ? 40 / scaleFactor : 60 / scaleFactor}
                  viewBox='0 0 48 48'
                  xmlns='http://www.w3.org/2000/svg'
                >
                  <path
                    width={20 / scaleFactor}
                    height={30 / scaleFactor}
                    d='M24,1.32c-9.92,0-18,7.8-18,17.38A16.83,16.83,0,0,0,9.57,29.09l12.84,16.8a2,2,0,0,0,3.18,0l12.84-16.8A16.84,16.84,0,0,0,42,18.7C42,9.12,33.92,1.32,24,1.32Z'
                    fill={
                      selectedMarkerAddress?.address === city.name ? 'red' : city.color || '#1400FF'
                    }
                  />
                  <path d='M25.37,12.13a7,7,0,1,0,5.5,5.5A7,7,0,0,0,25.37,12.13Z' fill='white' />
                </svg>
              </g>
            </Marker>
          ))}

          {placesToDisplay?.map((place) => (
            <Marker
              key={`${place.place_id}${place.lng}${place.lat}`}
              onClick={() => handleSelectMarker(place.name, place.place_id)}
              coordinates={[place.lng, place.lat]}
              cursor={'pointer'}
            >
              <g
                transform={`translate(${-10 / scaleFactor}, ${-26 / scaleFactor})`}
                className={styles.marker}
              >
                <svg
                  width={window.innerWidth > 500 ? 30 / scaleFactor : 40 / scaleFactor}
                  height={window.innerWidth > 500 ? 40 / scaleFactor : 60 / scaleFactor}
                  viewBox='0 0 48 48'
                  xmlns='http://www.w3.org/2000/svg'
                >
                  <path
                    d='M24,1.32c-9.92,0-18,7.8-18,17.38A16.83,16.83,0,0,0,9.57,29.09l12.84,16.8a2,2,0,0,0,3.18,0l12.84-16.8A16.84,16.84,0,0,0,42,18.7C42,9.12,33.92,1.32,24,1.32Z'
                    fill={
                      selectedMarkerAddress?.address === place.name
                        ? 'red'
                        : place.color || '#1400FF'
                    }
                  />
                  <path d='M25.37,12.13a7,7,0,1,0,5.5,5.5A7,7,0,0,0,25.37,12.13Z' fill='white' />
                </svg>
              </g>
            </Marker>
          ))}
        </ZoomableGroup>
      </ComposableMap>

      {/* <div className={styles.buttonsContainer}>
        <div className={styles.button} onClick={handleZoomIn}>
          <img src={Plus} alt={'Plus zoom icon'} />
        </div>
        <div className={styles.button} onClick={handleZoomOut}>
          <img src={Minus} alt={'Minus zoom icon'} />
        </div>
      </div> */}
    </div>
  );
};

export default Map;

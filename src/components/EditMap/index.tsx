import { useCallback, useState } from 'react';

import { LoadingScreen } from '~/components/LoadingScreen';
import Map from '~/components/Map/Map';
import { db } from '~/firebase';

import Bin from '@assets/icons/BinIcon.svg';
import { doc, updateDoc } from '@firebase/firestore';

import styles from './EditMap.module.css';

const EditMap = () => {
  const [selectedMarker, setSelectedMarker] = useState<null | string>(null);
  const [isLoading, setIsLoading] = useState(false);

  // const handleSave = useCallback(() => {
  //   if (selectedMarker) {
  //     const filteredMarkers = markers.filter(marker => marker.top !== selectedMarker?.top && marker.left !== selectedMarker?.left);
  //     const filteredNewMarkers = newMarkers.filter(marker => marker.top !== selectedMarker?.top && marker.left !== selectedMarker?.left);
  //
  //     setMarkers(filteredMarkers);
  //     setNewMarkers(filteredNewMarkers);
  //     setSelectedMarker(null);
  //   }
  // }, [markers, selectedMarker]);

  const handleDeleteMarker = useCallback(async () => {
    if (selectedMarker) {
      try {
        setIsLoading(true);
        await updateDoc(doc(db, 'trips', selectedMarker), {
          location: {
            latitude: null,
            longitude: null,
            color: null,
          },
        });
      } catch (e) {
        console.log('[ERROR deleting marker] => ', e);
      } finally {
        setIsLoading(false);
      }
    }
  }, [selectedMarker]);

  return (
    <div className={styles.container}>
      <p className={styles.title}>Edit Map</p>
      <div className={styles.centerContainer}>
        <div className={styles.mapContainer}>
          <Map onClick={setSelectedMarker} selectedTripId={selectedMarker} />
        </div>
        <div className={styles.buttonsWrapper}>
          <div className={styles.buttonsContainer}>
            <button
              onClick={handleDeleteMarker}
              className={`${styles.deleteButton} ${!selectedMarker && styles.disabled}`}
            >
              Delete the pin <img src={Bin} alt='Bin icon' />
            </button>
          </div>
        </div>
      </div>

      {isLoading && <LoadingScreen />}
    </div>
  );
};

export default EditMap;

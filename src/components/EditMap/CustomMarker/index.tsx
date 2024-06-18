import { FC } from 'react';

import { Marker } from '@assets/icons/map/Marker';

import styles from './customMarker.module.css';

interface Props {
  color?: string;
  onClick?: () => void;
  isSelected?: boolean;
}

const CustomMarker: FC<Props> = ({ color, onClick, isSelected }) => {
  return <Marker color={color || '#FFF'} />;
};

export default CustomMarker;

import React from 'react';

const styles: React.CSSProperties = {
  position: 'absolute',
  top: '-5px',
  right: '-2px',
  color: 'white',
  backgroundColor: 'red',
  width: 'max-content',
  borderRadius: '10px',
  height: 'max-content',
  padding: '1px 4px',
  fontSize: '10px',
};

export const NotificationsIcon = ({
  isActive,
  // onClick,
  counter,
}: {
  isActive: boolean;
  // onClick: () => void;
  counter: number;
}) => {
  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {isActive && <div style={styles}>{counter > 0 ? counter : ''}</div>}
      <svg
        width='24'
        height='24'
        viewBox='0 0 24 24'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
        cursor={isActive ? 'pointer' : 'unset'}
        // onClick={onClick}
      >
        <path
          d='M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.37 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5C11.17 2.5 10.5 3.17 10.5 4V4.68C7.64 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16ZM16 17H8V11C8 8.52 9.51 6.5 12 6.5C14.49 6.5 16 8.52 16 11V17Z'
          fill={isActive ? 'rgb(255, 77, 0)' : '#717171'}
        />
      </svg>
    </div>
  );
};

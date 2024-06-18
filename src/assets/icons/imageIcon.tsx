import React, {SVGProps} from "react";

export const ImageIcon: React.FC<SVGProps<SVGElement>> = ({color}) => {
  return (
    <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g id="carbon:image">
        <path
          id="Vector"
          d="M17.0625 2.625H3.9375C3.5894 2.625 3.25556 2.76328 3.00942 3.00942C2.76328 3.25556 2.625 3.5894 2.625 3.9375V17.0625C2.625 17.4106 2.76328 17.7444 3.00942 17.9906C3.25556 18.2367 3.5894 18.375 3.9375 18.375H17.0625C17.4106 18.375 17.7444 18.2367 17.9906 17.9906C18.2367 17.7444 18.375 17.4106 18.375 17.0625V3.9375C18.375 3.5894 18.2367 3.25556 17.9906 3.00942C17.7444 2.76328 17.4106 2.625 17.0625 2.625ZM17.0625 17.0625H3.9375V13.125L7.21875 9.84375L10.8872 13.5122C11.1331 13.7566 11.4658 13.8939 11.8125 13.8939C12.1592 13.8939 12.4919 13.7566 12.7378 13.5122L13.7812 12.4688L17.0625 15.75V17.0625ZM17.0625 13.8928L14.7066 11.5369C14.4606 11.2924 14.128 11.1552 13.7812 11.1552C13.4345 11.1552 13.1019 11.2924 12.8559 11.5369L11.8125 12.5803L8.14406 8.91187C7.89815 8.66742 7.56549 8.53021 7.21875 8.53021C6.87201 8.53021 6.53935 8.66742 6.29344 8.91187L3.9375 11.2678V3.9375H17.0625V13.8928Z"
          fill={color || "#A4A4A4"}
        />
      </g>
    </svg>
  );
};
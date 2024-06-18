import React, {SVGProps} from "react";

export const TextIcon: React.FC<SVGProps<SVGElement>> = ({color}) => {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M5 21C4.45 21 3.979 20.804 3.587 20.412C3.195 20.02 2.99934 19.5493 3 19V5C3 4.45 3.196 3.979 3.588 3.587C3.98 3.195 4.45067 2.99934 5 3H14V5H5V19H19V10H21V19C21 19.55 20.804 20.021 20.412 20.413C20.02 20.805 19.5493 21.0007 19 21H5ZM8 17V15H16V17H8ZM8 14V12H16V14H8ZM8 11V9H16V11H8ZM17 9V7H15V5H17V3H19V5H21V7H19V9H17Z"
        fill={color || "#A4A4A4"}
      />
    </svg>
  );
};

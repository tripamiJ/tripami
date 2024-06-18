import { FC } from "react";

interface Props {
	isReverse: boolean;
}

export const SortDirection: FC<Props> = ({isReverse}) => (
    <svg
		fill={isReverse ? "#ff4d00" : "#717171"} 
		height="20px" 
		width="20px" 
		version="1.1" 
		id="Capa_1" 
		xmlns="http://www.w3.org/2000/svg" 
		viewBox="0 0 490 490" 
		style={{cursor: "pointer"}}
	>
<g>
	<polygon points="85.877,154.014 85.877,428.309 131.706,428.309 131.706,154.014 180.497,221.213 217.584,194.27 108.792,44.46 
		0,194.27 37.087,221.213 	"/>
	<polygon points="404.13,335.988 404.13,61.691 358.301,61.691 358.301,335.99 309.503,268.787 272.416,295.73 381.216,445.54 
		490,295.715 452.913,268.802 	"/>
</g>
</svg>
)
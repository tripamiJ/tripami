import {
  blue, // cyan,
  geekblue,
  gold,
  green, // grey,
  lime, // magenta,
  purple,
  red,
  volcano, // yellow,
} from '@ant-design/colors';

const getNeutralColor = () => {
  const colors = [
    blue,
    // cyan,
    geekblue,
    gold,
    green,
    // grey,
    lime,
    // magenta,
    purple,
    red,
    volcano,
    // yellow,
  ];
  const randomIndex = Math.floor(Math.random() * colors.length);
  const randomShade = Math.floor(Math.random() * 4) + 2;
  return colors[randomIndex][randomShade];
};

export default getNeutralColor;

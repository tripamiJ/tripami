import ava1 from '@assets/icons/ava1.svg';
import ava2 from '@assets/icons/ava2.svg';
import ava3 from '@assets/icons/ava3.svg';
import post1 from '@assets/icons/post1.svg';
import post2 from '@assets/icons/post2.svg';
import post3 from '@assets/icons/post3.svg';

export type Post = {
  id: number;
  userName: string;
  timeAgo: number;
  userIcon: string;
  rating: number;
  caption: string;
  img: string;
  commentsNumber: number;
};

export const posts: Post[] = [
  {
    id: 1,
    userName: 'Anna Maria',
    timeAgo: 20,
    userIcon: ava1,
    rating: 5,
    caption: 'First day in Albania! Beautiful sea, hot weather and of course a lot of tourists❤️️ ',
    img: post1,
    commentsNumber: 2,
  },
  {
    id: 2,
    userName: 'Ostin',
    timeAgo: 10,
    userIcon: ava2,
    rating: 4,
    caption: 'I visited London! Incredible architecture. I will come back here again 👍️ ',
    img: post2,
    commentsNumber: 4,
  },
  {
    id: 3,
    userName: 'Adam',
    timeAgo: 5,
    userIcon: ava3,
    rating: 3,
    caption: 'Rome, a great city to visit! Just look at the photos!!!! 😜😻',
    img: post3,
    commentsNumber: 6,
  },
];

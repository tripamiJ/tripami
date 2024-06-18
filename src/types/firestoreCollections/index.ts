import { db } from '~/firebase';

import { collection } from '@firebase/firestore';

export const usersCollection = collection(db, 'users');
export const postsCollection = collection(db, 'posts');
export const tripsCollection = collection(db, 'trips');

export const placesCollection = collection(db, 'places');
export const commentsCollection = collection(db, 'comments');
export const reviewsCollection = collection(db, 'reviews');
export const placesCommentsCollection = collection(db, 'places_comments');
export const friendsRequestsCollection = collection(db, 'friends_requests');
export const notificationsCollection = collection(db, 'notifications');
export const repliesCollection = collection(db, 'replies');

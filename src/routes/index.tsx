import { useContext, useEffect } from 'react';
import { RouterProvider, createBrowserRouter, createHashRouter } from 'react-router-dom';

import { AuthContext } from '~/providers/authContext';
import { AddNewFriends } from '~/routes/AppRoutes/AddNewFriends';
import { InvitePeople } from '~/routes/AppRoutes/InvitePeople';
import { Place } from '~/routes/AppRoutes/Place';
import { PostsPage } from '~/routes/AppRoutes/Posts';
import { Profile } from '~/routes/AppRoutes/Profile';
import { Settings } from '~/routes/AppRoutes/Settings';
import { UserProfile } from '~/routes/AppRoutes/UserProfile';
import { Intro } from '~/routes/Auth/Intro';

import CreateTrip from './AppRoutes/CreateTrip/CreateTrip';
import { Trip } from './AppRoutes/Trip/Trip';

const router = createHashRouter([
  {
    path: '/',
    element: <Intro />,
  },
  {
    path: '/profile',
    element: <Profile />,
  },
  {
    path: '/posts/:id',
    element: <PostsPage />,
  },
  {
    path: '/add-friends',
    element: <AddNewFriends />,
  },
  {
    path: '/invite-people',
    element: <InvitePeople />,
  },
  {
    path: '/settings',
    element: <Settings />,
  },
  {
    path: '/place/:id',
    element: <Place />,
  },
  {
    path: '/trip/:id',
    element: <Trip />,
  },
  {
    path: '/user/:id',
    element: <UserProfile />,
  },
  {
    path: '/trip/create',
    element: <CreateTrip />,
  },
]);

const Navigator = () => {
  const { currentUser, loading } = useContext(AuthContext);

  const routArray = window.location.href.split('/');

  useEffect(() => {
    if (!currentUser && routArray[routArray.length - 1].length !== 0 && !loading) {
      window.history.pushState({}, '/', '/');
      window.location.reload();
    }
  }, [currentUser, loading]);

  return <RouterProvider router={router} />;
};

export default Navigator;

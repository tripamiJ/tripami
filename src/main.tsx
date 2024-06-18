import React from 'react';
import ReactDOM from 'react-dom/client';

import { AuthProvider } from '~/providers/authContext';
import Navigator from '~/routes';

import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <Navigator />
    </AuthProvider>
  </React.StrictMode>
);

import React from 'react';
import ReactDOM from 'react-dom/client';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './context/AuthContext.tsx';

const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID || '';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PayPalScriptProvider
      options={{
        clientId: paypalClientId,
        currency: 'USD',
        intent: 'capture',
      }}
    >
      <AuthProvider>
        <App />
      </AuthProvider>
    </PayPalScriptProvider>
  </React.StrictMode>,
);
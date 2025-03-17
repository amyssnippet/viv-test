import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { GoogleOAuthProvider } from '@react-oauth/google';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Toaster } from 'react-hot-toast';

createRoot(document.getElementById('root')).render(
  <StrictMode>
  <GoogleOAuthProvider clientId="1078111133429-cl730ad6olunpocll2lql38vt3ppj3ti.apps.googleusercontent.com">
    <App />
    <Toaster />
</GoogleOAuthProvider>
  </StrictMode>,
)

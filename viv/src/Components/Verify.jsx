import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import BACKENDURL from './urls';

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('Verifying...');

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      axios.get(`${BACKENDURL}/verify-email?token=${token}`)
        .then(() => {
          toast.success('Email verified successfully!');
          setStatus('Your email has been verified. You can now log in.');
        })
        .catch(() => {
          toast.error('Invalid or expired verification link.');
          setStatus('Verification failed. Please try registering again.');
        });
    }
  }, [searchParams]);

  return (
    <div style={{ padding: "40px", color: "#fff", textAlign: "center" }}>
      <h2>{status}</h2>
    </div>
  );
}

export default VerifyEmail;

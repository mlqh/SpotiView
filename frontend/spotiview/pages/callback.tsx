'use client';

import { useSearchParams } from 'next/navigation';
import router from 'next/router';
import { useState } from 'react';

export default function Callback() {
  const clientId = 'a5e31f9ee875448491eb8729690c6fd9';
  const tokenEndpoint = 'https://accounts.spotify.com/api/token';
  const redirectUrl = 'http://localhost:3000/callback';

  const [error, setError] = useState<string>('');

  type Token = {
    access_token: string | null;
    refresh_token: string | null;
    expires_in: string | null;
    expires: string | null;
    save: (response: {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    }) => void;
  };

  const currentToken: Token = {
    get access_token() {
      return localStorage.getItem('access_token') || null;
    },
    get refresh_token() {
      return localStorage.getItem('refresh_token') || null;
    },
    get expires_in() {
      return localStorage.getItem('expires_in') || null;
    },
    get expires() {
      return localStorage.getItem('expires') || null;
    },

    save: function (response: {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    }) {
      const { access_token, refresh_token, expires_in } = response;
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      localStorage.setItem('expires_in', expires_in.toString());

      const now = new Date();
      const expiry = new Date(now.getTime() + expires_in * 1000);
      localStorage.setItem('expires', expiry.toISOString());
    },
  };

  // Spotify API Calls
  async function getToken(code: string) {
    const code_verifier = localStorage.getItem('code_verifier');

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUrl,
        code_verifier: code_verifier || '',
      }),
    });
    const resp = await response.json();
    console.log(resp);

    if (resp.access_token) {
      router.push('/dashboard')
    }
  }

  // async function refreshToken() {
  //   const response = await fetch(tokenEndpoint, {
  //     method: 'POST',
  //     headers: {
  //       'Content-Type': 'application/x-www-form-urlencoded',
  //     },
  //     body: new URLSearchParams({
  //       client_id: clientId,
  //       grant_type: 'refresh_token',
  //       refresh_token: currentToken.refresh_token || '',
  //     }),
  //   });

  //   return await response.json();
  // }

  function callback() {
    const searchParams = useSearchParams();
    const error = searchParams?.get('error');
    const code = searchParams?.get('code');

    if (error) {
      console.error(JSON.stringify({ error }));
      setError(error);
    } else if (code) {
      getToken(code);
    }
  }

  callback();

  return <div>{error ? `Error: ${error}` : 'Processing callback...'}</div>;
}

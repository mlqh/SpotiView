'use client';

import { motion } from 'framer-motion';
import { useEffect } from 'react';

export default function Login() {
  const clientId = 'a5e31f9ee875448491eb8729690c6fd9';
  const redirectUrl = 'http://localhost:8080'; // your redirect URL - must be localhost URL and/or HTTPS

  const authorizationEndpoint = 'https://accounts.spotify.com/authorize';
  const tokenEndpoint = 'https://accounts.spotify.com/api/token';
  const scope = 'user-read-private user-read-email';

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

  useEffect(() => {
    const args = new URLSearchParams(window.location.search);
    console.log('args', args);

    const attemptLogin = async () => {
      // On page load, try to fetch auth code from current browser search URL
      const code = args.get('code');
      console.log('code', code);

      // If we find a code, we're in a callback, do a token exchange
      if (code) {
        const token = await getToken(code);
        currentToken.save(token);
        console.log('token', token);

        // Remove code from URL so we can refresh correctly.
        const url = new URL(window.location.href);
        url.searchParams.delete('code');

        const updatedUrl = url.search ? url.href : url.href.replace('?', '');
        window.history.replaceState({}, document.title, updatedUrl);
      }

      // If we have a token, we're logged in, so fetch user data and render logged in template
      if (currentToken.access_token) {
        const userData = await getUserData();
        //route to dashboard/home
      }

      // Otherwise we're not logged in, so render the login template
      if (!currentToken.access_token) {
        //not logged in
      }
    };
    attemptLogin();
  }, []);

  async function redirectToSpotifyAuthorize() {
    const possible =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const randomValues = crypto.getRandomValues(new Uint8Array(64));
    const randomString = randomValues.reduce(
      (acc, x) => acc + possible[x % possible.length],
      ''
    );

    const code_verifier = randomString;
    const data = new TextEncoder().encode(code_verifier);
    const hashed = await crypto.subtle.digest('SHA-256', data);

    const code_challenge_base64 = btoa(
      String.fromCharCode(...new Uint8Array(hashed))
    )
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    window.localStorage.setItem('code_verifier', code_verifier);

    const authUrl = new URL(authorizationEndpoint);
    const params = {
      response_type: 'code',
      client_id: clientId,
      scope: scope,
      code_challenge_method: 'S256',
      code_challenge: code_challenge_base64,
      redirect_uri: redirectUrl,
    };

    authUrl.search = new URLSearchParams(params).toString();
    window.location.href = authUrl.toString(); // Redirect the user to the authorization server for login
  }

  // Soptify API Calls
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

    return await response.json();
  }

  async function refreshToken() {
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        grant_type: 'refresh_token',
        refresh_token: currentToken.refresh_token || '',
      }),
    });

    return await response.json();
  }

  async function getUserData() {
    const response = await fetch('https://api.spotify.com/v1/me', {
      method: 'GET',
      headers: { Authorization: 'Bearer ' + currentToken.access_token },
    });

    return await response.json();
  }

  async function loginWithSpotifyClick() {
    await redirectToSpotifyAuthorize();
  }

  async function logoutClick() {
    localStorage.clear();
    window.location.href = redirectUrl;
  }

  //unused?
  async function refreshTokenClick() {
    const token = await refreshToken();
    currentToken.save(token);
  }

  return (
    <motion.div
      className='flex flex-row sm:flex-row items-center justify-center gap-3 px-4 text-lg font-medium'
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: 0.1,
      }}
    >
      <h1>SpotiView</h1>
      <button
        className='flex mt-1 items-center justify-center gap-3 group h-[3rem] w-[8rem] bg-gray-900 text-white rounded-full outline-none transition-all focus:scale-110 hover:scale-110 hover:bg-gray-950 active:scale-105 disabled:scale-100 disabled:bg-opacity-65'
        onClick={loginWithSpotifyClick}
      >
        Login with Spotify
      </button>
    </motion.div>
  );
}

'use client';

import { motion } from 'framer-motion';
import { FaSpotify } from 'react-icons/fa';

export default function Home() {
  const clientId = 'a5e31f9ee875448491eb8729690c6fd9';
  const redirectUrl = 'http://localhost:3000/callback';

  const authorizationEndpoint = 'https://accounts.spotify.com/authorize';
  const scope = 'user-read-private user-read-email';

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
      show_dialog: 'true',
    };

    authUrl.search = new URLSearchParams(params).toString();
    window.location.href = authUrl.toString(); // Redirect the user to the authorization server for login
  }

  // async function getUserData() {
  //   const response = await fetch('https://api.spotify.com/v1/me', {
  //     method: 'GET',
  //     headers: { Authorization: 'Bearer ' + currentToken.access_token },
  //   });

  //   return await response.json();
  // }

  async function loginWithSpotifyClick() {
    await redirectToSpotifyAuthorize();
  }

  // async function logoutClick() {
  //   localStorage.clear();
  //   window.location.href = redirectUrl;
  // }


  return (
    <main className='flex flex-col gap-8 items-center justify-center h-screen'>
      <motion.div
        className='flex flex-col sm:flex-col items-center justify-center gap-3 px-4 text-lg font-medium'
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.1,
        }}
      >
        <h1 className='text-xl font-bold'>SpotiView</h1>
        <button
          className='flex mt-1 items-center justify-center gap-3 group h-[4rem] w-[14rem] bg-green-800 text-white rounded-full outline-none transition-all focus:scale-110 hover:scale-110 hover:bg-gray-850 active:scale-105'
          onClick={loginWithSpotifyClick}
        >
          Login with Spotify
          <FaSpotify />
        </button>
      </motion.div>
    </main>
  );
}

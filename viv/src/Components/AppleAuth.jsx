// React (Vite) Apple Sign-In Button

const APPLE_CLIENT_ID = "com.cosinv.auth";
const REDIRECT_URI = "http://localhost:5173/apple/callback"; // Your frontend redirect handler
const STATE = crypto.randomUUID();
const SCOPE = "name email";

const appleLoginUrl = `https://appleid.apple.com/auth/authorize?response_type=code&client_id=${APPLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${SCOPE}&response_mode=form_post&state=${STATE}`;

export default function AppleLogin() {
  return <a href={appleLoginUrl}><button>Sign in with Apple</button></a>;
}

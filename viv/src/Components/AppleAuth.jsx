const APPLE_CLIENT_ID = "com.cosinv.auth";
const REDIRECT_URI = "http://localhost:4000/api/v1/apple/callback";
const STATE = crypto.randomUUID();
const SCOPE = "name email";

const appleLoginUrl = `https://appleid.apple.com/auth/authorize?response_type=code&client_id=${APPLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPE)}&response_mode=query&state=${STATE}`;

export default function AppleLogin() {
  const loginUrl = `https://appleid.apple.com/auth/authorize?` + new URLSearchParams({
    response_type: 'code',
    client_id: 'com.cosinv.auth',
    redirect_uri: 'http://localhost:4000/api/v1/apple/callback',
    scope: 'name email',
    response_mode: 'form_post',
    state: 'randomstate123'
  }).toString();

  return (
    <form action={loginUrl} method="GET">
      <button type="submit">Sign in with Apple</button>
    </form>
  );
}


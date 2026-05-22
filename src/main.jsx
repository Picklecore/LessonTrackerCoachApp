import React from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider, SignedIn, SignedOut, SignIn } from '@clerk/clerk-react';
import App from './App.jsx';
import './styles.css';

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function Gate() {
  if (!publishableKey) {
    return (
      <div style={{ padding: 24, fontFamily: 'Inter, sans-serif', color: '#14241b' }}>
        <h2 style={{ marginTop: 0 }}>Missing Clerk key</h2>
        <p>Set <code>VITE_CLERK_PUBLISHABLE_KEY</code> in your environment to enable sign-in.</p>
      </div>
    );
  }
  return (
    <ClerkProvider publishableKey={publishableKey}>
      <SignedIn>
        <App />
      </SignedIn>
      <SignedOut>
        <div
          style={{
            minHeight: '100dvh',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            background: 'radial-gradient(120% 80% at 50% 0%, #e8e2d0 0%, #c8c1ad 100%)',
          }}
        >
          <SignIn routing="hash" />
        </div>
      </SignedOut>
    </ClerkProvider>
  );
}

createRoot(document.getElementById('root')).render(<Gate />);

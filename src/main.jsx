import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { IOSDevice } from './ios.jsx';
import './styles.css';

function Root() {
  return (
    <IOSDevice width={402} height={874} dark={true}>
      <App />
    </IOSDevice>
  );
}

createRoot(document.getElementById('root')).render(<Root />);

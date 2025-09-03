// import React from 'react';
import { createRoot } from 'react-dom/client';
import PrivacyPage from './PrivacyPage';
import '../../styles/globals.css';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<PrivacyPage />);
}
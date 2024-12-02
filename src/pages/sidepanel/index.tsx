import React from 'react';
import { createRoot } from 'react-dom/client';
import SidePanel from './SidePanel';
import '../../styles/globals.css';

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <SidePanel />
  </React.StrictMode>
); 
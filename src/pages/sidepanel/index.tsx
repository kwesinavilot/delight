import React from 'react';
import { createRoot } from 'react-dom/client';
import MainSidePanel from './MainSidePanel';
import '../../styles/globals.css';
import { ThemeProvider } from "@/components/ui/theme-provider";
import PostHogService from '../../services/PostHogService';

// Initialize PostHog
PostHogService.initialize();
PostHogService.trackPage('sidepanel');

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <MainSidePanel />
    </ThemeProvider>
  </React.StrictMode>
); 
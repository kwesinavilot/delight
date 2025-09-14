import { createRoot } from 'react-dom/client';
import WelcomePage from './WelcomePage';
import '../../styles/globals.css';
import PostHogService from '../../services/PostHogService';

// Initialize PostHog
PostHogService.initialize();
PostHogService.trackPage('welcome');

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<WelcomePage />);
}
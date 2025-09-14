import ReactDOM from 'react-dom/client';
import UpdatesPage from './UpdatesPage';
import '../../styles/globals.css';
import PostHogService from '../../services/PostHogService';

// Initialize PostHog
PostHogService.initialize();
PostHogService.trackPage('updates');

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(<UpdatesPage />);
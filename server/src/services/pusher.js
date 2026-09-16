import Pusher from 'pusher';
import config from '../config/index.js';

// Fallback to mock values to prevent crashing if ENV variables are not set during development
const pusher = new Pusher({
  appId: config.pusher.appId || "mock_app_id",
  key: config.pusher.key || "mock_key",
  secret: config.pusher.secret || "mock_secret",
  cluster: config.pusher.cluster || "us2",
  useTLS: true
});

export default pusher;

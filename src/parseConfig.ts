import Parse from 'parse';

// Initialize Parse
Parse.initialize(
  import.meta.env.VITE_PARSE_APP_ID,
  import.meta.env.VITE_PARSE_JAVASCRIPT_KEY
);

// Using the standard Parse server URL format
Parse.serverURL = import.meta.env.VITE_PARSE_SERVER_URL;

export default Parse;
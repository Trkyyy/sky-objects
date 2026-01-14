const fs = require('fs');
const path = require('path');

// Get API_BASE_URL from environment variable or use default
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';

console.log('Building with API_BASE_URL:', API_BASE_URL);

// Create environment config that will be injected into the frontend
const envConfig = `
window.ENV = {
  API_BASE_URL: "${API_BASE_URL}"
};
`;

// Write the environment config to a file that will be loaded by the frontend
fs.writeFileSync(path.join(__dirname, 'frontend', 'env-config.js'), envConfig);

console.log('Build complete! Environment config written to frontend/env-config.js');
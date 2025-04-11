declare global {
  interface Window {
    __CONFIG__?: { API_BASE_URL: string };
  }
}

export const API_BASE_URL = window.__CONFIG__?.API_BASE_URL || 'http://172.24.82.57:3001/api';

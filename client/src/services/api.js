import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true, // Enables HttpOnly cookie transmission across requests
  withXSRFToken: true, // Enables XSRF token header on cross-domain requests (Vercel -> Render)
  xsrfCookieName: 'XSRF-TOKEN', // Automatically reads readable CSRF cookie set by server
  xsrfHeaderName: 'X-XSRF-TOKEN', // Automatically sets request header for state-changing calls
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor to handle session expiration without using localStorage tokens
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (
        !window.location.pathname.includes('/login') &&
        !window.location.pathname.includes('/register')
      ) {
        window.dispatchEvent(new CustomEvent('ridesync:unauthorized'));
      }
    }
    return Promise.reject(error);
  }
);

export default api;

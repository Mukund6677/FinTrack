/**
 * Centralized API configuration for FinTrack Frontend.
 *
 * Supports:
 * 1. Explicit Vite environment variable: VITE_API_URL
 * 2. Production fallback: https://fintrack-backend-ac4h.onrender.com
 * 3. Local development fallback: http://127.0.0.1:8000
 */

const resolveApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === "string" && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, "");
  }

  if (import.meta.env.PROD) {
    return "https://fintrack-backend-ac4h.onrender.com";
  }

  return "http://127.0.0.1:8000";
};

export const API_URL = resolveApiUrl();
export default API_URL;

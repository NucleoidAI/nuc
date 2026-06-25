import axios from "axios";
import config from "../../config";
import http from "@canmingir/link/platform/http";
import { storage } from "@nucleoidjs/webstorage";

type QueueEntry = {
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
};

let isRefreshing = false;
let queue: QueueEntry[] = [];

function processQueue(err: unknown, token: string | null) {
  queue.forEach((entry) => (err ? entry.reject(err) : entry.resolve(token!)));
  queue = [];
}

async function refreshAccessToken(): Promise<string> {
  const identityProvider = storage.get("link", "identityProvider");
  const { data } = await axios.post(`${config.api}/oauth`, {
    refreshToken: storage.get("link", "refreshToken"),
    appId: config.appId,
    projectId: storage.get("projectId"),
    identityProvider,
    ...(identityProvider === "DEMO" && {
      username: "admin",
      password: "admin",
    }),
  });
  storage.set("link", "accessToken", data.accessToken);
  if (data.refreshToken) {
    storage.set("link", "refreshToken", data.refreshToken);
  }
  return data.accessToken;
}

// Fallback interceptor: handles 401s that axios-auth-refresh skipped
// (e.g. when shouldRefresh returned false due to clock skew)
http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status !== 401 ||
      originalRequest._retried ||
      originalRequest.skipAuthRefresh
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        queue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers["Authorization"] = `Bearer ${token}`;
        return http(originalRequest);
      });
    }

    originalRequest._retried = true;
    isRefreshing = true;

    try {
      const newToken = await refreshAccessToken();
      processQueue(null, newToken);
      originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
      return http(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      storage.remove("link", "accessToken");
      storage.remove("link", "refreshToken");
      window.location.href = `${window.location.origin}${config.base}/login`;
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default http;

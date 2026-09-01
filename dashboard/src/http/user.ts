import axios from "axios";
import config from "../../config";
import { storage } from "@nucleoidjs/webstorage";

declare module "axios" {
  interface AxiosInstance {
    getUserDetails(): Promise<{
      name: string;
      avatarUrl: string;
      id: string | number;
    } | null>;
  }
}

const instance = axios.create({
  headers: {
    common: {
      "Content-Type": "application/json",
    },
  },
});

instance.interceptors.request.use(async (request) => {
  const refreshToken = await storage.get("link", "refreshtoken");
  if (refreshToken) {
    request.headers["Authorization"] = `Bearer ${refreshToken}`;
  }
  return request;
});

instance.getUserDetails = async () => {
  const refreshToken = await storage.get("link", "refreshtoken");

  const identityProvider = await storage.get("link", "identityprovider");
  if (identityProvider?.toUpperCase() === "DEMO") {
    const userId = "1001";
    const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${userId}`;

    return {
      id: userId,
      name: "admin",
      avatarUrl,
    };
  }

  const { project } = config;
  const { github, google } = project;

  let userUrl;
  let provider;
  if (google) {
    userUrl = google.userUrl;
    provider = "google";
  } else if (github) {
    userUrl = github.userUrl;
    provider = "github";
  }

  if (refreshToken) {
    const response = await axios.get(userUrl, {
      headers: {
        Authorization: `Bearer ${refreshToken}`,
      },
    });
    if (provider === "github") {
      return {
        name: response.data.login,
        avatarUrl: response.data.avatar_url,
        id: response.data.id,
      };
    } else if (provider === "google") {
      return {
        name: response.data.name,
        avatarUrl: response.data.picture,
        id: response.data.id,
      };
    }
  }
  return null;
};

export default instance;

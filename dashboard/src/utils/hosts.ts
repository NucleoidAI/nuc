export const SWAGGER_URL =
  typeof window === "undefined"
    ? "http://localhost:3004"
    : window.location.origin;

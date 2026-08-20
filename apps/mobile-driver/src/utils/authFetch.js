import * as SecureStore from "expo-secure-store";

export const AUTH_TOKEN_KEY = "auth_token";

export async function authFetch(url, options = {}) {
  const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  return fetch(url, {
    ...options,
    headers,
  });
}

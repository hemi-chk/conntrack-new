import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

export const AUTH_TOKEN_KEY = "auth_token";

export async function getStoredAuthToken() {
  const secureToken = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
  if (secureToken) return secureToken;

  return AsyncStorage.getItem("driver_token");
}

export async function authFetch(url, options = {}) {
  const token = await getStoredAuthToken();
  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  return fetch(url, {
    ...options,
    headers,
  });
}

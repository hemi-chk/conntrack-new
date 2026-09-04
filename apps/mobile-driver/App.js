import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { API_BASE_URL } from "./src/constants/config";
import { ThemeProvider } from "./src/constants/theme";
import { OrderProvider } from "./src/context/OrderContext";
import "./src/i18n";
import AppNavigator from "./src/navigation/AppNavigator";
import { AUTH_TOKEN_KEY } from "./src/utils/authFetch";

// Attach the driver's session token to every request to our own API, so
// individual screens don't each need to know about auth headers.
const originalFetch = global.fetch;
global.fetch = async (url, options = {}) => {
  const urlStr = url.toString();
  if (urlStr.startsWith(API_BASE_URL)) {
    const secureToken = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
    const storageToken = await AsyncStorage.getItem("driver_token");
    const token = secureToken || storageToken;

    if (token) {
      options.headers = { ...options.headers, Authorization: `Bearer ${token}` };
    }
  }
  return originalFetch(url, options);
};

export default function App() {
  return (
    <ThemeProvider>
      <OrderProvider>
        <AppNavigator />
      </OrderProvider>
    </ThemeProvider>
  );
}
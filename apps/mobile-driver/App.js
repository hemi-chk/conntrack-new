import AsyncStorage from "@react-native-async-storage/async-storage";
import AppNavigator from "./src/navigation/AppNavigator";
import "./src/i18n";
import { OrderProvider } from "./src/context/OrderContext";
import { API_BASE_URL } from "./src/constants/config";

// Attach the driver's session token to every request to our own API, so
// individual screens don't each need to know about auth headers.
const originalFetch = global.fetch;
global.fetch = async (url, options = {}) => {
  const urlStr = url.toString();
  if (urlStr.startsWith(API_BASE_URL)) {
    const token = await AsyncStorage.getItem("driver_token");
    if (token) {
      options.headers = { ...options.headers, Authorization: `Bearer ${token}` };
    }
  }
  return originalFetch(url, options);
};

export default function App() {
  return (
    <OrderProvider>
      <AppNavigator />
    </OrderProvider>
  );
}
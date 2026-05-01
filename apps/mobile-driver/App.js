import AppNavigator from "./src/navigation/AppNavigator";
import "./src/i18n";
import { OrderProvider } from "./src/context/OrderContext";

export default function App() {
  return (
    <OrderProvider>
      <AppNavigator />
    </OrderProvider>
  );
}
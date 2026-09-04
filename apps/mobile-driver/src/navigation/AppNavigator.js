import { NavigationContainer, DefaultTheme, DarkTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "../constants/theme";

import ChangePassword from "../screens/ChangePassword";
import Dashboard from "../screens/Dashboard";
import Documents from "../screens/Documents";
import DriverProfile from "../screens/DriverProfile";
import EditProfile from "../screens/EditProfile";
import History from "../screens/History";
import IntroScreen from "../screens/IntroScreen";
import Language from "../screens/Language";
import LoginScreen from "../screens/LoginScreen";
import MapScreen from "../screens/MapScreen";
import Notifications from "../screens/Notifications";
import OrderDetails from "../screens/OrderDetails";
import Settings from "../screens/Settings";
import Support from "../screens/Support";
import Tracking from "../screens/Tracking";
import VehicleInfo from "../screens/VehicleInfo";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { isDarkMode, theme: activeTheme } = useTheme();

  const navigationTheme = {
    ...(isDarkMode ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDarkMode ? DarkTheme.colors : DefaultTheme.colors),
      background: activeTheme.colors.background,
      card: activeTheme.colors.surface,
      text: activeTheme.colors.text,
      border: activeTheme.colors.border,
      primary: activeTheme.colors.primary,
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Intro" component={IntroScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Dashboard" component={Dashboard} />
        <Stack.Screen name="OrderDetails" component={OrderDetails} />
        <Stack.Screen name="Tracking" component={Tracking} />
        <Stack.Screen name="Map" component={MapScreen} />
        <Stack.Screen name="Documents" component={Documents} />
        <Stack.Screen name="Support" component={Support} />
        <Stack.Screen name="Profile" component={DriverProfile} />
        <Stack.Screen name="EditProfile" component={EditProfile} />
        <Stack.Screen name="Notifications" component={Notifications} />
        <Stack.Screen name="VehicleInfo" component={VehicleInfo} />
        <Stack.Screen name="Settings" component={Settings} />
        <Stack.Screen name="Language" component={Language} />
        <Stack.Screen name="History" component={History} />
        <Stack.Screen name="ChangePassword" component={ChangePassword} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
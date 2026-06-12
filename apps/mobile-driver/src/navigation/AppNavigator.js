import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";


import LoginScreen from "../screens/LoginScreen";
import Dashboard from "../screens/Dashboard";
import OrderDetails from "../screens/OrderDetails";
import Tracking from "../screens/Tracking";
import MapScreen from "../screens/MapScreen";
import Documents from "../screens/Documents";
import Support from "../screens/Support";
import DriverProfile from "../screens/DriverProfile";
import EditProfile from "../screens/EditProfile";
import Notifications from "../screens/Notifications";
import VehicleInfo from "../screens/VehicleInfo";
import Settings from "../screens/Settings";
import Language from "../screens/Language";
import History from "../screens/History";
import ChangePassword from "../screens/ChangePassword";


const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
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
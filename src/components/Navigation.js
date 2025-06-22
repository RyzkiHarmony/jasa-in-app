import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text, Platform } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";

// Auth Screens
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";

// Customer Screens
import HomeScreen from "../screens/customer/HomeScreen";
import BookingFormScreen from "../screens/customer/BookingFormScreen";
import BookingHistoryScreen from "../screens/customer/BookingHistoryScreen";
import ReviewFormScreen from "../screens/customer/ReviewFormScreen";
import ProfileScreen from "../screens/customer/ProfileScreen";

// UMKM Screens
import DashboardScreen from "../screens/umkm/DashboardScreen";
import ManageBookingsScreen from "../screens/umkm/ManageBookingsScreen";
import ManageServicesScreen from "../screens/umkm/ManageServicesScreen";
import UMKMProfileScreen from "../screens/umkm/ProfileScreen";

import { useAuth } from "../context/AuthContext";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Customer Tab Navigator
const CustomerTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: "#48bb78",
        tabBarInactiveTintColor: "#9ca3af",
        tabBarStyle: {
          backgroundColor: "white",
          borderTopWidth: 0,
          elevation: 20,
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: -4,
          },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          paddingBottom: Platform.OS === "ios" ? 22 : 9,
          paddingTop: 9,
          height: Platform.OS === "ios" ? 75 : 62,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          position: "absolute",
        },
        tabBarLabelStyle: {
          fontSize: 10.5,
          fontWeight: "600",
          marginTop: 1.5,
        },
        tabBarIconStyle: {
          marginTop: 1.5,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: "Beranda",
          tabBarIcon: ({ color, focused }) => (
            <Icon
              name="home"
              size={focused ? 23 : 20}
              color={color}
              style={{
                transform: [{ scale: focused ? 1.1 : 1 }],
              }}
            />
          ),
        }}
      />
      <Tab.Screen
        name="BookingHistory"
        component={BookingHistoryScreen}
        options={{
          tabBarLabel: "Riwayat",
          tabBarIcon: ({ color, focused }) => (
            <Icon
              name="history"
              size={focused ? 23 : 20}
              color={color}
              style={{
                transform: [{ scale: focused ? 1.1 : 1 }],
              }}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: "Profil",
          tabBarIcon: ({ color, focused }) => (
            <Icon
              name="person"
              size={focused ? 23 : 20}
              color={color}
              style={{
                transform: [{ scale: focused ? 1.1 : 1 }],
              }}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// UMKM Tab Navigator
const UMKMTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: "#48bb78",
        tabBarInactiveTintColor: "#9ca3af",
        tabBarStyle: {
          backgroundColor: "white",
          borderTopWidth: 0,
          elevation: 20,
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: -4,
          },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          paddingBottom: Platform.OS === "ios" ? 22 : 9,
          paddingTop: 9,
          height: Platform.OS === "ios" ? 75 : 62,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          position: "absolute",
        },
        tabBarLabelStyle: {
          fontSize: 10.5,
          fontWeight: "600",
          marginTop: 1.5,
        },
        tabBarIconStyle: {
          marginTop: 1.5,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: "Dashboard",
          tabBarIcon: ({ color, focused }) => (
            <Icon
              name="dashboard"
              size={focused ? 23 : 20}
              color={color}
              style={{
                transform: [{ scale: focused ? 1.1 : 1 }],
              }}
            />
          ),
        }}
      />
      <Tab.Screen
        name="ManageBookings"
        component={ManageBookingsScreen}
        options={{
          tabBarLabel: "Booking",
          tabBarIcon: ({ color, focused }) => (
            <Icon
              name="event"
              size={focused ? 23 : 20}
              color={color}
              style={{
                transform: [{ scale: focused ? 1.1 : 1 }],
              }}
            />
          ),
        }}
      />
      <Tab.Screen
        name="ManageServices"
        component={ManageServicesScreen}
        options={{
          tabBarLabel: "Layanan",
          tabBarIcon: ({ color, focused }) => (
            <Icon
              name="build"
              size={focused ? 23 : 20}
              color={color}
              style={{
                transform: [{ scale: focused ? 1.1 : 1 }],
              }}
            />
          ),
        }}
      />
      <Tab.Screen
        name="UMKMProfile"
        component={UMKMProfileScreen}
        options={{
          tabBarLabel: "Profil",
          tabBarIcon: ({ color, focused }) => (
            <Icon
              name="person"
              size={focused ? 23 : 20}
              color={color}
              style={{
                transform: [{ scale: focused ? 1.1 : 1 }],
              }}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Main App Navigator
const AppNavigator = () => {
  const { user } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {!user ? (
          // Auth Stack
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          // Main App Stack
          <>
            {user.role === "customer" ? (
              <>
                <Stack.Screen name="CustomerTabs" component={CustomerTabs} />
                <Stack.Screen
                  name="BookingForm"
                  component={BookingFormScreen}
                  options={{
                    headerShown: true,
                    title: "Form Booking",
                    headerStyle: {
                      backgroundColor: "#48bb78",
                    },
                    headerTintColor: "white",
                    headerTitleStyle: {
                      fontWeight: "bold",
                    },
                  }}
                />
                <Stack.Screen
                  name="ReviewForm"
                  component={ReviewFormScreen}
                  options={{
                    headerShown: true,
                    title: "Beri Ulasan",
                    headerStyle: {
                      backgroundColor: "#48bb78",
                    },
                    headerTintColor: "white",
                    headerTitleStyle: {
                      fontWeight: "bold",
                    },
                  }}
                />
              </>
            ) : (
              // UMKM Stack
              <Stack.Screen name="UMKMTabs" component={UMKMTabs} />
            )}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;

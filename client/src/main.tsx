// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import {
  RouterProvider,
  createBrowserRouter,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { AuthProvider } from "./contexts/AuthContext";
import SocketProvider from "./contexts/SocketContext";
import ProtectedRoute from "./routes/ProtectedRoute";

import LoginPage from "./routes/login/LoginForm";
import RegisterPage from "./routes/register/RegisterForm";
import HomePage from "./routes/home/HomePage";
import "./index.css";
import Profile from "./routes/profile/Profile";
import FriendsPage from "./routes/friends/FriendsPage";
import HomePageMain from "./routes/home/HomePageMain";
import FriendsPageMain from "./routes/friends/FriendsPageMain";
import FriendRequestsPage from "./routes/friends/FriendRequestsPage";
import FindFriendsPage from "./routes/friends/FindFriendsPage";
import MainLayout from "./routes/home/MainLayout";
import Post from "./routes/posts/Post";

import ProfilePosts from "./components/profile/posts/ProfilePosts";
import ProfileAbout from "./components/profile/about/ProfileAbout";

import AboutOverview from "./components/profile/about/AboutOverview";
import AboutWorkEducation from "./components/profile/about/AboutWorkEducation";
import AboutPlacesLived from "./components/profile/about/AboutPlacesLived";
import AboutContactBasicInfo from "./components/profile/about/AboutContactBasicInfo";

const queryClient = new QueryClient();

const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <HomePage />
      </ProtectedRoute>
    ),
    children: [
      {
        element: <MainLayout />,
        children: [
          {
            index: true,
            element: <HomePageMain />,
          },
          {
            path: "posts/:postId",
            element: <Post />,
          },
        ],
      },

      {
        path: "profile/:userId",
        element: <Profile />,
        children: [
          {
            index: true,
            element: <ProfilePosts />,
          },
          {
            path: "about",
            element: <ProfileAbout />,
            children: [
              { 
                index: true, 
                element: <AboutOverview /> 
              },
              {
                path: "overview",
                element: <AboutOverview />,
              },
              {
                path: "work-education",
                element: <AboutWorkEducation />,
              },
              {
                path: "places-lived",
                element: <AboutPlacesLived />,
              },
              {
                path: "contact-basic-info",
                element: <AboutContactBasicInfo />,
              },
            ],
          },
        ],
      },
      {
        path: "friends",
        element: <FriendsPage />,
        children: [
          {
            index: true,
            element: <FriendsPageMain />,
          },
          {
            path: "find",
            element: <FindFriendsPage />,
          },
          {
            path: "requests",
            element: <FriendRequestsPage />,
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SocketProvider>
          <RouterProvider router={router} />
        </SocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);

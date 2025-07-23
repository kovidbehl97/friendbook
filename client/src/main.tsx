import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  RouterProvider,
  createBrowserRouter,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import SocketProvider from "./contexts/SocketContext";
import "./index.css";

import ProtectedRoute from "./routes/ProtectedRoute";
import LoginPage from "./routes/login/LoginForm";
import RegisterPage from "./routes/register/RegisterForm";
import HomePage from "./routes/home/HomePage";

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
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
      <SocketProvider>
        <RouterProvider router={router} />
      </SocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>
);

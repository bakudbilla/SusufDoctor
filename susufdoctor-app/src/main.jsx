import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";

import HomePage from "./components/HomePage.jsx";
import Signup from "./components/Signup.jsx";
import DashboardPage from "./dashboard/DashboardPage.jsx";
import ProtectedRoute from './utils/ProtectedRoute';

import AdminApp from "./admin/AdminApp";
import AdminLogin from "./admin/AdminLogin";
import AdminSignup from "./admin/AdminSignup";
import AdminLayout from "./admin/AdminLayout";
import AdminDashboard from "./admin/AdminDashboard";
import RadiologistManagement from "./admin/RadiologistManagement";
import RecentReports from "./admin/RecentReports";

document.documentElement.style.overflowX = 'hidden'
document.body.style.overflowX = 'hidden'

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [{ path: "/", element: <HomePage /> }],
  },

  { path: "/signup", element: <Signup /> },
  { path: "/dashboard", element: (
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  ) },

  { path: "/admin/login", element: <AdminLogin /> },
  { path: "/admin/signup", element: <AdminSignup /> },

  {
    path: "/admin",
    element: <AdminApp />, 
    children: [
      {
        path: "",
        element: <AdminLayout />,
        children: [
          { path: "dashboard", element: <AdminDashboard /> },
          { path: "users", element: <RadiologistManagement /> },
          { path: "reports", element: <RecentReports /> },
        ],
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);

import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

// ✅ Lazy-load components (no duplicates)
const HomePage = lazy(() => import("./components/HomePage.jsx"));
const Signup = lazy(() => import("./components/Signup.jsx"));
const Login = lazy(() => import("./components/Login.jsx"));
const DashboardPage = lazy(() => import("./dashboard/Dashboard.jsx"));

// ✅ Define your routes cleanly
const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [{ path: "/", element: <HomePage /> }],
  },
  { path: "/signup", element: <Signup /> },
  { path: "/login", element: <Login /> },
  { path: "/dashboard", element: <DashboardPage /> },
]);

// ✅ Render the app
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Suspense fallback={<div className="text-center mt-10">Loading...</div>}>
      <RouterProvider router={router} />
    </Suspense>
  </React.StrictMode>
);

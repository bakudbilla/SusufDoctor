import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import HomePage from "./components/HomePage.jsx";
import Signup from "./components/Signup.jsx";
import DashboardPage from "./dashboard/DashboardPage.jsx";


const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { path: "/", 
        element: <HomePage /> 
      }
    ],
  },
  { path: "/signup", element: <Signup /> },
  { path: "/dashboard", element: <DashboardPage /> },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);

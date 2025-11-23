import { useEffect, useState, useCallback } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { API_URL } from "../utils/constant";

export default function AdminApp() {
  const [loading, setLoading] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);

  const checkAdminStatus = useCallback(async () => {
    try {
      const token = localStorage.getItem("admin_token");

      if (!token) {
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_URL}/auth/me/role`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        setLoading(false);
        return;
      }

      const data = await res.json();
      const ok =
        data?.data?.is_admin === true || data?.data?.is_superuser === true;

      setIsAllowed(ok);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAdminStatus();
  }, [checkAdminStatus]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-linear-to-br from-blue-500 to-blue-900">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading Admin Panel...</p>
        </div>
      </div>
    );
  }

  if (!isAllowed) return <Navigate to="/admin/login" replace />;

  return <Outlet />;
}

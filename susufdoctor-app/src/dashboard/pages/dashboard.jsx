import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Activity, CheckCircle, LogOut, Loader } from "lucide-react";
import PatientsPerMonthChart from "../components/PatientChart";
import FiltersQuickAction from "../components/FiltersQuickAction";
import { API_URL } from '../../utils/constant';
import { useNavigate } from 'react-router-dom';
import AgeDistributionHistogram from '../components/AgeHistogram';
import WordCloud from "../components/WordCloud";  


export function Dashboard() {
  const [radiologistName, setRadiologistName] = useState("Dr. Unknown");
  const [stats, setStats] = useState({
    totalScans: 0,
    completedToday: 0,
  });
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const navigate = useNavigate('');

  // Trigger for Word Cloud auto-refresh
  const [refreshWordCloud, setRefreshWordCloud] = useState(0);

  useEffect(() => {
    const storedName = localStorage.getItem("radiologist_name");
    if (storedName) {
      setRadiologistName(storedName);
    }

    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");

      try {
        const userResponse = await fetch(`${API_URL}/auth/me/`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (userResponse.ok) {
          const userData = await userResponse.json();
          const fullName =
            userData.data?.full_name ||
            localStorage.getItem("radiologist_name") ||
            "Dr. Unknown";
          setRadiologistName(fullName);
          localStorage.setItem("radiologist_name", fullName);
        }
      } catch (e) {
        console.error("Auth/me endpoint not available, using localStorage",e);
      }

      const patientsResponse = await fetch(`${API_URL}/patients/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (patientsResponse.ok) {
        const patientsData = await patientsResponse.json();
        const patientsList = patientsData.data || [];

        const totalScans = patientsList.reduce((sum, p) => sum + (p.visit_count || 1), 0);
        const today = new Date().toISOString().split("T")[0];
        const completedToday = patientsList.filter((p) => {
          const createdDate = p.latest_visit?.split("T")[0];
          return createdDate === today;
        }).length;
console.log(totalScans)
        setStats({
          totalScans,
          completedToday,
        });

        setRefreshWordCloud((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      const token = localStorage.getItem("access_token");

      const response = await fetch(`${API_URL}/auth/logout/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.warn("Logout endpoint returned error, but proceeding");
      }

      localStorage.removeItem("access_token");
      localStorage.removeItem("radiologist_name");
      navigate("/signup")
      
    } catch (error) {
      console.error("Error logging out:", error);
      localStorage.removeItem("access_token");
      localStorage.removeItem("radiologist_name");
      navigate("/signup")
    } finally {
      setLoggingOut(false);
    }
  };

  const statsCards = [
    {
      title: "Total number of Patients",
      value: stats.totalScans,
      icon: Activity,
      bgColor: "#00B7EB",
    },
    {
      title: "Reports Generated Today",
      value: stats.completedToday,
      icon: CheckCircle,
      bgColor: "#FFD700",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#DFFBFA]">
        <Loader className="animate-spin text-blue-600" size={32} />
        <span className="ml-2 text-gray-600">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-[#DFFBFA] min-h-screen p-4 sm:p-6 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="pt-4 md:pt-0">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#0088FF]">
            Welcome back, {radiologistName}
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Generate Chest X-ray Report and analyze patient data.
          </p>
        </div>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="group flex items-center cursor-pointer gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-400 disabled:cursor-not-allowed text-white font-medium rounded-lg 
             transition-all duration-300 h-fit transform hover:scale-105 active:scale-95"
        >
          <LogOut className="h-4 w-4 transition-transform duration-300 text-white group-hover:rotate-12 group-hover:translate-x-1" />
          <span className="group-hover:animate-pulse">
            {loggingOut ? "Logging out..." : "Logout"}
          </span>
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
        {statsCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card
              key={idx}
              className="shadow-md transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:-translate-y-1 cursor-pointer relative overflow-hidden"
              style={{ backgroundColor: stat.bgColor }}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-white">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-white" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>


      {/* Chart Section */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="md:w-1/2 w-full">
          <PatientsPerMonthChart />
        </div>
        <div className="md:w-1/2 w-full">
          <AgeDistributionHistogram />
        </div>
      </div>



      <FiltersQuickAction />
      <WordCloud refreshTrigger={refreshWordCloud} />

    </div>
  );
}

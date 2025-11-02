import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Activity,
  CheckCircle,
  Clock,
} from "lucide-react";
import PatientsPerMonthChart from "../components/PatientChart";
import FiltersQuickAction from "../components/FiltersQuickAction";

const mockStats = {
  totalScans: 1247,
  pendingReports: 23,
  completedToday: 15,
  accuracyRate: 94.2,
};

export function Dashboard() {

  const statsCards = [
    {
      title: "Total Scans",
      value: mockStats.totalScans,
      icon: Activity,
      color: "text-blue-800",
      bgColor: '#00B7EB'
    },
    {
      title: "Average Model Accuracy",
      value: mockStats.accuracyRate + "%",
      icon: Clock,
      color: "text-yellow-600",
      bgColor: '#E91E63'
    },
    {
      title: "Number of X-rays Uploaded",
      value: mockStats.completedToday,
      icon: CheckCircle,
      color: "text-green-500",
      bgColor: '#FFD700'
    },
  ];

  return (
    <div className="space-y-6 bg-[#DFFBFA] min-h-screen p-4 sm:p-6 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#0088FF]">
            Welcome back, Dr. Akudbilla
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Here's what's happening with your radiology practice today.
          </p>
        </div>

      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} className='shadow-sm hover:shadow-md transition-all cursor-pointer' style={{ backgroundColor: stat.bgColor }}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-white">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-white" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold text-white`}>{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Chart Section */}
      <PatientsPerMonthChart />

      <FiltersQuickAction />
    </div>
  );
}

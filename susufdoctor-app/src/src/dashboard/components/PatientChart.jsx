"use client";

import { useState, useEffect } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Loader2 } from "lucide-react";

const months = [
  "All Months",
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export default function PatientsPerMonthChart() {
  const [selectedFilter, setSelectedFilter] = useState("All Months");
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchChartData();
  }, []);

  const fetchChartData = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("access_token");

      const response = await fetch("http://localhost:8000/patients/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.status === "success") {
        const processedData = processPatientData(data.data);
        setChartData(processedData);
      } else {
        setError("Failed to fetch data");
      }
    } catch (err) {
      console.error("Error fetching chart data:", err);
      setError("Error fetching data");
    } finally {
      setLoading(false);
    }
  };

  const processPatientData = (patients) => {
    const monthlyData = {};

    patients.forEach((patient) => {
      if (patient.latest_visit) {
        const date = new Date(patient.latest_visit);
        const monthIndex = date.getMonth();
        const monthName = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ][monthIndex];

        if (!monthlyData[monthName]) {
          monthlyData[monthName] = { month: monthName, Reports: 0, Patients: 0 };
        }

        monthlyData[monthName].Reports += patient.visit_count || 0;
        monthlyData[monthName].Patients += 1;
      }
    });

    return months
      .slice(1)
      .map((month) => monthlyData[month] || { month, Reports: 0, Patients: 0 });
  };

  const filteredData =
    selectedFilter === "All Months"
      ? chartData
      : chartData.filter((item) => item.month === selectedFilter);

  if (loading) {
    return (
      <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="ml-2 text-gray-600">Loading chart data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex flex-row items-center justify-between p-6 pb-4 border-b">
        <h2 className="text-lg font-semibold text-gray-900">
          Number of patients per month
        </h2>

        <div className="relative">
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="appearance-none px-3 py-1 pr-8 rounded-md bg-indigo-50 text-[#0088FF] text-sm font-medium border-none outline-none cursor-pointer focus:ring-0 focus:outline-none"
          >
            {months.map((month) => (
              <option key={month} value={month}>
                {month}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#0088FF]">
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="flex justify-center gap-6 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-[#0088FF]"></div>
            <span className="text-sm text-gray-600">Reports</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-[#F2EFFF]"></div>
            <span className="text-sm text-gray-600">Patients</span>
          </div>
        </div>

        {filteredData.length > 0 ? (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={filteredData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              barSize={48}
            >
              <CartesianGrid
                stroke="#d1d5db"
                strokeDasharray="4 4"
                horizontal={true}
                vertical={false}
              />

              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#6b7280" }}
              />

              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#6b7280" }}
              />

              <Tooltip
                cursor={{ fill: "transparent" }}
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
                labelStyle={{ color: "#111827", fontWeight: 600 }}
                formatter={(value, name) => {
                  const color = name === "Reports" ? "#0088FF" : "#111827";
                  return [
                    <span style={{ color, fontWeight: 600 }}>{`${name}: ${value}`}</span>,
                    null,
                  ];
                }}
              />

              <Legend wrapperStyle={{ display: "none" }} />

              <Bar
                dataKey="Reports"
                stackId="a"
                fill="#0088FF"
                radius={[4, 4, 0, 0]}
              />

              <Bar
                dataKey="Patients"
                stackId="a"
                fill="#F2EFFF"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No data available
          </div>
        )}
      </div>
    </div>
  );
}
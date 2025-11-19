import { useState, useEffect } from "react"
import { Pie, PieChart } from "recharts"
import { Card, CardContent, CardDescription, CardHeader } from "./ui/card"
import { ChartContainer } from "./ui/chart"
import { Loader2 } from "lucide-react"
import { API_URL } from '../../utils/constant'

const chartConfig = {
  patients: {
    label: "Patients",
  },
  Male: {
    label: "Male",
    color: "var(--chart-1)",
  },
  Female: {
    label: "Female",
    color: "var(--chart-2)",
  },
}

export default function PatientGenderDistribution() {
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchGenderDistribution()
  }, [])

  const fetchGenderDistribution = async () => {
    try {
      setLoading(true)
      setError(null)
      const token = localStorage.getItem("access_token")

      const response = await fetch(`${API_URL}/patients/`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (data.status === "success" && data.data) {
        // Count patients by gender
        const genderCount = {
          Male: 0,
          Female: 0,
        }

        data.data.forEach((patient) => {
          const gender = (patient.sex || "").toLowerCase()
          if (gender === "male") {
            genderCount.Male += 1
          } else if (gender === "female") {
            genderCount.Female += 1
          }
        })

        // Format data for chart
        const formattedData = [
          {
            gender: "Male",
            patients: genderCount.Male,
            fill: "#00B7EB",
          },
          {
            gender: "Female",
            patients: genderCount.Female,
            fill: "#8B00FF",
          },
        ].filter((item) => item.patients > 0) // Only show genders with patients

        setChartData(formattedData)
      }
    } catch (err) {
      console.error("Error fetching gender distribution:", err)
      setError("Failed to load gender distribution data")
    } finally {
      setLoading(false)
    }
  }

  const total = chartData.reduce((sum, item) => sum + item.patients, 0)

  if (loading) {
    return (
      <Card className="flex flex-col w-full">
        <CardHeader className="items-center pb-0">
          <h2 className="font-semibold text-lg">Patient Gender Distribution</h2>
          <CardDescription>Male vs Female</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0 flex items-center justify-center min-h-[300px]">
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm text-muted-foreground">Loading data...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="flex flex-col w-full">
        <CardHeader className="items-center pb-0">
          <h2 className="font-semibold text-lg">Patient Gender Distribution</h2>
          <CardDescription>Male vs Female</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0 flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            <p className="text-sm text-red-500">{error}</p>
            <button
              onClick={fetchGenderDistribution}
              className="mt-3 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 underline"
            >
              Retry
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (chartData.length === 0) {
    return (
      <Card className="flex flex-col w-full">
        <CardHeader className="items-center pb-0">
          <h2 className="font-semibold text-lg">Patient Gender Distribution</h2>
          <CardDescription>Male vs Female</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0 flex items-center justify-center min-h-[300px]">
          <p className="text-sm text-muted-foreground">No patient data available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="flex flex-col w-full">
      <CardHeader className="items-center pb-0">
        <h2 className="font-semibold text-lg">Patient Gender Distribution</h2>
        <CardDescription>Male vs Female</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[300px]"
        >
          <PieChart>
            <Pie data={chartData} dataKey="patients" nameKey="gender" />
          </PieChart>
        </ChartContainer>
      </CardContent>
      <div className="flex gap-4 justify-center items-center pb-6 px-4 flex-wrap">
        {chartData.map((item) => {
          const percentage = ((item.patients / total) * 100).toFixed(1)
          return (
            <div
              key={item.gender}
              className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 hover:shadow-sm"
            >
              <div
                className="w-3 h-3 rounded-full transition-transform duration-200"
                style={{ backgroundColor: item.fill }}
              ></div>
              <span className="text-sm font-medium transition-colors duration-200">
                {item.gender}: {item.patients} ({percentage}%)
              </span>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
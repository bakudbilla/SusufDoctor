import { useState, useEffect } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card"
import { Loader2 } from "lucide-react"
import { API_URL } from '../../utils/constant'

const colors = ["#93c5fd", "#60a5fa", "#3b82f6", "#2563eb", "#1d4ed8", "#1e40af", "#1e3a8a"]

const CustomBar = (props) => {
  const { x, y, width, height, fill } = props
  const radius = 6
  return (
    <g>
      <path
        d={`
          M${x},${y + radius}
          Q${x},${y} ${x + radius},${y}
          L${x + width - radius},${y}
          Q${x + width},${y} ${x + width},${y + radius}
          L${x + width},${y + height}
          L${x},${y + height}
          Z
        `}
        fill={fill}
      />
    </g>
  )
}

export default function AgeDistributionHistogram() {
  const [ageBins, setAgeBins] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchAgeDistribution()
  }, [])

  const fetchAgeDistribution = async () => {
    try {
      setLoading(true)
      setError(null)
      const token = localStorage.getItem("access_token")

      const response = await fetch(`${API_URL}patients/`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (data.status === "success" && data.data) {
        // Define age bins
        const bins = {
          "0-10": 0,
          "11-20": 0,
          "21-30": 0,
          "31-40": 0,
          "41-50": 0,
          "51-60": 0,
          "61-70": 0,
          "71+": 0,
        }

        // Count patients in each age bin
        data.data.forEach((patient) => {
          const age = parseInt(patient.age) || 0
          if (age >= 0 && age <= 10) bins["0-10"] += 1
          else if (age >= 11 && age <= 20) bins["11-20"] += 1
          else if (age >= 21 && age <= 30) bins["21-30"] += 1
          else if (age >= 31 && age <= 40) bins["31-40"] += 1
          else if (age >= 41 && age <= 50) bins["41-50"] += 1
          else if (age >= 51 && age <= 60) bins["51-60"] += 1
          else if (age >= 61 && age <= 70) bins["61-70"] += 1
          else if (age > 70) bins["71+"] += 1
        })

        // Format data for chart
        const formattedBins = Object.entries(bins).map(([range, count]) => ({
          range,
          count,
        }))

        setAgeBins(formattedBins)
      }
    } catch (err) {
      console.error("Error fetching age distribution:", err)
      setError("Failed to load age distribution data")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="w-full h-full">
        <CardHeader>
          <CardTitle>Patient Age Distribution</CardTitle>
          <CardDescription>Number of patients per age group</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center min-h-[300px]">
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
      <Card className="w-full h-full">
        <CardHeader>
          <CardTitle>Patient Age Distribution</CardTitle>
          <CardDescription>Number of patients per age group</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            <p className="text-sm text-red-500">{error}</p>
            <button
              onClick={fetchAgeDistribution}
              className="mt-3 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 underline"
            >
              Retry
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full h-full">
      <CardHeader>
        <CardTitle>Patient Age Distribution</CardTitle>
        <CardDescription>Number of patients per age group</CardDescription>
      </CardHeader>
      <CardContent
        className="rounded-t-lg"
        style={{ outline: "none", borderRadius: "15px 30px 0 0", overflow: "hidden" }}
      >
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={ageBins}
            margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
            barCategoryGap={0}
            style={{ pointerEvents: "none" }}
            onClick={(e) => e.preventDefault()}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="range"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#6b7280", fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
              labelStyle={{ color: "#111827", fontWeight: 600 }}
              wrapperStyle={{ pointerEvents: "none" }}
            />
            <Bar dataKey="count" shape={<CustomBar />} isAnimationActive={false}>
              {ageBins.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-2 text-sm">
        <div className="text-muted-foreground leading-none">
          Showing {ageBins.reduce((sum, bin) => sum + bin.count, 0)} patients across {ageBins.filter(b => b.count > 0).length} age groups
        </div>
      </CardFooter>
    </Card>
  )
}
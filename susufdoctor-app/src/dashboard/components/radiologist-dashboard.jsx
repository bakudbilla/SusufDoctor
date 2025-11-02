import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { ImageUpload } from './image-upload';
import { ReportGeneration } from './report-generation';
import { PatientManagement } from './patient-management';
import { PredictionModel } from './prediction-model';
import { RLHFFeedback } from './rlhf-feedback';
import { 
  Upload, 
  FileText, 
  Users, 
  Brain, 
  MessageSquare, 
  Activity,
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';
import PatientsPerMonthChart from './PatientChart';

const mockStats = {
  totalScans: 1247,
  pendingReports: 23,
  completedToday: 15,
  accuracyRate: 94.2
};

const mockRecentActivity = [
  { id: 1, patient: "John Doe", scan: "Chest X-Ray", status: "completed", time: "2 hours ago" },
  { id: 2, patient: "Jane Smith", scan: "Chest X-ray", status: "pending", time: "4 hours ago" },
  { id: 3, patient: "Bob Johnson", scan: "Chest X-ray", status: "in-progress", time: "6 hours ago" },
];

export function RadiologistDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'in-progress':
        return <Activity className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      completed: "default",
      pending: "secondary",
      "in-progress": "outline"
    };
    
    return (
      <Badge variant={variants[status] || "destructive"}>
        {status.replace('-', ' ')}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <div className="flex items-center space-x-2">
            <Brain className="h-6 w-6 text-primary" />
            <span className="hidden text-lg font-semibold sm:inline-block">
              Radiologist Dashboard
            </span>
          </div>
          <div className="ml-auto flex items-center space-x-4">
            <Button variant="outline" size="sm">
              <MessageSquare className="mr-2 h-4 w-4" />
              Feedback
            </Button>
            <Button size="sm">
              <Upload className="mr-2 h-4 w-4" />
              New Scan
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-4 p-4 pt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="upload">
              <Upload className="mr-2 h-4 w-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="reports">
              <FileText className="mr-2 h-4 w-4" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="patients">
              <Users className="mr-2 h-4 w-4" />
              Patients
            </TabsTrigger>
            <TabsTrigger value="prediction">
              <Brain className="mr-2 h-4 w-4" />
              AI Model
            </TabsTrigger>
            <TabsTrigger value="feedback">
              <MessageSquare className="mr-2 h-4 w-4" />
              RLHF
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockStats.totalScans}</div>
                  <p className="text-xs text-muted-foreground">
                    +12% from last month
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Reports</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockStats.pendingReports}</div>
                  <p className="text-xs text-muted-foreground">
                    -3 from yesterday
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockStats.completedToday}</div>
                  <p className="text-xs text-muted-foreground">
                    +7 from yesterday
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">AI Accuracy</CardTitle>
                  <Brain className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockStats.accuracyRate}%</div>
                  <Progress value={mockStats.accuracyRate} className="mt-2" />
                </CardContent>
              </Card>
            </div>

            {/* <PatientsPerMonthChart /> */}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    Latest scans and reports processed
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockRecentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between space-x-4">
                        <div className="flex items-center space-x-4">
                          {getStatusIcon(activity.status)}
                          <div>
                            <p className="text-sm font-medium leading-none">
                              {activity.patient}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {activity.scan}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(activity.status)}
                          <div className="text-sm text-muted-foreground">
                            {activity.time}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>System Status</CardTitle>
                  <CardDescription>
                    Backend services health
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">FastAPI Server</span>
                      <Badge variant="default">Online</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Authentication Service</span>
                      <Badge variant="default">Online</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Prediction Model</span>
                      <Badge variant="default">Online</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Firebase Storage</span>
                      <Badge variant="default">Online</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">RLHF Service</span>
                      <Badge variant="secondary">Updating</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <ImageUpload />
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <ReportGeneration />
          </TabsContent>

          <TabsContent value="patients" className="space-y-4">
            <PatientManagement />
          </TabsContent>

          <TabsContent value="prediction" className="space-y-4">
            <PredictionModel />
          </TabsContent>

          <TabsContent value="feedback" className="space-y-4">
            <RLHFFeedback />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

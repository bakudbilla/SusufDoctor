import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Brain, 
  Activity, 
  TrendingUp, 
  Settings, 
  Database,
  Target,
  BarChart3,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';

const mockMetrics = {
  accuracy: 94.2,
  precision: 92.8,
  recall: 95.1,
  f1Score: 93.9,
  totalPredictions: 15847,
  successfulPredictions: 14927
};

const mockModelStatus = {
  status: 'online',
  version: 'v2.1.3',
  lastUpdated: '2024-10-01 14:30:00',
};

const mockTrainingData = [
  { date: '2024-09-01', accuracy: 91.2, samples: 1200 },
  { date: '2024-09-15', accuracy: 92.8, samples: 1350 },
  { date: '2024-10-01', accuracy: 94.2, samples: 1500 },  
];

const scanTypePerformance = [
  { type: 'Chest X-Ray', accuracy: 96.1, predictions: 4523 },
  { type: 'Brain MRI', accuracy: 93.8, predictions: 2847 },
  { type: 'Abdominal CT', accuracy: 91.5, predictions: 3621 },
  { type: 'Spine MRI', accuracy: 94.7, predictions: 1932 },
  { type: 'Cardiac CT', accuracy: 89.3, predictions: 1456 },
  { type: 'Bone X-Ray', accuracy: 97.2, predictions: 1468 },
];

// Custom progress bar component
function ColoredProgress({ value }) {
  return (
    <div className="w-full h-2 bg-gray-300 rounded-full mt-1">
      <div
        className="h-2 bg-green-500 rounded-full transition-all duration-500"
        style={{ width: `${value}%` }}
      ></div>
    </div>
  );
}

export function PredictionModel() {
  const [isRetraining, setIsRetraining] = useState(false);
  const [retrainingProgress, setRetrainingProgress] = useState(0);

  const startRetraining = () => {
    setIsRetraining(true);
    setRetrainingProgress(0);
    
    const interval = setInterval(() => {
      setRetrainingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsRetraining(false);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 1000);
  };

  const getStatusBadge = (status) => {
    const variants = {
      online: "default",
      training: "secondary",
      offline: "destructive"
    };
    
    return (
      <Badge variant={variants[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getPerformanceColor = (accuracy) => {
    if (accuracy >= 95) return 'text-green-600';
    if (accuracy >= 90) return 'text-blue-600';
    if (accuracy >= 85) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Model Status</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              {getStatusBadge(mockModelStatus.status)}
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Version</div>
                <div className="text-sm font-medium">{mockModelStatus.version}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Accuracy</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockMetrics.accuracy}%</div>
            <ColoredProgress value={mockMetrics.accuracy} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Predictions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockMetrics.totalPredictions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {mockMetrics.successfulPredictions.toLocaleString()} successful
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">F1 Score</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockMetrics.f1Score}%</div>
            <p className="text-xs text-muted-foreground">
              Precision: {mockMetrics.precision}% • Recall: {mockMetrics.recall}%
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Multimodal Transformer Model</CardTitle>
              <CardDescription>
                AI model performance metrics and training management
              </CardDescription>
            </div>
            <Button
              onClick={startRetraining}
              disabled={isRetraining}
              variant={isRetraining ? "secondary" : "default"}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRetraining ? 'animate-spin' : ''}`} />
              {isRetraining ? 'Retraining...' : 'Retrain Model'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isRetraining && (
            <div className="mb-6 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Model Retraining in Progress</span>
                <span className="text-sm text-muted-foreground">{Math.round(retrainingProgress)}%</span>
              </div>
              <ColoredProgress value={retrainingProgress} />
              <p className="text-xs text-muted-foreground">
                Training with latest feedback data and medical image updates...
              </p>
            </div>
          )}

          <Tabs defaultValue="performance" className="space-y-4">
            <TabsList>
              <TabsTrigger value="performance">
                <TrendingUp className="mr-2 h-4 w-4" />
                Performance
              </TabsTrigger>
              <TabsTrigger value="training">
                <Database className="mr-2 h-4 w-4" />
                Training History
              </TabsTrigger>
              <TabsTrigger value="config">
                <Settings className="mr-2 h-4 w-4" />
                Configuration
              </TabsTrigger>
            </TabsList>

            <TabsContent value="performance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Performance by Scan Type</CardTitle>
                  <CardDescription>
                    Model accuracy across different medical imaging modalities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {scanTypePerformance.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{item.type}</span>
                            <span className={`text-sm font-bold ${getPerformanceColor(item.accuracy)}`}>
                              {item.accuracy}%
                            </span>
                          </div>
                          <ColoredProgress value={item.accuracy} />
                          <div className="text-xs text-muted-foreground mt-1">
                            {item.predictions.toLocaleString()} predictions
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="training" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Training History</CardTitle>
                  <CardDescription>
                    Model performance improvements over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockTrainingData.map((entry, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                          <div>
                            <div className="text-sm font-medium">Training Completed</div>
                            <div className="text-xs text-muted-foreground">{entry.date}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{entry.accuracy}% accuracy</div>
                          <ColoredProgress value={entry.accuracy} />
                          <div className="text-xs text-muted-foreground">{entry.samples} samples</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="config" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Model Configuration</CardTitle>
                  <CardDescription>
                    Current multimodal transformer settings and parameters
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Architecture</Label>
                        <div className="text-sm text-muted-foreground mt-1">
                          Vision Transformer + BERT Encoder
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Input Resolution</Label>
                        <div className="text-sm text-muted-foreground mt-1">
                          512 x 512 pixels
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Batch Size</Label>
                        <div className="text-sm text-muted-foreground mt-1">
                          32 images
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Learning Rate</Label>
                        <div className="text-sm text-muted-foreground mt-1">
                          0.0001 (adaptive)
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Training Data</Label>
                        <div className="text-sm text-muted-foreground mt-1">
                          247,000 annotated images
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Last Updated</Label>
                        <div className="text-sm text-muted-foreground mt-1">
                          {mockModelStatus.lastUpdated}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function Label({ children, className }) {
  return <div className={className}>{children}</div>;
}

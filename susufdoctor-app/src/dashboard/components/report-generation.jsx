import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { 
  FileText, 
  Download, 
  Eye, 
  Brain, 
  Target,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

const mockReports = [
  {
    id: '1',
    patientId: 'P-2024-001',
    scanType: 'Chest X-Ray',
    date: '2024-10-02',
    status: 'review',
    aiConfidence: 92.5,
    findings: 'Normal chest X-ray. No acute cardiopulmonary abnormalities detected. Heart size and mediastinal contours are within normal limits. Lungs are clear with no evidence of infiltrates, masses, or pleural effusions. Bony structures appear intact.',
    recommendations: 'No immediate follow-up required. Continue routine screening as per guidelines.',
    gradcam: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop',
    originalImage: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400&h=300&fit=crop'
  },
  {
    id: '2',
    patientId: 'P-2024-002',
    scanType: 'Brain MRI',
    date: '2024-10-02',
    status: 'generating',
    aiConfidence: 0,
    findings: '',
    recommendations: '',
    gradcam: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400&h=300&fit=crop',
    originalImage: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400&h=300&fit=crop'
  },
  {
    id: '3',
    patientId: 'P-2024-003',
    scanType: 'Abdominal CT',
    date: '2024-10-01',
    status: 'completed',
    aiConfidence: 87.3,
    findings: 'Mild hepatic steatosis identified. No focal lesions or masses detected in the liver, pancreas, or spleen. Kidneys appear normal with no hydronephrosis. No abnormal lymphadenopathy.',
    recommendations: 'Follow-up in 6 months with lifestyle modifications. Consider dietary consultation.',
    gradcam: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400&h=300&fit=crop',
    originalImage: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400&h=300&fit=crop'
  }
];

export function ReportGeneration() {
  const [selectedReport, setSelectedReport] = useState(null);
  const [editedFindings, setEditedFindings] = useState('');
  const [editedRecommendations, setEditedRecommendations] = useState('');

  const selectReport = (report) => {
    setSelectedReport(report);
    setEditedFindings(report.findings);
    setEditedRecommendations(report.recommendations);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'review':
        return <Eye className="h-4 w-4 text-blue-500" />;
      case 'generating':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      completed: "default",
      review: "secondary", 
      generating: "outline"
    };
    
    return (
      <Badge variant={variants[status] || "destructive"}>
        {status === 'generating' ? 'AI Processing...' : status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const saveReport = () => {
    if (selectedReport) {
      console.log('Saving report:', {
        id: selectedReport.id,
        findings: editedFindings,
        recommendations: editedRecommendations
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Reports Queue</CardTitle>
            <CardDescription>
              AI-generated reports awaiting review
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockReports.map((report) => (
                <div
                  key={report.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedReport?.id === report.id
                      ? 'border-primary bg-primary/5'
                      : 'hover:border-muted-foreground/50'
                  }`}
                  onClick={() => selectReport(report)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{report.patientId}</span>
                    {getStatusIcon(report.status)}
                  </div>
                  <div className="text-xs text-muted-foreground mb-2">
                    {report.scanType} • {report.date}
                  </div>
                  <div className="flex items-center justify-between">
                    {getStatusBadge(report.status)}
                    {report.status !== 'generating' && (
                      <div className="text-xs text-muted-foreground">
                        AI: {report.aiConfidence}%
                      </div>
                    )}
                  </div>
                  {report.status === 'generating' && (
                    <Progress value={65} className="mt-2 h-1" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          {selectedReport ? (
            <>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Report: {selectedReport.patientId}</CardTitle>
                    <CardDescription>
                      {selectedReport.scanType} • {selectedReport.date}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    {selectedReport.status !== 'generating' && (
                      <Badge variant="outline">
                        <Brain className="mr-1 h-3 w-3" />
                        {selectedReport.aiConfidence}% confidence
                      </Badge>
                    )}
                    {getStatusBadge(selectedReport.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {selectedReport.status === 'generating' ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <Sparkles className="h-12 w-12 text-primary animate-pulse" />
                    <div className="text-center">
                      <h3 className="text-lg font-medium">AI Processing in Progress</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Multimodal transformer analyzing medical images...
                      </p>
                    </div>
                    <Progress value={65} className="w-64" />
                    <div className="text-sm text-muted-foreground">65% complete</div>
                  </div>
                ) : (
                  <Tabs defaultValue="report" className="space-y-4">
                    <TabsList>
                      <TabsTrigger value="report">
                        <FileText className="mr-2 h-4 w-4" />
                        Report
                      </TabsTrigger>
                      <TabsTrigger value="gradcam">
                        <Target className="mr-2 h-4 w-4" />
                        GradCAM
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="report" className="space-y-4">
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">Clinical Findings</label>
                          <Textarea
                            value={editedFindings}
                            onChange={(e) => setEditedFindings(e.target.value)}
                            className="mt-1 min-h-[120px]"
                            placeholder="Enter clinical findings..."
                          />
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium">Recommendations</label>
                          <Textarea
                            value={editedRecommendations}
                            onChange={(e) => setEditedRecommendations(e.target.value)}
                            className="mt-1 min-h-[80px]"
                            placeholder="Enter recommendations..."
                          />
                        </div>

                        <div className="flex space-x-2 pt-4">
                          <Button onClick={saveReport}>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Save Report
                          </Button>
                          <Button variant="outline">
                            <Download className="mr-2 h-4 w-4" />
                            Export PDF
                          </Button>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="gradcam" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium mb-2">Original Image</h4>
                          <ImageWithFallback
                            src={selectedReport.originalImage}
                            alt="Original medical scan"
                            className="w-full h-64 object-cover rounded-lg border"
                          />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium mb-2">GradCAM Visualization</h4>
                          <ImageWithFallback
                            src={selectedReport.gradcam}
                            alt="GradCAM heatmap"
                            className="w-full h-64 object-cover rounded-lg border"
                          />
                        </div>
                      </div>
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium mb-2">AI Analysis Explanation</h4>
                        <p className="text-sm text-muted-foreground">
                          The highlighted regions in the GradCAM visualization show areas where the AI model 
                          focused its attention during analysis. Warmer colors (red/yellow) indicate higher 
                          relevance to the diagnostic decision, while cooler colors (blue) show less relevant areas.
                        </p>
                      </div>
                    </TabsContent>
                  </Tabs>
                )}
              </CardContent>
            </>
          ) : (
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Select a Report</h3>
              <p className="text-sm text-muted-foreground">
                Choose a report from the queue to view details and make edits
              </p>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}

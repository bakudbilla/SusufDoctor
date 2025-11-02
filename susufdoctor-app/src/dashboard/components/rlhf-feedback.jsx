import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import {
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Send,
  TrendingUp,
  Target,
  RefreshCw,
  Brain
} from 'lucide-react';

const mockFeedback = [
  {
    id: 'F-001',
    reportId: 'R-2024-123',
    patientId: 'P-2024-001',
    scanType: 'Chest X-Ray',
    aiPrediction: 'Normal chest X-ray with no acute findings.',
    radiologistFeedback: 'AI correctly identified normal findings. However, subtle signs of early pneumonia in right lower lobe were missed.',
    rating: 'negative',
    date: '2024-10-02',
    status: 'processed'
  },
  {
    id: 'F-002',
    reportId: 'R-2024-124',
    patientId: 'P-2024-002',
    scanType: 'Brain MRI',
    aiPrediction: 'Small white matter lesions consistent with microvascular changes.',
    radiologistFeedback: 'Excellent identification of microvascular changes. AI correctly noted the distribution and characteristics.',
    rating: 'positive',
    date: '2024-10-01',
    status: 'integrated'
  },
  {
    id: 'F-003',
    reportId: 'R-2024-125',
    patientId: 'P-2024-003',
    scanType: 'Abdominal CT',
    aiPrediction: 'Mild hepatic steatosis, no focal lesions detected.',
    radiologistFeedback: 'AI correctly identified steatosis but missed small gallstone in gallbladder fundus.',
    rating: 'neutral',
    date: '2024-09-30',
    status: 'pending'
  }
];

const mockMetrics = {
  totalFeedback: 1247,
  positiveRating: 78.3,
  improvementRate: 12.5,
  processingTime: 2.4
};

export function RLHFFeedback() {
  const [newFeedback, setNewFeedback] = useState({
    reportId: '',
    feedback: '',
    rating: 'neutral'
  });

  const submitFeedback = () => {
    console.log('Submitting feedback:', newFeedback);
    setNewFeedback({ reportId: '', feedback: '', rating: 'neutral' });
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'secondary',
      processed: 'outline',
      integrated: 'default'
    };
    return (
      <Badge variant={variants[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getRatingIcon = (rating) => {
    switch (rating) {
      case 'positive':
        return <ThumbsUp className="h-4 w-4 text-green-500" />;
      case 'negative':
        return <ThumbsDown className="h-4 w-4 text-red-500" />;
      default:
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
    }
  };

  const getRatingColor = (rating) => {
    switch (rating) {
      case 'positive':
        return 'text-green-600';
      case 'negative':
        return 'text-red-600';
      default:
        return 'text-blue-600';
    }
  };

  return (
    <div className="space-y-6">

      {/* ====== METRICS CARDS ====== */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockMetrics.totalFeedback}</div>
            <p className="text-xs text-muted-foreground">+42 this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Positive Rating</CardTitle>
            <ThumbsUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockMetrics.positiveRating}%</div>
            <Progress value={mockMetrics.positiveRating} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Improvement Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{mockMetrics.improvementRate}%</div>
            <p className="text-xs text-muted-foreground">Since last training cycle</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing Time</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockMetrics.processingTime}h</div>
            <p className="text-xs text-muted-foreground">Average feedback integration</p>
          </CardContent>
        </Card>
      </div>

      {/* ====== MAIN TABS ====== */}
      <Card>
        <CardHeader>
          <CardTitle>RLHF (Reinforcement Learning from Human Feedback)</CardTitle>
          <CardDescription>Provide feedback to improve AI model accuracy</CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="submit" className="space-y-4">
            <TabsList>
              <TabsTrigger value="submit"><Send className="mr-2 h-4 w-4" />Submit Feedback</TabsTrigger>
              <TabsTrigger value="history"><MessageSquare className="mr-2 h-4 w-4" />Feedback History</TabsTrigger>
              <TabsTrigger value="loop"><Brain className="mr-2 h-4 w-4" />Feedback Loop</TabsTrigger>
            </TabsList>

            {/* === SUBMIT TAB === */}
            <TabsContent value="submit" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Provide AI Feedback</CardTitle>
                  <CardDescription>Help improve the AI model</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Report ID */}
                  <div className="space-y-2">
                    <Label htmlFor="report-id">Report ID</Label>
                    <input
                      id="report-id"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder="Enter report ID (e.g., R-2024-126)"
                      value={newFeedback.reportId}
                      onChange={(e) => setNewFeedback({ ...newFeedback, reportId: e.target.value })}
                    />
                  </div>

                  {/* Rating */}
                  <div className="space-y-2">
                    <Label>Feedback Rating</Label>
                    <RadioGroup
                      value={newFeedback.rating}
                      onValueChange={(value) => setNewFeedback({ ...newFeedback, rating: value })}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="positive" id="positive" />
                        <Label htmlFor="positive" className="flex items-center space-x-2">
                          <ThumbsUp className="h-4 w-4 text-green-500" />
                          <span>Positive - Accurate</span>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="neutral" id="neutral" />
                        <Label htmlFor="neutral" className="flex items-center space-x-2">
                          <MessageSquare className="h-4 w-4 text-blue-500" />
                          <span>Neutral - Partially correct</span>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="negative" id="negative" />
                        <Label htmlFor="negative" className="flex items-center space-x-2">
                          <ThumbsDown className="h-4 w-4 text-red-500" />
                          <span>Negative - Inaccurate</span>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Detailed Feedback */}
                  <div className="space-y-2">
                    <Label htmlFor="feedback-text">Detailed Feedback</Label>
                    <Textarea
                      id="feedback-text"
                      placeholder="Explain your feedback..."
                      value={newFeedback.feedback}
                      onChange={(e) => setNewFeedback({ ...newFeedback, feedback: e.target.value })}
                      className="min-h-[120px]"
                    />
                  </div>

                  <Button
                    onClick={submitFeedback}
                    disabled={!newFeedback.reportId || !newFeedback.feedback}
                    className="w-full"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Submit Feedback
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* === HISTORY TAB === */}
            <TabsContent value="history" className="space-y-4">
              {mockFeedback.map((feedback) => (
                <Card key={feedback.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      {/* Left */}
                      <div className="flex items-center space-x-2">
                        {getRatingIcon(feedback.rating)}
                        <div>
                          <div className="font-medium">{feedback.patientId} • {feedback.scanType}</div>
                          <div className="text-sm text-muted-foreground">
                            Report {feedback.reportId} • {feedback.date}
                          </div>
                        </div>
                      </div>
                      {/* Right */}
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(feedback.status)}
                        <span className={`text-sm font-medium ${getRatingColor(feedback.rating)}`}>
                          {feedback.rating.charAt(0).toUpperCase() + feedback.rating.slice(1)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium">AI Prediction:</Label>
                        <p className="text-sm text-muted-foreground mt-1 p-2 bg-muted/50 rounded">
                          {feedback.aiPrediction}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Radiologist Feedback:</Label>
                        <p className="text-sm text-muted-foreground mt-1 p-2 bg-muted/50 rounded">
                          {feedback.radiologistFeedback}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* === LOOP TAB === */}
            <TabsContent value="loop" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">RLHF Feedback Loop Process</CardTitle>
                  <CardDescription>How feedback improves the AI</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Steps */}
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">1</div>
                      <div>
                        <h4 className="font-medium">Radiologist Review</h4>
                        <p className="text-sm text-muted-foreground">
                          Experts evaluate the AI predictions and leave corrections.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">2</div>
                      <div>
                        <h4 className="font-medium">Feedback Processing</h4>
                        <p className="text-sm text-muted-foreground">
                          System extracts learning signals and error patterns.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">3</div>
                      <div>
                        <h4 className="font-medium">Model Fine-tuning</h4>
                        <p className="text-sm text-muted-foreground">
                          The model is strengthened using corrected examples.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">4</div>
                      <div>
                        <h4 className="font-medium">Deployment</h4>
                        <p className="text-sm text-muted-foreground">
                          Updated model is pushed to production.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Metrics Impact */}
                  <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Target className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Current Impact</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Radiologist feedback has led to a {mockMetrics.improvementRate}% improvement in prediction accuracy.
                    </p>
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

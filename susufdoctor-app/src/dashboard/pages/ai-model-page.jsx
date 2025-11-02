import { PredictionModel } from '../components/prediction-model';

export function AIModelPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Model Management</h1>
        <p className="text-muted-foreground">
          Monitor multimodal transformer performance, accuracy metrics, and training status
        </p>
      </div>
      
      <PredictionModel />
    </div>
  );
}
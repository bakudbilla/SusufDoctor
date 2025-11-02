import { RLHFFeedback } from '../components/rlhf-feedback';

export function FeedbackPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">RLHF Feedback Loop</h1>
        <p className="text-muted-foreground">
          Provide reinforcement learning feedback to improve AI model accuracy and performance
        </p>
      </div>
      
      <RLHFFeedback />
    </div>
  );
}
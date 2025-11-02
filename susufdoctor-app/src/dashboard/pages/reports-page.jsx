import { ReportGeneration } from '../components/report-generation';

export function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports & Analysis</h1>
        <p className="text-muted-foreground">
          Review AI-generated reports, view GradCAM visualizations, and finalize diagnoses
        </p>
      </div>
      
      <ReportGeneration />
    </div>
  );
}
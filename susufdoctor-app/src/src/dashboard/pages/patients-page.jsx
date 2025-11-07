import PatientManagement  from '../components/patient-management';

export function PatientsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#0088FF]">Patient Management</h1>
        <p className="text-muted-foreground">
          Manage patient records, medical history, and track scan progress
        </p>
      </div>
      
      <PatientManagement />
    </div>
  );
}
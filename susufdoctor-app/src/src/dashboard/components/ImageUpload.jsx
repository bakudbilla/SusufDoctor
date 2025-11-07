import { useState } from "react";
import PatientSelection from "./PatientSelection";
import PatientForm from "./PatientForm";

export default function ImageUpload() {
  const [mode, setMode] = useState("select");
  const [selectedPatient, setSelectedPatient] = useState(null);

  const handleSelectMode = (newMode) => {
    setMode(newMode);
  };

  const handleSelectExistingPatient = (patient) => {
    setSelectedPatient(patient);
    setMode("update"); // Changed from "existing" to "update"
  };

  const handleBack = () => {
    setMode("select");
    setSelectedPatient(null);
  };

  if (mode === "select" || mode === "search") {
    return (
      <PatientSelection
        mode={mode} 
        onSelectMode={handleSelectMode}
        onSelectExistingPatient={handleSelectExistingPatient}
      />
    );
  }

  return (
    <PatientForm
      mode={mode}
      selectedPatient={selectedPatient}
      onBack={handleBack}
      initialFormData={
        selectedPatient
          ? {
              patientName: selectedPatient.name,
              age: selectedPatient.age.toString(),
              sex: selectedPatient.sex,
              bmi: selectedPatient.bmi.toString(),
              xrayView: "",
              patientId: selectedPatient.id,
            }
          : null
      }
    />
  );
}
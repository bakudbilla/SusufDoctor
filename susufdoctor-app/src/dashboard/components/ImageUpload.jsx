import { useState, useEffect } from "react";
import PatientSelection from "./PatientSelection";
import PatientForm from "./PatientForm";

export default function ImageUpload() {
  const [mode, setMode] = useState(() => {
    const saved = localStorage.getItem("uploadPageMode");
    return saved || "select";
  });

  const [selectedPatient, setSelectedPatient] = useState(() => {
    const saved = localStorage.getItem("selectedPatient");
    return saved ? JSON.parse(saved) : null;
  });

  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem("patientFormData");
    return saved ? JSON.parse(saved) : null;
  });

  // Save mode to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("uploadPageMode", mode);
  }, [mode]);

  // Save selected patient to localStorage whenever it changes
  useEffect(() => {
    if (selectedPatient) {
      localStorage.setItem("selectedPatient", JSON.stringify(selectedPatient));
    } else {
      localStorage.removeItem("selectedPatient");
    }
  }, [selectedPatient]);

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    if (formData) {
      localStorage.setItem("patientFormData", JSON.stringify(formData));
    } else {
      localStorage.removeItem("patientFormData");
    }
  }, [formData]);

  const handleSelectMode = (newMode) => {
    setMode(newMode);
  };

  const handleSelectExistingPatient = (patient) => {
    setSelectedPatient(patient);
    setMode("update");
  };

  const handleBack = () => {
    setMode("select");
    setSelectedPatient(null);
    setFormData(null);
    localStorage.removeItem("selectedPatient");
    localStorage.removeItem("patientFormData");
    localStorage.removeItem("uploadPageMode");
  };

  const handleFormDataChange = (data) => {
    setFormData(data);
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
      onFormDataChange={handleFormDataChange}
      initialFormData={
        formData || (selectedPatient
          ? {
              patientName: selectedPatient.name,
              age: selectedPatient.age.toString(),
              sex: selectedPatient.sex,
              bmi: selectedPatient.bmi.toString(),
              xrayView: "",
              patientId: selectedPatient.id,
            }
          : null)
      }
    />
  );
}
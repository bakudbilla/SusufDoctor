import { useState, useRef, useCallback, useEffect } from "react";
import { Download, Eye, Loader2 } from "lucide-react";
import { API_URL } from '../../utils/constant'
import PatientDetails from './layout/PatientDetails';
import FileUploadSection from './layout/FileUploadSection';
import ReportSection from './layout/ReportSection';

export default function PatientForm({ mode, selectedPatient, onBack, initialFormData = null, onFormDataChange, onImageUpload, onReportUpload, uploadedImage, uploadedReport }) {
  const [formData, setFormData] = useState(
    initialFormData || {
      patientName: "",
      age: "",
      sex: "",
      bmi: "",
      xrayView: "",
      patientId: null,
    }
  );
  const [errors, setErrors] = useState({});
  const [xrayFile, setXrayFile] = useState(null);
  const [reportFile, setReportFile] = useState(null);
  const [xrayDragActive, setXrayDragActive] = useState(false);
  const [reportDragActive, setReportDragActive] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [firestoreId, setFirestoreId] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [loadingPriorReport, setLoadingPriorReport] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [reportText, setReportText] = useState("");
  const [originalReportText, setOriginalReportText] = useState("");
  const [liveStage, setLiveStage] = useState(null);

  const xrayFileInputRef = useRef(null);
  const reportFileInputRef = useRef(null);

  useEffect(() => {
    if (onFormDataChange) {
      onFormDataChange(formData);
    }
  }, [formData, onFormDataChange]);

  useEffect(() => {
    if (mode === "update" && selectedPatient?.patient_id) {
      fetchPriorReport(selectedPatient.patient_id);
    }
  }, [mode, selectedPatient]);

  const fetchPriorReport = async (patientId) => {
    try {
      setLoadingPriorReport(true);
      const token = localStorage.getItem("access_token");

      const response = await fetch(`${API_URL}/patients/${patientId}/visits`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        const visits = data.data?.visits || [];
        
        if (visits.length > 0) {
          const latestVisit = visits[0];
          setReportFile({
            id: latestVisit.visit_id,
            name: `Prior Report - ${latestVisit.date}`,
            url: latestVisit.report_url,
            isPrior: true,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching prior report:", error);
    } finally {
      setLoadingPriorReport(false);
    }
  };

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const handleXrayDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setXrayDragActive(true);
    else if (e.type === "dragleave") setXrayDragActive(false);
  }, []);

  const handleXrayDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setXrayDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleXrayFiles(e.dataTransfer.files);
    }
  }, []);

  const handleXrayFiles = (fileList) => {
    const file = fileList[0];
    const validTypes = ["application/dicom", "image/png", "image/jpeg", "image/jpg"];
    const validExtensions = [".dcm", ".dicom", ".png", ".jpg", ".jpeg"];
    const fileName = file.name.toLowerCase();
    const isValid =
      validTypes.includes(file.type) ||
      validExtensions.some((ext) => fileName.endsWith(ext));

    if (!isValid) {
      setErrors((prev) => ({
        ...prev,
        xrayFile: "Only DICOM, PNG, or JPEG formats are supported",
      }));
      return;
    }

    setXrayFile({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      file,
    });
    
    if (onImageUpload) {
      onImageUpload(file);
    }
    
    setErrors((prev) => ({ ...prev, xrayFile: "" }));
  };

  const handleReportFiles = (fileList) => {
    const file = fileList[0];
    if (file.type !== "application/pdf") {
      setErrors((prev) => ({
        ...prev,
        reportFile: "Only PDF files are supported",
      }));
      return;
    }

    setReportFile({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      file,
      isPrior: false,
    });
    
    if (onReportUpload) {
      onReportUpload(file);
    }
    
    setErrors((prev) => ({ ...prev, reportFile: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.patientName) newErrors.patientName = "Patient Name is required";
    if (!formData.age) newErrors.age = "Age is required";
    if (!formData.sex) newErrors.sex = "Sex is required";
    if (!formData.bmi) newErrors.bmi = "BMI is required";
    if (!formData.xrayView) newErrors.xrayView = "X-ray view is required";
    if (!xrayFile) newErrors.xrayFile = "An X-ray image must be uploaded";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGenerateReportWS = async () => {
    if (!validateForm()) return;
    setIsGenerating(true);
    setApiError(null);
    setSubmitStatus(null);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("xray_image", xrayFile.file);
      
      if (reportFile && reportFile.file && !reportFile.isPrior) {
        formDataToSend.append("prior_report", reportFile.file);
      }
      
      formDataToSend.append("bmi", formData.bmi);
      formDataToSend.append("age", formData.age);
      formDataToSend.append("sex", formData.sex);
      formDataToSend.append("view_type", formData.xrayView);
      formDataToSend.append("patient_name", formData.patientName);

      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("Please login to generate reports");

      const response = await fetch(`${API_URL}/predict/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formDataToSend,
      });

      if (!response.ok) {
        const text = await response.text();
        console.error("Raw error:", text);
        let message = "Unknown API error";
        try {
          const data = JSON.parse(text);
          message =
            data.detail?.[0]?.msg ||
            data.message ||
            JSON.stringify(data.detail || data);
        } catch {
          message = text;
        }
        throw new Error(message);
      }

      const result = await response.json();
      const pdfUrl = result.data?.generated_report_url;
      if (!pdfUrl) throw new Error("No PDF URL found in API response");

      setPdfUrl(pdfUrl);
      setFirestoreId(result.data?.patient_id);
      setReportText(result.data?.report_text || "");
      setOriginalReportText(result.data?.report_text || "");
      setReportGenerated(true);
      setSubmitStatus({
        type: "success",
        message: "Report generated successfully! You can now view, edit, or download the PDF.",
      });
    } catch (error) {
      console.error("Error generating report:", error);
      setApiError(error.message);
      setSubmitStatus({
        type: "error",
        message: `Failed to generate report: ${error.message}`,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditReport = () => {
    setIsEditMode(true);
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem("access_token");
      
      const formDataToSend = new FormData();
      formDataToSend.append("report_text", reportText);
      formDataToSend.append("firestore_id", firestoreId);
      formDataToSend.append("is_edit", "true");
      formDataToSend.append("patient_name", formData.patientName);
      formDataToSend.append("age", formData.age);
      formDataToSend.append("sex", formData.sex);
      formDataToSend.append("bmi", formData.bmi);
      formDataToSend.append("view_type", formData.xrayView);

      const response = await fetch(`${API_URL}/predict/`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        const text = await response.text();
        let message = "Unknown API error";
        try {
          const data = JSON.parse(text);
          message = data.detail?.[0]?.msg || data.message || JSON.stringify(data.detail || data);
        } catch {
          message = text;
        }
        throw new Error(message);
      }

      const result = await response.json();
      
      setOriginalReportText(reportText);
      setIsEditMode(false);
      setPdfUrl(result.data?.generated_report_url);
      
      setSubmitStatus({
        type: "success",
        message: "Report saved successfully!",
      });

    } catch (error) {
      console.error("Error saving report:", error);
      setSubmitStatus({
        type: "error",
        message: `Failed to save report: ${error.message}`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAndDownload = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem("access_token");
      
      const formDataToSend = new FormData();
      formDataToSend.append("report_text", reportText);
      formDataToSend.append("firestore_id", firestoreId);
      formDataToSend.append("is_edit", "true");
      formDataToSend.append("patient_name", formData.patientName);
      formDataToSend.append("age", formData.age);
      formDataToSend.append("sex", formData.sex);
      formDataToSend.append("bmi", formData.bmi);
      formDataToSend.append("view_type", formData.xrayView);

      const response = await fetch(`${API_URL}/predict/`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        const text = await response.text();
        let message = "Unknown API error";
        try {
          const data = JSON.parse(text);
          message = data.detail?.[0]?.msg || data.message || JSON.stringify(data.detail || data);
        } catch {
          message = text;
        }
        throw new Error(message);
      }

      const result = await response.json();
      
      setOriginalReportText(reportText);
      setIsEditMode(false);
      setPdfUrl(result.data?.generated_report_url);
      
      setSubmitStatus({
        type: "success",
        message: "Report saved! Downloading updated PDF...",
      });

      setTimeout(() => {
        handleDownloadReport();
      }, 500);

    } catch (error) {
      console.error("Error saving report:", error);
      setSubmitStatus({
        type: "error",
        message: `Failed to save report: ${error.message}`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setReportText(originalReportText);
    setIsEditMode(false);
  };

  const handleDownloadReport = () => {
    if (pdfUrl) {
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.download = `medical-report-${formData.patientName}-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleViewReport = () => {
    if (pdfUrl) window.open(pdfUrl, "_blank");
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-blue-50 p-6">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={onBack}
          className="mb-6 cursor-pointer text-slate-600 hover:text-slate-800 flex items-center gap-2"
        >
          ← Back
        </button>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-[#0088FF] mb-6">
            {mode === "new" ? "New Patient Registration" : "Patient Visit Update"}
          </h1>

          <PatientDetails 
            formData={formData}
            errors={errors}
            handleChange={handleChange}
          />

          <FileUploadSection
            mode={mode}
            xrayFile={xrayFile}
            reportFile={reportFile}
            xrayDragActive={xrayDragActive}
            reportDragActive={reportDragActive}
            loadingPriorReport={loadingPriorReport}
            errors={errors}
            uploadedImage={uploadedImage}
            uploadedReport={uploadedReport}
            handleXrayDrag={handleXrayDrag}
            handleXrayDrop={handleXrayDrop}
            handleXrayFiles={handleXrayFiles}
            handleReportFiles={handleReportFiles}
            xrayFileInputRef={xrayFileInputRef}
            reportFileInputRef={reportFileInputRef}
            setXrayFile={setXrayFile}
            setReportFile={setReportFile}
          />

          {liveStage && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-700 text-sm font-medium animate-pulse">
                {liveStage}
              </p>
            </div>
          )}

          <ReportSection
            reportGenerated={reportGenerated}
            isEditMode={isEditMode}
            reportText={reportText}
            setReportText={setReportText}
            isSaving={isSaving}
            submitStatus={submitStatus}
            handleEditReport={handleEditReport}
            handleSaveChanges={handleSaveChanges}
            handleSaveAndDownload={handleSaveAndDownload}
            handleCancelEdit={handleCancelEdit}
            handleViewReport={handleViewReport}
            handleDownloadReport={handleDownloadReport}
          />

          <div className="flex gap-4 justify-center pt-8">
            {!reportGenerated ? (
              <button
                onClick={handleGenerateReportWS}
                disabled={isGenerating}
                className="flex items-center gap-2 px-8 py-3 cursor-pointer rounded-lg font-semibold text-white bg-linear-to-r from-blue-500 to-blue-600 hover:scale-105 transform transition-all disabled:opacity-50 shadow-lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating Report...
                  </>
                ) : (
                  "Generate Report"
                )}
              </button>
            ) : (
              <>
                <button
                  onClick={handleViewReport}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg cursor-pointer font-semibold text-white bg-linear-to-r from-green-500 to-green-600 hover:scale-105 transform transition-all shadow-lg"
                >
                  <Eye className="h-4 w-4" />
                  View PDF
                </button>
                <button
                  onClick={handleDownloadReport}
                  className="flex items-center gap-2 px-6 py-3 cursor-pointer rounded-lg font-semibold text-white bg-linear-to-r from-blue-500 to-blue-600 hover:scale-105 transform transition-all shadow-lg"
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
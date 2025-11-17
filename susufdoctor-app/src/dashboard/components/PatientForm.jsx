import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, X, FileImage, CheckCircle2, AlertCircle, File, Download, Edit2, Save, Eye, Loader2 } from "lucide-react";
import { API_URL } from '../../utils/constant'

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

      const response = await fetch(`${API_URL}patients/${patientId}/visits`, {
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
    
    // Call parent's onImageUpload handler
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
    
    // Call parent's onReportUpload handler
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

//   const handleGenerateReport = async () => {
//     if (!validateForm()) return;
//     setIsGenerating(true);
//     setApiError(null);
//     setSubmitStatus(null);

//     try {
//       const formDataToSend = new FormData();
//       formDataToSend.append("xray_image", xrayFile.file);
      
//       if (reportFile && reportFile.file && !reportFile.isPrior) {
//         formDataToSend.append("prior_report", reportFile.file);
//       }
      
//       formDataToSend.append("bmi", formData.bmi);
//       formDataToSend.append("age", formData.age);
//       formDataToSend.append("sex", formData.sex);
//       formDataToSend.append("view_type", formData.xrayView);
//       formDataToSend.append("patient_name", formData.patientName);

//       const token = localStorage.getItem("access_token");
//       if (!token) throw new Error("Please login to generate reports");

//       const response = await fetch(`${API_URL}predict/`, {
//         method: "POST",
//         headers: { Authorization: `Bearer ${token}` },
//         body: formDataToSend,
//       });

//       if (!response.ok) {
//         const text = await response.text();
//         console.error("Raw error:", text);
//         let message = "Unknown API error";
//         try {
//           const data = JSON.parse(text);
//           message =
//             data.detail?.[0]?.msg ||
//             data.message ||
//             JSON.stringify(data.detail || data);
//         } catch {
//           message = text;
//         }
//         throw new Error(message);
//       }

//       const result = await response.json();
//       const pdfUrl = result.data?.generated_report_url;
//       if (!pdfUrl) throw new Error("No PDF URL found in API response");

//       setPdfUrl(pdfUrl);
//       setFirestoreId(result.data?.patient_id);
//       setReportText(result.data?.report_text || "");
//       setOriginalReportText(result.data?.report_text || "");
//       setReportGenerated(true);
//       setSubmitStatus({
//         type: "success",
//         message: "Report generated successfully! You can now view, edit, or download the PDF.",
//       });
//     } catch (error) {
//       console.error("Error generating report:", error);
//       setApiError(error.message);
//       setSubmitStatus({
//         type: "error",
//         message: `Failed to generate report: ${error.message}`,
//       });
//     } finally {
//       setIsGenerating(false);
//     }
//   };
const handleGenerateReportWS = async () => {
  if (!validateForm()) return;

  setIsGenerating(true);
  setReportGenerated(false);
  setReportText("");
  setOriginalReportText("");
  setLiveStage("Connecting…");

  const ws = new WebSocket("ws://localhost:8000/predict/ws");
  ws.binaryType = "arraybuffer";

  ws.onopen = async () => {
    try {
      setLiveStage("Uploading X-ray…");

      const arrayBuffer = await xrayFile.file.arrayBuffer();
      const xrayHex = Array.from(new Uint8Array(arrayBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      let priorHex = null;
      if (reportFile && reportFile.file && !reportFile.isPrior) {
        const pdfBuffer = await reportFile.file.arrayBuffer();
        priorHex = Array.from(new Uint8Array(pdfBuffer))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
      }

      ws.send(
        JSON.stringify({
          xray_hex: xrayHex,
          prior_hex: priorHex,
          patient_info: {
            bmi: formData.bmi,
            age: formData.age,
            sex: formData.sex,
            view_type: formData.xrayView,
            patient_name: formData.patientName
          }
        })
      );
    } catch (err) {
      console.error("WS send error", err);
      setIsGenerating(false);
      setLiveStage(null);
      ws.close();
    }
  };

  let accumulated = "";

  ws.onmessage = async (event) => {
  let data;
  try {
    data = typeof event.data === "string" ? JSON.parse(event.data) : {};
  } catch (err) {
    console.error("WS parse error", err);
    return;
  }

  if (data.stage) {
    setLiveStage(data.stage);
  }

  if (data.partial) {
    accumulated += data.partial + " ";
    setReportText(accumulated);
  }

  if (data.done) {
    const finalReport = data.report || accumulated;

    setReportText(finalReport);
    setOriginalReportText(finalReport);

    if (data.generated_report_url) setPdfUrl(data.generated_report_url);
    if (data.patient_id) setFirestoreId(data.patient_id);

    setReportGenerated(true);
    setIsGenerating(false);
    setLiveStage(null);

    ws.close();
    return;
  }

  
  if (data.error) {
    console.error("WS error:", data.error);
    setIsGenerating(false);
    setLiveStage(null);
    ws.close();
  }
};


  ws.onerror = () => {
    setIsGenerating(false);
    setLiveStage(null);
    alert("WebSocket connection failed");
  };
};


  const handleEditReport = () => {
    setIsEditMode(true);
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem("access_token");
      
      // Create a FormData object for the edit request
      const formDataToSend = new FormData();
      formDataToSend.append("report_text", reportText);
      formDataToSend.append("firestore_id", firestoreId);
      formDataToSend.append("is_edit", "true");
      formDataToSend.append("patient_name", formData.patientName);
      formDataToSend.append("age", formData.age);
      formDataToSend.append("sex", formData.sex);
      formDataToSend.append("bmi", formData.bmi);
      formDataToSend.append("view_type", formData.xrayView);

      const response = await fetch(`${API_URL}predict/`, {
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
      
      // Update the state with the new PDF URL and report text
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
      
      // Create a FormData object for the edit request
      const formDataToSend = new FormData();
      formDataToSend.append("report_text", reportText);
      formDataToSend.append("firestore_id", firestoreId);
      formDataToSend.append("is_edit", "true");
      formDataToSend.append("patient_name", formData.patientName);
      formDataToSend.append("age", formData.age);
      formDataToSend.append("sex", formData.sex);
      formDataToSend.append("bmi", formData.bmi);
      formDataToSend.append("view_type", formData.xrayView);

      const response = await fetch(`${API_URL}predict/`, {
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
      
      // Update the state with the new PDF URL and report text
      setOriginalReportText(reportText);
      setIsEditMode(false);
      setPdfUrl(result.data?.generated_report_url);
      
      setSubmitStatus({
        type: "success",
        message: "Report saved! Downloading updated PDF...",
      });

      // Download the new PDF
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700">Patient Name *</label>
              <input
                type="text"
                placeholder="Enter patient name"
                value={formData.patientName}
                onChange={(e) => handleChange("patientName", e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.patientName && <p className="text-xs text-red-500 mt-1">{errors.patientName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Age *</label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => handleChange("age", e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.age && <p className="text-xs text-red-500 mt-1">{errors.age}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">BMI *</label>
              <input
                type="number"
                step="0.1"
                value={formData.bmi}
                onChange={(e) => handleChange("bmi", e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.bmi && <p className="text-xs text-red-500 mt-1">{errors.bmi}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Sex *</label>
              <select
                value={formData.sex}
                onChange={(e) => handleChange("sex", e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select sex</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              {errors.sex && <p className="text-xs text-red-500 mt-1">{errors.sex}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700">X-ray View *</label>
              <select
                value={formData.xrayView}
                onChange={(e) => handleChange("xrayView", e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select view</option>
                <option value="Lateral view">Lateral view</option>
                <option value="Frontal view">Frontal view</option>
              </select>
              {errors.xrayView && <p className="text-xs text-red-500 mt-1">{errors.xrayView}</p>}
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-semibold text-slate-700 mb-4">Upload X-ray Image</h3>
            <div
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                xrayDragActive ? "border-blue-400 bg-blue-50" : "border-slate-300"
              }`}
              onDragEnter={handleXrayDrag}
              onDragLeave={handleXrayDrag}
              onDragOver={handleXrayDrag}
              onDrop={handleXrayDrop}
              onClick={() => xrayFileInputRef.current?.click()}
            >
              {!xrayFile ? (
                <>
                  <Upload className="h-14 w-14 mx-auto text-slate-400 mb-3" />
                  <p className="text-slate-600">
                    Drag & drop or <span className="text-blue-500 font-semibold">browse</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Supports DICOM, PNG, or JPEG formats
                  </p>
                  {errors.xrayFile && (
                    <p className="text-xs text-red-500 mt-2">{errors.xrayFile}</p>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center gap-4">
                  <FileImage className="h-14 w-14 text-blue-500" />
                  <div className="text-left">
                    <p className="font-medium">{xrayFile.name}</p>
                    <p className="text-xs text-emerald-500">✓ Ready for analysis</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setXrayFile(null);
                    }}
                    className="p-2 hover:bg-slate-100 rounded-lg"
                  >
                    <X className="h-5 w-5 text-red-400" />
                  </button>
                </div>
              )}
              <input
                ref={xrayFileInputRef}
                type="file"
                className="hidden"
                accept=".dcm,.dicom,image/png,image/jpeg,image/jpg"
                onChange={(e) => e.target.files && handleXrayFiles(e.target.files)}
              />
            </div>

            {uploadedImage && (
              <div className="mt-4 p-4 border border-slate-200 rounded-xl bg-slate-50">
                <p className="text-sm font-medium text-slate-700 mb-3">Image Preview</p>
                <img
                  src={uploadedImage.preview}
                  alt="X-ray preview"
                  className="max-h-64 rounded-lg mx-auto"
                />
              </div>
            )}
          </div>
{/* {uploadedImage && (
  <div className="mt-4 p-4 border border-slate-200 rounded-xl bg-slate-50">
    <p className="text-sm font-medium text-slate-700 mb-3">Image Preview</p>
    <img
      src={uploadedImage.preview}
      alt="X-ray preview"
      className="max-h-64 rounded-lg mx-auto"
    />
  </div>
)} */}


          <div className="mt-8">
            <h3 className="text-lg font-semibold text-slate-700 mb-4">
              {mode === "update" ? "Prior Report from Latest Visit" : "Reference Report (Optional)"}
            </h3>
            
            {mode === "update" ? (
              <>
                {loadingPriorReport ? (
                  <div className="flex items-center justify-center p-8 bg-slate-50 rounded-xl">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-500 mr-2" />
                    <span>Loading prior report...</span>
                  </div>
                ) : reportFile && reportFile.isPrior ? (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium text-green-900">{reportFile.name}</p>
                          <p className="text-xs text-green-700">Automatically loaded from patient records</p>
                        </div>
                      </div>
                      <a
                        href={reportFile.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm font-medium"
                      >
                        View
                      </a>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm">No prior reports found for this patient</p>
                )}
              </>
            ) : (
              <div
                className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                  reportDragActive ? "border-purple-400 bg-purple-50" : "border-slate-300"
                }`}
                onClick={() => reportFileInputRef.current?.click()}
              >
                {!reportFile ? (
                  <>
                    <Upload className="h-14 w-14 mx-auto text-slate-400 mb-3" />
                    <p className="text-slate-600">
                      Drag & drop or <span className="text-purple-500 font-semibold">browse</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-1">PDF format only</p>
                  </>
                ) : (
                  <div className="flex items-center justify-center gap-4">
                    <File className="h-14 w-14 text-purple-500" />
                    <div className="text-left">
                      <p className="font-medium">{reportFile.name}</p>
                      <p className="text-xs text-emerald-500">Ready to include</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setReportFile(null);
                      }}
                      className="p-2 hover:bg-slate-100 rounded-lg"
                    >
                      <X className="h-5 w-5 text-red-400" />
                    </button>
                  </div>
                )}
                <input
                  ref={reportFileInputRef}
                  type="file"
                  className="hidden"
                  accept="application/pdf"
                  onChange={(e) => e.target.files && handleReportFiles(e.target.files)}
                />
              </div>
            )}

            {uploadedReport && (
              <div className="mt-4 p-4 border border-slate-200 rounded-xl bg-slate-50">
                <p className="text-sm font-medium text-slate-700 mb-3">Report Preview</p>
                <div className="bg-white rounded-lg p-4 max-h-64 overflow-auto border border-slate-200">
                  <iframe
                    src={uploadedReport.preview}
                    className="w-full h-64 rounded"
                    title="PDF preview"
                  />
                </div>
              </div>
            )}
          </div>
          {liveStage && (
  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
    <p className="text-blue-700 text-sm font-medium animate-pulse">
      {liveStage}
    </p>
  </div>
)}
{reportGenerated && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-700">Generated Report</h3>
                {!isEditMode && (
                  <button
                    onClick={handleEditReport}
                    className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit Report
                  </button>
                )}
              </div>
              
              {isEditMode ? (
                <div className="space-y-4">
                  <textarea
                    value={reportText}
                    onChange={(e) => setReportText(e.target.value)}
                    className="w-full h-64 p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Edit the report text here..."
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={handleSaveChanges}
                      disabled={isSaving}
                      className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleSaveAndDownload}
                      disabled={isSaving}
                      className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      Save & Download
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg whitespace-pre-wrap text-sm max-h-64 overflow-y-auto">
                  {reportText}
                </div>
              )}
            </div>
          )}

          {submitStatus && (
            <div
              className={`mt-6 p-4 rounded-lg border ${
                submitStatus.type === "success"
                  ? "bg-green-50 border-green-200 text-green-700"
                  : "bg-red-50 border-red-200 text-red-700"
              }`}
            >
              <div className="flex items-center gap-2">
                {submitStatus.type === "success" ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <AlertCircle className="h-5 w-5" />
                )}
                <p className="text-sm">{submitStatus.message}</p>
              </div>
            </div>
          )}

          <div className="flex gap-4 justify-center pt-8">
            {!reportGenerated ? (
              <button
                onClick={handleGenerateReportWS}

                disabled={isGenerating}
                className="flex items-center gap-2 px-8 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:scale-105 transform transition-all disabled:opacity-50 shadow-lg"
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
                  className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-green-500 to-green-600 hover:scale-105 transform transition-all shadow-lg"
                >
                  <Eye className="h-4 w-4" />
                  View PDF
                </button>
                <button
                  onClick={handleDownloadReport}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:scale-105 transform transition-all shadow-lg"
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
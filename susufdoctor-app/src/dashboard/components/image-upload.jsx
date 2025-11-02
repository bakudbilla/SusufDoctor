import { useState, useRef, useCallback } from "react";
import {
  Upload,
  X,
  FileImage,
  CheckCircle2,
  AlertCircle,
  Search,
  Plus,
  Loader,
  File,
  Download,
} from "lucide-react";

export default function ImageUpload() {
  const [mode, setMode] = useState("select");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [xrayFile, setXrayFile] = useState(null);
  const [reportFile, setReportFile] = useState(null);
  const [formData, setFormData] = useState({
    patientName: "",
    age: "",
    sex: "",
    bmi: "",
    xrayView: "",
    patientId: null,
  });
  const [errors, setErrors] = useState({});
  const [xrayDragActive, setXrayDragActive] = useState(false);
  const [reportDragActive, setReportDragActive] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [firestoreId, setFirestoreId] = useState(null);
  const [apiError, setApiError] = useState(null);

  const xrayFileInputRef = useRef(null);
  const reportFileInputRef = useRef(null);

  // Mock patient data for demo
  const mockPatientDatabase = [
    { id: "P-2024-001", name: "John Doe", age: 45, sex: "Male", bmi: 24.5, lastVisit: "2024-10-02", scans: 2 },
    { id: "P-2024-002", name: "Jane Smith", age: 38, sex: "Female", bmi: 22.1, lastVisit: "2024-10-01", scans: 1 },
    { id: "P-2024-003", name: "Bob Johnson", age: 62, sex: "Male", bmi: 27.3, lastVisit: "2024-09-30", scans: 3 },
  ];

  // 🔎 Patient search
  const handleSearchPatient = (query) => {
    setSearchTerm(query);
    if (query.trim()) {
      const results = mockPatientDatabase.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.id.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  // 👩‍⚕️ Select existing patient
  const selectExistingPatient = (patient) => {
    setSelectedPatient(patient);
    setFormData({
      patientName: patient.name,
      age: patient.age.toString(),
      sex: patient.sex,
      bmi: patient.bmi.toString(),
      xrayView: "",
      patientId: patient.id,
    });
    setMode("existing");
    setSearchTerm("");
    setSearchResults([]);
  };

  const startNewPatient = () => {
    setSelectedPatient(null);
    setFormData({
      patientName: "",
      age: "",
      sex: "",
      bmi: "",
      xrayView: "",
      patientId: null,
    });
    setMode("new");
  };

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  // 📂 Handle drag events
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

  // 📸 Validate X-ray file
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
    setErrors((prev) => ({ ...prev, xrayFile: "" }));
  };

  // 📄 Validate report file
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
    });
    setErrors((prev) => ({ ...prev, reportFile: "" }));
  };

  // 🧩 Validate form
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

  // 🚀 Generate report
  const handleGenerateReport = async () => {
    if (!validateForm()) return;
    setIsGenerating(true);
    setApiError(null);
    setSubmitStatus(null);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("xray_image", xrayFile.file);
      if (reportFile) formDataToSend.append("prior_report", reportFile.file);
      formDataToSend.append("bmi", formData.bmi);
      formDataToSend.append("age", formData.age);
      formDataToSend.append("sex", formData.sex);
      formDataToSend.append("view_type", formData.xrayView);
      formDataToSend.append("patient_name", formData.patientName); // ✅ FIX

      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("Please login to generate reports");

      const response = await fetch("http://localhost:8000/predict/", {
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
      setFirestoreId(result.data?.firestore_id);
      setReportGenerated(true);
      setSubmitStatus({
        type: "success",
        message: "✅ Report generated successfully! You can now view or download the PDF.",
      });
    } catch (error) {
      console.error("Error generating report:", error);
      setApiError(error.message);
      setSubmitStatus({
        type: "error",
        message: `❌ Failed to generate report: ${error.message}`,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadReport = () => {
    if (pdfUrl) {
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.download = `medical-report-${formData.patientId || "new"}-${Date.now()}.pdf`;
      link.target = "_blank";
      link.click();
    }
  };

  const handleViewReport = () => {
    if (pdfUrl) window.open(pdfUrl, "_blank");
  };

  // --- UI COMPONENTS BELOW ---
  if (mode === "select") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-blue-600 mb-4">Patient Check-In</h1>
          <p className="text-slate-600 mb-10">
            Is this a new patient or a returning visit?
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={startNewPatient}
              className="group bg-white border-2 border-slate-200 rounded-2xl p-8 hover:border-blue-400 hover:shadow-lg transition-all"
            >
              <div className="flex justify-center mb-4">
                <Plus className="h-10 w-10 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold text-blue-600 mb-2">New Patient</h3>
              <p className="text-slate-500 text-sm">
                First-time visit. A new patient ID will be generated.
              </p>
            </button>

            <button
              onClick={() => setMode("search")}
              className="group bg-white border-2 border-slate-200 rounded-2xl p-8 hover:border-green-400 hover:shadow-lg transition-all"
            >
              <div className="flex justify-center mb-4">
                <Search className="h-10 w-10 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold text-green-600 mb-2">Returning Patient</h3>
              <p className="text-slate-500 text-sm">
                Look up an existing patient record to add a new scan.
              </p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 🧑‍⚕️ Patient search page
  if (mode === "search") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => setMode("select")}
            className="mb-6 text-slate-600 hover:text-slate-800 flex items-center gap-2"
          >
            ← Back
          </button>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-semibold text-slate-800 mb-6">Search Patient Records</h2>
            <input
              type="text"
              placeholder="Enter patient name or ID..."
              value={searchTerm}
              onChange={(e) => handleSearchPatient(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg mb-6 focus:outline-none focus:ring-2 focus:ring-green-300"
            />

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {searchResults.length > 0 ? (
                searchResults.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => selectExistingPatient(p)}
                    className="w-full text-left p-4 border border-slate-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-all"
                  >
                    <div className="flex justify-between">
                      <div>
                        <p className="font-semibold text-slate-800">{p.name}</p>
                        <p className="text-sm text-slate-600">{p.id}</p>
                      </div>
                      <div className="text-right text-sm text-slate-600">
                        <p>Age: {p.age}</p>
                        <p>{p.scans} scan{p.scans > 1 ? "s" : ""}</p>
                        <p className="text-xs">Last visit: {p.lastVisit}</p>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500">
                  {searchTerm
                    ? `No patients found matching "${searchTerm}"`
                    : "Start typing to search for a patient"}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Main Upload Page ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => setMode("select")}
          className="mb-6 text-slate-600 hover:text-slate-800 flex items-center gap-2"
        >
          ← Back
        </button>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-6">
            {mode === "new" ? "New Patient Registration" : "Patient Visit Update"}
          </h1>

          {/* 🧾 Patient Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700">Patient Name *</label>
              <input
                type="text"
                placeholder="Enter patient name"
                value={formData.patientName}
                onChange={(e) => handleChange("patientName", e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg"
              />
              {errors.patientName && <p className="text-xs text-red-500">{errors.patientName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Age *</label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => handleChange("age", e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg"
              />
              {errors.age && <p className="text-xs text-red-500">{errors.age}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">BMI *</label>
              <input
                type="number"
                value={formData.bmi}
                onChange={(e) => handleChange("bmi", e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg"
              />
              {errors.bmi && <p className="text-xs text-red-500">{errors.bmi}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Sex *</label>
              <select
                value={formData.sex}
                onChange={(e) => handleChange("sex", e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg"
              >
                <option value="">Select sex</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              {errors.sex && <p className="text-xs text-red-500">{errors.sex}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700">X-ray View *</label>
              <select
                value={formData.xrayView}
                onChange={(e) => handleChange("xrayView", e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg"
              >
                <option value="">Select view</option>
                <option value="Lateral view">Lateral view</option>
                <option value="Frontal view">Frontal view</option>
              </select>
              {errors.xrayView && <p className="text-xs text-red-500">{errors.xrayView}</p>}
            </div>
          </div>

          {/* Upload Sections */}
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
                    onClick={() => setXrayFile(null)}
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
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-semibold text-slate-700 mb-4">
              Upload Reference Report (Optional)
            </h3>
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
                    <p className="text-xs text-emerald-500">✓ Ready to include</p>
                  </div>
                  <button
                    onClick={() => setReportFile(null)}
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
          </div>

          {/* Status */}
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

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center pt-8">
            {!reportGenerated ? (
              <button
                onClick={handleGenerateReport}
                disabled={isGenerating}
                className="flex items-center gap-2 px-8 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 hover:scale-105 transform transition-all disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
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
                  className="flex items-center gap-2 px-8 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-green-400 to-green-600 hover:scale-105 transform transition-all"
                >
                  <FileImage className="h-4 w-4" />
                  View Report
                </button>
                <button
                  onClick={handleDownloadReport}
                  className="flex items-center gap-2 px-8 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 hover:scale-105 transform transition-all"
                >
                  <Download className="h-4 w-4" />
                  Download Report
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

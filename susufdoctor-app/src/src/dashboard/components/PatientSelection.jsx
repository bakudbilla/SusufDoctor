import { useState, useEffect } from "react";
import { Search, Plus, Loader2 } from "lucide-react";

export default function PatientSelection({ mode, onSelectMode, onSelectExistingPatient }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [allPatients, setAllPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (mode === "search") {
      fetchAllPatients();
    }
  }, [mode]);

  const fetchAllPatients = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("access_token");
      
      const response = await fetch("http://localhost:8000/patients/", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.status === "success") {
        setAllPatients(data.data);
      } else {
        setError("Failed to fetch patients");
      }
    } catch (err) {
      console.error("Error fetching patients:", err);
      setError("Error fetching patients");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchPatient = (query) => {
    setSearchTerm(query);
    if (query.trim()) {
      const results = allPatients.filter(
        (p) =>
          (p.patient_name?.toLowerCase() || '').includes(query.toLowerCase()) ||
          (p.patient_id?.toLowerCase() || '').includes(query.toLowerCase())
      );
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const selectExistingPatient = (patient) => {
    onSelectExistingPatient({
      patient_id: patient.patient_id,
      id: patient.patient_id,
      name: patient.patient_name,
      age: patient.age,
      sex: patient.sex,
      bmi: patient.bmi,
      lastVisit: patient.latest_visit,
      scans: patient.visit_count || 0
    });
    console.log("Selected patient:", patient);
    setSearchTerm("");
    setSearchResults([]);
  };

  if (mode === "select") {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-blue-50 p-6">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-[#0088FF] mb-4">Patient Check-In</h1>
          <p className="text-slate-600 mb-10">
            Is this a new patient or a returning visit?
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => onSelectMode("new")}
              className="group bg-white border-2 border-slate-200 cursor-pointer rounded-2xl p-8 hover:border-blue-400 hover:shadow-lg transition-all duration-300 text-left"
            >
              <div className="flex items-center justify-center w-14 h-14 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors mb-4">
                <Plus className="h-7 w-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-[#0088FF] mb-2">New Patient</h3>
              <p className="text-slate-500 text-sm">
                First-time visit. A new patient ID will be generated.
              </p>
            </button>

            <button
              onClick={() => onSelectMode("search")}
              className="group bg-white border-2 border-slate-200 cursor-pointer rounded-2xl p-8 hover:border-green-400 hover:shadow-lg transition-all duration-300 text-left"
            >
              <div className="flex items-center justify-center w-14 h-14 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors mb-4">
                <Search className="h-7 w-7 text-green-600" />
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

  if (mode === "search") {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-blue-50 p-6">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => onSelectMode("select")}
            className="mb-6 text-slate-600 cursor-pointer hover:text-slate-800 flex items-center gap-2"
          >
            ← Back
          </button>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-semibold text-slate-800 mb-6">Search Patient Records</h2>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
                {error}
              </div>
            )}

            <input
              type="text"
              placeholder="Enter patient name or ID..."
              value={searchTerm}
              onChange={(e) => handleSearchPatient(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg mb-6 focus:outline-none focus:ring-2 focus:ring-green-300"
            />

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                  <p className="ml-2 text-slate-500">Loading patients...</p>
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((p) => (
                  <button
                    key={p.patient_id}
                    onClick={() => selectExistingPatient(p)}
                    className="w-full text-left p-4 border border-slate-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-all"
                  >
                    <div className="flex justify-between">
                      <div>
                        <p className="font-semibold text-slate-800">{p.patient_name}</p>
                        <p className="text-sm text-slate-600">{p.patient_id}</p>
                      </div>
                      <div className="text-right text-sm text-slate-600">
                        <p>Age: {p.age}</p>
                        <p>{p.visit_count || 0} scan{(p.visit_count || 0) > 1 ? "s" : ""}</p>
                        <p className="text-xs">Last visit: {p.latest_visit ? new Date(p.latest_visit).toLocaleDateString() : "N/A"}</p>
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

  return null;
}
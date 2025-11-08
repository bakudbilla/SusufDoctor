import { useState, useEffect } from "react";
import { Filter, Upload, User, Loader } from "lucide-react";
import { API_URL } from '../../utils/constant'

const filterOptions = ["All", "Frontal", "Lateral"];
const sortOptions = [
  { label: "Age", key: "age" },
  { label: "BMI", key: "bmi" },
];

const quickActions = [
  { label: "Upload images", icon: Upload, id: 'upload' },
  { label: "Patient Management", icon: User, id: 'patients' },
];

export default function FiltersQuickAction({ onNavigate }) {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [openFilter, setOpenFilter] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentFilter, setCurrentFilter] = useState("All");

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");
      
      const response = await fetch(`${API_URL}patients/dashboard`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setPatients(data.data || []);
      setFilteredPatients(data.data || []);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching patients:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (type) => {
    setCurrentFilter(type);
    if (type === "All") {
      setFilteredPatients(patients);
    } else {
      setFilteredPatients(patients.filter(p => p.view_type === type));
    }
    setOpenFilter(false);
  };

  const handleSort = (key) => {
    setFilteredPatients([...filteredPatients].sort((a, b) => a[key] - b[key]));
    setOpenFilter(false);
  };

  return (
    <div className="flex flex-col md:flex-row gap-3 w-full">

      <div className="w-full md:w-[70%] bg-white rounded-xl shadow p-4">
        <div className="flex justify-between items-center mb-3 relative">
          <h2 className="font-semibold text-lg">Patients</h2>

          <button
            onClick={() => setOpenFilter(!openFilter)}
            className="flex items-center gap-2 text-sm cursor-pointer font-semibold text-[#0088FF]"
          >
            Filter & Sort <Filter size={16} />
          </button>

          {openFilter && (
            <div className="absolute top-8 right-0 bg-white shadow rounded-md border w-40 text-sm z-10">
              <p className="px-3 py-2 font-semibold">Filter</p>
              {filterOptions.map((type) => (
                <button
                  key={type}
                  onClick={() => handleFilter(type)}
                  className={`w-full px-3 py-2 text-left ${
                    currentFilter === type ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100"
                  }`}
                >
                  {type}
                </button>
              ))}

              <p className="px-3 py-2 font-semibold border-t">Sort</p>
              {sortOptions.map(({ label, key }) => (
                <button
                  key={key}
                  onClick={() => handleSort(key)}
                  className="w-full px-3 py-2 hover:bg-gray-100 text-left"
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader className="animate-spin text-blue-600" size={24} />
            <span className="ml-2 text-gray-600">Loading patients...</span>
          </div>
        ) : error ? (
          <div className="py-8 text-center text-red-600">
            <p>Error: {error}</p>
            <button
              onClick={fetchPatients}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <p>No patients found</p>
          </div>
        ) : (
          <table className="w-full text-sm text-gray-700">
            <thead>
              <tr className="text-left border-b bg-gray-50">
                <th className="py-2 px-2">Patient Name</th>
                <th className="py-2 px-2">Age</th>
                <th className="py-2 px-2">BMI</th>
                <th className="py-2 px-2">View Type</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((patient, i) => (
                <tr key={i} className="border-b last:border-none hover:bg-gray-50">
                  <td className="py-3 px-2 font-medium">
                    {patient.name || "N/A"}
                  </td>
                  <td className="py-3 px-2 font-semibold">{patient.age || "N/A"}</td>
                  <td className="py-3 px-2 font-semibold">{patient.bmi ? patient.bmi.toFixed(2) : "N/A"}</td>
                  <td className="py-3 px-2">{patient.view_type || "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="w-full md:w-[30%] bg-white rounded-xl shadow p-6">
        <h2 className="font-semibold text-lg mb-4">Quick Actions</h2>
        <ul className="space-y-4 text-gray-700">
          {quickActions.map(({ label, icon: Icon, id }) => (
            <li 
              key={label} 
              onClick={() => onNavigate && onNavigate(id)}
              className="flex items-center gap-3 cursor-pointer hover:text-blue-600 transition"
            >
              <Icon size={18} /> {label}
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
}
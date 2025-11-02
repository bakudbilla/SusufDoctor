import { useState } from "react";
import { Filter, Upload, FileText, Bell } from "lucide-react";

const patientsData = [
  { name: "Kwadwo Oppong Wilson", age: 22, bmi: 22.5, view_type: "Frontal", img: "https://i.pravatar.cc/40?img=1" },
  { name: "Maabena Ayishetu", age: 24, bmi: 16.0, view_type: "Lateral", img: "https://i.pravatar.cc/40?img=2" },
  { name: "Thomas Abugri", age: 28, bmi: 35.0, view_type: "Frontal", img: "https://i.pravatar.cc/40?img=3" },
];

const filterOptions = ["All", "Frontal", "Lateral"];
const sortOptions = [
  { label: "Age", key: "age" },
  { label: "BMI", key: "bmi" },
];

const quickActions = [
  { label: "Upload images", icon: Upload },
  { label: "Reports and Analysis", icon: FileText },
  { label: "Check Notifications", icon: Bell },
];

export default function FiltersQuickAction() {
  const [patients, setPatients] = useState(patientsData);
  const [openFilter, setOpenFilter] = useState(false);

  const handleFilter = (type) => {
    setPatients(type === "All" ? patientsData : patientsData.filter(p => p.view_type === type));
    setOpenFilter(false);
  };

  const handleSort = (key) => {
    setPatients([...patients].sort((a, b) => a[key] - b[key]));
    setOpenFilter(false);
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="flex flex-col md:flex-row gap-3 w-full max-w-6xl">

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
                    className="w-full px-3 py-2 hover:bg-gray-100 text-left"
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

          <table className="w-full text-sm text-gray-700">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2">Patient Name</th>
                <th>Age</th>
                <th>BMI</th>
                <th>View Type</th>
              </tr>
            </thead>
            <tbody>
              {patients.map(({ name, age, bmi, view_type, img }, i) => (
                <tr key={i} className="border-b last:border-none">
                  <td className="py-3 flex items-center gap-3 font-medium">
                    <img src={img} alt={name} className="w-8 h-8 rounded-full" />
                    {name}
                  </td>
                  <td className="font-semibold">{age}</td>
                  <td className="font-semibold">{bmi}</td>
                  <td>{view_type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="w-full md:w-[30%] bg-white rounded-xl shadow p-6">
          <h2 className="font-semibold text-lg mb-4">Quick Actions</h2>
          <ul className="space-y-4 text-gray-700">
            {quickActions.map(({ label, icon: Icon }) => (
              <li key={label} className="flex items-center gap-3 cursor-pointer hover:text-blue-600">
                <Icon size={18} /> {label}
              </li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  );
}

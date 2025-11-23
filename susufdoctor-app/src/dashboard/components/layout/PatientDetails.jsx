export default function PatientDetails({ formData, errors, handleChange }) {
  return (
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
  );
}
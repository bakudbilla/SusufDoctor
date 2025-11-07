import { useState } from "react";
import { Camera, Save,  Mail, Phone, User } from "lucide-react";

export default function Settings() {
  const [profilePicture, setProfilePicture] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    first_name: "John",
    last_name: "Doe",
    email: "john.doe@radiologist.com",
    phone: "+1 (555) 123-4567",
    license_number: "LIC123456",
    specialization: "Diagnostic Radiology",
  });

  const handleProfilePictureChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ ...errors, profile_picture: "File size must be less than 5MB" });
        return;
      }

      setProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
        setErrors({ ...errors, profile_picture: "" });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      setTimeout(() => {
        setSuccessMsg("Profile updated successfully!");
        setLoading(false);
        setTimeout(() => setSuccessMsg(""), 3000);
      }, 1000);
    } catch (error) {
      setErrors({ ...errors, submit: "Failed to update profile" });
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-linear-to-br from-cyan-50 via-teal-50 to-cyan-100 flex flex-col">
    

      <div className="flex flex-1 justify-center items-center px-4 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-3xl">
          {successMsg && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-lg flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              {successMsg}
            </div>
          )}

          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Profile Settings
          </h2>

          <div className="flex flex-col items-center mb-10">
            <div className="relative">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover border-4 border-[#0088FF] shadow-lg"
                />
              ) : (
                <div className="w-32 h-32 flex items-center justify-center rounded-full bg-blue-50 border-4 border-[#0088FF] shadow-lg text-[#0088FF]">
                  <User size={60} />
                </div>
              )}
              <label
                htmlFor="profile-upload"
                className="absolute bottom-0 right-0 bg-[#0088FF] hover:bg-blue-600 text-white p-3 rounded-full cursor-pointer transition shadow-lg"
              >
                <Camera size={20} />
              </label>
              <input
                id="profile-upload"
                type="file"
                accept="image/*"
                onChange={handleProfilePictureChange}
                className="hidden"
              />
            </div>
            <p className="text-sm text-gray-600 mt-4">
              JPG, PNG, (Max 5MB)
            </p>
            {errors.profile_picture && (
              <p className="text-xs text-red-500 mt-2">{errors.profile_picture}</p>
            )}
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0088FF]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0088FF]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Mail size={16} className="inline mr-2" />
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0088FF]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Phone size={16} className="inline mr-2" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0088FF]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  License Number
                </label>
                <input
                  type="text"
                  name="license_number"
                  value={formData.license_number}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0088FF]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Specialization
                </label>
                <input
                  type="text"
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0088FF]"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleSaveProfile}
            disabled={loading}
            className="mt-8 w-full cursor-pointer bg-[#0088FF] hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
          >
            <Save size={18} /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

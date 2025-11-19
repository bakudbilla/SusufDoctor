import { useState, useEffect } from "react";
import { Camera, Save, Mail, Phone, User, Loader } from "lucide-react";
import { API_URL } from "../../utils/constant";

export default function Settings() {
  const [profilePicture, setProfilePicture] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errors, setErrors] = useState({});
  const [initialLoading, setInitialLoading] = useState(true);

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    license_number: "",
    specialization: "",
  });

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setInitialLoading(true);
      const token = localStorage.getItem("access_token");
      
      const response = await fetch(`${API_URL}/auth/profile/`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        const user = data.user;
        setFormData({
          full_name: user.full_name || "",
          email: user.email || "",
          phone: user.phone || "",
          license_number: user.license_number || "",
          specialization: user.specialization || "",
        });
        
        // Load saved profile picture URL from backend
        if (user.profile_picture_url) {
          setPreviewUrl(user.profile_picture_url);
        }
      } else {
        setErrors({ ...errors, submit: "Failed to fetch profile data" });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setErrors({ ...errors, submit: "Error loading profile" });
    } finally {
      setInitialLoading(false);
    }
  };

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
    setErrors({});
    
    try {
      const token = localStorage.getItem("access_token");
      
      // If profile picture is uploaded, upload it first
      if (profilePicture) {
        const formDataWithFile = new FormData();
        formDataWithFile.append("profile_picture", profilePicture);
        
        console.log("Uploading profile picture...");
        const uploadResponse = await fetch(`${API_URL}/auth/upload-profile-picture/`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
          body: formDataWithFile,
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json().catch(() => ({}));
          console.error("Upload response error:", errorData);
          setErrors({ submit: errorData.detail || "Failed to upload profile picture" });
          setLoading(false);
          return;
        }

        console.log("Profile picture uploaded successfully");
        // Clear the profile picture after successful upload
        setProfilePicture(null);
      }

      // Update profile data
      console.log("Updating profile data...");
      const response = await fetch(`${API_URL}/auth/profile/`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Profile updated successfully", data);
        
        setSuccessMsg("Profile updated successfully!");
        setLoading(false);
        
        // Fetch updated profile to confirm changes
        await fetchProfileData();
        
        // Show success message for 3 seconds
        setTimeout(() => {
          setSuccessMsg("");
        }, 3000);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Profile update error:", errorData);
        setErrors({ submit: errorData.detail || "Failed to update profile" });
        setLoading(false);
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      setErrors({ submit: error.message || "Failed to update profile" });
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-cyan-50 via-teal-50 to-cyan-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader className="h-8 w-8 animate-spin text-[#0088FF]" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

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

          {errors.submit && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg flex items-center gap-3">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              {errors.submit}
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
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0088FF]"
              />
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
            {loading ? (
              <>
                <Loader className="h-5 w-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={18} /> Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
import { useState } from "react";
import { AlertCircle, ArrowRight, Shield, Users, ChevronRight, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function RadiologistDetail({ radiologist, patients, patientsLoading, error, onBack, onViewPatient,onToggleStatus,onMakeAdmin,onDeleteRadiologist}) {
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async () => {
        if (!radiologist) return;
        setDeleting(true);

        toast.loading("Deleting radiologist...", { id: "delete" });

        try {
            await onDeleteRadiologist(radiologist.user_id);
            toast.success(`Radiologist ${radiologist.full_name} deleted successfully`, { id: "delete" });
            setShowDeleteModal(false);
        } catch (err) {
            toast.error(err?.message || "Failed to delete radiologist", { id: "delete" });
        }

        setDeleting(false);
    };

    return (
        <div className="min-h-screen bg-linear-to-br from-blue-50 via-blue-50 to-pink-50 p-8">
            <button
                onClick={onBack}
                className="mb-6 flex cursor-pointer items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg shadow-md transition-all hover:shadow-lg font-semibold"
            >
                <ArrowRight size={20} className="transform rotate-180" />
                Back to Radiologists
            </button>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg shadow-sm">
                    <div className="flex gap-3 items-start">
                        <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
                        <p className="text-red-700 font-medium">{error}</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                        <div className="bg-linear-to-r from-blue-500 to-blue-600 p-6 text-white">
                            <h2 className="text-2xl font-bold mb-2">{radiologist?.full_name}</h2>
                            <p className="text-blue-100 text-sm">Radiologist Profile</p>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Email */}
                            <div className="pb-4 border-b border-gray-200">
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Email Address</p>
                                <p className="text-gray-900 font-semibold text-sm break-all">{radiologist?.email}</p>
                            </div>

                            {/* Attributes */}
                            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-200">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Role</p>
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold ${
                                        radiologist?.is_superuser
                                            ? 'bg-linear-to-r from-red-500 to-red-600 text-white shadow-md'
                                            : radiologist?.is_admin
                                            ? 'bg-linear-to-r from-blue-500 to-blue-500 text-white shadow-md'
                                            : 'bg-gray-200 text-gray-700'
                                    }`}>
                                        {(radiologist?.is_superuser || radiologist?.is_admin) && <Shield size={13} />}
                                        {radiologist?.is_superuser ? 'Superuser' : radiologist?.is_admin ? 'Admin' : 'User'}
                                    </span>
                                </div>

                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Status</p>
                                    <span className={`inline-flex items-center px-3 py-2 rounded-lg text-xs font-semibold ${
                                        radiologist?.is_active
                                            ? 'bg-green-100 text-green-700 border-2 border-green-300'
                                            : 'bg-red-100 text-red-700 border-2 border-red-300'
                                    }`}>
                                        {radiologist?.is_active ? '● Active' : '● Inactive'}
                                    </span>
                                </div>

                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">License</p>
                                    <p className="text-gray-900 font-mono text-xs bg-gray-100 px-2 py-2 rounded">{radiologist?.license_number || '-'}</p>
                                </div>

                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Reports</p>
                                    <p className="text-2xl font-bold text-blue-500">{radiologist?.report_count || 0}</p>
                                </div>
                            </div>

                            {!radiologist?.is_superuser && (
                                <div className="pt-4 grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => onToggleStatus(radiologist.user_id, radiologist.is_active)}
                                        className={`px-4 py-2.5 rounded-lg cursor-pointer transition-all duration-200 font-semibold border-2 ${
                                            radiologist.is_active 
                                                ? 'text-red-600 hover:bg-red-100 border-red-200 bg-red-50' 
                                                : 'text-green-600 hover:bg-green-100 border-green-200 bg-green-50'
                                        }`}
                                    >
                                        {radiologist.is_active ? 'Deactivate' : 'Activate'}
                                    </button>

                                    {!radiologist?.is_admin && (
                                        <button
                                            onClick={() => onMakeAdmin(radiologist.user_id)}
                                            className="px-4 py-2.5 text-blue-500 cursor-pointer hover:bg-blue-100 bg-blue-50 rounded-lg transition-all duration-200 font-semibold border-2 border-blue-200"
                                        >
                                            Make Admin
                                        </button>
                                    )}

                                    {/* Delete Button */}
                                    <button
                                        onClick={() => setShowDeleteModal(true)}
                                        className="col-span-2 px-4 py-2.5 cursor-pointer text-red-600 hover:bg-red-100 bg-red-50 rounded-lg transition-all duration-200 font-semibold border-2 border-red-300 flex items-center justify-center gap-2"
                                    >
                                        <Trash2 size={16} />
                                        Delete Radiologist
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Patients List */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl shadow-xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-bold text-gray-900">Patients</h3>
                            <span className="bg-linear-to-r from-blue-500 to-blue-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-md">
                                {patients.length} Total
                            </span>
                        </div>

                        {patientsLoading ? (
                            <div className="text-center py-12">
                                <div className="relative inline-block">
                                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200"></div>
                                    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 absolute inset-0"></div>
                                </div>
                                <p className="text-gray-600 mt-4 font-medium">Loading patients...</p>
                            </div>
                        ) : patients.length === 0 ? (
                            <div className="text-center py-12">
                                <Users size={48} className="text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-600 text-lg">No patients found for this radiologist</p>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                                {patients.map((patient) => (
                                    <PatientCard 
                                        key={patient.patient_id}
                                        patient={patient}
                                        onViewDetail={() => onViewPatient(patient)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Confirm Deletion</h2>
                        <p className="text-gray-700 mb-6">
                            Are you sure you want to delete <span className="font-semibold">{radiologist.full_name}</span>? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="px-4 py-2 rounded-lg border cursor-pointer border-gray-300 bg-gray-50 hover:bg-gray-100 font-semibold"
                                disabled={deleting}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 rounded-lg cursor-pointer bg-red-600 text-white hover:bg-red-700 font-semibold flex items-center gap-2"
                                disabled={deleting}
                            >
                                {deleting ? "Deleting..." : "Delete"}
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function PatientCard({ patient, onViewDetail }) {
    return (
        <button
            onClick={onViewDetail}
            className="w-full text-left p-5 bg-linear-to-r from-gray-50 to-blue-50 hover:from-blue-100 hover:to-blue-100 rounded-xl border-2 border-gray-200 hover:border-blue-400 transition-all shadow-sm hover:shadow-md transform hover:-translate-y-1"
        >
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <p className="font-bold text-gray-900 text-lg">{patient.patient_name || 'Unknown'}</p>
                        <span className="bg-blue-200 text-blue-700 px-2 py-1 rounded text-xs font-semibold">
                            {patient.visit_count} visits
                        </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2 font-mono">ID: {patient.patient_id}</p>
                    <div className="flex gap-4 text-xs text-gray-600">
                        <span className="bg-white px-3 py-1 rounded-full border border-gray-200">
                            Age: <span className="font-semibold">{patient.age || '-'}</span>
                        </span>
                        <span className="bg-white px-3 py-1 rounded-full border border-gray-200">
                            Sex: <span className="font-semibold capitalize">{patient.sex || '-'}</span>
                        </span>
                    </div>
                </div>
                <ChevronRight size={24} className="text-blue-400 transform rotate-180" />
            </div>
        </button>
    );
}

import { AlertCircle, Eye, Users, FileText, ChevronRight, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { LoadingSpinner } from '../../utils/LoadingSpinner';


export default function RadiologistList({ radiologists, loading, error, onViewDetail, onDeleteRadiologist }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [radiologistToDelete, setRadiologistToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const filteredRadiologists = radiologists.filter(radiologist =>
        radiologist.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        radiologist.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (radiologist.license_number && radiologist.license_number.includes(searchTerm))
    );

    const handleDeleteClick = (radiologist) => {
        setRadiologistToDelete(radiologist);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!radiologistToDelete) return;
        setDeleting(true);

        toast.loading("Deleting radiologist...", { id: "delete" });

        try {
            await onDeleteRadiologist(radiologistToDelete.user_id);
            toast.success(`Radiologist ${radiologistToDelete.full_name} deleted successfully`, { id: "delete" });
            setShowDeleteModal(false);
            setRadiologistToDelete(null);
        } catch (err) {
            toast.error(err?.message || "Failed to delete radiologist", { id: "delete" });
        }

        setDeleting(false);
    };

    const handleCancelDelete = () => {
        setShowDeleteModal(false);
        setRadiologistToDelete(null);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner message="Loading radiologists..."/>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-blue-50 via-blue-50 to-pink-50 p-8">
            {error && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg shadow-sm">
                    <div className="flex gap-3 items-start">
                        <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
                        <p className="text-red-700 font-medium">{error}</p>
                    </div>
                </div>
            )}

            <div className="mb-6">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by name, email, or license number..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white shadow-sm"
                    />
                </div>
            </div>

            {filteredRadiologists.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
                    <Users size={48} className="text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg">{searchTerm ? 'No radiologists match your search' : 'No radiologists found'}</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-linear-to-r from-blue-50 to-blue-50 border-b-2 border-blue-100">
                                <tr>
                                    <th className="px-8 py-6 text-left text-sm font-semibold text-blue-900 uppercase tracking-wider">Radiologist</th>
                                    <th className="px-6 py-6 text-left text-sm font-semibold text-blue-900 uppercase tracking-wider">License</th>
                                    <th className="px-6 py-6 text-left text-sm font-semibold text-blue-900 uppercase tracking-wider">Reports</th>
                                    <th className="px-6 py-6 text-left text-sm font-semibold text-blue-900 uppercase tracking-wider">Status</th>
                                    <th className="px-8 py-6 text-left text-sm font-semibold text-blue-900 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredRadiologists.map((radiologist) => (
                                    <RadiologistRow 
                                        key={radiologist.user_id}
                                        radiologist={radiologist}
                                        onViewDetail={onViewDetail}
                                        onDeleteClick={handleDeleteClick}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && radiologistToDelete && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Confirm Deletion</h2>
                        <p className="text-gray-700 mb-6">
                            Are you sure you want to delete <span className="font-semibold">{radiologistToDelete.full_name}</span>? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={handleCancelDelete}
                                className="px-4 py-2 rounded-lg cursor-pointer border border-gray-300 bg-gray-50 hover:bg-gray-100 font-semibold"
                                disabled={deleting}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                className="px-4 py-2 rounded-lg bg-red-600 cursor-pointer text-white hover:bg-red-700 font-semibold flex items-center gap-2"
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

function RadiologistRow({ radiologist, onViewDetail, onDeleteClick }) {
    return (
        <tr className="hover:bg-linear-to-r hover:from-blue-50/50 hover:to-blue-50/50 transition-all duration-200 group">
            <td className="px-8 py-5">
                <div className="flex items-center space-x-4">
                    <div>
                        <p className="font-semibold text-gray-900 text-lg">
                            {radiologist.full_name}
                        </p>
                    </div>
                </div>
            </td>
            <td className="px-6 py-5">
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-mono bg-gray-100 text-gray-700 border border-gray-300">
                    {radiologist.license_number || 'Not provided'}
                </span>
            </td>
            <td className="px-6 py-5">
                <div className="flex items-center space-x-2">
                    <FileText size={16} className="text-blue-500" />
                    <span className="font-bold text-gray-900 text-lg">
                        {radiologist.report_count || 0}
                    </span>
                </div>
            </td>
            <td className="px-6 py-5">
                <span className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border-2 ${
                    radiologist.is_active
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                }`}>
                    <div className={`w-2 h-2 rounded-full ${radiologist.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    {radiologist.is_active ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td className="px-8 py-5">
                <div className="flex gap-3 items-center">
                    <button
                        onClick={() => onViewDetail(radiologist)}
                        className="flex-1 flex items-center cursor-pointer justify-center gap-2 px-4 py-2.5 bg-linear-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200 border border-blue-400"
                        title="View Details"
                    >
                        <Eye size={18} />
                        <span>View</span>
                        <ChevronRight size={16} />
                    </button>
                    {!radiologist.is_superuser && (
                        <button
                            onClick={() => onDeleteClick(radiologist)}
                            className="p-2.5 text-red-600 cursor-pointer hover:bg-red-100 bg-red-50 rounded-lg transition-all duration-200 hover:scale-110 shadow-sm border border-red-200"
                            title="Delete Radiologist"
                        >
                            <Trash2 size={18} />
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );
}
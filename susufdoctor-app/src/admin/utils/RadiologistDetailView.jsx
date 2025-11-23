import { BackButton } from '../../utils/ErrorAlert';
import { LoadingSpinner } from '../../utils/LoadingSpinner';
import { Eye } from 'lucide-react';

export function RadiologistDetailView({ radiologist, patients, loading, onBack, onSelectPatient }) {
    return (
        <div className="bg-[#DFFBFA]">
            <div className="p-8">
                <div className="flex items-center gap-4 mb-6">
                    <BackButton onClick={onBack} />
                    <h2 className="text-2xl font-bold text-gray-900">{radiologist?.full_name}</h2>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Radiologist Details</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <p className="text-xs text-gray-600 font-semibold">Email</p>
                            <p className="text-sm text-gray-900">{radiologist?.email}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-600 font-semibold">License</p>
                            <p className="text-sm text-gray-900">{radiologist?.license_number || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-600 font-semibold">Total Reports</p>
                            <p className="text-sm text-gray-900">{radiologist?.report_count}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-600 font-semibold">Status</p>
                            <p className={`text-sm font-semibold ${radiologist?.is_active ? 'text-green-600' : 'text-red-600'}`}>
                                {radiologist?.is_active ? 'Active' : 'Inactive'}
                            </p>
                        </div>
                    </div>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-4">Patients ({patients.length})</h3>
                {loading ? (
                    <LoadingSpinner message="Loading patients..." />
                ) : patients.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {patients.map(patient => (
                            <div key={patient.patient_id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition">
                                <h4 className="text-lg font-bold text-gray-900 mb-2">{patient.patient_name}</h4>
                                <div className="space-y-2 mb-4 text-sm text-gray-700">
                                    <p><span className="font-semibold">Age:</span> {patient.age}</p>
                                    <p><span className="font-semibold">Sex:</span> {patient.sex}</p>
                                    <p><span className="font-semibold">BMI:</span> {patient.bmi}</p>
                                    <p><span className="font-semibold">Visits:</span> {patient.visit_count}</p>
                                    <p><span className="font-semibold">Latest:</span> {new Date(patient.latest_visit).toLocaleDateString()}</p>
                                </div>
                                <button 
                                    onClick={() => onSelectPatient(patient.patient_id)}
                                    className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium flex items-center justify-center gap-2">
                                    <Eye size={18} />
                                    View Details
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                        <p className="text-gray-600">No patients found for this radiologist</p>
                    </div>
                )}
            </div>
        </div>
    );
}
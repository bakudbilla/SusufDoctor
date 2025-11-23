import { BackButton } from '../../utils/ErrorAlert';
import { Eye, Download } from 'lucide-react';

export function PatientDetailView({ patient, onBack }) {
    return (
        <div className="bg-[#DFFBFA]">
            <div className="p-8">
                <div className="flex items-center gap-4 mb-6">
                    <BackButton onClick={onBack} />
                    <h2 className="text-2xl font-bold text-gray-900">{patient?.patient_name}</h2>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Patient Information</h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div>
                            <p className="text-xs text-gray-600 font-semibold">Patient ID</p>
                            <p className="text-sm text-gray-900">{patient?.patient_id}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-600 font-semibold">Age</p>
                            <p className="text-sm text-gray-900">{patient?.age}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-600 font-semibold">Sex</p>
                            <p className="text-sm text-gray-900 capitalize">{patient?.sex}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-600 font-semibold">BMI</p>
                            <p className="text-sm text-gray-900">{patient?.bmi}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-600 font-semibold">Total Visits</p>
                            <p className="text-sm text-gray-900">{patient?.visit_count}</p>
                        </div>
                    </div>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-4">Visit History</h3>
                {patient?.visits && patient.visits.length > 0 ? (
                    <div className="space-y-4">
                        {patient.visits.map((visit, idx) => (
                            <div key={idx} className="bg-white rounded-xl shadow-lg p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <p className="text-xs text-gray-600 font-semibold">Date</p>
                                        <p className="text-sm text-gray-900">{new Date(visit.date).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-600 font-semibold">Reason</p>
                                        <p className="text-sm text-gray-900">{visit.reason}</p>
                                    </div>
                                </div>
                                {visit.notes && (
                                    <div className="mb-4">
                                        <p className="text-xs text-gray-600 font-semibold mb-2">Initial Finding</p>
                                        <p className="text-sm text-gray-700 line-clamp-2">{visit.notes}</p>
                                    </div>
                                )}
                                <div className="flex gap-2 flex-wrap">
                                    {visit.xray_url && (
                                        <a href={visit.xray_url} target="_blank" rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition text-sm font-medium">
                                            <Eye size={16} />
                                            View X-ray
                                        </a>
                                    )}
                                    {visit.report_pdf && (
                                        <a href={visit.report_pdf} target="_blank" rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition text-sm font-medium">
                                            <Download size={16} />
                                            Download Report
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                        <p className="text-gray-600">No visits found for this patient</p>
                    </div>
                )}
            </div>
        </div>
    );
}
import { ArrowLeft, FileText, Download, Eye } from 'lucide-react';

export default function PatientDetail({ patient, patientDetails, onBack }) {
    return (
        <div className="min-h-screen bg-linear-to-br from-blue-50 via-blue-50 to-pink-50 p-8">
            <button
                onClick={onBack}
                className="mb-6 flex cursor-pointer items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg shadow-md transition-all hover:shadow-lg font-semibold"
            >
                <ArrowLeft size={20} />
                Back to Radiologist
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                        <div className="bg-linear-to-r from-blue-500 to-blue-600 p-6 text-white">
                            <h2 className="text-2xl font-bold mb-2">{patient?.patient_name || 'Unknown'}</h2>
                            <p className="text-blue-100 text-sm">Patient Profile</p>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="pb-4 border-b border-gray-200">
                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Patient ID</p>
                                    <p className="text-gray-900 font-semibold font-mono text-sm">{patient?.patient_id}</p>
                                </div>

                                <div className="pb-4 border-b border-gray-200">
                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Age</p>
                                    <p className="text-gray-900 font-semibold">{patient?.age || '-'} years</p>
                                </div>

                                <div className="pb-4 border-b border-gray-200">
                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Sex</p>
                                    <p className="text-gray-900 font-semibold capitalize">{patient?.sex || '-'}</p>
                                </div>

                                <div className="pb-4 border-b border-gray-200">
                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">BMI</p>
                                    <p className="text-gray-900 font-semibold">{patient?.bmi || '-'}</p>
                                </div>
                            </div>

                            <div className="pt-2 bg-linear-to-br from-blue-50 to-blue-50 rounded-xl p-4">
                                <p className="text-4xl font-bold bg-linear-to-r from-blue-500 to-blue-500 bg-clip-text text-transparent mb-1">
                                    {patient?.visit_count || 0}
                                </p>
                                <p className="text-sm text-gray-600 font-medium">Total Visits</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Visit History */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl shadow-xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-bold text-gray-900">Visit History</h3>
                            {patientDetails?.visits?.length > 0 && (
                                <span className="bg-linear-to-r from-blue-500 to-blue-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-md">
                                    {patientDetails.visits.length} Visits
                                </span>
                            )}
                        </div>

                        {!patientDetails ? (
                            <div className="text-center py-12">
                                <div className="relative inline-block">
                                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200"></div>
                                    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 absolute inset-0"></div>
                                </div>
                                <p className="text-gray-600 mt-4 font-medium">Loading visit history...</p>
                            </div>
                        ) : patientDetails?.visits?.length === 0 ? (
                            <div className="text-center py-12">
                                <FileText size={48} className="text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-600 text-lg">No visits found</p>
                            </div>
                        ) : (
                            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                                {patientDetails?.visits?.map((visit, index) => (
                                    <VisitCard key={visit.visit_id} visit={visit} index={index} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function VisitCard({ visit, index }) {
    return (
        <div className="p-5 bg-linear-to-r cursor-pointer from-gray-50 to-blue-50 rounded-xl border-2 border-gray-200 hover:border-blue-300 transition-all shadow-sm hover:shadow-md">
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                    <p className="font-bold text-gray-900 text-lg mb-1">{visit.reason}</p>
                    <p className="text-sm text-gray-600 font-medium">
                        {visit.date ? new Date(visit.date).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                        }) : 'Date unknown'}
                    </p>
                </div>
                <span className="bg-blue-200 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
                    Visit #{index + 1}
                </span>
            </div>

            <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
                <p className="text-sm text-gray-700">{visit.notes || 'No notes available'}</p>
            </div>

            <div className="flex gap-2 flex-wrap">
                {visit.report_pdf && (
                    <a
                        href={visit.report_pdf}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm bg-linear-to-r from-blue-500 to-blue-500 text-white px-4 py-2 rounded-lg hover:from-blue-500 hover:to-blue-700 transition-all shadow-md hover:shadow-lg font-semibold"
                    >
                        <Download size={16} />
                        Download Report
                    </a>
                )}
                {visit.xray_url && (
                    <a
                        href={visit.xray_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm bg-linear-to-r from-blue-500 to-blue-500 text-white px-4 py-2 rounded-lg hover:from-blue-500 hover:to-blue-700 transition-all shadow-md hover:shadow-lg font-semibold"
                    >
                        <Eye size={16} />
                        View X-ray
                    </a>
                )}
            </div>
        </div>
    );
}
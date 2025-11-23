import { useState, useEffect } from 'react';
import { FileText, AlertCircle, X, Download, Eye } from 'lucide-react';
import { API_URL } from '../utils/constant';
import { LoadingSpinner } from '../utils/LoadingSpinner'

export default function RecentReports() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedReport, setSelectedReport] = useState(null);
    const [reportDetail, setReportDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState('');
    const [showXrayPreview, setShowXrayPreview] = useState(false);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`${API_URL}/admin/reports/recent?limit=20`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setReports(data.data);
            } else {
                setError('Failed to fetch reports');
            }
        } catch (error) {
            setError('Error fetching reports');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchReportDetail = async (reportId) => {
        setDetailLoading(true);
        setDetailError('');
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`${API_URL}/admin/reports/${reportId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setReportDetail(data.data);
            } else {
                setDetailError('Failed to fetch report details');
            }
        } catch (error) {
            setDetailError('Error fetching report details');
            console.error(error);
        } finally {
            setDetailLoading(false);
        }
    };

    const handleViewReport = (report) => {
        setSelectedReport(report.report_id);
        fetchReportDetail(report.report_id);
    };

    const handleCloseModal = () => {
        setSelectedReport(null);
        setReportDetail(null);
        setShowXrayPreview(false);
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">
            <LoadingSpinner message='Loading reports...' />
        </div>;
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            {error && (
                <div className="mb-4 sm:mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                    <AlertCircle size={20} className="text-red-600 shrink-0" />
                    <p className="text-red-700 text-sm sm:text-base">{error}</p>
                </div>
            )}

            <div className="rounded-xl bg-white shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm sm:text-base">
                        <thead className="bg-gray-100 border-b border-gray-200">
                            <tr>
                                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900">Patient</th>
                                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900">Radiologist</th>
                                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900">View Type</th>
                                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900">Date</th>
                                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900">Status</th>
                                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reports.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-3 sm:px-6 py-6 sm:py-8 text-center text-gray-500 text-sm sm:text-base">
                                        No reports found
                                    </td>
                                </tr>
                            ) : (
                                reports.map((report) => (
                                    <tr key={report.report_id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                                        <td className="px-3 sm:px-6 py-3 sm:py-4 font-medium text-gray-900 text-xs sm:text-base">{report.patient_name}</td>
                                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-gray-700 text-xs sm:text-base">{report.radiologist_name}</td>
                                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-gray-700 text-xs">{report.view_type}</td>
                                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-gray-700 text-xs">
                                            {new Date(report.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                                            <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${
                                                report.is_edited
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : 'bg-blue-100 text-blue-800'
                                            }`}>
                                                {report.is_edited ? (
                                                    <>
                                                        <FileText size={12} className="sm:w-4 sm:h-4" />
                                                        <span className="hidden sm:inline">Edited</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <FileText size={12} className="sm:w-4 sm:h-4" />
                                                        <span className="hidden sm:inline">Generated</span>
                                                    </>
                                                )}
                                            </span>
                                        </td>
                                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                                            <button
                                                onClick={() => handleViewReport(report)}
                                                className="px-2 sm:px-3 py-1 sm:py-2 bg-blue-500 text-white text-xs sm:text-sm cursor-pointer rounded hover:bg-blue-600 transition font-medium"
                                            >
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detail Modal */}
            {selectedReport && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl lg:max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white">
                            <h2 className="text-lg sm:text-xl font-bold text-blue-500">Report Details</h2>
                            <button
                                onClick={handleCloseModal}
                                className="p-1 hover:bg-gray-100 cursor-pointer rounded transition"
                            >
                                <X size={24} className="text-gray-600" />
                            </button>
                        </div>

                        {detailLoading ? (
                            <div className="p-6 text-center">
                                <LoadingSpinner message="Loading report..." />
                            </div>
                        ) : detailError ? (
                            <div className="p-4 sm:p-6">
                                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                                    <AlertCircle size={20} className="text-red-600 shrink-0" />
                                    <p className="text-red-700 text-sm sm:text-base">{detailError}</p>
                                </div>
                            </div>
                        ) : reportDetail && (
                            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs sm:text-sm text-gray-500">Patient Name</p>
                                        <p className="font-semibold text-gray-900 text-sm sm:text-base">{reportDetail.patient_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs sm:text-sm text-gray-500">Patient ID</p>
                                        <p className="font-semibold text-gray-900 text-sm sm:text-base">{reportDetail.patient_id}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs sm:text-sm text-gray-500">Age</p>
                                        <p className="font-semibold text-gray-900 text-sm sm:text-base">{reportDetail.patient_age || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs sm:text-sm text-gray-500">Gender</p>
                                        <p className="font-semibold text-gray-900 text-sm sm:text-base">{reportDetail.patient_gender || 'N/A'}</p>
                                    </div>
                                </div>

                                <hr className="border-gray-200" />

                                {/* Report Information */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs sm:text-sm text-gray-500">Radiologist</p>
                                        <p className="font-semibold text-gray-900 text-sm sm:text-base">{reportDetail.radiologist_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs sm:text-sm text-gray-500">View Type</p>
                                        <p className="font-semibold text-gray-900 text-sm sm:text-base">{reportDetail.view_type}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs sm:text-sm text-gray-500">Created</p>
                                        <p className="font-semibold text-gray-900 text-sm sm:text-base">
                                            {new Date(reportDetail.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs sm:text-sm text-gray-500">Status</p>
                                        <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${
                                            reportDetail.is_edited
                                                ? 'bg-yellow-100 text-yellow-800'
                                                : 'bg-blue-100 text-blue-800'
                                        }`}>
                                            {reportDetail.is_edited ? (
                                                <>
                                                    <FileText size={12} />
                                                    <span className="hidden sm:inline">Edited</span>
                                                </>
                                            ) : (
                                                <>
                                                    <FileText size={12} />
                                                    <span className="hidden sm:inline">Generated</span>
                                                </>
                                            )}
                                        </span>
                                    </div>
                                </div>

                                <hr className="border-gray-200" />

                                {/* X-Ray Preview */}
                                {reportDetail.xray_url && (
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <p className="text-sm font-medium text-gray-700">X-Ray Image</p>
                                            <button
                                                onClick={() => setShowXrayPreview(!showXrayPreview)}
                                                className="flex items-center gap-2 px-3 py-1 text-xs sm:text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                                            >
                                                <Eye size={16} />
                                                {showXrayPreview ? 'Hide' : 'Show'}
                                            </button>
                                        </div>
                                        {showXrayPreview && (
                                            <div className="bg-gray-100 rounded-lg p-4 flex justify-center max-h-96 overflow-auto">
                                                <img 
                                                    src={reportDetail.xray_url} 
                                                    alt="X-Ray" 
                                                    className="max-w-full max-h-full object-contain rounded"
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Findings */}
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-gray-700">Findings</p>
                                    <p className="text-gray-700 text-sm sm:text-base bg-gray-50 p-3 rounded-lg">
                                        {reportDetail.findings || 'No findings recorded'}
                                    </p>
                                </div>

                                {/* Report PDF */}
                                {reportDetail.report_pdf && (
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium text-gray-700">Report PDF</p>
                                        <a 
                                            href={reportDetail.report_pdf}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition font-medium w-fit text-sm"
                                        >
                                            <Download size={16} />
                                            Download PDF Report
                                        </a>
                                    </div>
                                )}

                                {/* Modal Actions */}
                                <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                                    <button
                                        onClick={handleCloseModal}
                                        className="px-3 sm:px-4 py-2 border border-gray-300 text-gray-700 text-sm sm:text-base rounded-lg hover:bg-gray-50 transition font-medium"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
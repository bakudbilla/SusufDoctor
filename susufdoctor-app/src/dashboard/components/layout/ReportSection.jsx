import { Edit2, Save, Download, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function ReportSection({ reportGenerated, isEditMode, reportText, setReportText, isSaving, submitStatus, handleEditReport, handleSaveChanges, handleSaveAndDownload, handleCancelEdit, }) {
  if (!reportGenerated) return null;

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-700">Generated Report</h3>
        {!isEditMode && (
          <button
            onClick={handleEditReport}
            className="flex items-center gap-2 px-4 py-2 cursor-pointer text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
          >
            <Edit2 className="h-4 w-4" />
            Edit Report
          </button>
        )}
      </div>
      
      {isEditMode ? (
        <div className="space-y-4">
          <textarea
            value={reportText}
            onChange={(e) => setReportText(e.target.value)}
            className="w-full h-64 p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Edit the report text here..."
          />
          <div className="flex gap-3">
            <button
              onClick={handleSaveChanges}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-3 cursor-pointer bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </button>
            <button
              onClick={handleSaveAndDownload}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-3 cursor-pointer bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              <Download className="h-4 w-4" />
              Save & Download
            </button>
            <button
              onClick={handleCancelEdit}
              className="px-6 py-3 border border-slate-300 cursor-pointer text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg whitespace-pre-wrap text-sm max-h-64 overflow-y-auto">
          {reportText}
        </div>
      )}

      {submitStatus && (
        <div
          className={`mt-6 p-4 rounded-lg border ${
            submitStatus.type === "success"
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          <div className="flex items-center gap-2">
            {submitStatus.type === "success" ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <p className="text-sm">{submitStatus.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
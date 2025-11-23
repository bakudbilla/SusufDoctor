import { Upload, X, FileImage, CheckCircle2, File, Loader2 } from "lucide-react";

export default function FileUploadSection({ mode, xrayFile, reportFile, xrayDragActive, reportDragActive, loadingPriorReport, errors, uploadedImage, uploadedReport, handleXrayDrag, handleXrayDrop, handleXrayFiles, handleReportFiles, xrayFileInputRef, reportFileInputRef, setXrayFile, setReportFile }) {
  return (
    <>
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-slate-700 mb-4">Upload X-ray Image</h3>
        <div
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
            xrayDragActive ? "border-blue-400 bg-blue-50" : "border-slate-300"
          }`}
          onDragEnter={handleXrayDrag}
          onDragLeave={handleXrayDrag}
          onDragOver={handleXrayDrag}
          onDrop={handleXrayDrop}
          onClick={() => xrayFileInputRef.current?.click()}
        >
          {!xrayFile ? (
            <>
              <Upload className="h-14 w-14 mx-auto text-slate-400 mb-3" />
              <p className="text-slate-600">
                Drag & drop or <span className="text-blue-500 font-semibold">browse</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Supports DICOM, PNG, or JPEG formats
              </p>
              {errors.xrayFile && (
                <p className="text-xs text-red-500 mt-2">{errors.xrayFile}</p>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center gap-4">
              <FileImage className="h-14 w-14 text-blue-500" />
              <div className="text-left">
                <p className="font-medium">{xrayFile.name}</p>
                <p className="text-xs text-emerald-500">✓ Ready for analysis</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setXrayFile(null);
                }}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <X className="h-5 w-5 text-red-400" />
              </button>
            </div>
          )}
          <input
            ref={xrayFileInputRef}
            type="file"
            className="hidden"
            accept=".dcm,.dicom,image/png,image/jpeg,image/jpg"
            onChange={(e) => e.target.files && handleXrayFiles(e.target.files)}
          />
        </div>

        {uploadedImage && (
          <div className="mt-4 p-4 border border-slate-200 rounded-xl bg-slate-50">
            <p className="text-sm font-medium text-slate-700 mb-3">Image Preview</p>
            <img
              src={uploadedImage.preview}
              alt="X-ray preview"
              className="max-h-64 rounded-lg mx-auto"
            />
          </div>
        )}
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold text-slate-700 mb-4">
          {mode === "update" ? "Prior Report from Latest Visit" : "Reference Report (Optional)"}
        </h3>
        
        {mode === "update" ? (
          <>
            {loadingPriorReport ? (
              <div className="flex items-center justify-center p-8 bg-slate-50 rounded-xl">
                <Loader2 className="h-5 w-5 animate-spin text-blue-500 mr-2" />
                <span>Loading prior report...</span>
              </div>
            ) : reportFile && reportFile.isPrior ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">{reportFile.name}</p>
                      <p className="text-xs text-green-700">Automatically loaded from patient records</p>
                    </div>
                  </div>
                  <a
                    href={reportFile.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm font-medium"
                  >
                    View
                  </a>
                </div>
              </div>
            ) : (
              <p className="text-slate-500 text-sm">No prior reports found for this patient</p>
            )}
          </>
        ) : (
          <div
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
              reportDragActive ? "border-purple-400 bg-purple-50" : "border-slate-300"
            }`}
            onClick={() => reportFileInputRef.current?.click()}
          >
            {!reportFile ? (
              <>
                <Upload className="h-14 w-14 mx-auto text-slate-400 mb-3" />
                <p className="text-slate-600">
                  Drag & drop or <span className="text-purple-500 font-semibold">browse</span>
                </p>
                <p className="text-xs text-slate-400 mt-1">PDF format only</p>
              </>
            ) : (
              <div className="flex items-center justify-center gap-4">
                <File className="h-14 w-14 text-purple-500" />
                <div className="text-left">
                  <p className="font-medium">{reportFile.name}</p>
                  <p className="text-xs text-emerald-500">Ready to include</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setReportFile(null);
                  }}
                  className="p-2 hover:bg-slate-100 rounded-lg"
                >
                  <X className="h-5 w-5 text-red-400" />
                </button>
              </div>
            )}
            <input
              ref={reportFileInputRef}
              type="file"
              className="hidden"
              accept="application/pdf"
              onChange={(e) => e.target.files && handleReportFiles(e.target.files)}
            />
          </div>
        )}

        {uploadedReport && (
          <div className="mt-4 p-4 border border-slate-200 rounded-xl bg-slate-50">
            <p className="text-sm font-medium text-slate-700 mb-3">Report Preview</p>
            <div className="bg-white rounded-lg p-4 max-h-64 overflow-auto border border-slate-200">
              <iframe
                src={uploadedReport.preview}
                className="w-full h-64 rounded"
                title="PDF preview"
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
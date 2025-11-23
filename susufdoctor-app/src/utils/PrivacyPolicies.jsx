import { X, Check } from "lucide-react";
import { privacyPolicies } from './constant';

export default function PrivacyPolicies({ isOpen, onClose, onAccept, onDecline, showAcceptBtn = true, showDeclineBtn = true, isLoading = false, }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-linear-to-r from-blue-50 to-cyan-50">
          <h2 className="text-2xl font-bold text-gray-900">Privacy Policy & Terms</h2>
          <button
            onClick={onClose}
            className="text-gray-400 cursor-pointer hover:text-gray-600 transition"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <p className="text-gray-700 mb-6 font-semibold">
            By creating an account on SuSufDoctor, I confirm that:
          </p>
          <div className="space-y-4">
            {privacyPolicies.map((policy, index) => (
              <div key={index} className="flex gap-3">
                <div className="shrink-0 mt-1">
                  <Check size={20} className="text-blue-500" />
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">{policy}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-200 p-6 bg-gray-50 flex gap-3">
          {showDeclineBtn && (
            <button
              onClick={onDecline}
              className="flex-1 px-4 py-3 cursor-pointer bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold rounded-lg transition"
            >
              Decline
            </button>
          )}
          {showAcceptBtn && (
            <button
              onClick={onAccept}
              disabled={isLoading}
              className={`${
                showDeclineBtn ? "flex-1" : "w-full"
              } px-4 py-3 bg-blue-500 cursor-pointer hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition`}
            >
              Accept & Continue
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
import { AlertCircle, ArrowLeft } from 'lucide-react';

export function ErrorAlert({ error, onDismiss }) {
    return (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3 items-start">
            <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
                <p className="text-red-700">{error}</p>
            </div>
            {onDismiss && (
                <button onClick={onDismiss} className="text-red-600 hover:text-red-800 text-xl leading-none">×</button>
            )}
        </div>
    );
}


export function SuccessAlert({ message, onDismiss }) {
    return (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3 items-start">
            <AlertCircle size={20} className="text-green-600 shrink-0 mt-0.5" />
            <div className="flex-1">
                <p className="text-green-700">{message}</p>
            </div>
            {onDismiss && (
                <button onClick={onDismiss} className="text-green-600 hover:text-green-800 text-xl leading-none">×</button>
            )}
        </div>
    );
}



export function BackButton({ onClick }) {
    return (
        <button 
            onClick={onClick}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition">
            <ArrowLeft size={20} />
            Back
        </button>
    );
}
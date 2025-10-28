import { AlertTriangle, X } from "lucide-react";

/**
 * Reusable Confirmation Dialog Component
 * @param {boolean} isOpen - Whether the dialog is visible
 * @param {function} onClose - Function to call when closing without confirming
 * @param {function} onConfirm - Function to call when user confirms
 * @param {string} title - Dialog title
 * @param {string} message - Main message
 * @param {string} warningMessage - Optional warning message (highlighted)
 * @param {string} confirmText - Text for confirm button (default: "Delete")
 * @param {string} cancelText - Text for cancel button (default: "Cancel")
 * @param {string} confirmColor - Tailwind gradient for confirm button (default: red-pink)
 */
export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  warningMessage = null,
  confirmText = "Delete",
  cancelText = "Cancel",
  confirmColor = "from-red-500 to-pink-500",
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-scaleIn">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-pink-500 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-gray-700 text-sm leading-relaxed">{message}</p>
          
          {warningMessage && (
            <div className="bg-amber-50 border-l-4 border-amber-500 px-4 py-3 rounded">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-amber-800 text-sm font-medium">{warningMessage}</p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 rounded-lg bg-gradient-to-r ${confirmColor} text-white font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

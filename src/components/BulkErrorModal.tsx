import React from "react";
import { Modal } from "./Modal";

interface BulkErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  operation: string;
  errors: string[];
  successfulCount: number;
  failedCount: number;
  onRetry?: () => void;
  onSkipErrors?: () => void;
}

export const BulkErrorModal = React.memo(function BulkErrorModal({
  isOpen,
  onClose,
  operation,
  errors,
  successfulCount,
  failedCount,
  onRetry,
  onSkipErrors,
}: BulkErrorModalProps) {
  const totalCount = successfulCount + failedCount;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${operation} Results`}>
      <div className="space-y-4">
        {/* Summary */}
        <div className="bg-surface-tertiary rounded-lg p-4">
          <h3 className="text-lg font-semibold text-monokai-fg mb-3">
            Operation Summary
          </h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-monokai-green bg-opacity-20 rounded-lg p-3">
              <div className="text-2xl font-bold text-monokai-green">
                {successfulCount}
              </div>
              <div className="text-sm text-monokai-comment">Successful</div>
            </div>
            <div className="bg-monokai-red bg-opacity-20 rounded-lg p-3">
              <div className="text-2xl font-bold text-monokai-red">
                {failedCount}
              </div>
              <div className="text-sm text-monokai-comment">Failed</div>
            </div>
            <div className="bg-monokai-blue bg-opacity-20 rounded-lg p-3">
              <div className="text-2xl font-bold text-monokai-blue">
                {totalCount}
              </div>
              <div className="text-sm text-monokai-comment">Total</div>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {successfulCount > 0 && (
          <div className="bg-monokai-green bg-opacity-10 border border-monokai-green border-opacity-30 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <span className="text-monokai-green text-xl">✅</span>
              <div>
                <h4 className="text-monokai-green font-medium">
                  {successfulCount} items processed successfully
                </h4>
                <p className="text-sm text-monokai-comment">
                  These changes have been applied to your notes.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Errors */}
        {errors.length > 0 && (
          <div className="bg-monokai-red bg-opacity-10 border border-monokai-red border-opacity-30 rounded-lg p-4">
            <h4 className="text-monokai-red font-medium mb-3">
              Errors ({errors.length})
            </h4>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {errors.map((error, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-surface-secondary rounded border border-monokai-red border-opacity-20"
                >
                  <span className="text-monokai-red mt-0.5">⚠️</span>
                  <p className="text-sm text-monokai-comment leading-relaxed">
                    {error}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-monokai border-opacity-30">
          {onRetry && failedCount > 0 && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-monokai-orange text-monokai-bg border border-monokai-orange rounded-lg hover:bg-opacity-90 transition-colors flex items-center gap-2"
            >
              <span>🔄</span>
              Retry Failed Items
            </button>
          )}

          {onSkipErrors && failedCount > 0 && (
            <button
              onClick={onSkipErrors}
              className="px-4 py-2 text-monokai-comment bg-surface-tertiary border border-monokai-comment rounded-lg hover:bg-monokai-comment hover:bg-opacity-20 transition-colors"
            >
              Continue with Successful Items
            </button>
          )}

          <button
            onClick={onClose}
            className="px-4 py-2 bg-monokai-blue text-monokai-bg border border-monokai-blue rounded-lg hover:bg-opacity-90 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
});

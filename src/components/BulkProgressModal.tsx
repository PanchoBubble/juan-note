import React from 'react';
import { Modal } from './Modal';

interface BulkProgressModalProps {
    isOpen: boolean;
    onClose: () => void;
    operation: string;
    progress: number;
    total: number;
    currentItem?: string;
    isComplete?: boolean;
    errors?: string[];
}

export const BulkProgressModal = React.memo(function BulkProgressModal({
    isOpen,
    onClose,
    operation,
    progress,
    total,
    currentItem,
    isComplete = false,
    errors = []
}: BulkProgressModalProps) {
    const handleClose = onClose || (() => {});
    const progressPercentage = Math.round((progress / total) * 100);

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={`${operation} Progress`}>
            <div className="space-y-4">
                {/* Progress Bar */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-monokai-fg">{operation}</span>
                        <span className="text-monokai-comment">
                            {progress} of {total} ({progressPercentage}%)
                        </span>
                    </div>
                    <div className="w-full bg-surface-tertiary rounded-full h-2">
                        <div
                            className="bg-monokai-blue h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>
                </div>

                {/* Current Item */}
                {currentItem && (
                    <div className="text-sm text-monokai-comment">
                        Processing: {currentItem}
                    </div>
                )}

                {/* Loading Spinner */}
                {!isComplete && (
                    <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-monokai-blue"></div>
                        <span className="ml-3 text-monokai-fg">Processing...</span>
                    </div>
                )}

                {/* Completion Message */}
                {isComplete && (
                    <div className="text-center py-4">
                        <div className="w-16 h-16 bg-monokai-green bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">✅</span>
                        </div>
                        <h3 className="text-lg font-semibold text-monokai-fg mb-2">
                            {operation} Complete!
                        </h3>
                        <p className="text-monokai-comment">
                            Successfully processed {progress} of {total} items
                        </p>
                    </div>
                )}

                {/* Errors */}
                {errors.length > 0 && (
                    <div className="bg-monokai-red bg-opacity-10 border border-monokai-red border-opacity-30 rounded-lg p-4">
                        <h4 className="text-monokai-red font-medium mb-2">
                            Some operations failed:
                        </h4>
                        <ul className="space-y-1 text-sm text-monokai-comment">
                            {errors.map((error, index) => (
                                <li key={index}>• {error}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4">
                    {isComplete ? (
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-monokai-blue text-monokai-bg border border-monokai-blue rounded-lg hover:bg-opacity-90 transition-colors"
                        >
                            Close
                        </button>
                    ) : (
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-monokai-comment bg-surface-tertiary border border-monokai-comment rounded-lg hover:bg-monokai-comment hover:bg-opacity-20 transition-colors"
                            disabled={!isComplete}
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </div>
        </Modal>
    );
});
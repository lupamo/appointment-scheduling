"use client";

interface PaymentStepProps {
  isCheckingPayment: boolean;
  onCheckStatus: () => void;
}

export function PaymentStep({
  isCheckingPayment,
  onCheckStatus,
}: PaymentStepProps) {
  return (
    <div className="p-6 md:p-8 border border-gray-200 rounded-3xl bg-white shadow-sm text-center">
      <div className="text-5xl mb-4">📱</div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment Pending</h2>
      <p className="text-sm text-gray-600 mb-1">
        Check your phone for the M-Pesa STK push.
      </p>
      <p className="text-xs text-gray-400 mb-6">
        Enter your M-Pesa PIN to complete the booking deposit.
      </p>

      {isCheckingPayment && (
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-4">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>Waiting for payment verification...</span>
        </div>
      )}

      <button
        type="button"
        onClick={onCheckStatus}
        disabled={isCheckingPayment}
        className="w-full h-10 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium text-sm rounded-xl transition duration-150 disabled:opacity-50"
      >
        Check Payment Status
      </button>
    </div>
  );
}

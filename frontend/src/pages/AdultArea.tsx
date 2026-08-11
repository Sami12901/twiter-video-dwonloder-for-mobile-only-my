import React, { useState } from 'react';
import { ShieldAlert } from 'lucide-react';

export const AdultArea = () => {
  const [isVerified, setIsVerified] = useState(false);

  if (!isVerified) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center p-4">
        <div className="max-w-md bg-[var(--surface)] p-8 rounded-2xl border-2 border-red-500/50 text-center">
          <ShieldAlert size={48} className="mx-auto text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-red-500 mb-2">Age Verification Required</h1>
          <p className="text-[var(--text-muted)] mb-6">
            This section contains adult content. You must verify that you are 18 years or older to proceed.
          </p>
          <button
            onClick={() => setIsVerified(true)}
            className="w-full bg-red-500 text-white font-bold py-3 rounded-xl hover:bg-red-600 transition-colors"
          >
            I am 18 or older - Enter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 max-w-2xl mx-auto w-full">
      <h1 className="text-2xl font-bold text-red-500 mb-4">18+ Premium Content</h1>
      <div className="bg-[var(--surface)] p-4 rounded-xl border border-[var(--border)] text-center text-[var(--text-muted)] py-12">
        Adult feed and creator subscriptions will load here.
      </div>
    </div>
  );
};

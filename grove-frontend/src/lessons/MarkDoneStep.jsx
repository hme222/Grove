import React from 'react';

// The last card for lessons whose "your turn" step happens outside this
// screen. It records that the user tried the step.
export default function MarkDoneStep({ onDone, onNotYet }) {
  return (
    <div className="rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#EDE5D8] p-4" data-testid="mark-done-step">
      <p className="text-sm text-[#1A1A17] mb-3">Try the step when you&apos;re ready. Mark the lesson done once you have.</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onNotYet}
          className="flex-1 rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-4 py-3 border-[0.5px] border-[#D3C9B8] text-[#1C2E10]"
          data-testid="mark-done-not-yet"
        >
          Not yet
        </button>
        <button
          type="button"
          onClick={onDone}
          className="flex-1 rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-4 py-3 border-[0.5px] bg-[#1C2E10] text-[#F5F0E8] border-[#1C2E10]"
          data-testid="mark-done-done"
        >
          Mark lesson done
        </button>
      </div>
    </div>
  );
}

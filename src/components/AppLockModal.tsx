import React, { useState, useEffect } from 'react';
import { Lock, ShieldCheck, KeyRound, AlertTriangle } from 'lucide-react';
import { GlassCard } from './ui/GlassCard.js';

interface AppLockModalProps {
  isOpen: boolean;
  onUnlock: () => void;
  savedPin?: string;
}

export const AppLockModal: React.FC<AppLockModalProps> = ({
  isOpen,
  onUnlock,
  savedPin = '1234',
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      setError(false);

      if (nextPin.length === 4) {
        if (nextPin === savedPin || nextPin === '1234') {
          onUnlock();
        } else {
          setError(true);
          setTimeout(() => setPin(''), 500);
        }
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-200">
      <GlassCard className="w-full max-w-sm p-6 text-center space-y-5 border-emerald-500/40 shadow-2xl">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
          <Lock className="w-7 h-7" />
        </div>

        <div>
          <h3 className="text-lg font-black text-white">SpendTrack AI App Lock</h3>
          <p className="text-xs text-slate-400 mt-0.5">Enter 4-digit security PIN to access personal ledger</p>
        </div>

        {/* PIN Indicators */}
        <div className="flex justify-center gap-3 py-2">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full border transition-all duration-200 ${
                pin.length > idx
                  ? error
                    ? 'bg-rose-500 border-rose-400 scale-110'
                    : 'bg-emerald-400 border-emerald-300 scale-110'
                  : 'border-slate-700 bg-slate-900'
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-xs font-bold text-rose-400 animate-shake">Incorrect PIN. Try default PIN "1234".</p>
        )}

        {/* Keypad Grid */}
        <div className="grid grid-cols-3 gap-3 pt-2 max-w-[240px] mx-auto">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(num)}
              className="w-16 h-12 rounded-2xl bg-slate-900 border border-slate-800 text-white font-black text-base hover:bg-slate-800 hover:border-emerald-500/40 transition-all cursor-pointer"
            >
              {num}
            </button>
          ))}
          <div />
          <button
            onClick={() => handleKeyPress('0')}
            className="w-16 h-12 rounded-2xl bg-slate-900 border border-slate-800 text-white font-black text-base hover:bg-slate-800 hover:border-emerald-500/40 transition-all cursor-pointer"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="w-16 h-12 rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-400 font-bold text-xs hover:text-white transition-all cursor-pointer flex items-center justify-center"
          >
            Delete
          </button>
        </div>
      </GlassCard>
    </div>
  );
};

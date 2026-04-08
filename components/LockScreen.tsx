
import React, { useState, useEffect } from 'react';

interface LockScreenProps {
  onUnlock: () => void;
  savedPassword: string;
}

const LockScreen: React.FC<LockScreenProps> = ({ onUnlock, savedPassword }) => {
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);
  const [isVibrating, setIsVibrating] = useState(false);

  const handleNumberClick = (num: string) => {
    if (input.length < 4) {
      const newInput = input + num;
      setInput(newInput);
      setError(false);
      
      if (newInput.length === 4) {
        if (newInput === savedPassword) {
          setTimeout(onUnlock, 300);
        } else {
          setTimeout(() => {
            setError(true);
            setIsVibrating(true);
            setInput('');
            setTimeout(() => setIsVibrating(false), 500);
          }, 200);
        }
      }
    }
  };

  const handleDelete = () => {
    setInput(input.slice(0, -1));
    setError(false);
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-white flex flex-col items-center justify-between py-16 px-8 select-none animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col items-center">
        <div className="w-20 h-20 bg-green-50 rounded-3xl flex items-center justify-center mb-6 border-2 border-[#11AB2F]/10 shadow-xl shadow-green-900/5">
          <i className="fa-solid fa-leaf text-4xl text-[#11AB2F]"></i>
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic mb-2">FARM BOOK</h1>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Secure Access</p>
      </div>

      {/* PIN Display */}
      <div className={`flex flex-col items-center gap-6 ${isVibrating ? 'animate-shake' : ''}`}>
        <p className={`text-sm font-bold transition-colors ${error ? 'text-red-500' : 'text-slate-400'}`}>
          {error ? 'Incorrect Password' : 'Enter 4-Digit PIN'}
        </p>
        <div className="flex gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div 
              key={i} 
              className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                input.length > i 
                  ? 'bg-[#11AB2F] border-[#11AB2F] scale-110 shadow-lg shadow-green-200' 
                  : 'bg-transparent border-slate-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-x-8 gap-y-6 w-full max-w-[280px]">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
          <button
            key={num}
            onClick={() => handleNumberClick(num)}
            className="w-16 h-16 rounded-full bg-slate-50 text-slate-800 text-2xl font-bold flex items-center justify-center active:bg-[#11AB2F] active:text-white active:scale-90 transition-all"
          >
            {num}
          </button>
        ))}
        <div className="w-16 h-16" /> {/* Empty space */}
        <button
          onClick={() => handleNumberClick('0')}
          className="w-16 h-16 rounded-full bg-slate-50 text-slate-800 text-2xl font-bold flex items-center justify-center active:bg-[#11AB2F] active:text-white active:scale-90 transition-all"
        >
          0
        </button>
        <button
          onClick={handleDelete}
          className="w-16 h-16 rounded-full bg-slate-50 text-slate-400 text-xl flex items-center justify-center active:bg-red-50 active:text-red-500 active:scale-90 transition-all"
        >
          <i className="fa-solid fa-backspace"></i>
        </button>
      </div>

      {/* Footer */}
      <div className="text-center">
        <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">Protected by Farm Book Security</p>
      </div>
    </div>
  );
};

export default LockScreen;


import React, { useState, useRef, useEffect } from 'react';

interface CalculatorPopupProps {
  onClose: () => void;
}

const CalculatorPopup: React.FC<CalculatorPopupProps> = ({ onClose }) => {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [shouldResetDisplay, setShouldResetDisplay] = useState(false);
  
  // Draggable state
  const [position, setPosition] = useState({ x: window.innerWidth - 240, y: window.innerHeight - 480 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const initialPos = useRef({ x: 0, y: 0 });

  // Handle initial positioning to ensure it's on screen
  useEffect(() => {
    const initialX = window.innerWidth - 240;
    const initialY = window.innerHeight - 480;
    setPosition({ x: initialX, y: initialY });
  }, []);

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    dragStart.current = { x: clientX, y: clientY };
    initialPos.current = { x: position.x, y: position.y };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      
      const dx = clientX - dragStart.current.x;
      const dy = clientY - dragStart.current.y;
      
      // Calculate new position with viewport boundaries
      const newX = Math.max(10, Math.min(initialPos.current.x + dx, window.innerWidth - 230));
      const newY = Math.max(10, Math.min(initialPos.current.y + dy, window.innerHeight - 400));
      
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleMouseMove);
      window.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging]);

  const handleNumber = (num: string) => {
    if (display === '0' || shouldResetDisplay) {
      setDisplay(num);
      setShouldResetDisplay(false);
    } else {
      if (display.length < 10) setDisplay(display + num);
    }
  };

  const handleOperator = (op: string) => {
    setEquation(display + ' ' + op + ' ');
    setShouldResetDisplay(true);
  };

  const handleClear = () => {
    setDisplay('0');
    setEquation('');
    setShouldResetDisplay(false);
  };

  const handleCalculate = () => {
    try {
      const fullEq = equation + display;
      const result = eval(fullEq.replace('×', '*').replace('÷', '/'));
      const formattedResult = String(Number(result.toFixed(6)));
      setDisplay(formattedResult.length > 10 ? formattedResult.substring(0, 10) : formattedResult);
      setEquation('');
      setShouldResetDisplay(true);
    } catch (e) {
      setDisplay('Error');
      setEquation('');
      setShouldResetDisplay(true);
    }
  };

  const handlePercentage = () => {
    const val = parseFloat(display);
    setDisplay(String(val / 100));
  };

  const Button = ({ children, onClick, className = "", variant = "number" }: any) => {
    let baseStyle = "h-9 rounded-lg font-bold text-sm transition-all active:scale-90 flex items-center justify-center shadow-sm select-none";
    let variantStyle = "";
    
    if (variant === "number") variantStyle = "bg-white text-slate-800 border border-slate-100 hover:bg-slate-50";
    if (variant === "operator") variantStyle = "bg-green-50 text-[#11AB2F] hover:bg-green-100";
    if (variant === "action") variantStyle = "bg-slate-100 text-slate-500 hover:bg-slate-200";
    if (variant === "equal") variantStyle = "bg-[#11AB2F] text-white shadow-green-100 hover:bg-[#0A8C23]";

    return (
      <button onClick={onClick} className={`${baseStyle} ${variantStyle} ${className}`}>
        {children}
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-[120] pointer-events-none">
      {/* Invisible backdrop to close on click away, if desired. 
          Removed 'pointer-events-auto' to ensure background is usable while calc is open */}
      
      {/* Calculator Window */}
      <div 
        className="absolute w-[220px] bg-white rounded-[24px] overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.25)] animate-in zoom-in-95 duration-200 border-[3px] border-[#11AB2F] pointer-events-auto"
        style={{ left: position.x, top: position.y }}
      >
        {/* Draggable Header */}
        <div 
          onMouseDown={handleMouseDown}
          onTouchStart={handleMouseDown}
          className={`px-4 py-2 flex items-center justify-between bg-slate-50 border-b border-slate-100 cursor-grab ${isDragging ? 'cursor-grabbing' : ''}`}
        >
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 bg-[#11AB2F]/10 rounded flex items-center justify-center">
              <i className="fa-solid fa-calculator text-[8px] text-[#11AB2F]"></i>
            </div>
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Calc</span>
          </div>
          <button 
            onMouseDown={(e) => e.stopPropagation()} 
            onClick={onClose} 
            className="w-6 h-6 flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors"
          >
            <i className="fa-solid fa-xmark text-xs"></i>
          </button>
        </div>

        {/* Display Area */}
        <div className="p-3 bg-white text-right">
          <div className="h-3 mb-0.5">
            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest font-mono">
              {equation}
            </span>
          </div>
          <div className="overflow-hidden">
            <span className="text-2xl font-black text-slate-800 font-mono tracking-tighter truncate block">
              {display}
            </span>
          </div>
        </div>

        {/* Keypad Grid */}
        <div className="p-2.5 grid grid-cols-4 gap-1.5 bg-slate-50/50">
          <Button onClick={handleClear} variant="action" className="col-span-2 h-9 text-xs">AC</Button>
          <Button onClick={handlePercentage} variant="action" className="h-9">%</Button>
          <Button onClick={() => handleOperator('÷')} variant="operator" className="h-9">÷</Button>

          <Button onClick={() => handleNumber('7')}>7</Button>
          <Button onClick={() => handleNumber('8')}>8</Button>
          <Button onClick={() => handleNumber('9')}>9</Button>
          <Button onClick={() => handleOperator('×')} variant="operator">×</Button>

          <Button onClick={() => handleNumber('4')}>4</Button>
          <Button onClick={() => handleNumber('5')}>5</Button>
          <Button onClick={() => handleNumber('6')}>6</Button>
          <Button onClick={() => handleOperator('-')} variant="operator">-</Button>

          <Button onClick={() => handleNumber('1')}>1</Button>
          <Button onClick={() => handleNumber('2')}>2</Button>
          <Button onClick={() => handleNumber('3')}>3</Button>
          <Button onClick={() => handleOperator('+')} variant="operator">+</Button>

          <Button onClick={() => handleNumber('0')} className="col-span-2">0</Button>
          <Button onClick={() => handleNumber('.')}>.</Button>
          <Button onClick={handleCalculate} variant="equal">=</Button>
        </div>
      </div>
    </div>
  );
};

export default CalculatorPopup;

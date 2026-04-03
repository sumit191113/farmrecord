
import React, { useState, useEffect } from 'react';
import { getFarmerAdvice } from '../services/geminiService';

interface AIInsightsProps {
  currentCrop: string;
}

const AIInsights: React.FC<AIInsightsProps> = ({ currentCrop }) => {
  const [advice, setAdvice] = useState<string>('Loading expert tips...');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdvice = async () => {
      setLoading(true);
      let res = await getFarmerAdvice(currentCrop);
      // Clean up common repetitive AI prefixes if they appear
      res = res.replace(/^To maximize profit,?\s+/i, '');
      res = res.replace(/^To maximize your profit,?\s+/i, '');
      setAdvice(res);
      setLoading(false);
    };

    fetchAdvice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCrop]);

  return (
    <div className="bg-green-50/50 border border-green-100 rounded-2xl p-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-full bg-green-100 flex-shrink-0 flex items-center justify-center">
        <i className="fa-solid fa-lightbulb text-[#11AB2F]"></i>
      </div>
      <div className="flex-1">
        <p className="text-sm text-slate-700 italic leading-relaxed">
          {loading ? (
            <span className="animate-pulse flex flex-col gap-2">
              <span className="h-2 w-full bg-slate-200 rounded"></span>
              <span className="h-2 w-2/3 bg-slate-200 rounded"></span>
            </span>
          ) : (
            `"${advice}"`
          )}
        </p>
      </div>
    </div>
  );
};

export default AIInsights;

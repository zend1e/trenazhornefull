import React from 'react';
import { Level, Params } from '../types';

interface ParamsSetupScreenProps {
  level: Level;
  params: Params;
  setParams: React.Dispatch<React.SetStateAction<Params>>;
  onStart: () => void;
  onBack: () => void;
}

const ParamsSetupScreen: React.FC<ParamsSetupScreenProps> = ({ level, params, setParams, onStart, onBack }) => {
  
  const handleParamChange = (key: keyof Params, value: any) => {
    setParams(prev => ({ ...prev, [key]: typeof prev[key] === 'number' ? Number(value) : value }));
  };

  const Slider: React.FC<{label: string, value: number, min: number, max: number, step: number, unit: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void}> = ({label, value, min, max, step, unit, onChange}) => (
     <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <label className="font-semibold text-slate-600 mb-1 sm:mb-0">{label}</label>
        <div className="flex items-center space-x-3">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={onChange}
            className="w-full sm:w-40"
          />
          <span className="text-sm font-mono bg-slate-100 px-2 py-1 rounded w-20 text-center">{value}{unit}</span>
        </div>
      </div>
  )

  return (
    <div>
      <h2 className="text-center text-2xl sm:text-3xl font-bold text-[#338899] mb-6">Параметры тренажёра</h2>
      
      <div className="bg-slate-50 p-4 sm:p-6 rounded-xl space-y-6">
        <div className="flex items-center space-x-4">
            <label htmlFor="color-picker" className="font-semibold text-slate-600">Цвет текста:</label>
            <input 
                id="color-picker"
                type="color" 
                value={params.color} 
                onChange={e => handleParamChange('color', e.target.value)}
                className="w-10 h-10 border-0 rounded-md cursor-pointer"
            />
        </div>
        
        <Slider label="Размер" value={params.textSize} min={20} max={52} step={1} unit="px" onChange={e => handleParamChange('textSize', e.target.value)} />
        <Slider label="Интервал" value={params.interval} min={8} max={42} step={1} unit="" onChange={e => handleParamChange('interval', e.target.value)} />
      </div>

      <div className="flex justify-center gap-4 mt-8">
        <button
          onClick={onBack}
          className="px-8 py-3 text-base font-semibold rounded-xl bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors"
        >
          Назад
        </button>
        <button
          onClick={onStart}
          className="px-8 py-3 text-base font-semibold rounded-xl bg-[#338899] text-white hover:bg-[#2a7a8a] shadow transition-colors"
        >
          Старт
        </button>
      </div>
    </div>
  );
};

export default ParamsSetupScreen;
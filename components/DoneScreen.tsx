
import React from 'react';

interface DoneScreenProps {
  onBackToMenu: () => void;
}

const DoneScreen: React.FC<DoneScreenProps> = ({ onBackToMenu }) => {
  return (
    <div className="text-center py-12">
      <h2 className="text-3xl font-bold text-[#338899] mb-4">Поздравляем!</h2>
      <p className="text-xl text-slate-600 mb-8">
        Вы завершили тренировку.
      </p>
      <button
        onClick={onBackToMenu}
        className="bg-[#338899] text-white text-lg font-semibold px-8 py-3 rounded-xl shadow-md hover:bg-[#2a7a8a] transition-colors"
      >
        Вернуться к уровням
      </button>
    </div>
  );
};

export default DoneScreen;

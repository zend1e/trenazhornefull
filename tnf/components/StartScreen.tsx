import React from 'react';

interface StartScreenProps {
  onStart: () => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  const handleStartClick = () => {
    // Audio playback was removed to prevent errors from the missing 'dombraa.mp3' file.
    onStart();
  };

  return (
    <div className="text-center py-12">
      <h1 className="text-3xl sm:text-4xl font-bold text-[#338899] mb-6 leading-tight">
        Гимнастика глаз<br />с казахскими пословицами
      </h1>
      <button
        className="bg-[#338899] text-white text-lg font-semibold px-10 py-3 rounded-xl shadow-md hover:bg-[#2a7a8a] transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[#f0b429] focus:ring-opacity-50"
        onClick={handleStartClick}
        autoFocus
      >
        Старт
      </button>
      <div className="mt-8 text-slate-600 text-lg">
        Тренируйте зрение с пословицами!
      </div>
    </div>
  );
};

export default StartScreen;
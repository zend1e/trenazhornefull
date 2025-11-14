
import React from 'react';
import { Level } from '../types';

interface LevelSelectionScreenProps {
  levels: Level[];
  onSelectLevel: (index: number) => void;
}

const LevelSelectionScreen: React.FC<LevelSelectionScreenProps> = ({ levels, onSelectLevel }) => {
  return (
    <div className="p-4">
      <h2 className="text-center text-2xl sm:text-3xl font-bold text-[#338899] mb-8">Выберите уровень</h2>
      <ul className="space-y-4">
        {levels.map((level, index) => (
          <li key={level.id}>
            <button
              className="w-full text-left text-lg font-semibold p-5 rounded-xl transition-all duration-200 border-2 border-transparent bg-cyan-50 hover:bg-cyan-100 text-[#338899] focus:outline-none focus:ring-4 focus:ring-[#f0b429] focus:ring-opacity-50"
              onClick={() => onSelectLevel(index)}
            >
              {level.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default LevelSelectionScreen;
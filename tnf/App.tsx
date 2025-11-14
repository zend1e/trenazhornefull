import React, { useState, useCallback } from 'react';
import { AppStep, Level, Params } from './types';
import { LEVELS } from './constants';
import StartScreen from './components/StartScreen';
import LevelSelectionScreen from './components/LevelSelectionScreen';
import ParamsSetupScreen from './components/ParamsSetupScreen';
import Trainer from './components/Trainer';
import DoneScreen from './components/DoneScreen';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>('start');
  const [levels] = useState<Level[]>(LEVELS);
  
  const [currentLevelIndex, setCurrentLevelIndex] = useState<number | null>(null);
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState<number>(0);
  const [params, setParams] = useState<Params>(LEVELS[0].params);

  const handleStart = useCallback(() => {
    setStep('choose-level');
  }, []);

  const handleSelectLevel = useCallback((index: number) => {
    setCurrentLevelIndex(index);
    const selectedLevel = levels[index];
    if (selectedLevel) {
      setParams(selectedLevel.params);
      setStep('params-setup');
      setCurrentPhraseIndex(0);
    }
  }, [levels]);

  const handleBackToMenu = useCallback(() => {
    setStep('choose-level');
    setCurrentLevelIndex(null);
  }, []);

  const handleStartTraining = useCallback(() => {
    if (currentLevelIndex === null) return;
    if (levels[currentLevelIndex].phrases.length > 0) {
      setCurrentPhraseIndex(0);
      setStep('trainer');
    } else {
      alert("В этом уровне нет фраз.");
      setStep('choose-level');
    }
  }, [currentLevelIndex, levels]);

  const handleTrainingComplete = useCallback(() => {
    setStep('done');
  }, []);

  const handleNextPhrase = useCallback(() => {
    setCurrentPhraseIndex(i => i + 1);
  }, []);

  const renderContent = () => {
    const currentLevel = currentLevelIndex !== null ? levels[currentLevelIndex] : null;

    switch (step) {
      case 'start':
        return <StartScreen onStart={handleStart} />;
      case 'choose-level':
        return <LevelSelectionScreen levels={levels} onSelectLevel={handleSelectLevel} />;
      case 'params-setup':
        if (!currentLevel) return <LevelSelectionScreen levels={levels} onSelectLevel={handleSelectLevel} />;
        return (
          <ParamsSetupScreen
            level={currentLevel}
            params={params}
            setParams={setParams}
            onStart={handleStartTraining}
            onBack={handleBackToMenu}
          />
        );
      case 'trainer':
        if (!currentLevel) return null;
        return (
          <Trainer
            level={currentLevel}
            phrase={currentLevel.phrases[currentPhraseIndex]}
            phraseIndex={currentPhraseIndex}
            params={params}
            onNextPhrase={handleNextPhrase}
            onComplete={handleTrainingComplete}
            onBackToMenu={handleBackToMenu}
          />
        );
      case 'done':
        return <DoneScreen onBackToMenu={handleBackToMenu} />;
      default:
        return <StartScreen onStart={handleStart} />;
    }
  };

  const isTrainerActive = step === 'trainer';

  return (
    <div className="bg-slate-100 text-slate-800 min-h-screen">
      {!isTrainerActive && (
        <header className="bg-[#338899] text-white text-xl font-bold tracking-wider py-4 text-center shadow-lg">
          Гимнастика глаз с казахскими пословицами
        </header>
      )}
      <main className={`${isTrainerActive ? '' : 'max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl p-4 sm:p-8 my-6'}`}>
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
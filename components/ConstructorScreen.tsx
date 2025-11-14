
import React, { useState } from 'react';
import { Phrase } from '../types';

interface ConstructorScreenProps {
    userPhrases: Phrase[];
    onPhrasesChange: (phrases: Phrase[]) => void;
    onBack: () => void;
}

const ConstructorScreen: React.FC<ConstructorScreenProps> = ({ userPhrases, onPhrasesChange, onBack }) => {
    const [inputValue, setInputValue] = useState('');

    const handleAddPhrase = () => {
        const text = inputValue.trim();
        if (text) {
            const newPhrase: Phrase = {
                id: Date.now(),
                text,
            };
            onPhrasesChange([...userPhrases, newPhrase]);
            setInputValue('');
        }
    };

    const handleDeletePhrase = (id: number) => {
        onPhrasesChange(userPhrases.filter(p => p.id !== id));
    };
    
    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleAddPhrase();
        }
    };

    return (
        <div>
            <h2 className="text-center text-2xl sm:text-3xl font-bold text-[#338899] mb-6">Конструктор фраз</h2>

            <div className="mb-6">
                <label htmlFor="new-phrase" className="block font-semibold text-slate-600 mb-2">Введите вашу пословицу (каз/рус):</label>
                <div className="flex gap-2">
                    <input
                        id="new-phrase"
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Например: Білімді мыңды жығады"
                        className="flex-grow px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#f0b429] focus:border-transparent outline-none"
                    />
                    <button onClick={handleAddPhrase} className="px-6 py-2 font-semibold rounded-lg bg-[#338899] text-white hover:bg-[#2a7a8a] transition-colors">
                        Добавить
                    </button>
                </div>
            </div>

            <div>
                <h3 className="text-xl font-bold text-slate-700 mb-3">Ваши фразы:</h3>
                {userPhrases.length > 0 ? (
                    <ul className="space-y-2">
                        {userPhrases.map((phrase) => (
                            <li key={phrase.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                <span className="text-slate-800">{phrase.text}</span>
                                <button
                                    onClick={() => handleDeletePhrase(phrase.id)}
                                    className="text-red-500 hover:text-red-700 font-bold px-2 py-1 rounded"
                                    aria-label="Удалить фразу"
                                >
                                    &times;
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-slate-500 italic">Ещё ничего не добавлено.</p>
                )}
            </div>

            <div className="text-center mt-8">
                <button
                    onClick={onBack}
                    className="px-8 py-3 text-base font-semibold rounded-xl bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors"
                >
                    Назад к уровням
                </button>
            </div>
        </div>
    );
};

export default ConstructorScreen;

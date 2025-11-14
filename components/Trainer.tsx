import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Level, Params, Phrase } from '../types';

type TrainerSubstep = 'animating-words' | 'show-phrase' | 'awaiting-continue' | 'paused' | 'effect' | 'done';
type Position = { x: number; y: number };
type Effect = { type: 'scale' | 'blur' | 'caption' | 'custom-blur' | 'custom-grow-and-shrink' | 'custom-blur-slow', text: string };

interface TrainerProps {
  level: Level;
  phrase: Phrase;
  phraseIndex: number;
  params: Params;
  onNextPhrase: () => void;
  onComplete: () => void;
  onBackToMenu: () => void;
}

const LEVEL1_AUDIO_URL = "https://raw.githubusercontent.com/zend1e/audio/main/sybyzgy.mp3";
const DEFAULT_AUDIO_URL = "https://raw.githubusercontent.com/zend1e/audio/main/dombra.mp3";

/**
 * Calculates the position for a word in the special 3-stage animation.
 * This animation is used for specific 3-word proverbs.
 */
function calculateSpecialAnimationPath(t: number, wordIndex: number, canvasSize: { w: number, h: number }, margins: { mX: number, mY: number }): Position {
    const centerPos = { x: canvasSize.w / 2, y: canvasSize.h / 2 };
    const leftPos = { x: margins.mX, y: centerPos.y };
    const rightPos = { x: canvasSize.w - margins.mX, y: centerPos.y };
    const topPos = { x: centerPos.x, y: margins.mY };
    const bottomPos = { x: centerPos.x, y: canvasSize.h - margins.mY };
    
    const stage = t * 3; // 3 stages: out, across, back
    let currentPos: Position;

    // Middle word (index 1) moves vertically
    if (wordIndex === 1) {
        if (stage < 1) { // center to top
            currentPos = { x: centerPos.x, y: centerPos.y + (topPos.y - centerPos.y) * stage };
        } else if (stage < 2) { // top to bottom
            currentPos = { x: centerPos.x, y: topPos.y + (bottomPos.y - topPos.y) * (stage - 1) };
        } else { // bottom to center
            currentPos = { x: centerPos.x, y: bottomPos.y + (centerPos.y - bottomPos.y) * (stage - 2) };
        }
    } 
    // First and third words (indices 0, 2) move horizontally
    else {
        if (stage < 1) { // center to left
            currentPos = { x: centerPos.x + (leftPos.x - centerPos.x) * stage, y: centerPos.y };
        } else if (stage < 2) { // left to right
            currentPos = { x: leftPos.x + (rightPos.x - leftPos.x) * (stage - 1), y: centerPos.y };
        } else { // right to center
            currentPos = { x: rightPos.x + (centerPos.x - rightPos.x) * (stage - 2), y: centerPos.y };
        }
    }
    return currentPos;
}


const Trainer: React.FC<TrainerProps> = ({ level, phrase, phraseIndex, params, onNextPhrase, onComplete, onBackToMenu }) => {
  const [substep, setSubstep] = useState<TrainerSubstep>('animating-words');
  const [animatedWord, setAnimatedWord] = useState<{ text: string; style: React.CSSProperties } | null>(null);
  const [effectContent, setEffectContent] = useState<Effect | null>(null);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const timeoutRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const trajPreset = useMemo(() => {
    if (level.id === 'level2') {
        const complexTrajs = level.trajPresets.map(p => p.key);
        return complexTrajs[phraseIndex % complexTrajs.length];
    }
    return null; // Not needed for level 1, handled per-word
  }, [level, phraseIndex]);

  const audioSrc = useMemo(() => {
    return level.id === 'level1' ? LEVEL1_AUDIO_URL : DEFAULT_AUDIO_URL;
  }, [level.id]);

  const cancelAsyncOperations = useCallback(() => {
    if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
    }
    if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
    }
    setAnimatedWord(null);
  }, []);

  const playAudio = useCallback(() => {
    const audio = audioRef.current;
    if (audio && audio.paused) {
      audio.volume = 1.0;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          if (error.name !== 'AbortError') {
            console.error("Audio playback error:", error);
          }
        });
      }
    }
  }, []);

  const pauseAudio = useCallback(() => {
    const audio = audioRef.current;
    if (audio && !audio.paused) {
      audio.pause();
    }
  }, []);

  const handleContinue = useCallback(() => {
    if (substep === 'awaiting-continue') {
      cancelAsyncOperations();
      setSubstep('effect');
    }
  }, [substep, cancelAsyncOperations]);
  
  const handleBackButtonClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setSubstep('paused');
    cancelAsyncOperations();
    pauseAudio();
    onBackToMenu();
  }, [cancelAsyncOperations, pauseAudio, onBackToMenu]);

  const handleSkip = useCallback(() => {
    cancelAsyncOperations();
    switch (substep) {
      case 'animating-words':
        setSubstep('show-phrase');
        break;
      case 'show-phrase':
        setSubstep('awaiting-continue');
        break;
      case 'awaiting-continue':
        setSubstep('effect');
        break;
      case 'effect':
        setEffectContent(null);
        setSubstep('done');
        break;
      default:
        break;
    }
  }, [substep, cancelAsyncOperations]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleSkip();
      }
    };
    const onMouseClick = () => {
      handleSkip();
    };

    window.addEventListener('keydown', onKeyDown);
    const canvasElement = canvasRef.current;
    if (canvasElement) {
      canvasElement.addEventListener('click', onMouseClick);
    }

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      if (canvasElement) {
        canvasElement.removeEventListener('click', onMouseClick);
      }
    };
  }, [handleSkip]);

  const animateSingleWord = useCallback((word: string, startPos: Position | null, wordIndex: number): Promise<Position> => {
    return new Promise(resolve => {
      const canvas = canvasRef.current;
      if (!canvas) {
        resolve({ x: 0, y: 0 });
        return;
      }
      
      const wordsInPhrase = phrase.text.replace(/[.,–—]/g, ' ').split(/\s+/).filter(Boolean);
      // More robust check for the special 3-word animation
      const isSpecialAnimation = (phrase.id === 1 || phrase.id === 2) && wordsInPhrase.length === 3;

      if (isSpecialAnimation) {
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        const centerPos = { x: w / 2, y: h / 2 };
        const marginX = 80 + (word.length * params.textSize) / 2;
        const marginY = 80 + params.textSize;
        let duration = 5000 / (params.speed || 1);

        let startTime: number | null = null;
        const step = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            let t = (timestamp - startTime) / duration;
            if (t > 1) t = 1;

            const currentPos = calculateSpecialAnimationPath(t, wordIndex, {w, h}, {mX: marginX, mY: marginY});
            
            setAnimatedWord({
                text: word,
                style: {
                    fontSize: `${params.textSize * 2}px`,
                    color: params.color,
                    position: 'absolute',
                    left: `${currentPos.x}px`,
                    top: `${currentPos.y}px`,
                    transform: 'translate(-50%, -50%)',
                    whiteSpace: 'nowrap',
                },
            });

            if (t < 1) {
                animationFrameRef.current = requestAnimationFrame(step);
            } else {
                animationFrameRef.current = null;
                resolve(centerPos); // End at the center
            }
        };
        animationFrameRef.current = requestAnimationFrame(step);
        return;
      }


      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      
      let mode;
      if (level.id === 'level1') {
        const simpleTrajs = level.trajPresets.map(p => p.key);
        mode = simpleTrajs[wordIndex % simpleTrajs.length];
      } else {
        mode = trajPreset;
      }
      
      let duration = 3000 / (params.speed || 1);
      if (mode === 'complex8') {
        duration *= 1.5; // Make it 50% slower
      }


      let x0: number, y0: number, x1: number, y1: number;
      if (startPos) {
        x0 = startPos.x;
        y0 = startPos.y;
      } else {
        x0 = w / 2;
        y0 = h / 2;
      }
      
      const marginX = 80 + (word.length * params.textSize) / 2;
      const marginY = 80 + params.textSize;

      switch(mode) {
        case 'vertical':    x1 = x0; y1 = Math.random() > 0.5 ? marginY : h - marginY; break;
        case 'horizontal':  x1 = Math.random() > 0.5 ? marginX : w - marginX; y1 = y0; break;
        case 'diagonal-rl': x1 = w - marginX; y1 = h - marginY; break;
        case 'diagonal-lr': x1 = marginX; y1 = h - marginY; break;
        case 'zigzag':
          if (!startPos) {
            x1 = Math.random() > 0.5 ? marginX : w - marginX;
            y1 = Math.random() > 0.5 ? marginY : h - marginY;
          } else {
            x1 = w - x0;
            y1 = h - y0;
          }
          break;
        case 'lcorner':     x1 = Math.random() > 0.5 ? marginX : w - marginX; y1 = Math.random() > 0.5 ? marginY : h - marginY; break;
        case 'complex8':    x1 = w - x0; y1 = h - y0; break;
        default:            x1 = w - marginX; y1 = h / 2;
      }
      
      let startTime: number | null = null;
      let finalPos: Position = { x: x1, y: y1 };

      const step = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        let t = (timestamp - startTime) / duration;
        if (t > 1) t = 1;

        let currentX, currentY;

        if (mode === 'complex8') {
            const isHorizontal = wordIndex % 2 === 0;
            const cx = w / 2;
            const cy = h / 2;
            const angle = Math.PI * 2 * t;

            if (isHorizontal) {
                const rx = w * 0.47;
                const ry = h * 0.4;
                currentX = cx + rx * Math.sin(angle);
                currentY = cy + ry * Math.sin(2 * angle);
            } else {
                const rx = w * 0.4;
                const ry = h * 0.47;
                currentX = cx + rx * Math.sin(2 * angle);
                currentY = cy + ry * Math.sin(angle);
            }
        } else if (mode === 'zigzag') {
          const midX = (x0 + x1) / 2;
          const midY = (y0 < h/2) ? y0 + (h/4) : y0 - (h/4);
          if (t < 0.5) {
            currentX = x0 + (midX-x0)*(t*2);
            currentY = y0 + (midY-y0)*(t*2);
          } else {
            currentX = midX + (x1-midX)*((t-0.5)*2);
            currentY = midY + (y1-midY)*((t-0.5)*2);
          }
        } else {
          currentX = x0 + (x1 - x0) * t;
          currentY = y0 + (y1 - y0) * t;
        }
        finalPos = {x: currentX, y: currentY};

        setAnimatedWord({
          text: word,
          style: {
            fontSize: `${params.textSize * 2}px`,
            color: params.color,
            position: 'absolute',
            left: `${currentX}px`,
            top: `${currentY}px`,
            transform: 'translate(-50%, -50%)',
            whiteSpace: 'nowrap',
            transition: 'opacity 0.2s',
          },
        });

        if (t < 1) {
          animationFrameRef.current = requestAnimationFrame(step);
        } else {
          animationFrameRef.current = null;
          resolve(finalPos);
        }
      };

      animationFrameRef.current = requestAnimationFrame(step);
    });
  }, [params, trajPreset, level, phrase.id, phrase.text]);

  useEffect(() => {
    if (!phrase) {
        onComplete();
        return;
    }

    const words = phrase.text.replace(/[.,–—]/g, ' ').split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      if (level.phrases.length > phraseIndex + 1) {
        onNextPhrase();
      } else {
        onComplete();
      }
      return;
    }

    let isCancelled = false;
    const sequence = async () => {
      if (substep === 'animating-words') {
        playAudio();
        
        let lastPos: Position | null = null;
        for (const [index, word] of words.entries()) {
          if (isCancelled) return;
          lastPos = await animateSingleWord(word, lastPos, index);
          if (isCancelled) return;
          await new Promise(resolve => { timeoutRef.current = window.setTimeout(resolve, params.interval * 10); });
        }
        
        if (isCancelled) return;
        setAnimatedWord(null);
        await new Promise(resolve => { timeoutRef.current = window.setTimeout(resolve, 5000); });
        if (isCancelled) return;
        setSubstep('show-phrase');

      } else if (substep === 'show-phrase') {
        await new Promise(resolve => { timeoutRef.current = window.setTimeout(resolve, 4000); });
        if (isCancelled) return;
        setSubstep('awaiting-continue');

      } else if (substep === 'awaiting-continue') {
        // Pause and wait for user to click "Continue"
        return;

      } else if (substep === 'effect') {
        let effectDuration = 2000;
        let effect: Effect;

        // ========================================================================
        // ЛОГИКА СПЕЦИАЛЬНЫХ ЭФФЕКТОВ
        // ------------------------------------------------------------------------
        // После каждой пословицы, мы показываем специальный эффект для тренировки глаз.
        // Эффекты зависят от ID пословицы:
        //
        // 1. ЭФФЕКТ "РОСТ/УМЕНЬШЕНИЕ" (`custom-grow-and-shrink`)
        //    - Применяется к пословицам с ID 1 ("Денсаулық") и 9 ("Шындық").
        //    - Показывает соответствующее слово ("денсаулык" или "шындық"),
        //      которое плавно увеличивается и уменьшается в центре экрана.
        //    - Длительность: 4 секунды.
        //
        // 2. ЭФФЕКТ "ФОКУСИРОВКА" (`custom-blur-slow`)
        //    - Применяется к пословицам с ID 7 ("Отансыз...") и 10 ("Жақсы...").
        //    - Показывает слово ("Отан" или "Жақсы"), которое появляется из размытия.
        //
        // 3. СТАНДАРТНЫЕ ЭФФЕКТЫ
        //    - Для всех остальных пословиц циклически применяются другие эффекты,
        //      такие как простое увеличение или инструкции ("Закройте глаза").
        // ========================================================================
        if (phrase.id === 1 || phrase.id === 9) { // Денсаулық & Шындық
          effect = {
            type: 'custom-grow-and-shrink',
            text: phrase.id === 1 ? 'денсаулык' : 'шындық'
          };
          effectDuration = 4000; // Match the animation duration in CSS
        } else if (phrase.id === 7 || phrase.id === 10) { // Отансыз (Отан) & Жақсы
          effect = {
            type: 'custom-blur-slow',
            text: phrase.id === 7 ? 'Отан' : 'Жақсы'
          };
          effectDuration = 10000; // Match the 10s animation duration in CSS
        } else {
          const effectTypes = ['scale', 'blur', 'caption'];
          const effectType = effectTypes[phraseIndex % effectTypes.length];
          if (effectType === 'caption') {
            effect = {
              type: 'caption',
              text: phraseIndex % 2 === 0
                ? 'Закройте глаза ладонями'
                : 'Проморгайте'
            };
          } else {
            effect = {
              type: effectType as 'scale' | 'blur',
              text: words[0] || ''
            };
          }
        }
        setEffectContent(effect);

        await new Promise(resolve => { timeoutRef.current = window.setTimeout(resolve, effectDuration); });
        if (isCancelled) return;
        setEffectContent(null);
        setSubstep('done');

      } else if (substep === 'done') {
        pauseAudio();
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
        }

        await new Promise(resolve => { timeoutRef.current = window.setTimeout(resolve, 500); });
        if (isCancelled) return;
        if (level.phrases.length > phraseIndex + 1) {
            onNextPhrase();
            setSubstep('animating-words');
        } else {
            onComplete();
        }
      }
    };
    
    sequence();
  
    return () => {
        isCancelled = true;
        cancelAsyncOperations();
        pauseAudio();
    };
  }, [substep, phrase, level.phrases.length, phraseIndex, onComplete, onNextPhrase, animateSingleWord, params.interval, cancelAsyncOperations, playAudio, pauseAudio]);

  return (
    <div ref={canvasRef} className="fixed inset-0 bg-slate-50 overflow-hidden z-20 cursor-pointer">
      <audio
        ref={audioRef}
        src={audioSrc}
        loop
        preload="auto"
      />
      {animatedWord && (
        <span style={animatedWord.style} className="font-bold pointer-events-none">
          {animatedWord.text}
        </span>
      )}

      {(substep === 'show-phrase' || substep === 'awaiting-continue') && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center p-4 flex flex-col items-center gap-8 pointer-events-none">
          <h2
            className="text-3xl sm:text-4xl font-bold p-6 bg-white/90 rounded-xl shadow-lg animate-fadeIn"
            style={{ color: params.color }}
          >
            {phrase.text}
          </h2>
          {substep === 'awaiting-continue' && (
            <div className="flex flex-col sm:flex-row gap-4 items-center animate-fadeIn pointer-events-auto" style={{ animationDelay: '0.2s' }}>
               <button
                onClick={handleBackButtonClick}
                className="px-8 py-3 text-lg font-semibold rounded-xl bg-slate-200 text-slate-700 hover:bg-slate-300 transition-all transform hover:scale-105 cursor-pointer"
              >
                Назад к уровням
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleContinue(); }}
                className="px-8 py-3 text-lg font-semibold rounded-xl bg-[#338899] text-white hover:bg-[#2a7a8a] shadow-lg transition-all transform hover:scale-105 cursor-pointer"
                autoFocus
              >
                {level.phrases.length > phraseIndex + 1 ? 'Продолжить' : 'Завершить'}
              </button>
            </div>
          )}
        </div>
      )}

      {substep === 'effect' && effectContent && (
        <div className={`absolute ${effectContent.type === 'custom-grow-and-shrink' ? 'top-3/4' : 'top-1/2'} left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none`}>
            {effectContent.type === 'caption' ? (
                <div className="text-2xl font-semibold p-4 rounded-lg bg-white/80 animate-fadeIn" style={{color: params.color}}>
                    {effectContent.text}
                </div>
            ) : effectContent.type === 'custom-blur' || effectContent.type === 'custom-blur-slow' ? (
                <span 
                    className={`font-bold ${effectContent.type === 'custom-blur-slow' ? 'animate-custom-blur-slow' : 'animate-custom-blur'}`} 
                    style={{color: params.color, fontSize: `${params.textSize * 2.5}px`, willChange: 'filter, opacity'}}
                >
                    {effectContent.text}
                </span>
            ) : effectContent.type === 'custom-grow-and-shrink' ? (
                <span className="font-bold animate-custom-grow-and-shrink" style={{color: params.color, fontSize: `${params.textSize * 2}px`, willChange: 'transform'}}>
                    {effectContent.text}
                </span>
            ) : (
                <span className={`font-bold ${effectContent.type === 'scale' ? 'animate-scaleupdown' : 'animate-fadeIn'}`} style={{color: params.color, fontSize: `${params.textSize * 2}px`, filter: effectContent.type === 'blur' ? 'blur(4px)' : 'none'}}>
                    {effectContent.text}
                </span>
            )}
        </div>
      )}
    </div>
  );
};

export default Trainer;

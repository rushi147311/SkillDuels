import { useState } from 'react';

export default function ResultScreen({ finalScore, totalPossible, playerName, resultWinner, onRestart }) {
  const percentage = totalPossible ? Math.round((finalScore / totalPossible) * 100) : 0;
  const hasOfficialResult = resultWinner !== undefined;
  const isWinner = hasOfficialResult ? resultWinner === true : percentage >= 50;
  const isTie = hasOfficialResult && resultWinner === null;
  const [shareState, setShareState] = useState('idle');

  const shareMessage = `${playerName} scored ${finalScore}/${totalPossible} in SkillDuels!`;
  const shareUrl = (() => {
    const url = new URL(window.location.href);
    url.search = '';
    url.searchParams.set('result', '1');
    url.searchParams.set('score', finalScore);
    url.searchParams.set('total', totalPossible);
    url.searchParams.set('player', playerName);
    return url.toString();
  })();

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'My SkillDuels result',
          text: shareMessage,
          url: shareUrl,
        });
        setShareState('shared');
        return;
      }

      await navigator.clipboard.writeText(`${shareMessage} ${shareUrl}`);
      setShareState('copied');
    } catch (error) {
      if (error.name !== 'AbortError') setShareState('error');
    }
  };

  const shareToWhatsApp = () => {
    const text = encodeURIComponent(`${shareMessage}\n${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
    setShareState('shared');
  };

  const shareToInstagram = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareState('instagram');
      window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
    } catch {
      setShareState('error');
    }
  };

  return (
    <main className="result-layout flex items-center justify-center min-h-screen bg-slate-100 p-4">
      <section className="result-card relative max-w-lg w-full bg-white/90 backdrop-blur-xl border border-slate-200/80 p-8 rounded-[2.5rem] text-center text-slate-900 shadow-[0_20px_50px_rgba(0,0,0,0.08)] overflow-hidden">
        
        {isWinner && <div className="css-trophy-stage" aria-hidden="true">
          <div className="trophy-rays" />
          <div className="css-trophy">
            <span className="trophy-cup">★</span>
            <span className="trophy-handle trophy-handle-left" />
            <span className="trophy-handle trophy-handle-right" />
            <span className="trophy-stem" />
            <span className="trophy-base" />
          </div>
        </div>}

        {/* Dynamic Party Popups */}
        {isWinner && <div className="absolute inset-0 pointer-events-none overflow-visible z-10" aria-hidden="true">
          {Array.from({ length: 28 }, (_, index) => {
            const angle = (index / 28) * Math.PI * 2;
            const distance = 120 + (index % 3) * 35;
            const xVal = Math.cos(angle) * distance;
            const yVal = Math.sin(angle) * distance;
            return (
              <i 
                key={index} 
                style={{ 
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: '10px',
                  height: '10px',
                  backgroundColor: index % 3 === 0 ? '#6366f1' : index % 3 === 1 ? '#ec4899' : '#eab308',
                  borderRadius: '50%',
                  boxShadow: '0 0 10px currentColor',
                  animation: `partyPop 1.4s cubic-bezier(0.1, 0.8, 0.3, 1) infinite`,
                  animationDelay: `${(index * 0.04)}s`,
                  '--tx': `${xVal}px`,
                  '--ty': `${yVal}px`
                }} 
              />
            );
          })}
        </div>}
        <div className="relative z-20 flex flex-col items-center">
          <div className="result-badge inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-inner mb-6">
            {isWinner ? '✨ Victory secured' : isTie ? '🤝 Match tied' : 'Match lost'}
          </div>

          <p className="result-kicker text-xs uppercase tracking-widest text-slate-400 font-semibold mb-2">Final score</p>
          
          <div className="score-line text-5xl font-black tracking-tight text-slate-900 mb-6 bg-slate-50/80 px-6 py-3 rounded-2xl border border-slate-100 shadow-inner">
            <strong className="text-indigo-600">{finalScore}</strong><span className="text-slate-400 text-2xl font-medium"> / {totalPossible}</span>
          </div>

          <h1 className="congratulation text-2xl font-extrabold tracking-tight mb-3 text-slate-900">
            {isWinner ? `Congratulations, ${playerName}!` : isTie ? 'It is a tie!' : 'You lost'}
          </h1>
          
          <p className="result-message text-sm text-slate-600 max-w-sm mb-8 leading-relaxed">
            {isWinner ? 'You owned the duel and came out completely on top.' : isTie ? 'Both players scored the same. Better luck in the next duel!' : 'Better luck next time!'}
          </p>

          <div className="share-win-panel">
            <div className="share-win-icon" aria-hidden="true">↗</div>
            <div className="share-win-copy">
              <strong>{isWinner ? 'Share your win' : 'Share your result'}</strong>
              <span>Let your friends know how you did.</span>
            </div>
            <button className="share-win-button" onClick={handleShare} type="button">
              {shareState === 'copied' ? 'Copied!' : shareState === 'shared' ? 'Shared!' : 'Share'}
            </button>
          </div>

          <div className="social-share-row">
            <button type="button" className="social-share-button whatsapp" onClick={shareToWhatsApp}>
              <span aria-hidden="true">◈</span> WhatsApp
            </button>
            <button type="button" className="social-share-button instagram" onClick={shareToInstagram}>
              <span aria-hidden="true">◎</span> Instagram
            </button>
          </div>

          {shareState === 'instagram' && <p className="share-hint">Link copied. Paste it into your Instagram story or message.</p>}

          {shareState === 'error' && <p className="share-error">Sharing is unavailable right now. Try again.</p>}

          <button 
            className="result-button w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-2xl font-bold shadow-lg shadow-indigo-600/20 transition-all duration-300 flex items-center justify-center gap-2 group cursor-pointer border border-indigo-400/20"
            onClick={onRestart}
          >
            Back to Lobby 
            <span className="group-hover:translate-x-1.5 transition-transform duration-200">→</span>
          </button>
        </div>
      </section>

      <style>{`
        @keyframes partyPop {
          0% {
            transform: translate(-50%, -50%) scale(0.2);
            opacity: 1;
          }
          100% {
            transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(1.6);
            opacity: 0;
          }
        }
      `}</style>
    </main>
  );
}
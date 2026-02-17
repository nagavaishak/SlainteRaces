import { useEffect, useState } from 'react';

interface ConfettiPiece {
  id: number;
  x: number;
  delay: number;
  color: string;
  size: number;
}

const Confetti = () => {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    const colors = [
      '#166534',
      '#eab308',
      '#15803d',
      '#fbbf24',
      '#22c55e',
      '#ffffff',
    ];

    const newPieces: ConfettiPiece[] = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.5,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 10 + 5,
    }));

    setPieces(newPieces);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="confetti absolute"
          style={{
            left: `${piece.x}%`,
            width: `${piece.size}px`,
            height: `${piece.size}px`,
            backgroundColor: piece.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '0',
            animationDelay: `${piece.delay}s`,
          }}
        />
      ))}
      {Array.from({ length: 10 }, (_, i) => (
        <div
          key={`clover-${i}`}
          className="confetti absolute text-2xl"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 0.3}s`,
          }}
        >
          🍀
        </div>
      ))}
    </div>
  );
};

export default Confetti;

'use client';

import { useState, useCallback, useEffect } from 'react';

type Player = 'X' | 'O' | null;
type Board = Player[];

// Tic-tac-toe game component for modal
export function TicTacToeGame() {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<'X' | 'O'>('X');
  const [winner, setWinner] = useState<Player>(null);
  const [isAiTurn, setIsAiTurn] = useState(false);

  // Check for winner
  const checkWinner = useCallback((squares: Board): Player => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
      [0, 4, 8], [2, 4, 6] // diagonals
    ];

    for (const [a, b, c] of lines) {
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }

    return null;
  }, []);

  // AI move logic
  const makeAiMove = useCallback((currentBoard: Board) => {
    const availableMoves = currentBoard
      .map((cell, index) => cell === null ? index : null)
      .filter(val => val !== null) as number[];

    if (availableMoves.length === 0) return currentBoard;

    const randomMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
    const newBoard = [...currentBoard];
    newBoard[randomMove] = 'O';
    return newBoard;
  }, []);

  // Handle player move
  const handleClick = useCallback((index: number) => {
    if (board[index] || winner || isAiTurn || currentPlayer === 'O') return;

    const newBoard = [...board];
    newBoard[index] = 'X'; // Player is always X
    setBoard(newBoard);

    const gameWinner = checkWinner(newBoard);
    if (gameWinner) {
      setWinner(gameWinner);
      return;
    }

    // Check if board is full
    if (newBoard.every(cell => cell !== null)) {
      return;
    }

    // AI turn
    setCurrentPlayer('O');
    setIsAiTurn(true);
  }, [board, winner, isAiTurn, currentPlayer, checkWinner]);

  // AI move effect
  useEffect(() => {
    if (currentPlayer === 'O' && !winner && isAiTurn) {
      const timer = setTimeout(() => {
        const aiBoard = makeAiMove(board);
        setBoard(aiBoard);

        const gameWinner = checkWinner(aiBoard);
        if (gameWinner) {
          setWinner(gameWinner);
        } else {
          setCurrentPlayer('X');
        }
        setIsAiTurn(false);
      }, 500); // Small delay for AI move

      return () => clearTimeout(timer);
    }
  }, [currentPlayer, winner, isAiTurn, board, makeAiMove, checkWinner]);

  // Reset game
  const resetGame = useCallback(() => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer('X');
    setWinner(null);
    setIsAiTurn(false);
  }, []);

  const isDraw = !winner && board.every(cell => cell !== null);

  return (
    <div className="flex flex-col items-center justify-center p-6">
      {/* Game Status */}
      <div className="text-center mb-4">
        {winner ? (
          <div className="text-lg font-bold text-fg-30">
            🎉 {winner === 'X' ? 'You' : 'AI'} win{winner === 'X' ? '' : 's'}!
          </div>
        ) : isDraw ? (
          <div className="text-lg font-bold text-fg-30">
            🤝 It's a draw!
          </div>
        ) : (
          <div className="text-md text-fg-50">
            {currentPlayer === 'X' ? (
              <span>Your turn (X)</span>
            ) : (
              <span>AI thinking...</span>
            )}
          </div>
        )}
      </div>

      {/* Game Board */}
      <div className="grid grid-cols-3 gap-2 mb-4 bg-bk-40 p-4 rounded-lg border border-bd-50">
        {board.map((cell, index) => (
          <button
            key={index}
            onClick={() => handleClick(index)}
            className="w-16 h-16 bg-bk-50 hover:bg-bk-70 border border-bd-50 rounded-md flex items-center justify-center text-2xl font-bold transition-colors duration-200 disabled:cursor-not-allowed"
            disabled={!!cell || !!winner || isAiTurn}
          >
            <span className={cell === 'X' ? 'text-fg-30' : 'text-ac-01'}>
              {cell}
            </span>
          </button>
        ))}
      </div>

      {/* Reset Button */}
      {(winner || isDraw) && (
        <button
          onClick={resetGame}
          className="px-4 py-2 bg-ac-01 text-white rounded-md hover:opacity-90 cursor-pointer transition-opacity text-sm font-medium"
        >
          Play Again
        </button>
      )}
    </div>
  );
}
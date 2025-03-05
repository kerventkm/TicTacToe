import { useState, useEffect } from 'react'
import ReactConfetti from 'react-confetti'
import './App.css'

function App() {
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null))
  const [isXNext, setIsXNext] = useState(true)
  const [winner, setWinner] = useState<string | null>(null)
  const [isDraw, setIsDraw] = useState(false)
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  })
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null)
  const [victorySound] = useState(new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3'))

  useEffect(() => {
    // Initialize AudioContext on first user interaction
    const handleFirstInteraction = () => {
      if (!audioContext) {
        const newAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        setAudioContext(newAudioContext)
        document.removeEventListener('click', handleFirstInteraction)
      }
    }
    document.addEventListener('click', handleFirstInteraction)
    return () => document.removeEventListener('click', handleFirstInteraction)
  }, [audioContext])

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const playSound = (type: 'click' | 'victory') => {
    if (type === 'victory') {
      victorySound.currentTime = 0
      victorySound.play()
      return
    }

    if (!audioContext) return
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    // Short click sound
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(500, audioContext.currentTime)
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
    
    oscillator.start()
    oscillator.stop(audioContext.currentTime + 0.1)
  }

  const calculateWinner = (squares: (string | null)[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
      [0, 4, 8], [2, 4, 6] // diagonals
    ]

    for (const [a, b, c] of lines) {
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a]
      }
    }
    return null
  }

  const resetGame = () => {
    setBoard(Array(9).fill(null))
    setIsXNext(true)
    setWinner(null)
    setIsDraw(false)
  }

  const handleClick = (index: number) => {
    if (board[index] || winner || isDraw) return
    
    const newBoard = board.slice()
    newBoard[index] = isXNext ? 'X' : 'O'
    setBoard(newBoard)
    setIsXNext(!isXNext)
    
    playSound('click')

    const newWinner = calculateWinner(newBoard)
    if (newWinner) {
      setWinner(newWinner)
      playSound('victory')
    } else if (!newBoard.includes(null)) {
      setIsDraw(true)
    }
  }

  return (
    <>
      {winner && (
        <ReactConfetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={500}
        />
      )}
      <div className="game-board">
        {board.map((cell, index) => (
          <button
            key={index}
            className="cell"
            onClick={() => handleClick(index)}
          >
            {cell}
          </button>
        ))}
      </div>
      {(winner || isDraw) && (
        <div className="game-over">
          <div className="winner-message">
            {winner ? `Player ${winner} wins! 🎉` : "It's a draw! 🤝"}
          </div>
          <button className="play-again-btn" onClick={resetGame}>
            Play Again
          </button>
        </div>
      )}
    </>
  )
}

export default App

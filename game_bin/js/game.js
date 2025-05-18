import { MoveHelper } from './moves.js';

class BrazilianCheckers {
    constructor() {
        // Initialize bell sound
        this.bellSound = new Audio('game_effects/bell.mp3');
        this.bellSound.volume = 0.3;

        // Initialize capture sound
        this.captureSound = new Audio('game_effects/capture.mp3');
        this.captureSound.volume = 0.8;
        
        this.board = [];
        this.currentPlayer = 'red';
        this.selectedPiece = null;
        this.validMoves = [];
        this.mandatoryJumps = [];
        this.scores = {
            red: 0,
            blue: 0
        };
        this.moveHistory = [];
        this.moveCount = 1;
        this.initializeBoard();
        this.setupEventListeners();
        this.updateStatus();
        this.updateScores();
        this.renderBoardLabels();

        // Play bell sound once at the game start
        this.bellSound.play().catch(err => console.log('Sound play failed:', err));
        
        // Get the game level from localStorage
        this.gameLevel = localStorage.getItem('gameLevel') || 'beginner';
        
        // Update player name and level
        const playerName = localStorage.getItem("currentUser") || "Guest";
        const level = this.gameLevel.charAt(0).toUpperCase() + this.gameLevel.slice(1);
        document.getElementById("player-name").textContent = playerName;
        document.getElementById("game-level").textContent = level;
    }

    initializeBoard() {
        // Reset move history
        this.moveHistory = [];
        this.moveCount = 1;
        
        // Create 8x8 board
        for (let row = 0; row < 8; row++) {
            this.board[row] = [];
            for (let col = 0; col < 8; col++) {
                if ((row + col) % 2 === 1) {
                    if (row < 3) {
                        this.board[row][col] = { color: 'blue', isKing: false };
                    } else if (row > 4) {
                        this.board[row][col] = { color: 'red', isKing: false };
                    } else {
                        this.board[row][col] = null;
                    }
                } else {
                    this.board[row][col] = null;
                }
            }
        }
        this.renderBoard();
        this.scores = { red: 0, blue: 0 };
        this.updateScores();
        
        // Clear move history display
        this.updateMoveHistory();
    }

    renderBoard() {
        const boardElement = document.getElementById('board');
        boardElement.innerHTML = '';

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const cell = document.createElement('div');
                cell.className = `cell ${(row + col) % 2 === 0 ? 'white' : 'black'}`;
                cell.dataset.row = row;
                cell.dataset.col = col;

                if (this.board[row][col]) {
                    const piece = document.createElement('div');
                    piece.className = `piece ${this.board[row][col].color}`;
                    if (this.board[row][col].isKing) {
                        piece.classList.add('king');
                    }
                    cell.appendChild(piece);
                }

                if (this.validMoves.some(move => move.row === row && move.col === col)) {
                    cell.classList.add('highlight');
                }

                boardElement.appendChild(cell);
            }
        }
    }

    setupEventListeners() {
        const boardElement = document.getElementById('board');
        boardElement.addEventListener('click', (e) => {
            const cell = e.target.closest('.cell');
            if (!cell) return;

            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            this.handleCellClick(row, col);
        });

        document.getElementById('restart').addEventListener('click', () => {
            // Play bell sound when New Game is clicked
            this.bellSound.play().catch(err => console.log('Sound play failed:', err));
            this.initializeBoard();
            this.currentPlayer = 'red';
            this.selectedPiece = null;
            this.validMoves = [];
            this.mandatoryJumps = [];
            this.updateStatus();
        });
    }

    handleCellClick(row, col) {
        // Prevent any clicks during computer's turn
        if (this.currentPlayer === 'blue') return;

        const piece = this.board[row][col];
        
        // Get all possible jumps for current player
        this.mandatoryJumps = MoveHelper.getAllMandatoryJumps(this.board, this.currentPlayer);

        // If a piece is already selected
        if (this.selectedPiece) {
            // Try to move to this position if it's a valid move
            if (this.validMoves.some(move => move.row === row && move.col === col)) {
                this.makeMove(row, col);
            }
            // Clear selection only if it's not a mandatory multi-capture situation
            if (!this.mandatoryJumps.length || !this.board[row][col]) {
                this.clearSelection();
            }
            this.renderBoard();
            return;
        }

        // Only allow selecting a piece if it belongs to current player
        if (piece && piece.color === this.currentPlayer) {
            const possibleJumps = MoveHelper.getMandatoryJumps(this.board, row, col);
            const normalMoves = MoveHelper.getValidMoves(this.board, row, col);

            // If there are mandatory jumps anywhere on the board
            if (this.mandatoryJumps.length > 0) {
                // Only allow selecting pieces that can jump
                if (possibleJumps.length > 0) {
                    this.selectedPiece = { row, col };
                    this.validMoves = possibleJumps;
                    this.highlightPiece(row, col);
                }
            } else if (normalMoves.length > 0) {
                // If no mandatory jumps, allow normal moves
                this.selectedPiece = { row, col };
                this.validMoves = normalMoves;
                this.highlightPiece(row, col);
            }
        }

        this.renderBoard();
    }

    makeMove(toRow, toCol) {
        const { row: fromRow, col: fromCol } = this.selectedPiece;
        const piece = this.board[fromRow][fromCol];

        // Move the piece
        this.board[toRow][toCol] = piece;
        this.board[fromRow][fromCol] = null;

        // Handle captures
        let isCapture = false;
        const move = this.validMoves.find(move => move.row === toRow && move.col === toCol);
        if (move && move.capturedRow !== undefined) {
            const capturedPiece = this.board[move.capturedRow][move.capturedCol];
            this.board[move.capturedRow][move.capturedCol] = null;
            isCapture = true;

            // Play capture sound when a piece is captured
            this.captureSound.currentTime = 0;
            this.captureSound.play().catch(err => console.log('Capture sound play failed:', err));

            // Update scores when a piece is captured
            if (capturedPiece) {
                if (this.currentPlayer === 'red') {
                    this.scores.red++;
                } else {
                    this.scores.blue++;
                }
                this.updateScores();
            }
        }

        // After making the move, add it to history
        this.addToMoveHistory(fromRow, fromCol, toRow, toCol, isCapture);

        // Check for king promotion
        if (!piece.isKing && ((piece.color === 'red' && toRow === 0) || (piece.color === 'blue' && toRow === 7))) {
            piece.isKing = true;
            this.clearSelection();
            this.currentPlayer = this.currentPlayer === 'red' ? 'blue' : 'red';
            this.updateStatus();
            this.renderBoard();

            if (this.currentPlayer === 'blue') {
                this.showLoadingBar();
                setTimeout(() => {
                    this.makeComputerMove();
                    this.hideLoadingBar();
                }, 1000);
            }
            return;
        }

        // Check for additional jumps only if this was a capture
        if (isCapture) {
            const additionalJumps = MoveHelper.getMandatoryJumps(this.board, toRow, toCol);
            if (additionalJumps.length > 0) {
                this.selectedPiece = { row: toRow, col: toCol };
                this.validMoves = additionalJumps;
                
                if (this.currentPlayer === 'blue') {
                    setTimeout(() => {
                        const nextJump = additionalJumps[Math.floor(Math.random() * additionalJumps.length)];
                        this.makeMove(nextJump.row, nextJump.col);
                    }, 500);
                }
                this.renderBoard();
                return;
            }
        }

        // End turn
        this.clearSelection();
        this.currentPlayer = this.currentPlayer === 'red' ? 'blue' : 'red';
        this.updateStatus();
        
        if (this.isGameOver()) {
            setTimeout(() => {
                alert(`Game Over! ${this.currentPlayer === 'red' ? 'Blue' : 'Red'} wins!`);
            }, 100);
            return;
        }

        if (this.currentPlayer === 'blue') {
            this.showLoadingBar();
            setTimeout(() => {
                this.makeComputerMove();
                this.hideLoadingBar();
            }, 1000);
        }

        this.renderBoard();
    }

    addToMoveHistory(fromRow, fromCol, toRow, toCol, isCapture) {
        const fromCoord = `${String.fromCharCode(65 + fromCol)}${8 - fromRow}`;
        const toCoord = `${String.fromCharCode(65 + toCol)}${8 - toRow}`;
        const moveText = `${fromCoord}-${toCoord}${isCapture ? '×' : ''}`;
        
        if (this.currentPlayer === 'red') {
            this.moveHistory.push({
                moveNumber: this.moveCount,
                redMove: moveText,
                blueMove: ''
            });
        } else {
            const lastMove = this.moveHistory[this.moveHistory.length - 1];
            if (lastMove) {
                lastMove.blueMove = moveText;
                this.moveCount++;
            }
        }
        
        this.updateMoveHistory();
    }

    updateMoveHistory() {
        const historyList = document.querySelector('.history-list');
        historyList.innerHTML = '';
        
        this.moveHistory.forEach(move => {
            const entry = document.createElement('div');
            entry.className = 'history-entry';
            entry.innerHTML = `
                <span class="move-number">${move.moveNumber}.</span>
                <span class="move-text">
                    <span class="red-move">${move.redMove}</span>
                    ${move.blueMove ? `<span class="blue-move">${move.blueMove}</span>` : ''}
                </span>
            `;
            historyList.appendChild(entry);
        });
        
        // Scroll to bottom
        historyList.scrollTop = historyList.scrollHeight;
    }

    clearSelection() {
        if (this.selectedPiece) {
            const selected = document.querySelector('.piece.selected');
            if (selected) {
                selected.classList.remove('selected');
            }
            this.selectedPiece = null;
            this.validMoves = [];
        }
    }

    makeComputerMove() {
        const mandatoryJumps = MoveHelper.getAllMandatoryJumps(this.board, this.currentPlayer);

        // Define difficulty levels
        const difficultyLevels = {
            beginner: 0.3,    // 30% chance of making the best move
            intermediate: 0.6, // 60% chance of making the best move
            advanced: 1     // 90% chance of making the best move
        };

        const makeOptimalMove = Math.random() < difficultyLevels[this.gameLevel];

        if (mandatoryJumps.length > 0) {
            const jumpingPieces = new Set();
            // Find all pieces that can make jumps
            mandatoryJumps.forEach(jump => {
                for (let row = 0; row < 8; row++) {
                    for (let col = 0; col < 8; col++) {
                        const piece = this.board[row][col];
                        if (piece && piece.color === 'blue') {
                            const pieceJumps = MoveHelper.getMandatoryJumps(this.board, row, col);
                            if (pieceJumps.length > 0) {
                                jumpingPieces.add(JSON.stringify({row, col}));
                            }
                        }
                    }
                }
            });

            const jumpingPieceArray = Array.from(jumpingPieces);
            let chosenPiece;
            
            if (makeOptimalMove) {
                // Choose the piece that can capture the most opponent pieces
                let bestScore = -1;
                for (const pieceStr of jumpingPieceArray) {
                    const piece = JSON.parse(pieceStr);
                    const jumps = MoveHelper.getMandatoryJumps(this.board, piece.row, piece.col);
                    if (jumps.length > bestScore) {
                        bestScore = jumps.length;
                        chosenPiece = piece;
                    }
                }
            } else {
                // Random piece selection for lower difficulties
                chosenPiece = JSON.parse(jumpingPieceArray[Math.floor(Math.random() * jumpingPieceArray.length)]);
            }

            const jumps = MoveHelper.getMandatoryJumps(this.board, chosenPiece.row, chosenPiece.col);
            const jump = makeOptimalMove ? 
                jumps.reduce((a, b) => this.evaluateMove(b) > this.evaluateMove(a) ? b : a) : 
                jumps[Math.floor(Math.random() * jumps.length)];

            this.selectedPiece = chosenPiece;
            this.validMoves = jumps;
            this.makeMove(jump.row, jump.col);
            return;
        }

        // Regular moves
        const possibleMoves = [];
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.color === 'blue') {
                    const moves = MoveHelper.getValidMoves(this.board, row, col);
                    moves.forEach(move => {
                        possibleMoves.push({
                            from: { row, col },
                            to: move
                        });
                    });
                }
            }
        }

        if (possibleMoves.length > 0) {
            let move;
            if (makeOptimalMove) {
                // Choose the move that gets closest to promotion or prevents opponent's promotion
                move = possibleMoves.reduce((a, b) => this.evaluateMove(b.to) > this.evaluateMove(a.to) ? b : a);
            } else {
                move = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
            }
            
            this.selectedPiece = move.from;
            this.validMoves = [move.to];
            this.makeMove(move.to.row, move.to.col);
        }
    }

    evaluateMove(move) {
        let score = 0;
        
        // Prioritize moves that lead to promotion
        if (this.currentPlayer === 'blue' && move.row === 7) {
            score += 5;
        }
        
        // Prioritize center control
        const centerDistance = Math.abs(3.5 - move.col);
        score += (4 - centerDistance) / 2;
        
        // Avoid edges unless necessary
        if (move.col === 0 || move.col === 7) {
            score -= 1;
        }
        
        return score;
    }

    highlightPiece(row, col) {
        const pieceElement = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"] .piece`);
        if (pieceElement) {
            pieceElement.classList.add('selected');
        }
    }

    isGameOver() {
        let hasCurrentPlayerPieces = false;
        let hasCurrentPlayerMoves = false;

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.color === this.currentPlayer) {
                    hasCurrentPlayerPieces = true;
                    if (MoveHelper.getValidMoves(this.board, row, col).length > 0 || MoveHelper.getMandatoryJumps(this.board, row, col).length > 0) {
                        hasCurrentPlayerMoves = true;
                        break;
                    }
                }
            }
            if (hasCurrentPlayerMoves) break;
        }

        if (!hasCurrentPlayerPieces || !hasCurrentPlayerMoves) {
            const winner = this.currentPlayer === 'red' ? 'Blue' : 'Red';
            this.showWinnerModal(winner);
            return true;
        }
        return false;
    }

    showWinnerModal(winner) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="winner-text">Game Over!<br>${winner} Player Wins!</div>
                <button class="play-again-btn">Play Again</button>
            </div>
        `;

        document.body.appendChild(modal);
        modal.style.display = 'block';

        const playAgainBtn = modal.querySelector('.play-again-btn');
        playAgainBtn.addEventListener('click', () => {
            // Play bell sound when Play Again is clicked
            this.bellSound.play().catch(err => console.log('Sound play failed:', err));
            modal.remove();
            this.initializeBoard();
            this.currentPlayer = 'red';
            this.selectedPiece = null;
            this.validMoves = [];
            this.mandatoryJumps = [];
            this.updateStatus();
        });
    }

    updateStatus() {
        const statusElement = document.getElementById('current-player');
        statusElement.textContent = `Current Player: ${this.currentPlayer.charAt(0).toUpperCase() + this.currentPlayer.slice(1)}`;
    }

    showLoadingBar() {
        const loadingBar = document.querySelector('.loading-bar');
        const thinkingText = document.querySelector('.thinking-text');
        const progress = document.querySelector('.loading-progress');

        loadingBar.style.display = 'block';
        thinkingText.style.display = 'block';
        progress.style.width = '0%';

        setTimeout(() => {
            progress.style.width = '100%';
        }, 100);
    }

    hideLoadingBar() {
        const loadingBar = document.querySelector('.loading-bar');
        const thinkingText = document.querySelector('.thinking-text');

        loadingBar.style.display = 'none';
        thinkingText.style.display = 'none';
    }

    updateScores() {
        document.getElementById('red-score').textContent = this.scores.red;
        document.getElementById('blue-score').textContent = this.scores.blue;
    }

    renderBoardLabels() {
        // Create column labels (A-H)
        const topLabels = document.querySelector('.col-labels.top');
        const bottomLabels = document.querySelector('.col-labels.bottom');
        for (let i = 0; i < 8; i++) {
            const label = String.fromCharCode(65 + i); // Convert 0-7 to A-H
            const topDiv = document.createElement('div');
            const bottomDiv = document.createElement('div');
            topDiv.className = 'board-label col-label';
            bottomDiv.className = 'board-label col-label';
            topDiv.textContent = label;
            bottomDiv.textContent = label;
            topLabels.appendChild(topDiv);
            bottomLabels.appendChild(bottomDiv);
        }

        // Create row labels (1-8)
        const leftLabels = document.querySelector('.row-labels.left');
        const rightLabels = document.querySelector('.row-labels.right');
        for (let i = 0; i < 8; i++) {
            const label = 8 - i; // Convert 0-7 to 8-1
            const leftDiv = document.createElement('div');
            const rightDiv = document.createElement('div');
            leftDiv.className = 'board-label row-label';
            rightDiv.className = 'board-label row-label';
            leftDiv.textContent = label;
            rightDiv.textContent = label;
            leftLabels.appendChild(leftDiv);
            rightLabels.appendChild(rightDiv);
        }
    }
}

// Start the game
new BrazilianCheckers();

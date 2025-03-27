import { MoveHelper } from './moves.js';
import { BeginnerAI } from './ai/BeginnerAI.js';
import { IntermediateAI } from './ai/IntermediateAI.js';
import { AdvancedAI } from './ai/AdvancedAI.js';

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
        this.board = [];
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
        console.log('Board initialized:', this.board);
        this.renderBoard();
        this.scores = { red: 0, blue: 0 };
        this.updateScores();
        
        // Clear move history display
        this.updateMoveHistory();
    }

    renderBoard() {
        const boardElement = document.getElementById('board');
        if (!boardElement) {
            console.error('Board element not found!');
            return;
        }

        boardElement.innerHTML = ''; // Clear the board

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const cell = document.createElement('div');
                cell.className = `cell ${(row + col) % 2 === 0 ? 'white' : 'black'}`;
                cell.dataset.row = row;
                cell.dataset.col = col;

                const piece = this.board[row][col];
                if (piece) {
                    const pieceDiv = document.createElement('div');
                    pieceDiv.className = `piece ${piece.color}`;
                    if (piece.isKing) {
                        const crown = document.createElement('i');
                        crown.className = 'fas fa-crown';
                        pieceDiv.appendChild(crown);
                        pieceDiv.classList.add('king');
                    }
                    cell.appendChild(pieceDiv);
                }

                boardElement.appendChild(cell);
            }
        }

        // Debug log the entire board state
        console.log('Current board state:', this.board);
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

    highlightPiece(row, col) {
        // Highlight the selected piece
        const pieceElement = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"] .piece`);
        if (pieceElement) {
            pieceElement.classList.add('selected');
        }

        // Highlight valid moves
        this.validMoves.forEach(move => {
            const cell = document.querySelector(`.cell[data-row="${move.row}"][data-col="${move.col}"]`);
            if (cell) {
                cell.classList.add('highlight');
            }
        });
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
        // Clear the selected piece
        if (this.selectedPiece) {
            const selected = document.querySelector('.piece.selected');
            if (selected) {
                selected.classList.remove('selected');
            }
            this.selectedPiece = null;
            this.validMoves = [];
        }

        // Clear highlighted cells
        document.querySelectorAll('.cell.highlight').forEach(cell => {
            cell.classList.remove('highlight');
        });
    }

    makeComputerMove() {
        const AI = {
            'beginner': BeginnerAI,
            'intermediate': IntermediateAI,
            'advanced': AdvancedAI
        }[this.gameLevel] || BeginnerAI;

        const ai = new AI(this.board);
        const move = ai.makeMove();

        if (move) {
            this.selectedPiece = { row: move.fromRow, col: move.fromCol };
            this.validMoves = [{ row: move.toRow, col: move.toCol }];
            this.makeMove(move.toRow, move.toCol);
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
                <a  href="game_form.html" class="play-again-btn">Change Level</a>
                <a  href="game_home.html" class="play-again-btn">Quit</a>
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

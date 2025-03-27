import { BaseAI } from './BaseAI.js';
import { MoveHelper } from '../moves.js';

export class AdvancedAI extends BaseAI {
    makeMove() {
        const bestMove = this.findBestMove(4); // Look 4 moves ahead
        return bestMove;
    }

    findBestMove(depth) {
        let bestMove = null;
        let bestValue = -Infinity;
        const alpha = -Infinity;
        const beta = Infinity;

        // Get all valid moves including jumps
        const allMoves = this.getAllPossibleMoves('blue');

        for (const move of allMoves) {
            const boardCopy = this.copyBoard(this.board);
            this.makeTemporaryMove(boardCopy, move);
            
            const moveValue = this.minimax(boardCopy, depth - 1, false, alpha, beta);
            
            if (moveValue > bestValue) {
                bestValue = moveValue;
                bestMove = move;
            }
        }

        return bestMove;
    }

    minimax(board, depth, isMaximizing, alpha, beta) {
        if (depth === 0) return this.evaluateBoard(board);

        if (isMaximizing) {
            let maxEval = -Infinity;
            const moves = this.getAllPossibleMoves('blue', board);
            
            for (const move of moves) {
                const boardCopy = this.copyBoard(board);
                this.makeTemporaryMove(boardCopy, move);
                const evaluation = this.minimax(boardCopy, depth - 1, false, alpha, beta); // Renamed eval to evaluation
                maxEval = Math.max(maxEval, evaluation);
                alpha = Math.max(alpha, evaluation);
                if (beta <= alpha) break;
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            const moves = this.getAllPossibleMoves('red', board);
            
            for (const move of moves) {
                const boardCopy = this.copyBoard(board);
                this.makeTemporaryMove(boardCopy, move);
                const evaluation = this.minimax(boardCopy, depth - 1, true, alpha, beta); // Renamed eval to evaluation
                minEval = Math.min(minEval, evaluation);
                beta = Math.min(beta, evaluation);
                if (beta <= alpha) break;
            }
            return minEval;
        }
    }

    getAllPossibleMoves(color, board = this.board) {
        const moves = [];
        const mandatoryJumps = MoveHelper.getAllMandatoryJumps(board, color);

        if (mandatoryJumps.length > 0) {
            for (let row = 0; row < 8; row++) {
                for (let col = 0; col < 8; col++) {
                    if (board[row][col]?.color === color) {
                        const jumps = MoveHelper.getMandatoryJumps(board, row, col);
                        jumps.forEach(jump => {
                            moves.push({
                                fromRow: row,
                                fromCol: col,
                                toRow: jump.row,
                                toCol: jump.col,
                                isCapture: true
                            });
                        });
                    }
                }
            }
        } else {
            for (let row = 0; row < 8; row++) {
                for (let col = 0; col < 8; col++) {
                    if (board[row][col]?.color === color) {
                        const validMoves = MoveHelper.getValidMoves(board, row, col);
                        validMoves.forEach(move => {
                            moves.push({
                                fromRow: row,
                                fromCol: col,
                                toRow: move.row,
                                toCol: move.col,
                                isCapture: false
                            });
                        });
                    }
                }
            }
        }
        return moves;
    }

    evaluateBoard(board) {
        let score = 0;
        const weights = {
            piece: 10,
            king: 25,
            position: 0.5,
            center: 2,
            back: 3
        };

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (!piece) continue;

                const value = piece.isKing ? weights.king : weights.piece;
                const multiplier = piece.color === 'blue' ? 1 : -1;

                score += value * multiplier;

                // Position scoring
                if (piece.color === 'blue') {
                    score += (7 - row) * weights.position * multiplier;
                    if (row === 7 && !piece.isKing) score += weights.back * multiplier;
                }

                // Center control
                const centerDistance = Math.abs(3.5 - col);
                score += (4 - centerDistance) * weights.center * multiplier;
            }
        }

        return score;
    }

    evaluatePositionalAdvantage(row, col) {
        let score = 0;
        const centerDistance = Math.abs(3.5 - col);
        score += (4 - centerDistance) * 2;
        if (row === 0) score += 3;
        score += row * 0.5;
        return score;
    }

    evaluateKingSafety(board) {
        let score = 0;
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (piece?.color === 'blue' && piece.isKing) {
                    if (this.isPieceProtected(board, row, col)) {
                        score += 5;
                    }
                    score += this.evaluateKingSafeDistance(board, row, col);
                }
            }
        }
        return score;
    }

    evaluateKingSafeDistance(board, kingRow, kingCol) {
        let score = 0;
        const safetyRadius = 2;
        
        for (let row = Math.max(0, kingRow - safetyRadius); 
             row <= Math.min(7, kingRow + safetyRadius); row++) {
            for (let col = Math.max(0, kingCol - safetyRadius);
                 col <= Math.min(7, kingCol + safetyRadius); col++) {
                if (board[row][col]?.color === 'red') {
                    const distance = Math.max(Math.abs(row - kingRow), Math.abs(col - kingCol));
                    score -= (3 - distance);
                }
            }
        }
        return score;
    }

    copyBoard(board) {
        return board.map(row => row.map(cell => cell ? {...cell} : null));
    }

    makeTemporaryMove(board, move) {
        const piece = {...board[move.fromRow][move.fromCol]};
        board[move.toRow][move.toCol] = piece;
        board[move.fromRow][move.fromCol] = null;

        if (move.isCapture) {
            const midRow = (move.fromRow + move.toRow) >> 1;
            const midCol = (move.fromCol + move.toCol) >> 1;
            board[midRow][midCol] = null;
        }

        // Handle promotion
        if (!piece.isKing && 
            ((piece.color === 'red' && move.toRow === 0) || 
             (piece.color === 'blue' && move.toRow === 7))) {
            piece.isKing = true;
        }
    }
}

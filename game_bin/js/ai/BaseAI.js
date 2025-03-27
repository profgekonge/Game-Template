import { MoveHelper } from '../moves.js';

export class BaseAI {
    constructor(board) {
        this.board = board;
    }

    evaluatePosition(board) {
        // ...existing evaluation code...
    }

    makeTemporaryMove(board, move) {
        const piece = board[move.fromRow][move.fromCol];
        if (piece) {
            board[move.toRow][move.toCol] = { ...piece };
            board[move.fromRow][move.fromCol] = null;

            if (move.capturedRow !== undefined) {
                board[move.capturedRow][move.capturedCol] = null;
            }

            // Handle promotion
            if (!piece.isKing && 
                ((piece.color === 'red' && move.toRow === 0) || 
                 (piece.color === 'blue' && move.toRow === 7))) {
                board[move.toRow][move.toCol].isKing = true;
            }
        }
    }

    cloneBoard(board) {
        return board.map(row => row.map(cell => cell ? { ...cell } : null));
    }

    isValidPosition(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }
}

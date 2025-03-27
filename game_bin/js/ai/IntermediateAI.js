import { BaseAI } from './BaseAI.js';
import { MoveHelper } from '../moves.js';

export class IntermediateAI extends BaseAI {
    makeMove() {
        const mandatoryJumps = MoveHelper.getAllMandatoryJumps(this.board, 'blue');
        if (mandatoryJumps.length > 0) {
            // Find best capture
            let bestJump = null;
            let bestScore = -Infinity;

            for (let row = 0; row < 8; row++) {
                for (let col = 0; col < 8; col++) {
                    if (this.board[row][col]?.color === 'blue') {
                        const pieceJumps = MoveHelper.getMandatoryJumps(this.board, row, col);
                        pieceJumps.forEach(jump => {
                            const score = this.evaluateMove(row, col, jump.row, jump.col);
                            if (score > bestScore) {
                                bestScore = score;
                                bestJump = {
                                    fromRow: row,
                                    fromCol: col,
                                    toRow: jump.row,
                                    toCol: jump.col
                                };
                            }
                        });
                    }
                }
            }
            return bestJump;
        }

        // Regular moves with evaluation
        let bestMove = null;
        let bestScore = -Infinity;

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (this.board[row][col]?.color === 'blue') {
                    const moves = MoveHelper.getValidMoves(this.board, row, col);
                    moves.forEach(move => {
                        const score = this.evaluateMove(row, col, move.row, move.col);
                        if (score > bestScore) {
                            bestScore = score;
                            bestMove = {
                                fromRow: row,
                                fromCol: col,
                                toRow: move.row,
                                toCol: move.col
                            };
                        }
                    });
                }
            }
        }

        return bestMove;
    }

    evaluateMove(fromRow, fromCol, toRow, toCol) {
        let score = 0;
        
        // Prioritize forward movement
        if (toRow > fromRow) score += 2;
        
        // Prioritize center control
        const centerDistance = Math.abs(3.5 - toCol);
        score += (4 - centerDistance);
        
        // Prioritize king promotion
        if (toRow === 7 && !this.board[fromRow][fromCol].isKing) score += 5;
        
        // Avoid edges unless necessary
        if (toCol === 0 || toCol === 7) score -= 1;
        
        return score;
    }
}

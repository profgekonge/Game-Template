import { BaseAI } from './BaseAI.js';
import { MoveHelper } from '../moves.js';

export class BeginnerAI extends BaseAI {
    makeMove() {
        const mandatoryJumps = MoveHelper.getAllMandatoryJumps(this.board, 'blue');
        
        // Handle mandatory jumps
        if (mandatoryJumps.length > 0) {
            const jumpingPieces = [];
            for (let row = 0; row < 8; row++) {
                for (let col = 0; col < 8; col++) {
                    if (this.board[row][col]?.color === 'blue') {
                        const jumps = MoveHelper.getMandatoryJumps(this.board, row, col);
                        if (jumps.length > 0) {
                            jumpingPieces.push({ row, col, jumps });
                        }
                    }
                }
            }

            // Shuffle the jumping pieces to randomize selection
            this.shuffleArray(jumpingPieces);

            const piece = jumpingPieces[0];
            const jump = this.shuffleArray(piece.jumps)[0];
            return { fromRow: piece.row, fromCol: piece.col, toRow: jump.row, toCol: jump.col };
        }

        // Handle regular moves
        const possibleMoves = [];
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (this.board[row][col]?.color === 'blue') {
                    const moves = MoveHelper.getValidMoves(this.board, row, col);
                    moves.forEach(move => {
                        possibleMoves.push({
                            fromRow: row,
                            fromCol: col,
                            toRow: move.row,
                            toCol: move.col
                        });
                    });
                }
            }
        }

        // Shuffle the possible moves to randomize selection
        if (possibleMoves.length > 0) {
            return this.shuffleArray(possibleMoves)[0];
        }

        return null;
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}

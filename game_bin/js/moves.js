export class MoveHelper {
    static getMandatoryJumps(board, row, col) {
        const piece = board[row][col];
        if (!piece) return [];
        
        const jumps = [];
        const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
        
        for (const [dRow, dCol] of directions) {
            if (piece.isKing) {
                // For kings, check all possible distances in each direction
                let currentRow = row + dRow;
                let currentCol = col + dCol;
                
                // Continue until we find a piece or reach the board edge
                while (this.isValidPosition(currentRow, currentCol)) {
                    if (board[currentRow][currentCol]) {
                        // Found a piece, check if it can be captured
                        if (board[currentRow][currentCol].color !== piece.color) {
                            let jumpRow = currentRow + dRow;
                            let jumpCol = currentCol + dCol;
                            
                            // Check all possible landing spots after the captured piece
                            while (this.isValidPosition(jumpRow, jumpCol) && !board[jumpRow][jumpCol]) {
                                jumps.push({
                                    row: jumpRow,
                                    col: jumpCol,
                                    capturedRow: currentRow,
                                    capturedCol: currentCol
                                });
                                jumpRow += dRow;
                                jumpCol += dCol;
                            }
                        }
                        break; // Stop searching in this direction after finding any piece
                    }
                    currentRow += dRow;
                    currentCol += dCol;
                }
            } else {
                // Regular piece capture logic
                const nextRow = row + dRow;
                const nextCol = col + dCol;
                const jumpRow = nextRow + dRow;
                const jumpCol = nextCol + dCol;

                if (!this.isValidPosition(jumpRow, jumpCol)) continue;

                if (board[nextRow]?.[nextCol] && 
                    board[nextRow][nextCol].color !== piece.color && 
                    !board[jumpRow][jumpCol]) {
                    jumps.push({
                        row: jumpRow,
                        col: jumpCol,
                        capturedRow: nextRow,
                        capturedCol: nextCol
                    });
                }
            }
        }

        return jumps;
    }

    static getValidMoves(board, row, col) {
        const piece = board[row][col];
        if (!piece) return [];

        const moves = [];
        const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

        if (piece.isKing) {
            // Flying moves for kings
            for (const [dRow, dCol] of directions) {
                let currentRow = row + dRow;
                let currentCol = col + dCol;
                
                while (this.isValidPosition(currentRow, currentCol)) {
                    if (!board[currentRow][currentCol]) {
                        moves.push({ row: currentRow, col: currentCol });
                    } else {
                        break; // Stop when we hit any piece
                    }
                    currentRow += dRow;
                    currentCol += dCol;
                }
            }
        } else {
            // Regular piece moves
            const normalDirections = piece.color === 'red' ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]];
            
            for (const [dRow, dCol] of normalDirections) {
                const newRow = row + dRow;
                const newCol = col + dCol;

                if (this.isValidPosition(newRow, newCol) && !board[newRow][newCol]) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        }

        return moves;
    }

    static getAllMandatoryJumps(board, currentPlayer) {
        const jumps = [];
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (board[row][col]?.color === currentPlayer) {
                    const pieceJumps = this.getMandatoryJumps(board, row, col);
                    jumps.push(...pieceJumps);
                }
            }
        }
        return jumps;
    }

    static isValidPosition(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }
}
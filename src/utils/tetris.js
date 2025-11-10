/**
 * 俄罗斯方块游戏核心逻辑
 */

// 方块类型定义（7种经典方块）
export const TETROMINOS = {
  I: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    color: '#00f0f0', // 青色
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: '#0000f0', // 蓝色
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: '#f0a000', // 橙色
  },
  O: {
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: '#f0f000', // 黄色
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    color: '#00f000', // 绿色
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: '#a000f0', // 紫色
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    color: '#f00000', // 红色
  },
}

// 游戏配置
export const GAME_CONFIG = {
  ROWS: 20, // 游戏区域行数
  COLS: 10, // 游戏区域列数
  CELL_SIZE: 30, // 单元格大小（rpx）
  INITIAL_SPEED: 1000, // 初始下落速度（毫秒）
  SPEED_INCREMENT: 50, // 每级速度增加（毫秒减少）
  MIN_SPEED: 100, // 最小下落速度（毫秒）
}

/**
 * 游戏类
 */
export class TetrisGame {
  constructor() {
    this.reset()
  }

  /**
   * 重置游戏
   */
  reset() {
    this.board = this.createEmptyBoard()
    this.currentPiece = null
    this.nextPiece = null
    this.score = 0
    this.level = 1
    this.lines = 0
    this.gameOver = false
    this.isPaused = false

    // 生成初始方块
    this.nextPiece = this.randomPiece()
    this.spawnPiece()
  }

  /**
   * 创建空棋盘
   */
  createEmptyBoard() {
    return Array.from({ length: GAME_CONFIG.ROWS }, () =>
      Array.from({ length: GAME_CONFIG.COLS }).fill(0))
  }

  /**
   * 随机生成方块
   */
  randomPiece() {
    const pieces = Object.keys(TETROMINOS)
    const randomType = pieces[Math.floor(Math.random() * pieces.length)]
    const tetromino = TETROMINOS[randomType]

    return {
      type: randomType,
      shape: JSON.parse(JSON.stringify(tetromino.shape)), // 深拷贝
      color: tetromino.color,
      x: Math.floor(GAME_CONFIG.COLS / 2) - Math.floor(tetromino.shape[0].length / 2),
      y: 0,
    }
  }

  /**
   * 生成新方块
   */
  spawnPiece() {
    this.currentPiece = this.nextPiece
    this.nextPiece = this.randomPiece()

    // 检查游戏是否结束
    if (this.checkCollision(this.currentPiece)) {
      this.gameOver = true
      return false
    }
    return true
  }

  /**
   * 检查碰撞
   */
  checkCollision(piece, offsetX = 0, offsetY = 0) {
    const shape = piece.shape
    const newX = piece.x + offsetX
    const newY = piece.y + offsetY

    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col]) {
          const boardX = newX + col
          const boardY = newY + row

          // 检查边界
          if (boardX < 0 || boardX >= GAME_CONFIG.COLS || boardY >= GAME_CONFIG.ROWS) {
            return true
          }

          // 检查是否与已固定的方块碰撞
          if (boardY >= 0 && this.board[boardY][boardX]) {
            return true
          }
        }
      }
    }
    return false
  }

  /**
   * 移动方块
   */
  movePiece(direction) {
    if (this.gameOver || this.isPaused || !this.currentPiece)
      return false

    let offsetX = 0
    let offsetY = 0

    if (direction === 'left')
      offsetX = -1
    else if (direction === 'right')
      offsetX = 1
    else if (direction === 'down')
      offsetY = 1

    if (!this.checkCollision(this.currentPiece, offsetX, offsetY)) {
      this.currentPiece.x += offsetX
      this.currentPiece.y += offsetY
      return true
    }
    else if (direction === 'down') {
      // 方块到底，固定方块
      this.lockPiece()
    }
    return false
  }

  /**
   * 旋转方块
   */
  rotatePiece() {
    if (this.gameOver || this.isPaused || !this.currentPiece)
      return false

    const piece = this.currentPiece
    const originalShape = piece.shape

    // 顺时针旋转90度
    const rotatedShape = piece.shape[0].map((_, index) =>
      piece.shape.map(row => row[index]).reverse(),
    )

    piece.shape = rotatedShape

    // 检查旋转后是否碰撞
    if (this.checkCollision(piece)) {
      // 尝试墙踢（wall kick）
      const kicks = [
        { x: -1, y: 0 },
        { x: 1, y: 0 },
        { x: -2, y: 0 },
        { x: 2, y: 0 },
        { x: 0, y: -1 },
      ]

      let kicked = false
      for (const kick of kicks) {
        if (!this.checkCollision(piece, kick.x, kick.y)) {
          piece.x += kick.x
          piece.y += kick.y
          kicked = true
          break
        }
      }

      if (!kicked) {
        // 无法旋转，恢复原状
        piece.shape = originalShape
        return false
      }
    }
    return true
  }

  /**
   * 硬降（直接降到底部）
   */
  hardDrop() {
    if (this.gameOver || this.isPaused || !this.currentPiece)
      return

    while (this.movePiece('down')) {
      this.score += 2 // 硬降额外得分
    }
  }

  /**
   * 计算幽灵方块（下降预览）的位置
   */
  getGhostPiece() {
    if (!this.currentPiece) {
      return null
    }

    // 创建幽灵方块（与当前方块相同的形状和位置）
    const ghostPiece = {
      shape: this.currentPiece.shape,
      color: this.currentPiece.color,
      x: this.currentPiece.x,
      y: this.currentPiece.y,
    }

    // 持续向下移动，直到碰撞
    while (!this.checkCollision(ghostPiece, 0, 1)) {
      ghostPiece.y++
    }

    return ghostPiece
  }

  /**
   * 固定方块到棋盘
   */
  lockPiece() {
    const piece = this.currentPiece
    const shape = piece.shape

    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col]) {
          const boardY = piece.y + row
          const boardX = piece.x + col
          if (boardY >= 0) {
            this.board[boardY][boardX] = piece.color
          }
        }
      }
    }

    // 检查并清除完整的行
    this.clearLines()

    // 生成新方块
    this.spawnPiece()
  }

  /**
   * 清除完整的行
   */
  clearLines() {
    let linesCleared = 0

    for (let row = GAME_CONFIG.ROWS - 1; row >= 0; row--) {
      if (this.board[row].every(cell => cell !== 0)) {
        // 删除这一行
        this.board.splice(row, 1)
        // 在顶部添加新的空行
        this.board.unshift(Array.from({ length: GAME_CONFIG.COLS }).fill(0))
        linesCleared++
        row++ // 重新检查当前行
      }
    }

    if (linesCleared > 0) {
      this.lines += linesCleared

      // 计算得分（消除多行有额外奖励）
      const scoreMap = [0, 100, 300, 500, 800]
      this.score += scoreMap[linesCleared] * this.level

      // 更新等级（每10行升1级）
      this.level = Math.floor(this.lines / 10) + 1
    }
  }

  /**
   * 获取当前下落速度
   */
  getSpeed() {
    const speed = GAME_CONFIG.INITIAL_SPEED - (this.level - 1) * GAME_CONFIG.SPEED_INCREMENT
    return Math.max(speed, GAME_CONFIG.MIN_SPEED)
  }

  /**
   * 获取游戏状态用于渲染
   */
  getGameState() {
    return {
      board: this.board,
      currentPiece: this.currentPiece,
      nextPiece: this.nextPiece,
      ghostPiece: this.getGhostPiece(), // 添加幽灵方块
      score: this.score,
      level: this.level,
      lines: this.lines,
      gameOver: this.gameOver,
      isPaused: this.isPaused,
    }
  }

  /**
   * 暂停/继续游戏
   */
  togglePause() {
    if (!this.gameOver) {
      this.isPaused = !this.isPaused
    }
  }
}

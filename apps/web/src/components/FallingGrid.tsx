'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'

import { cn } from '@/lib/utils'

interface FallingGridProps {
  className?: string;
}

export default function FallingGrid({ className = '' }: FallingGridProps) {
  const elRef = useRef<HTMLDivElement>(null)
  const [grid, setGrid] = useState<(boolean | null)[][]>([])
  const [rows, setRows] = useState(0)
  const [cols, setCols] = useState(0)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [isVisible, setIsVisible] = useState(false)

  // Observe container size changes
  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        })
      }
    })

    if (elRef.current) {
      resizeObserver.observe(elRef.current)
    }

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  // Create grid
  const createGrid = useCallback(() => {
    const newGrid: (boolean | null)[][] = []
    for (let i = 0; i <= rows; i++) {
      newGrid.push(new Array(cols).fill(null))
    }
    setGrid(newGrid)
  }, [rows, cols])

  // Generate new cell
  const createNewCell = useCallback(() => {
    if (cols === 0) return

    setGrid(prevGrid => {
      const newGrid = [...prevGrid]
      const x = Math.floor(Math.random() * cols)
      if (newGrid[0]) {
        newGrid[0][x] = true
      }
      return newGrid
    })
  }, [cols])

  // Move cells down
  const moveCellsDown = useCallback(() => {
    setGrid(prevGrid => {
      const newGrid = prevGrid.map(row => [...row])

      for (let row = rows - 1; row >= 0; row--) {
        for (let col = 0; col < cols; col++) {
          if (newGrid[row][col] !== null && newGrid[row + 1] && newGrid[row + 1][col] === null) {
            newGrid[row + 1][col] = newGrid[row][col]
            newGrid[row][col] = null
          }
        }
      }

      // Check if bottom is filled
      setTimeout(() => {
        setGrid(currentGrid => {
          const updatedGrid = [...currentGrid]
          if (updatedGrid[rows] && updatedGrid[rows].every(cell => cell !== null)) {
            updatedGrid[rows] = new Array(cols).fill(null)
          }
          return updatedGrid
        })
      }, 500)

      return newGrid
    })
  }, [rows, cols])

  // Remove cell
  const removeCell = useCallback((row: number, col: number) => {
    setGrid(prevGrid => {
      const newGrid = [...prevGrid]
      if (newGrid[row]) {
        newGrid[row][col] = null
      }
      return newGrid
    })
  }, [])

  // Calculate grid dimensions
  const calcGrid = useCallback(() => {
    const { width, height } = dimensions
    if (width === 0 || height === 0) return

    const base = Math.ceil(width / 60)
    const cell = width / base
    const newRows = Math.ceil(height / cell)
    const newCols = Math.floor(width / cell)

    setRows(newRows)
    setCols(newCols)
  }, [dimensions])

  // Handle dimension changes
  useEffect(() => {
    calcGrid()
  }, [calcGrid])

  // Initialize grid
  useEffect(() => {
    createGrid()
  }, [createGrid])

  // Start animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 50)

    const interval = setInterval(() => {
      moveCellsDown()
      createNewCell()
    }, 1000)

    return () => {
      clearTimeout(timer)
      clearInterval(interval)
    }
  }, [moveCellsDown, createNewCell])

  const cellSize = cols > 0 ? dimensions.width / cols : 0

  return (
    <div
      className={cn(
        'transition-opacity duration-500',
        isVisible ? 'opacity-100' : 'opacity-0',
        className
      )}
      style={{
        '--cell': `${cellSize}px`,
        '--rows': rows - 1
      } as React.CSSProperties}
    >
      <div
        ref={elRef}
        className="absolute inset-0 grid justify-center"
        style={{
          gridTemplateRows: `repeat(${rows}, var(--cell))`,
          rowGap: '-1px'
        }}
      >
        {grid.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className="grid grid-flow-col flex-1"
            style={{
              gridTemplateColumns: `repeat(${cols}, var(--cell))`,
              columnGap: '-1px'
            }}
          >
            {row.map((cell, cellIndex) => (
              <div
                key={cellIndex}
                className="relative border border-blue-200/50 dark:border-blue-900/25"
              >
                <div
                  className={cn(
                    'absolute inset-0 bg-blue-500/10 hover:bg-blue-500/20 dark:bg-blue-400/5 dark:hover:bg-blue-400/10 transition-opacity duration-1000 will-change-[opacity]',
                    cell ? 'opacity-100 cursor-pointer' : 'opacity-0'
                  )}
                  onClick={() => cell && removeCell(rowIndex, cellIndex)}
                />
              </div>
            ))}
          </div>
        ))}
        <div
          className="absolute inset-x-0 pointer-events-none bg-gradient-to-t from-white dark:from-gray-900"
          style={{
            top: 'calc((var(--cell) * var(--rows)) + 1px)',
            height: 'calc(var(--cell) * 2)'
          }}
        />
      </div>
    </div>
  )
}

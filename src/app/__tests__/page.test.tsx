import { render, screen } from '@testing-library/react'
import Home from '../page'
import { describe, it, expect, vi } from 'vitest'

// Mock next/link
vi.mock('next/link', () => {
  return {
    default: ({ children }: { children: React.ReactNode }) => {
      return <a>{children}</a>
    }
  }
})

describe('Home Page', () => {
  it('renders the main heading', () => {
    render(<Home />)
    expect(screen.getByText('Transparent, Verifiable Carbon Credits.')).toBeDefined()
  })

  it('renders the launch dashboard button', () => {
    render(<Home />)
    expect(screen.getByText('Launch Dashboard')).toBeDefined()
  })

  it('renders the real-world data section', () => {
    render(<Home />)
    expect(screen.getByText('Real-World Data')).toBeDefined()
    expect(screen.getByText(/Credits are minted dynamically/)).toBeDefined()
  })
})

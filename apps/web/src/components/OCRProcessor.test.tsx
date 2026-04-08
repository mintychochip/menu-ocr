import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import OCRProcessor from './OCRProcessor'

describe('OCRProcessor', () => {
  const mockOnComplete = vi.fn()
  const mockOnError = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders start button', () => {
    const file = new File(['test'], 'test.png', { type: 'image/png' })
    
    render(
      <OCRProcessor
        files={[file]}
        onComplete={mockOnComplete}
        onError={mockOnError}
      />
    )

    expect(screen.getByText(/start ocr processing/i)).toBeInTheDocument()
  })

  it('disables start button when no files', () => {
    render(
      <OCRProcessor
        files={[]}
        onComplete={mockOnComplete}
        onError={mockOnError}
      />
    )

    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('starts processing on button click', async () => {
    const user = userEvent.setup()
    const file = new File(['test'], 'test.png', { type: 'image/png' })
    
    render(
      <OCRProcessor
        files={[file]}
        onComplete={mockOnComplete}
        onError={mockOnError}
      />
    )

    const startButton = screen.getByText(/start ocr processing/i)
    await user.click(startButton)

    await waitFor(() => {
      expect(screen.getByText(/loading ocr engine/i)).toBeInTheDocument()
    })
  })

  it('shows progress indicator', async () => {
    const user = userEvent.setup()
    const file = new File(['test'], 'test.png', { type: 'image/png' })
    
    render(
      <OCRProcessor
        files={[file]}
        onComplete={mockOnComplete}
        onError={mockOnError}
      />
    )

    const startButton = screen.getByText(/start ocr processing/i)
    await user.click(startButton)

    await waitFor(() => {
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })
  })

  it('allows canceling processing', async () => {
    const user = userEvent.setup()
    const file = new File(['test'], 'test.png', { type: 'image/png' })
    
    render(
      <OCRProcessor
        files={[file]}
        onComplete={mockOnComplete}
        onError={mockOnError}
      />
    )

    const startButton = screen.getByText(/start ocr processing/i)
    await user.click(startButton)

    await waitFor(() => {
      expect(screen.getByText(/cancel/i)).toBeInTheDocument()
    })

    const cancelButton = screen.getByText(/cancel/i)
    await user.click(cancelButton)

    expect(mockOnError).toHaveBeenCalledWith('Processing was cancelled')
  })

  it('processes PDF files differently', async () => {
    const user = userEvent.setup()
    const pdfFile = new File(['pdf content'], 'menu.pdf', { type: 'application/pdf' })
    
    render(
      <OCRProcessor
        files={[pdfFile]}
        onComplete={mockOnComplete}
        onError={mockOnError}
      />
    )

    const startButton = screen.getByText(/start ocr processing/i)
    await user.click(startButton)

    await waitFor(() => {
      expect(screen.getByText(/extracting text from pdf/i)).toBeInTheDocument()
    })
  })
})

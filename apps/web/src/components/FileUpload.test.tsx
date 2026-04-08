import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FileUpload from './FileUpload'

describe('FileUpload', () => {
  it('renders upload area', () => {
    const onFilesSelected = vi.fn()
    render(<FileUpload onFilesSelected={onFilesSelected} />)

    expect(screen.getByText(/click to upload or drag and drop/i)).toBeInTheDocument()
    expect(screen.getByText(/jpeg, png, webp, or pdf/i)).toBeInTheDocument()
  })

  it('handles file selection via input', async () => {
    const onFilesSelected = vi.fn()
    const user = userEvent.setup()
    
    render(<FileUpload onFilesSelected={onFilesSelected} />)

    const input = screen.getByLabelText(/click to upload or drag and drop/i)
    const file = new File(['test'], 'test.png', { type: 'image/png' })

    await user.upload(input, file)

    expect(onFilesSelected).toHaveBeenCalledWith([file])
    expect(screen.getByText('test.png')).toBeInTheDocument()
  })

  it('handles multiple file selection', async () => {
    const onFilesSelected = vi.fn()
    const user = userEvent.setup()
    
    render(<FileUpload onFilesSelected={onFilesSelected} maxFiles={3} />)

    const input = screen.getByLabelText(/click to upload or drag and drop/i)
    const files = [
      new File(['test1'], 'test1.png', { type: 'image/png' }),
      new File(['test2'], 'test2.jpg', { type: 'image/jpeg' }),
    ]

    await user.upload(input, files)

    expect(onFilesSelected).toHaveBeenCalledWith(files)
    expect(screen.getByText('2 files selected')).toBeInTheDocument()
  })

  it('filters invalid file types', async () => {
    const onFilesSelected = vi.fn()
    const user = userEvent.setup()
    
    render(<FileUpload onFilesSelected={onFilesSelected} />)

    const input = screen.getByLabelText(/click to upload or drag and drop/i)
    const files = [
      new File(['test'], 'test.png', { type: 'image/png' }),
      new File(['test'], 'test.txt', { type: 'text/plain' }), // Invalid
    ]

    await user.upload(input, files)

    expect(onFilesSelected).toHaveBeenCalledWith([files[0]])
  })

  it('respects maxFiles limit', async () => {
    const onFilesSelected = vi.fn()
    const user = userEvent.setup()
    
    render(<FileUpload onFilesSelected={onFilesSelected} maxFiles={2} />)

    const input = screen.getByLabelText(/click to upload or drag and drop/i)
    const files = [
      new File(['test1'], 'test1.png', { type: 'image/png' }),
      new File(['test2'], 'test2.jpg', { type: 'image/jpeg' }),
      new File(['test3'], 'test3.webp', { type: 'image/webp' }),
    ]

    await user.upload(input, files)

    expect(onFilesSelected).toHaveBeenCalledWith(files.slice(0, 2))
  })

  it('shows file size correctly', async () => {
    const onFilesSelected = vi.fn()
    const user = userEvent.setup()
    
    render(<FileUpload onFilesSelected={onFilesSelected} />)

    const input = screen.getByLabelText(/click to upload or drag and drop/i)
    const file = new File(['x'.repeat(2048)], 'test.png', { type: 'image/png' })

    await user.upload(input, file)

    expect(screen.getByText('2.0 KB')).toBeInTheDocument()
  })

  it('allows removing files', async () => {
    const onFilesSelected = vi.fn()
    const user = userEvent.setup()
    
    render(<FileUpload onFilesSelected={onFilesSelected} />)

    const input = screen.getByLabelText(/click to upload or drag and drop/i)
    const file = new File(['test'], 'test.png', { type: 'image/png' })

    await user.upload(input, file)
    expect(screen.getByText('test.png')).toBeInTheDocument()

    const removeButton = screen.getByRole('button', { name: '' }) // X icon button
    await user.click(removeButton)

    expect(onFilesSelected).toHaveBeenLastCalledWith([])
  })

  it('allows clearing all files', async () => {
    const onFilesSelected = vi.fn()
    const user = userEvent.setup()
    
    render(<FileUpload onFilesSelected={onFilesSelected} />)

    const input = screen.getByLabelText(/click to upload or drag and drop/i)
    const file = new File(['test'], 'test.png', { type: 'image/png' })

    await user.upload(input, file)

    const clearButton = screen.getByText('Clear all')
    await user.click(clearButton)

    expect(onFilesSelected).toHaveBeenLastCalledWith([])
  })

  it('handles drag and drop', () => {
    const onFilesSelected = vi.fn()
    
    render(<FileUpload onFilesSelected={onFilesSelected} />)

    const dropZone = screen.getByText(/click to upload or drag and drop/i).parentElement?.parentElement
    
    fireEvent.dragEnter(dropZone!, {
      dataTransfer: { files: [] },
    })

    expect(screen.getByText('Drop files here')).toBeInTheDocument()
  })
})

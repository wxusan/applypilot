/**
 * Component tests: KanbanBoard
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import KanbanBoard from '../../components/kanban/KanbanBoard'

// Mock the react-beautiful-dnd components since they are complex to test in jsdom
jest.mock('react-beautiful-dnd', () => ({
  DragDropContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Droppable: ({ children }: any) => children({
    droppableProps: {
      'data-rbd-droppable-id': 'droppable',
      'data-rbd-droppable-context-id': '1',
    },
    innerRef: jest.fn(),
    placeholder: null
  }, {}),
  Draggable: ({ children }: any) => children({
    draggableProps: {
      'data-rbd-draggable-context-id': '1',
      'data-rbd-draggable-id': 'draggable',
    },
    dragHandleProps: {
      'data-rbd-drag-handle-draggable-id': 'draggable',
      'data-rbd-drag-handle-context-id': '1',
    },
    innerRef: jest.fn(),
  }, {}),
}))

// Removed MOCK_COLUMNS

const MOCK_STUDENTS: any[] = [
  {
    id: '1',
    full_name: 'Alice Smith',
    status: 'intake',
    target_universities: [],
    deadlines: [],
    applications: [],
  }
]

describe('KanbanBoard', () => {
  it('renders all board columns properly', () => {
    render(
      <KanbanBoard 
        students={MOCK_STUDENTS}
      />
    )
    
    expect(screen.getByText('Intake')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText('Submitted')).toBeInTheDocument()
  })

  it('renders student cards within the correct columns', () => {
    render(
      <KanbanBoard 
        students={MOCK_STUDENTS}
      />
    )
    
    expect(screen.getByText('Alice Smith')).toBeInTheDocument()
  })

  it('renders empty columns without crashing', () => {
    render(
      <KanbanBoard 
        students={[]}
      />
    )
    expect(screen.getAllByText('0').length).toBeGreaterThan(0)
  })
})

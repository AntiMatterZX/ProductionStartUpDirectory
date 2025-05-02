import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import { RoundedDrawerNav } from '@/components/ui/rounded-drawer-nav'

// Mock the next/navigation module
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}))

// Mock the supabase client
jest.mock('@/lib/supabase/client-component', () => ({
  createClientComponentClient: () => ({
    auth: {
      signOut: jest.fn(() => Promise.resolve({})),
    },
  }),
}))

describe('RoundedDrawerNav', () => {
  const mockLinks = [
    {
      title: 'Test Category 1',
      sublinks: [
        { title: 'Sublink 1', href: '/test1' },
        { title: 'Sublink 2', href: '/test2' },
      ],
    },
    {
      title: 'Test Category 2',
      sublinks: [
        { title: 'Sublink 3', href: '/test3' },
        { title: 'Sublink 4', href: '/test4' },
      ],
    },
  ]

  it('renders navigation with links', () => {
    render(
      <RoundedDrawerNav links={mockLinks}>
        <div>Test content</div>
      </RoundedDrawerNav>
    )

    expect(screen.getByText('Test Category 1')).toBeInTheDocument()
    expect(screen.getByText('Test Category 2')).toBeInTheDocument()
    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('shows login and signup buttons when user is not logged in', () => {
    render(
      <RoundedDrawerNav links={mockLinks}>
        <div>Test content</div>
      </RoundedDrawerNav>
    )

    expect(screen.getAllByText('Log in')).toBeTruthy()
    expect(screen.getAllByText('Get started')).toBeTruthy()
  })

  it('shows dashboard button when user is logged in', () => {
    const mockUser = { id: '123', email: 'test@example.com' }
    
    render(
      <RoundedDrawerNav links={mockLinks} user={mockUser}>
        <div>Test content</div>
      </RoundedDrawerNav>
    )

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('shows create button when user is an admin', () => {
    const mockUser = { id: '123', email: 'test@example.com' }
    
    render(
      <RoundedDrawerNav links={mockLinks} user={mockUser} userRole="admin">
        <div>Test content</div>
      </RoundedDrawerNav>
    )

    expect(screen.getByText('Create')).toBeInTheDocument()
  })

  it('toggles mobile menu when hamburger button is clicked', () => {
    render(
      <RoundedDrawerNav links={mockLinks}>
        <div>Test content</div>
      </RoundedDrawerNav>
    )

    // Mobile menu should not be visible initially
    expect(screen.queryByText('Sublink 1')).not.toBeInTheDocument()
    
    // Click the hamburger menu button
    const menuButton = screen.getByRole('button')
    fireEvent.click(menuButton)
    
    // Mobile menu should now be visible
    expect(screen.getByText('Sublink 1')).toBeInTheDocument()
    expect(screen.getByText('Sublink 2')).toBeInTheDocument()
    expect(screen.getByText('Sublink 3')).toBeInTheDocument()
    expect(screen.getByText('Sublink 4')).toBeInTheDocument()
  })
}) 
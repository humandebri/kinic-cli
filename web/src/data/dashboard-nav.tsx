// Where: Dashboard sidebar navigation data.
// What: Sectioned menu items with icons and labels.
// Why: Keeps layout component focused on rendering.
import {
  ArrowRightLeftIcon,
  CalendarClockIcon,
  ChartNoAxesCombinedIcon,
  ChartPieIcon,
  ChartSplineIcon,
  ClipboardListIcon,
  Clock9Icon,
  CrownIcon,
  HashIcon,
  SettingsIcon,
  SquareActivityIcon,
  Undo2Icon,
  UsersIcon
} from 'lucide-react'

export type SidebarLink = {
  label: string
  href: string
  icon: JSX.Element
  badge?: string
}

export type SidebarSection = {
  label?: string
  items: SidebarLink[]
}

export const primarySection: SidebarSection = {
  items: [
    {
      label: 'Dashboard',
      href: '/',
      icon: <ChartNoAxesCombinedIcon />,
      badge: '3'
    }
  ]
}

export const pageSections: SidebarSection[] = [
  {
    label: 'Pages',
    items: [
      { label: 'Memories', href: '/memories', icon: <ChartSplineIcon /> },
      { label: 'Insert', href: '#', icon: <ArrowRightLeftIcon /> },
      { label: 'Search', href: '#', icon: <ChartPieIcon /> },
      { label: 'Memory Detail', href: '#', icon: <HashIcon />, badge: '1' },
      { label: 'ACL / Config', href: '#', icon: <UsersIcon /> }
    ]
  },
  {
    label: 'Utilities',
    items: [
      { label: 'Balance', href: '#', icon: <SquareActivityIcon /> },
      { label: 'Identity', href: '#', icon: <CalendarClockIcon /> },
      { label: 'Embedding Endpoint', href: '#', icon: <ClipboardListIcon /> },
      { label: 'Updates', href: '#', icon: <Undo2Icon /> },
      { label: 'Settings', href: '#', icon: <SettingsIcon /> }
    ]
  }
]

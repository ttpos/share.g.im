'use client'

import { CircleHelp, Settings, Key, Shield } from 'lucide-react'
import { useCallback } from 'react'

import { ThemeToggle } from '@/components/ThemeToggle'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useAppState, ENCRYPTION_MODES } from '@/contexts/AppStateContext'

// Define constants for action identifiers
const KEY_ACTIONS = {
  CREATE_KEY: 'createKey',
  VIEW_KEY: 'viewKey',
  KEY_STORE: 'keyStore',
  SECURE_PASSWORD: 'securePassword'
} as const

type KeyAction = typeof KEY_ACTIONS[keyof typeof KEY_ACTIONS]
type MenuAction = KeyAction | typeof ENCRYPTION_MODES[keyof typeof ENCRYPTION_MODES]

// Define interfaces for menu items
interface MenuItem {
  label: string
  action: MenuAction
  icon?: React.ComponentType<{ className?: string }>
}

interface SubMenu {
  triggerLabel: string
  triggerIcon: React.ComponentType<{ className?: string }>
  items: MenuItem[]
}

export default function Header() {
  const { selectedEncryptionMode, setSelectedEncryptionMode } = useAppState()

  // Handle all actions (key management and encryption mode changes)
  const handleAction = useCallback((action: MenuAction) => {
    if ((Object.values(ENCRYPTION_MODES) as string[]).includes(action)) {
      setSelectedEncryptionMode(action as typeof ENCRYPTION_MODES[keyof typeof ENCRYPTION_MODES])
      console.log(`Switched to encryption mode: ${action}`)
    } else {
      // TODO: Implement key management logic
      console.log(`Key management action: ${action}`)
    }
  }, [setSelectedEncryptionMode])

  // Component for rendering individual dropdown menu items
  const renderMenuItem = ({ label, action, icon: Icon }: MenuItem, isSelected: boolean = false) => (
    <DropdownMenuItem
      key={action}
      onClick={() => handleAction(action)}
      className={isSelected ? 'bg-accent' : ''}
    >
      {Icon && <Icon className="mr-2 h-4 w-4" />}
      {label}
    </DropdownMenuItem>
  )

  // Define key management menu items
  const keyManagementItems: MenuItem[] = [
    { label: '创建密钥', action: KEY_ACTIONS.CREATE_KEY },
    { label: '查看密钥', action: KEY_ACTIONS.VIEW_KEY },
    { label: '密钥库', action: KEY_ACTIONS.KEY_STORE },
    { label: '安全密码', action: KEY_ACTIONS.SECURE_PASSWORD }
  ]

  // Define encryption mode menu items
  const encryptionModeItems: MenuItem[] = [
    {
      label: 'Key 加密',
      action: ENCRYPTION_MODES.KEY_ENCRYPTION
    },
    {
      label: 'Password 加密',
      action: ENCRYPTION_MODES.PASSWORD_ENCRYPTION
    }
  ]

  // Define submenu configurations
  const subMenus: SubMenu[] = [
    {
      triggerLabel: '密钥管理',
      triggerIcon: Key,
      items: keyManagementItems
    },
    {
      triggerLabel: '加密模式',
      triggerIcon: Shield,
      items: encryptionModeItems
    }
  ]

  return (
    <header className="w-full max-w-6xl mb-8 md:mb-12 z-0">
      <div className="flex flex-col md:flex-row items-center md:justify-between gap-4">
        <div className="flex-1 text-center space-y-4 sm:space-y-6">
          <h1 className="text-3xl md:text-4xl flex items-center justify-center">SecureVault</h1>
          <h3 className="text-sm md:text-base text-gray-600 dark:text-gray-400 font-medium">
            ECIES File & Message Encryption Tool
          </h3>
        </div>
        <div className="flex items-center gap-2 justify-center md:justify-end w-full md:w-auto">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="cursor-pointer">
                <CircleHelp className='size-5' />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>ECIES File & Message Encryption Tool</p>
            </TooltipContent>
          </Tooltip>

          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="cursor-pointer">
                <Settings className="size-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {subMenus.map(({ triggerLabel, triggerIcon: TriggerIcon, items }) => (
                <DropdownMenuSub key={triggerLabel}>
                  <DropdownMenuSubTrigger>
                    <TriggerIcon className="mr-2 h-4 w-4" />
                    <span>{triggerLabel}</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {items.map(item =>
                      renderMenuItem(
                        item,
                        triggerLabel === '加密模式' && item.action === selectedEncryptionMode
                      )
                    )}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

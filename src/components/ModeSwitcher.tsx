'use client'

import { useRouter, usePathname } from 'next/navigation'

import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface ModeSwitcherProps {
  value: string;
  // eslint-disable-next-line no-unused-vars
  onValueChange?: (value: string) => void;
}

export default function ModeSwitcher({ value, onValueChange }: ModeSwitcherProps) {
  const router = useRouter()
  const pathname = usePathname()

  const handleModeChange = (value: string) => {
    if (value === 'puk' && pathname !== '/') {
      router.push('/')
    } else if (value === 'pwd' && pathname !== '/password') {
      router.push('/password')
    }
    onValueChange?.(value)
  }

  return (
    <div className="space-y-2">
      <Label className="text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300">Mode</Label>
      <Select value={value} onValueChange={handleModeChange}>
        <SelectTrigger className="w-full h-[40px] text-sm font-medium text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 rounded-md p-2 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none">
          <SelectValue placeholder="Select mode" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="puk">Public/Private Key Mode</SelectItem>
          <SelectItem value="pwd">Password Mode</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

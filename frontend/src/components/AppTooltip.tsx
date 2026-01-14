import type { ReactElement } from 'react'
import { Tooltip as MuiTooltip, type TooltipProps } from '@mui/material'
import { usePreferences } from '@/hooks/usePreferences'

type AppTooltipProps = Omit<TooltipProps, 'children'> & {
  children: ReactElement
}

export function AppTooltip({ children, ...props }: AppTooltipProps) {
  const prefs = usePreferences()

  if (!prefs.tooltips) {
    return children
  }

  return <MuiTooltip {...props}>{children}</MuiTooltip>
}

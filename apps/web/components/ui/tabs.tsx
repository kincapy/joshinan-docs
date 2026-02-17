'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

/** タブのコンテキスト */
const TabsContext = React.createContext<{
  value: string
  onChange: (value: string) => void
}>({ value: '', onChange: () => {} })

/** タブコンテナ */
function Tabs({
  defaultValue,
  value: controlledValue,
  onValueChange,
  className,
  children,
  ...props
}: {
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  className?: string
  children: React.ReactNode
} & React.HTMLAttributes<HTMLDivElement>) {
  const [internalValue, setInternalValue] = React.useState(
    defaultValue ?? '',
  )
  const value = controlledValue ?? internalValue
  const onChange = React.useCallback(
    (v: string) => {
      setInternalValue(v)
      onValueChange?.(v)
    },
    [onValueChange],
  )

  return (
    <TabsContext.Provider value={{ value, onChange }}>
      <div className={cn('w-full', className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

/** タブボタンの並び */
function TabsList({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'inline-flex h-10 items-center justify-start gap-1 rounded-md bg-muted p-1 text-muted-foreground',
        className,
      )}
      role="tablist"
      {...props}
    >
      {children}
    </div>
  )
}

/** タブボタン */
function TabsTrigger({
  value,
  className,
  children,
  ...props
}: { value: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const ctx = React.useContext(TabsContext)
  const isActive = ctx.value === value

  return (
    <button
      role="tab"
      aria-selected={isActive}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        isActive
          ? 'bg-background text-foreground shadow-sm'
          : 'hover:bg-background/50 hover:text-foreground',
        className,
      )}
      onClick={() => ctx.onChange(value)}
      {...props}
    >
      {children}
    </button>
  )
}

/** タブコンテンツ */
function TabsContent({
  value,
  className,
  children,
  ...props
}: { value: string } & React.HTMLAttributes<HTMLDivElement>) {
  const ctx = React.useContext(TabsContext)

  if (ctx.value !== value) return null

  return (
    <div
      role="tabpanel"
      className={cn('mt-2 ring-offset-background', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }

import { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
}

export default function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between lg:mb-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 lg:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-gray-600">{description}</p>}
      </div>
      {actions && <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">{actions}</div>}
    </div>
  )
}

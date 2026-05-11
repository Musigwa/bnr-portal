'use client'

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:!bg-popover group-[.toaster]:!border-border group-[.toaster]:shadow-lg group-[.toaster]:backdrop-blur-xl group-[.toaster]:backdrop-saturate-150",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          closeButton:
            "group-[.toast]:!bg-background group-[.toast]:!text-foreground group-[.toast]:!border-border hover:group-[.toast]:!bg-muted",
          success: "group-[.toaster]:!text-emerald-600 dark:group-[.toaster]:!text-emerald-400",
          error: "group-[.toaster]:!text-destructive",
          warning: "group-[.toaster]:!text-amber-500",
          info: "group-[.toaster]:!text-blue-500",
        },
      }}

      {...props}
    />
  )
}

export { Toaster }

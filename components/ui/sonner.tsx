"use client"

import { Toaster as Sonner, ToasterProps } from "sonner"
import { CheckCircle2, XCircle, Info } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      icons={{
        success: <CheckCircle2 className="h-5 w-5 text-green-500" />,
        error: <XCircle className="h-5 w-5 text-red-500" />,
        info: <Info className="h-5 w-5 text-blue-500" />
      }}
      toastOptions={{
        classNames: {
          toast: "border font-sans",
          success: "!bg-green-50 !text-green-800 !border-green-200",
          error: "!bg-red-50 !text-red-800 !border-red-200",
          info: "!bg-blue-50 !text-blue-800 !border-blue-200",
          description: "!text-current opacity-80"
        }
      }}
      {...props}
    />
  )
}

export { Toaster }

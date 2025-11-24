import * as React from "react"

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "outline" }
>(({ className, variant, ...props }, ref) => {
  const baseStyles =
    "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"

  const variantStyles =
    variant === "outline" ? "border border-input bg-background hover:bg-accent hover:text-accent-foreground" : ""

  return <button ref={ref} className={`${baseStyles} ${variantStyles} ${className || ""}`} {...props} />
})
Button.displayName = "Button"

export { Button }

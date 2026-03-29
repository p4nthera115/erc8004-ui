"use client"

import { forwardRef, HTMLAttributes } from "react"
import { motion, HTMLMotionProps } from "framer-motion"
import { cn } from "@/lib/utils"

interface CardProps extends Omit<HTMLMotionProps<"div">, "ref"> {
  variant?: "glass" | "solid" | "outline"
  hover?: boolean
  glow?: boolean
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = "glass",
      hover = false,
      glow = false,
      children,
      ...props
    },
    ref
  ) => {
    const variants = {
      glass: cn(
        "bg-obsidian-900/60 backdrop-blur-xl",
        "border border-platinum-800/20",
        "rounded-2xl shadow-2xl"
      ),
      solid: cn(
        "bg-obsidian-900",
        "border border-platinum-800/30",
        "rounded-2xl shadow-xl"
      ),
      outline: cn(
        "bg-transparent",
        "border border-platinum-700/30",
        "rounded-2xl"
      ),
    }

    const hoverStyles = hover
      ? "hover:border-gold-500/30 hover:shadow-[0_0_30px_rgba(212,162,74,0.1)] transition-all duration-300"
      : ""

    const glowStyles = glow ? "glow-gold" : ""

    return (
      <motion.div
        ref={ref}
        className={cn(variants[variant], hoverStyles, glowStyles, className)}
        whileHover={hover ? { y: -4 } : undefined}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)

Card.displayName = "Card"

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}

const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("px-6 py-5 border-b border-platinum-800/20", className)}
      {...props}
    />
  )
)

CardHeader.displayName = "CardHeader"

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6", className)} {...props} />
  )
)

CardContent.displayName = "CardContent"

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "px-6 py-4 border-t border-platinum-800/20 bg-obsidian-950/30",
        className
      )}
      {...props}
    />
  )
)

CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardContent, CardFooter }

import type { VariantProps } from 'class-variance-authority'
import type { HTMLAttributes } from 'vue'
import { cva } from 'class-variance-authority'

export interface BaseProps {
  variant?: PatternBgVariants['variant']
  size?: PatternBgVariants['size']
  mask?: PatternBgMaskVariants['mask']
  animate?: boolean
  direction?: 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  speed?: number
  class?: HTMLAttributes['class']
}

export const patternBgVariants = cva('relative text-clip', {
  variants: {
    variant: {
      'grid': 'bg-[linear-gradient(to_right,hsl(var(--foreground)/0.3)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--foreground)/0.3)_1px,transparent_1px)]',
      'dot': 'bg-[radial-gradient(hsl(var(--foreground)/0.3)_1px,transparent_1px)]',
      'big-dot': 'bg-[radial-gradient(hsl(var(--foreground)/0.3)_3px,transparent_3px)]',
    },
    size: {
      xs: 'bg-[size:8px_8px]',
      sm: 'bg-[size:16px_16px]',
      md: 'bg-[size:24px_24px]',
      lg: 'bg-[size:32px_32px]',
    },
  },
  defaultVariants: {
    variant: 'grid',
    size: 'md',
  },
})

export type PatternBgVariants = VariantProps<typeof patternBgVariants>

export const patternBgMaskVariants = cva('bg-background', {
  variants: {
    mask: {
      'ellipse': '[mask-image:radial-gradient(ellipse_at_center,transparent,black_80%)]',
      'ellipse-top': '[mask-image:radial-gradient(ellipse_at_top,transparent,black_80%)]',
      'ellipse-bottom': '[mask-image:radial-gradient(ellipse_at_bottom,transparent,black_80%)]',
      'ellipse-left': '[mask-image:radial-gradient(ellipse_at_left,transparent,black_80%)]',
      'ellipse-right': '[mask-image:radial-gradient(ellipse_at_right,transparent,black_80%)]',
      'ellipse-top-left': '[mask-image:radial-gradient(ellipse_at_top_left,transparent,black_80%)]',
      'ellipse-top-right': '[mask-image:radial-gradient(ellipse_at_top_right,transparent,black_80%)]',
      'ellipse-bottom-left': '[mask-image:radial-gradient(ellipse_at_bottom_left,transparent,black_80%)]',
      'ellipse-bottom-right': '[mask-image:radial-gradient(ellipse_at_bottom_right,transparent,black_80%)]',
    },
  },
  defaultVariants: {
    mask: 'ellipse',
  },
})

export type PatternBgMaskVariants = VariantProps<typeof patternBgMaskVariants>

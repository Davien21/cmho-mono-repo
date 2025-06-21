// components/ui/responsive-dialog.tsx

import React from "react";
import { useMediaQuery } from "@/hooks/use-media-query";

import {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTrigger,
  DialogClose,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerContent,
  DrawerTrigger,
  DrawerClose,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";

export const ResponsiveDialog = {
  Root: (props: React.ComponentProps<typeof Dialog>) => {
    const isMobile = useMediaQuery("(max-width: 640px)");
    return isMobile ? <Drawer {...props} /> : <Dialog {...props} />;
  },

  Trigger: (props: React.ComponentProps<typeof DialogTrigger>) => {
    const isMobile = useMediaQuery("(max-width: 640px)");
    return isMobile ? (
      <DrawerTrigger {...props} />
    ) : (
      <DialogTrigger {...props} />
    );
  },

  Portal: (props: React.ComponentProps<typeof DialogPortal>) => {
    const isMobile = useMediaQuery("(max-width: 640px)");
    return isMobile ? <DrawerPortal {...props} /> : <DialogPortal {...props} />;
  },

  Overlay: React.forwardRef<
    React.ElementRef<typeof DialogOverlay>,
    React.ComponentPropsWithoutRef<typeof DialogOverlay>
  >((props, ref) => {
    const isMobile = useMediaQuery("(max-width: 640px)");
    return isMobile ? (
      <DrawerOverlay ref={ref} {...props} />
    ) : (
      <DialogOverlay ref={ref} {...props} />
    );
  }),

  Content: React.forwardRef<
    React.ElementRef<typeof DialogContent>,
    React.ComponentPropsWithoutRef<typeof DialogContent>
  >((props, ref) => {
    const isMobile = useMediaQuery("(max-width: 640px)");
    return isMobile ? (
      <DrawerContent ref={ref} {...props} />
    ) : (
      <DialogContent ref={ref} {...props} />
    );
  }),

  Header: (props: React.HTMLAttributes<HTMLDivElement>) => {
    const isMobile = useMediaQuery("(max-width: 640px)");
    return isMobile ? <DrawerHeader {...props} /> : <DialogHeader {...props} />;
  },

  Footer: (props: React.HTMLAttributes<HTMLDivElement>) => {
    const isMobile = useMediaQuery("(max-width: 640px)");
    return isMobile ? <DrawerFooter {...props} /> : <DialogFooter {...props} />;
  },

  Title: React.forwardRef<
    React.ElementRef<typeof DialogTitle>,
    React.ComponentPropsWithoutRef<typeof DialogTitle>
  >((props, ref) => {
    const isMobile = useMediaQuery("(max-width: 640px)");
    return isMobile ? (
      <DrawerTitle ref={ref} {...props} />
    ) : (
      <DialogTitle ref={ref} {...props} />
    );
  }),

  Description: React.forwardRef<
    React.ElementRef<typeof DialogDescription>,
    React.ComponentPropsWithoutRef<typeof DialogDescription>
  >((props, ref) => {
    const isMobile = useMediaQuery("(max-width: 640px)");
    return isMobile ? (
      <DrawerDescription ref={ref} {...props} />
    ) : (
      <DialogDescription ref={ref} {...props} />
    );
  }),

  Close: (props: React.ComponentProps<typeof DialogClose>) => {
    const isMobile = useMediaQuery("(max-width: 640px)");
    return isMobile ? <DrawerClose {...props} /> : <DialogClose {...props} />;
  },
};

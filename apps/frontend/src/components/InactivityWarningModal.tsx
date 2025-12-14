import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface InactivityWarningModalProps {
  open: boolean;
  warningDuration: number; // milliseconds
  onStayLoggedIn: () => void;
  onLogout: () => void;
}

export const InactivityWarningModal = ({
  open,
  warningDuration,
  onStayLoggedIn,
  onLogout,
}: InactivityWarningModalProps) => {
  const [countdown, setCountdown] = useState(Math.floor(warningDuration / 1000));

  useEffect(() => {
    if (!open) {
      setCountdown(Math.floor(warningDuration / 1000));
      return;
    }

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [open, warningDuration, onLogout]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onStayLoggedIn()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Are you still there?</DialogTitle>
          <DialogDescription className="space-y-3">
            <p>
              You've been inactive for a while. For security reasons, you'll be
              automatically logged out in <strong>{countdown} seconds</strong>.
            </p>
            <p className="text-sm text-muted-foreground">
              To stay logged in, click the button below or simply move your mouse,
              click anywhere, or press any key.
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button variant="outline" onClick={onLogout}>
            Log Out Now
          </Button>
          <Button onClick={onStayLoggedIn}>Stay Logged In</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


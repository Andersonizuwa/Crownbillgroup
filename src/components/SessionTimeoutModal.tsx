import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface SessionTimeoutModalProps {
  onLogout: () => void;
  onExtend: () => void;
  isOpen: boolean;
  timeRemaining: number;
}

const SessionTimeoutModal = ({ onLogout, onExtend, isOpen, timeRemaining }: SessionTimeoutModalProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(timeRemaining);

  useEffect(() => {
    if (isOpen && timeRemaining > 0) {
      setCountdown(timeRemaining);
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            handleLogout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isOpen, timeRemaining]);

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  const handleExtend = () => {
    onExtend();
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleExtend()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Session Expiring Soon</DialogTitle>
          <DialogDescription>
            Your session will expire in {countdown} seconds due to inactivity. 
            Would you like to extend your session?
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col space-y-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-destructive">{countdown}</div>
            <div className="text-sm text-muted-foreground">seconds remaining</div>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleLogout}>
            Log Out
          </Button>
          <Button onClick={handleExtend}>
            Extend Session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SessionTimeoutModal;
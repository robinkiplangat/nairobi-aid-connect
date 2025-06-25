import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface VolunteerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (code: string) => void;
}

export const VolunteerModal: React.FC<VolunteerModalProps> = ({
  isOpen,
  onClose,
  onVerify
}) => {
  const [code, setCode] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) {
      onVerify(code.trim());
      setCode('');
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md z-[200]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-center">Volunteer Verification</DialogTitle>
          <DialogDescription className="text-center text-gray-600 pt-2">
            Please enter your pre-shared verification code to offer assistance.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div>
            <label htmlFor="verification-code" className="block text-sm font-medium text-gray-700 mb-2">
              Enter your pre-shared verification code:
            </label>
            <Input
              ref={inputRef}
              id="verification-code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Verification code"
              className="w-full"
              autoComplete="off"
            />
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Demo codes:</strong> VOLUNTEER2024, MEDIC123, LEGAL456
            </p>
          </div>
          
          <div className="flex space-x-3">
            <Button type="submit" className="flex-1">
              Verify
            </Button>
            <Button type="button" onClick={onClose} variant="outline" className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

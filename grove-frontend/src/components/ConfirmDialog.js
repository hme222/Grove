import React from 'react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from './ui/alert-dialog';

// The one confirm step for anything that removes or cancels something. Replaces window.confirm so
// the question looks like the app, can be read by a screen reader, and always says what is kept.
// Safe choice on top and filled; the action is outlined, never the primary fill.
export default function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel, cancelLabel = 'Keep it', onConfirm, testId = 'confirm-dialog' }) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent data-testid={testId}>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid={`${testId}-cancel`} variant="default">{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction variant="outline" data-testid={`${testId}-confirm`} onClick={onConfirm}>{confirmLabel}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

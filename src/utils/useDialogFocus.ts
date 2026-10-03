import { useEffect } from 'react';

/** Keep keyboard navigation inside an open dialog and restore its trigger on close. */
export function useDialogFocus(open: boolean, id: string, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = document.getElementById(id);
    if (!dialog) return;
    const elements = () => Array.from(dialog.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]')).filter(element => element.getClientRects().length > 0);
    elements()[0]?.focus();
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); }
      if (event.key !== 'Tab') return;
      const list = elements();
      if (!list.length) { event.preventDefault(); return; }
      if (event.shiftKey && (document.activeElement === list[0] || !dialog.contains(document.activeElement))) {
        event.preventDefault(); list[list.length - 1].focus();
      } else if (!event.shiftKey && (document.activeElement === list[list.length - 1] || !dialog.contains(document.activeElement))) {
        event.preventDefault(); list[0].focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => { document.removeEventListener('keydown', handler); previous?.focus(); };
  }, [open, id, onClose]);
}

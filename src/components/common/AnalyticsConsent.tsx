import React, { useEffect, useState } from 'react';
import { getAnalyticsConsent, setAnalyticsConsent, trackPageView } from '../../utils/analytics';

export const AnalyticsConsent: React.FC<{ routeKey: string }> = ({ routeKey }) => {
  const [choice, setChoice] = useState(getAnalyticsConsent);
  const [open, setOpen] = useState(!choice);
  useEffect(() => { if (choice === 'granted') trackPageView(); }, [choice, routeKey]);
  const choose = (granted: boolean) => {
    setAnalyticsConsent(granted); setChoice(granted ? 'granted' : 'denied'); setOpen(false);
  };
  return open ? <section aria-label="Analytics preferences" className="fixed bottom-4 left-4 right-4 z-[70] max-w-lg rounded-xl border border-[#DDD6F3] bg-white p-4 text-sm text-[#1E1630] shadow-xl">
    <p>Allow Google Analytics to measure visits and shopping activity? You can use the store without optional analytics.</p>
    <div className="mt-3 flex flex-wrap gap-3">
      <button type="button" onClick={() => choose(false)} className="rounded-lg border border-[#7C3AED] px-4 py-2">Decline</button>
      <button type="button" onClick={() => choose(true)} className="rounded-lg bg-[#7C3AED] px-4 py-2 text-white">Allow analytics</button>
      <a href="/policies/privacy" className="self-center underline">Privacy information</a>
    </div>
  </section> : <button type="button" onClick={() => setOpen(true)} className="fixed bottom-2 left-2 z-40 rounded-lg border border-[#DDD6F3] bg-white px-3 py-1 text-xs text-[#1E1630] shadow-sm">Analytics preferences</button>;
};

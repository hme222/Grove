import React from 'react';
import { BadgeCheck } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

/**
 * Verified Pro checkmark — renders next to a username when the user has
 * BOTH `verified_user` and `verified_by_admin` set to true. This is
 * Grove's manually-verified Pro signal (Phase 14C identity layer) and is
 * deliberately distinct from the regular swap-eligible verification
 * (which uses `verified_user` alone and has its own treatment).
 *
 * Usage:
 *   <VerifiedProBadge user={{verified_user, verified_by_admin}} />
 *   <VerifiedProBadge verified_user={...} verified_by_admin={...} />
 *
 * Props
 *   user                  Optional user object that carries the two flags.
 *   verified_user         Direct flag override (e.g. on enriched feed items).
 *   verified_by_admin     Direct flag override.
 *   size                  Icon edge length in px (defaults to 14, matches
 *                         small body/font-medium text).
 *   className             Extra classes for the wrapper span (positioning).
 */
export default function VerifiedProBadge({
  user,
  verified_user: vuProp,
  verified_by_admin: vaProp,
  size = 14,
  className = '',
}) {
  const vu = vuProp ?? user?.verified_user;
  const va = vaProp ?? user?.verified_by_admin;
  if (!vu || !va) return null;

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            role="img"
            aria-label="Verified Pro"
            data-testid="verified-pro-badge"
            className={`inline-flex items-center justify-center text-[#3B6D11] flex-shrink-0 ${className}`}
            onClick={(e) => e.stopPropagation()}
          >
            <BadgeCheck
              style={{ width: size, height: size }}
              strokeWidth={2.25}
              aria-hidden="true"
            />
          </span>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          align="center"
          className="bg-[#1C2E10] text-[#F4ECD9] text-[11px] font-ui px-2 py-1 rounded-[4px] border-0"
        >
          Verified Pro — manually verified by Grove
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

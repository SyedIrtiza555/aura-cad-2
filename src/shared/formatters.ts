import type { SpecimenType } from './types';

/**
 * Beautiful Ergonomic Date Formatter for Aura CAD
 * Format: 13 Oct, Tue - 05:36am
 * If in year start/end months (Nov, Dec, Jan, Feb): includes short year e.g. 13 Nov, Wed, '26 - 05:14pm
 */
export function formatOrderDate(timestamp: number | Date | undefined): string {
  if (!timestamp) return '—';
  const d = typeof timestamp === 'number' ? new Date(timestamp) : timestamp;
  if (isNaN(d.getTime())) return '—';

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const day = d.getDate();
  const monthIdx = d.getMonth();
  const month = months[monthIdx];
  const weekday = days[d.getDay()];

  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const hoursStr = String(hours).padStart(2, '0');

  // November (10), December (11), January (0), February (1)
  const isYearEndOrStart = monthIdx === 10 || monthIdx === 11 || monthIdx === 0 || monthIdx === 1;
  const yearShort = String(d.getFullYear()).slice(-2);

  if (isYearEndOrStart) {
    return `${day} ${month}, ${weekday}, '${yearShort} - ${hoursStr}:${minutes}${ampm}`;
  }
  return `${day} ${month}, ${weekday} - ${hoursStr}:${minutes}${ampm}`;
}

/**
 * Order Code Formatter
 * Format: <Designer 2-lettered Code>-<Prospect 2-lettered Code>-<Order Title>
 * Example: FA-PA-Three Stone Ring
 */
export function formatOrderCode(
  designerInitials: string | undefined,
  clientName: string,
  title: string
): string {
  // Designer 2-letter code
  let dCode = 'UN';
  if (designerInitials && designerInitials.trim()) {
    dCode = designerInitials.trim().slice(0, 2).toUpperCase();
  }

  // Prospect 2-letter code
  let pCode = 'CL';
  if (clientName && clientName.trim()) {
    const parts = clientName.trim().split(/\s+/);
    if (parts.length >= 2) {
      pCode = (parts[0][0] + parts[1][0]).toUpperCase();
    } else if (parts[0].length >= 2) {
      pCode = parts[0].slice(0, 2).toUpperCase();
    } else {
      pCode = (parts[0][0] + 'X').toUpperCase();
    }
  }

  const cleanTitle = (title || 'Untitled').trim();
  return `${dCode}-${pCode}-${cleanTitle}`;
}

/**
 * Canonical 5-Status normalizer
 * Yellow: Inbox
 * Orange: In progress
 * Blue: In Review
 * Green: Delivered
 * Grey: Backlog
 */
export type CanonicalStatus = 'Inbox' | 'In progress' | 'In Review' | 'Delivered' | 'Backlog';

export function normalizeStatus(rawStatus?: string): CanonicalStatus {
  if (!rawStatus) return 'Inbox';
  switch (rawStatus) {
    case 'Inbox':
    case 'SUBMITTED_TO_ADMIN':
      return 'Inbox';

    case 'In progress':
    case 'ASSIGNED_TO_DESIGNER':
    case 'IN_PRODUCTION':
      return 'In progress';

    case 'In Review':
    case 'ADMIN_REVIEW':
    case 'IN_REVISION':
      return 'In Review';

    case 'Delivered':
    case 'DELIVERED':
    case 'COMPLETED':
      return 'Delivered';

    case 'Backlog':
    case 'RETURNED_TO_AGENT':
      return 'Backlog';

    default:
      return 'Inbox';
  }
}

export interface StatusStyle {
  label: CanonicalStatus;
  colorName: string;
  badgeClass: string;
  dotClass: string;
  headerClass: string;
}

export function getStatusStyle(rawStatus?: string): StatusStyle {
  const status = normalizeStatus(rawStatus);
  switch (status) {
    case 'Inbox':
      return {
        label: 'Inbox',
        colorName: 'Yellow',
        badgeClass: 'bg-amber-100/90 text-amber-900 border-amber-300 font-semibold shadow-xs',
        dotClass: 'bg-amber-500',
        headerClass: 'border-l-4 border-l-amber-500',
      };
    case 'In progress':
      return {
        label: 'In progress',
        colorName: 'Orange',
        badgeClass: 'bg-orange-100/90 text-orange-900 border-orange-300 font-semibold shadow-xs',
        dotClass: 'bg-orange-500',
        headerClass: 'border-l-4 border-l-orange-500',
      };
    case 'In Review':
      return {
        label: 'In Review',
        colorName: 'Blue',
        badgeClass: 'bg-sky-100/90 text-sky-900 border-sky-300 font-semibold shadow-xs',
        dotClass: 'bg-sky-500',
        headerClass: 'border-l-4 border-l-sky-500',
      };
    case 'Delivered':
      return {
        label: 'Delivered',
        colorName: 'Green',
        badgeClass: 'bg-emerald-100/90 text-emerald-900 border-emerald-300 font-semibold shadow-xs',
        dotClass: 'bg-emerald-500',
        headerClass: 'border-l-4 border-l-emerald-500',
      };
    case 'Backlog':
      return {
        label: 'Backlog',
        colorName: 'Grey',
        badgeClass: 'bg-slate-100/90 text-slate-800 border-slate-300 font-semibold shadow-xs',
        dotClass: 'bg-slate-400',
        headerClass: 'border-l-4 border-l-slate-400',
      };
  }
}

export const ORDER_STATUSES: CanonicalStatus[] = [
  'Inbox',
  'In progress',
  'In Review',
  'Delivered',
  'Backlog',
];

export const SPECIMEN_TYPES: SpecimenType[] = [
  'Ring',
  'Bracelet',
  'Pendant',
  'Earring',
  'Grills',
  'Necklace',
];

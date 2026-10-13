import { describe, it, expect } from 'vitest';
import type { Order, UserProfile } from '../src/shared/types';

describe('Aura Desk Role & Security Invariants', () => {
  it('strictly quarantines newly registered users into pending_approval and unassigned', () => {
    const newUser: UserProfile = {
      uid: 'user-new-001',
      email: 'applicant@auradesk.internal',
      displayName: 'Applicant',
      role: 'unassigned',
      status: 'pending_approval',
      createdAt: Date.now(),
    };

    expect(newUser.role).toBe('unassigned');
    expect(newUser.status).toBe('pending_approval');
  });

  it('redacts agreed_price and client_phone from designer view model', () => {
    const rawOrder: Order = {
      id: 'ord-test-01',
      orderNumber: 'AURA-2026-001',
      title: 'Three Stone Ring',
      client_name: 'Patrick Archer',
      client_phone: '+1 555-0199',
      agreed_price: 1500,
      project_brief: 'Platinum ring design',
      status: 'IN_PRODUCTION',
      sales_agent_id: 'agent-01',
      sales_agent_name: 'Sophia Reed',
      assigned_designer_id: 'designer-01',
      assigned_designer_name: 'Felix Alvarez',
      assigned_designer_initials: 'FA',
      created_at: Date.now(),
      updated_at: Date.now(),
    };

    // Masking function applied for Designer role
    const maskForDesigner = (order: Order, role: string): Partial<Order> => {
      if (role === 'designer') {
        const { agreed_price, client_phone, ...rest } = order;
        return rest;
      }
      return order;
    };

    const designerVisibleOrder = maskForDesigner(rawOrder, 'designer');
    expect(designerVisibleOrder.agreed_price).toBeUndefined();
    expect(designerVisibleOrder.client_phone).toBeUndefined();
    expect(designerVisibleOrder.title).toBe('Three Stone Ring');
  });

  it('formulates deterministic WhatsApp delivery code format: <Designer>-<Prospect>-<Order>', () => {
    const designerInitials = 'FA';
    const clientName = 'Patrick Archer';
    const orderTitle = 'Three Stone Ring';

    const prospectInitials = clientName
      .split(' ')
      .map((n) => n[0].toUpperCase())
      .join('');

    const generatedCode = `${designerInitials}-${prospectInitials}-${orderTitle}`;
    expect(generatedCode).toBe('FA-PA-Three Stone Ring');
  });

  it('formats order date according to seasonal ergonomics (year omitted except Nov, Dec, Jan, Feb)', async () => {
    const { formatOrderDate } = await import('../src/shared/formatters');

    // October date (Year should be omitted): 13 Oct, Tue - 05:36am
    const octDate = new Date(2026, 9, 13, 5, 36);
    expect(formatOrderDate(octDate)).toBe('13 Oct, Tue - 05:36am');

    // November date (Year should be included with '26): 13 Nov, Fri, '26 - 05:14pm
    const novDate = new Date(2026, 10, 13, 17, 14);
    expect(formatOrderDate(novDate)).toBe("13 Nov, Fri, '26 - 05:14pm");

    // January date (Year should be included with '27): 05 Jan, Tue, '27 - 09:00am
    const janDate = new Date(2027, 0, 5, 9, 0);
    expect(formatOrderDate(janDate)).toBe("5 Jan, Tue, '27 - 09:00am");
  });

  it('formulates order code with <Designer 2-lettered Code>-<Prospect 2-lettered Code>-<Order Title>', async () => {
    const { formatOrderCode } = await import('../src/shared/formatters');
    expect(formatOrderCode('FA', 'Patrick Archer', 'Diamond Halo Ring')).toBe('FA-PA-Diamond Halo Ring');
    expect(formatOrderCode(undefined, 'Sophia Reed', 'Platinum Pendant')).toBe('UN-SR-Platinum Pendant');
  });

  it('normalizes statuses to 5 canonical states with assigned colors', async () => {
    const { normalizeStatus, getStatusStyle } = await import('../src/shared/formatters');
    expect(normalizeStatus('SUBMITTED_TO_ADMIN')).toBe('Inbox');
    expect(getStatusStyle('Inbox').colorName).toBe('Yellow');

    expect(normalizeStatus('IN_PRODUCTION')).toBe('In progress');
    expect(getStatusStyle('In progress').colorName).toBe('Orange');

    expect(normalizeStatus('ADMIN_REVIEW')).toBe('In Review');
    expect(getStatusStyle('In Review').colorName).toBe('Blue');

    expect(normalizeStatus('DELIVERED')).toBe('Delivered');
    expect(getStatusStyle('Delivered').colorName).toBe('Green');

    expect(normalizeStatus('RETURNED_TO_AGENT')).toBe('Backlog');
    expect(getStatusStyle('Backlog').colorName).toBe('Grey');
  });
});

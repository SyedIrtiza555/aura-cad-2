import { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../../shared/firebase';
import type { Order, UserProfile, OrderStatus, UserRole } from '../../shared/types';
import { useUIStore } from '../../shared/store';
import { Button, Input, Badge, DeleteConfirmModal } from '../../shared/ui';
import { dispatchNativeNotification } from '../../shared/notifications';
import { formatOrderCode, normalizeStatus } from '../../shared/formatters';
import { OrderDetail } from './OrderDetail';
import { NewOrderModal } from './NewOrderModal';
import { SafetyCheckModal } from './SafetyCheckModal';
import { EscalateModal } from './EscalateModal';
import { LeftSidebar } from './LeftSidebar';
import { ViewSwitcherToolbar } from './views/ViewSwitcherToolbar';
import { TableView } from './views/TableView';
import { KanbanStatusView } from './views/KanbanStatusView';
import { KanbanResourceView } from './views/KanbanResourceView';
import { CardsGridView } from './views/CardsGridView';
import { CalendarView } from './views/CalendarView';
import { EditUserModal } from '../team/EditUserModal';
import { Search, Plus, Palette, Briefcase, Users, Shield, Check, UserX, Pencil, Trash2 } from 'lucide-react';

export function OrderDashboard({ teamUsers }: { teamUsers: UserProfile[] }) {
  const currentUser = useUIStore((s) => s.currentUser);
  const selectedOrderId = useUIStore((s) => s.selectedOrderId);
  const setSelectedOrder = useUIStore((s) => s.setSelectedOrder);
  const openNewOrderModal = useUIStore((s) => s.openNewOrderModal);
  const searchQuery = useUIStore((s) => s.searchQuery);
  const setSearchQuery = useUIStore((s) => s.setSearchQuery);
  const statusFilter = useUIStore((s) => s.statusFilter);
  const setStatusFilter = useUIStore((s) => s.setStatusFilter);
  const activeViewMode = useUIStore((s) => s.activeViewMode);
  const activeEntity = useUIStore((s) => s.activeEntity);

  // Clean state directly from Firestore (no hardcoded pre-seeded fake orders)
  const [orders, setOrders] = useState<Order[]>([]);

  // User editing & deletion states
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null);
  const [isDeleteUserModalOpen, setIsDeleteUserModalOpen] = useState(false);

  useEffect(() => {
    try {
      const unsub = onSnapshot(collection(db, 'orders'), (snapshot) => {
        const list: Order[] = [];
        snapshot.forEach((d) => {
          list.push(d.data() as Order);
        });
        list.sort((a, b) => b.created_at - a.created_at);
        setOrders(list);
      });
      return () => unsub();
    } catch (e) {
      console.warn('[Aura Desk] Firestore orders listener:', e);
    }
  }, []);

  const isDesigner = currentUser?.role === 'designer';
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'owner';
  const isAgent = currentUser?.role === 'sales_agent';

  // Strict Role Filtering
  const visibleOrders = orders.filter((o) => {
    if (isDesigner) {
      return o.assigned_designer_id === currentUser?.uid;
    }
    return true;
  });

  const filteredOrders = visibleOrders.filter((order) => {
    const matchesSearch =
      order.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.client_name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' ||
      order.status === statusFilter ||
      normalizeStatus(order.status) === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const selectedOrder = orders.find((o) => o.id === selectedOrderId) || null;

  const handleCreateOrder = async (orderData: Partial<Order>) => {
    const newId = `ord-${Date.now()}`;
    const newOrderNumber =
      orderData.orderNumber ||
      formatOrderCode(
        orderData.assigned_designer_initials,
        orderData.client_name || 'Client',
        orderData.title || 'Order'
      );

    const fullOrder: Order = {
      ...(orderData as Order),
      id: newId,
      orderNumber: newOrderNumber,
    };

    setOrders((prev) => [fullOrder, ...prev]);

    await dispatchNativeNotification(
      'Order Landed',
      `New Order: ${fullOrder.title} submitted by ${fullOrder.sales_agent_name}`
    );

    try {
      await setDoc(doc(db, 'orders', newId), fullOrder);

      const dayDate = new Date().toISOString().split('T')[0];
      await setDoc(doc(db, 'order_snapshots', `${newId}-${dayDate}`), {
        order_id: newId,
        date_key: dayDate,
        day_number: 1,
        timestamp: Date.now(),
        snapshot_payload: fullOrder,
      });
    } catch (err) {
      console.warn('Persisted to local cache:', err);
    }
  };

  const handleUpdateOrder = async (updatedFields: Partial<Order>) => {
    const targetOrder =
      selectedOrder || orders.find((o) => o.id === updatedFields.id);
    if (!targetOrder) return;

    const previousStatus = targetOrder.status;

    // Automatically synchronize order code if designer or prospect or title changes
    let nextOrderNumber = updatedFields.orderNumber || targetOrder.orderNumber;
    if (
      updatedFields.assigned_designer_initials !== undefined ||
      updatedFields.client_name !== undefined ||
      updatedFields.title !== undefined
    ) {
      const dInitials =
        updatedFields.assigned_designer_initials !== undefined
          ? updatedFields.assigned_designer_initials
          : targetOrder.assigned_designer_initials;
      const cName =
        updatedFields.client_name !== undefined
          ? updatedFields.client_name
          : targetOrder.client_name;
      const oTitle =
        updatedFields.title !== undefined ? updatedFields.title : targetOrder.title;
      nextOrderNumber =
        updatedFields.orderNumber || formatOrderCode(dInitials, cName, oTitle);
    }

    const merged: Order = {
      ...targetOrder,
      ...updatedFields,
      orderNumber: nextOrderNumber,
    };

    setOrders((prev) => prev.map((o) => (o.id === merged.id ? merged : o)));
    if (selectedOrderId === merged.id) {
      setSelectedOrder(merged);
    }

    if (
      updatedFields.status === 'ASSIGNED_TO_DESIGNER' &&
      previousStatus !== 'ASSIGNED_TO_DESIGNER'
    ) {
      await dispatchNativeNotification(
        'New Assignment',
        `You have been assigned to ${merged.title}`
      );
    }

    if (
      updatedFields.status === 'RETURNED_TO_AGENT' &&
      previousStatus !== 'RETURNED_TO_AGENT'
    ) {
      await dispatchNativeNotification(
        'Action Required',
        `${merged.title} returned to your court`
      );
    }

    try {
      await Promise.race([
        updateDoc(doc(db, 'orders', merged.id), updatedFields),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Update timeout')), 3000)),
      ]);

      const dayDate = new Date().toISOString().split('T')[0];
      setDoc(doc(db, 'order_snapshots', `${merged.id}-${dayDate}`), {
        order_id: merged.id,
        date_key: dayDate,
        day_number: Math.max(
          1,
          Math.ceil((Date.now() - merged.created_at) / 86400000)
        ),
        timestamp: Date.now(),
        snapshot_payload: merged,
      }).catch(console.warn);
    } catch (e) {
      console.warn('Order update persisted locally:', e);
    }
  };

  const handleConfirmDelivery = async (orderWithCode: Order) => {
    await handleUpdateOrder({
      id: orderWithCode.id,
      status: 'DELIVERED',
      delivery_code: orderWithCode.delivery_code,
      delivered_at: orderWithCode.delivered_at,
    });
  };

  const handleConfirmEscalate = async (targetOrder: Order, note: string) => {
    if (!targetOrder) return;
    await handleUpdateOrder({
      id: targetOrder.id,
      status: 'RETURNED_TO_AGENT',
      escalation_note: note,
    });
  };

  const designerCount = teamUsers.filter((u) => u.role === 'designer').length;
  const agentCount = teamUsers.filter((u) => u.role === 'sales_agent').length;
  const uniqueProspects = Array.from(
    new Set(orders.map((o) => o.client_name))
  ).length;

  const handleUpdateRole = async (targetUid: string, newRole: UserRole) => {
    try {
      await setDoc(
        doc(db, 'users', targetUid),
        {
          role: newRole,
          status: 'active',
          approvedAt: Date.now(),
          approvedBy: currentUser?.displayName || 'Owner',
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('Firestore update role error:', err);
    }
  };

  const handleSuspend = async (targetUid: string) => {
    try {
      await setDoc(
        doc(db, 'users', targetUid),
        {
          status: 'suspended',
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('Firestore suspend user error:', err);
    }
  };

  const handleReactivate = async (targetUid: string) => {
    try {
      await setDoc(
        doc(db, 'users', targetUid),
        {
          status: 'active',
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('Firestore reactivate user error:', err);
    }
  };

  const handleSaveUser = async (updatedData: Partial<UserProfile> & { uid: string }) => {
    await setDoc(doc(db, 'users', updatedData.uid), updatedData, { merge: true });
  };

  const handleDeleteUser = async (uid: string) => {
    await deleteDoc(doc(db, 'users', uid));
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!isAdmin) return;
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    if (selectedOrderId === orderId) {
      setSelectedOrder(null);
    }
    try {
      await deleteDoc(doc(db, 'orders', orderId));
      await dispatchNativeNotification(
        'Order Deleted',
        `Order ${orderId} has been removed from system.`
      );
    } catch (e) {
      console.warn('Failed to delete order from Firestore:', e);
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-[#F5F5F7] select-none relative">
      {/* 1. Left Collapsible Entities Sidebar */}
      <LeftSidebar
        orderCount={orders.length}
        designerCount={designerCount}
        agentCount={agentCount}
        prospectCount={uniqueProspects}
        invoiceCount={orders.length}
        teamCount={teamUsers.length}
      />

      {/* 2. Main Central Work Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Simple Top Bar without visual clutter */}
        <div className="px-5 py-3 border-b border-slate-200/60 bg-white/60 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 flex-1 max-w-sm">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8.5 py-1 text-xs"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'ALL')}
              className="bg-white/80 border border-slate-200 rounded-xl text-xs px-2.5 py-1 text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Status</option>
              <option value="SUBMITTED_TO_ADMIN">Submitted</option>
              <option value="RETURNED_TO_AGENT">Returned</option>
              <option value="ASSIGNED_TO_DESIGNER">Assigned</option>
              <option value="IN_PRODUCTION">Production</option>
              <option value="ADMIN_REVIEW">Review</option>
              <option value="IN_REVISION">Revision</option>
              <option value="DELIVERED">Delivered</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          {(isAgent || isAdmin) && (
            <Button
              size="sm"
              variant="primary"
              onClick={openNewOrderModal}
              className="text-xs py-1"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> New Intake
            </Button>
          )}
        </div>

        {/* Dynamic View Engine */}
        <div className="flex-1 overflow-hidden flex flex-col relative">
          {activeEntity !== 'orders' ? (
            <div className="flex-1 p-6 overflow-y-auto pb-24">
              <div className="max-w-4xl mx-auto space-y-4">
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
                  {activeEntity === 'team' && <Shield className="w-3.5 h-3.5 text-slate-600" />}
                  Registry: {activeEntity}
                </div>

                {activeEntity === 'designers' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                    {teamUsers.filter((u) => u.role === 'designer').length === 0 ? (
                      <div className="text-xs text-slate-400 italic">No designers registered yet.</div>
                    ) : (
                      teamUsers
                        .filter((u) => u.role === 'designer')
                        .map((d) => (
                          <div
                            key={d.uid}
                            className="bg-white border border-slate-200/80 p-4 rounded-2xl space-y-2 shadow-xs"
                          >
                            <div className="flex items-center gap-3">
                              {d.photoUrl ? (
                                <img
                                  src={d.photoUrl}
                                  alt={d.displayName}
                                  className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-mono text-xs font-bold">
                                  {d.initials || d.displayName.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <Palette className="w-3.5 h-3.5 text-slate-500" />
                                  <span className="font-semibold text-[#1C1D21] text-xs">
                                    {d.displayName}
                                  </span>
                                </div>
                                <p className="text-[11px] text-[#6B7280]">{d.email}</p>
                              </div>
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono pt-1 border-t border-slate-100">
                              Active: {orders.filter((o) => o.assigned_designer_id === d.uid).length} orders
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                )}

                {activeEntity === 'agents' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                    {teamUsers.filter((u) => u.role === 'sales_agent').length === 0 ? (
                      <div className="text-xs text-slate-400 italic">No sales agents registered yet.</div>
                    ) : (
                      teamUsers
                        .filter((u) => u.role === 'sales_agent')
                        .map((a) => (
                          <div
                            key={a.uid}
                            className="bg-white border border-slate-200/80 p-4 rounded-2xl space-y-2 shadow-xs"
                          >
                            <div className="flex items-center gap-3">
                              {a.photoUrl ? (
                                <img
                                  src={a.photoUrl}
                                  alt={a.displayName}
                                  className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-mono text-xs font-bold">
                                  {a.initials || a.displayName.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                                  <span className="font-semibold text-[#1C1D21] text-xs">
                                    {a.displayName}
                                  </span>
                                </div>
                                <p className="text-[11px] text-[#6B7280]">{a.email}</p>
                              </div>
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono pt-1 border-t border-slate-100">
                              Intakes: {orders.filter((o) => o.sales_agent_id === a.uid).length} orders
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                )}

                {activeEntity === 'prospects' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                    {uniqueProspects === 0 ? (
                      <div className="text-xs text-slate-400 italic">No clients registered yet.</div>
                    ) : (
                      Array.from(new Set(orders.map((o) => o.client_name))).map((name) => (
                        <div
                          key={name}
                          className="bg-white border border-slate-200/80 p-4 rounded-2xl space-y-1 shadow-xs"
                        >
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-slate-500" />
                            <span className="font-semibold text-[#1C1D21] text-xs">{name}</span>
                          </div>
                          <div className="text-[11px] text-[#6B7280]">
                            Orders: {orders.filter((o) => o.client_name === name).length}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeEntity === 'team' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-1">
                      <p className="text-xs text-[#6B7280]">
                        Manage user permissions, assign agency roles, and approve new member signups.
                      </p>
                      <span className="text-[11px] font-mono text-slate-500">
                        Total Users: {teamUsers.length}
                      </span>
                    </div>

                    {teamUsers.length === 0 ? (
                      <div className="text-xs text-slate-400 italic">No registered users in database.</div>
                    ) : (
                      <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-2xl overflow-hidden bg-white shadow-xs">
                        {teamUsers.map((member) => {
                          const isMemberTrueOwner = member.email?.toLowerCase().includes('shahrukh');
                          const isPending = member.status === 'pending_approval' || member.role === 'unassigned';
                          const canManage =
                            currentUser?.role === 'owner' &&
                            (currentUser?.email?.toLowerCase().includes('shahrukh') ?? false);

                          return (
                            <div
                              key={member.uid}
                              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                {member.photoUrl ? (
                                  <img
                                    src={member.photoUrl}
                                    alt={member.displayName}
                                    className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                                  />
                                ) : (
                                  <div className="w-9 h-9 rounded-full bg-[#1C1D21] text-white flex items-center justify-center text-xs font-bold font-mono shrink-0">
                                    {member.initials || member.displayName.slice(0, 2).toUpperCase()}
                                  </div>
                                )}
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-xs text-[#1C1D21]">
                                      {member.displayName}
                                    </span>
                                    {isMemberTrueOwner && (
                                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 text-white font-medium">
                                        Owner
                                      </span>
                                    )}
                                    {isPending && (
                                      <Badge variant="warning" className="text-[9px]">
                                        Pending Approval
                                      </Badge>
                                    )}
                                    {member.status === 'suspended' && (
                                      <Badge variant="danger" className="text-[9px]">
                                        Suspended
                                      </Badge>
                                    )}
                                    {member.status === 'active' && !isMemberTrueOwner && !isPending && (
                                      <Badge variant="success" className="text-[9px]">
                                        Active
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-[#6B7280]">{member.email}</div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                {isMemberTrueOwner ? (
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-slate-500 px-3 py-1 bg-slate-100 rounded-lg">
                                      Full Access
                                    </span>
                                    {canManage && (
                                      <button
                                        onClick={() => {
                                          setEditingUser(member);
                                          setIsEditUserModalOpen(true);
                                        }}
                                        title="Edit Profile"
                                        className="p-1.5 text-slate-400 hover:text-[#1C1D21] hover:bg-slate-100 rounded-lg transition-colors"
                                      >
                                        <Pencil className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                ) : canManage ? (
                                  <div className="flex items-center gap-1.5">
                                    <select
                                      value={member.role}
                                      onChange={(e) =>
                                        handleUpdateRole(member.uid, e.target.value as UserRole)
                                      }
                                      className="bg-white border border-slate-200 rounded-lg text-xs px-2.5 py-1 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-slate-300"
                                    >
                                      <option value="unassigned">Unassigned</option>
                                      <option value="sales_agent">Sales Agent</option>
                                      <option value="designer">Designer</option>
                                      <option value="admin">Admin</option>
                                    </select>

                                    {isPending && (
                                      <Button
                                        size="sm"
                                        variant="primary"
                                        onClick={() => handleUpdateRole(member.uid, 'designer')}
                                        className="text-xs py-1"
                                      >
                                        <Check className="w-3 h-3 mr-1" /> Approve
                                      </Button>
                                    )}

                                    {member.status === 'active' && !isPending && (
                                      <button
                                        onClick={() => handleSuspend(member.uid)}
                                        title="Suspend User"
                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                      >
                                        <UserX className="w-3.5 h-3.5" />
                                      </button>
                                    )}

                                    {member.status === 'suspended' && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleReactivate(member.uid)}
                                        className="text-xs py-1"
                                      >
                                        Reactivate
                                      </Button>
                                    )}

                                    <button
                                      onClick={() => {
                                        setEditingUser(member);
                                        setIsEditUserModalOpen(true);
                                      }}
                                      title="Edit Member (Name, Email, Username, Role)"
                                      className="p-1.5 text-slate-400 hover:text-[#1C1D21] hover:bg-slate-100 rounded-lg transition-colors"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                      onClick={() => {
                                        setDeletingUser(member);
                                        setIsDeleteUserModalOpen(true);
                                      }}
                                      title="Delete Member"
                                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-xs text-slate-600 font-medium capitalize">
                                    {member.role.replace('_', ' ')}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {activeEntity === 'invoices' && !isDesigner && (
                  <div className="space-y-2.5">
                    {orders.length === 0 ? (
                      <div className="text-xs text-slate-400 italic">No invoices recorded yet.</div>
                    ) : (
                      orders.map((o) => (
                        <div
                          key={o.id}
                          onClick={() => setSelectedOrder(o, 'side')}
                          className="bg-white border border-slate-200/80 p-3.5 rounded-2xl flex items-center justify-between cursor-pointer hover:border-slate-300 shadow-xs"
                        >
                          <div>
                            <span className="font-mono text-xs text-[#1C1D21] font-bold">
                              INV-{o.orderNumber}
                            </span>
                            <div className="font-medium text-xs text-[#1C1D21]">{o.title}</div>
                            <div className="text-[11px] text-[#6B7280]">{o.client_name}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-emerald-700 font-bold text-sm font-mono">
                              ${(o.agreed_price || 0).toLocaleString()}
                            </div>
                            <span className="text-[10px] font-mono text-slate-400">
                              {o.status}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : activeViewMode === 'table' ? (
            <TableView
              orders={filteredOrders}
              teamUsers={teamUsers}
              onUpdateOrder={handleUpdateOrder}
              onDeleteOrder={handleDeleteOrder}
            />
          ) : activeViewMode === 'kanban_status' ? (
            <KanbanStatusView
              orders={filteredOrders}
              teamUsers={teamUsers}
              onUpdateOrder={handleUpdateOrder}
            />
          ) : activeViewMode === 'kanban_resource' ? (
            <KanbanResourceView
              orders={filteredOrders}
              teamUsers={teamUsers}
              onUpdateOrder={handleUpdateOrder}
            />
          ) : activeViewMode === 'cards' ? (
            <CardsGridView
              orders={filteredOrders}
              teamUsers={teamUsers}
              onUpdateOrder={handleUpdateOrder}
              onDeleteOrder={handleDeleteOrder}
            />
          ) : (
            <CalendarView
              orders={filteredOrders}
              teamUsers={teamUsers}
              onUpdateOrder={handleUpdateOrder}
            />
          )}

          {/* Floating Glassmorphic View Switcher just above bottom edge */}
          {activeEntity === 'orders' && <ViewSwitcherToolbar />}
        </div>
      </div>

      {/* Selected Order Detail (Side, Center, Full) */}
      {selectedOrder && (
        <OrderDetail
          order={selectedOrder}
          teamUsers={teamUsers}
          onUpdateOrder={handleUpdateOrder}
          onDeleteOrder={handleDeleteOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}

      {/* Clean Modals */}
      <NewOrderModal onCreateOrder={handleCreateOrder} />
      <SafetyCheckModal onConfirmDelivery={handleConfirmDelivery} />
      <EscalateModal onConfirmEscalate={handleConfirmEscalate} />

      {/* Edit User Modal */}
      <EditUserModal
        user={editingUser}
        isOpen={isEditUserModalOpen}
        onClose={() => {
          setIsEditUserModalOpen(false);
          setEditingUser(null);
        }}
        onSave={handleSaveUser}
        onDelete={handleDeleteUser}
        isCurrentSuperOwner={currentUser?.role === 'owner' && (currentUser?.email?.toLowerCase().includes('shahrukh') ?? false)}
      />

      {/* Delete User Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteUserModalOpen}
        title="Delete Team Member"
        description="Are you sure you want to permanently remove this user? Their account and access permissions will be deleted from the system."
        itemName={deletingUser ? `${deletingUser.displayName} (${deletingUser.email})` : undefined}
        requireTypedText="DELETE"
        onConfirm={async () => {
          if (deletingUser) {
            await handleDeleteUser(deletingUser.uid);
          }
        }}
        onClose={() => {
          setIsDeleteUserModalOpen(false);
          setDeletingUser(null);
        }}
      />
    </div>
  );
}

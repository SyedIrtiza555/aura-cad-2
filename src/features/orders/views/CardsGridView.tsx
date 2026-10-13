import type { Order, UserProfile } from '../../../shared/types';
import { useUIStore } from '../../../shared/store';
import { DeleteConfirmModal, ImageCarousel } from '../../../shared/ui';
import { useState } from 'react';
import {
  User,
  DollarSign,
  PanelRightOpen,
  AppWindow,
  Maximize2,
  Trash2,
  Calendar,
} from 'lucide-react';
import { getStatusStyle, formatOrderDate } from '../../../shared/formatters';

interface CardsGridViewProps {
  orders: Order[];
  teamUsers: UserProfile[];
  onUpdateOrder: (updated: Partial<Order>) => Promise<void>;
  onDeleteOrder?: (orderId: string) => Promise<void> | void;
}

export function CardsGridView({ orders, onDeleteOrder }: CardsGridViewProps) {
  const currentUser = useUIStore((s) => s.currentUser);
  const setSelectedOrder = useUIStore((s) => s.setSelectedOrder);
  const selectedOrderId = useUIStore((s) => s.selectedOrderId);
  const [deletingOrder, setDeletingOrder] = useState<Order | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const isDesigner = currentUser?.role === 'designer';
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'owner';

  return (
    <div className="flex-1 overflow-y-auto p-5 pb-24 bg-[#F5F5F7] select-none">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {orders.map((order) => {
          const isSelected = selectedOrderId === order.id;

          return (
            <div
              key={order.id}
              onClick={() => setSelectedOrder(order, 'side')}
              className={`p-4 rounded-3xl border transition-all cursor-pointer bg-white/80 hover:bg-white hover:border-slate-300 flex flex-col justify-between shadow-xs group ${
                isSelected
                  ? 'border-[#1C1D21] ring-1 ring-[#1C1D21]'
                  : 'border-slate-200/80'
              }`}
            >
              <div className="space-y-2.5">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#1C1D21] truncate max-w-[170px]">
                    {order.orderNumber}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusStyle(order.status).badgeClass}`}>
                    {getStatusStyle(order.status).label}
                  </span>
                </div>

                {/* Photo Carousel Thumbnail */}
                <ImageCarousel images={order.images} compact className="mb-2" />

                <h4 className="text-sm font-semibold text-[#1C1D21] line-clamp-1">
                  {order.title}
                </h4>

                <div className="flex items-center justify-between text-xs">
                  <div className="text-[#6B7280] flex items-center gap-1.5 truncate max-w-[150px]">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{order.client_name}</span>
                  </div>
                  {order.specimen_type && (
                    <span className="text-[10px] font-medium bg-slate-100 px-2 py-0.5 rounded-md text-slate-600 border border-slate-200/60 shrink-0">
                      {order.specimen_type}
                    </span>
                  )}
                </div>

                <p className="text-xs text-[#4B5563] line-clamp-3 leading-relaxed bg-slate-50/70 p-2.5 rounded-2xl border border-slate-100">
                  {order.project_brief}
                </p>
              </div>

              {/* Footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    {order.assigned_designer_name ? (
                      <div
                        title={`Designer: ${order.assigned_designer_name}`}
                        className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[9px] font-bold font-mono"
                      >
                        {order.assigned_designer_initials ||
                          order.assigned_designer_name.slice(0, 2).toUpperCase()}
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-[9px]">
                        ?
                      </div>
                    )}
                    <span className="text-[11px] text-[#6B7280]">
                      {order.assigned_designer_name || 'Unassigned'}
                    </span>
                  </div>

                  {!isDesigner ? (
                    <span className="font-bold text-emerald-700 flex items-center font-mono">
                      <DollarSign className="w-3 h-3" />
                      {(order.agreed_price || 0).toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">[Masked]</span>
                  )}
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <div className="flex items-center gap-1 text-slate-500">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>{formatOrderDate(order.created_at)}</span>
                  </div>

                  <div
                    className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => setSelectedOrder(order, 'side')}
                      className="p-0.5 text-slate-400 hover:text-[#1C1D21]"
                    >
                      <PanelRightOpen className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => setSelectedOrder(order, 'center')}
                      className="p-0.5 text-slate-400 hover:text-[#1C1D21]"
                    >
                      <AppWindow className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => setSelectedOrder(order, 'full')}
                      className="p-0.5 text-slate-400 hover:text-[#1C1D21]"
                    >
                      <Maximize2 className="w-3 h-3" />
                    </button>
                    {isAdmin && onDeleteOrder && (
                      <button
                        onClick={() => {
                          setDeletingOrder(order);
                          setIsDeleteModalOpen(true);
                        }}
                        title="Delete Order (Admin/Owner)"
                        className="p-0.5 text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete Order Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete Order"
        description="Are you sure you want to permanently delete this order? All specifications and production tracking will be permanently erased."
        itemName={deletingOrder ? `${deletingOrder.orderNumber} - ${deletingOrder.title}` : undefined}
        requireTypedText="DELETE"
        onConfirm={async () => {
          if (deletingOrder && onDeleteOrder) {
            await onDeleteOrder(deletingOrder.id);
          }
        }}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingOrder(null);
        }}
      />
    </div>
  );
}

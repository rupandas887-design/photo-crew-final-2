import React, { useState, useEffect } from 'react';
import { useRole } from '../RoleContext';
import { 
  Camera, Package, PlusCircle, Wrench, Edit3, Trash2, Calendar, ClipboardList
} from 'lucide-react';
import { Equipment } from '../../types';

export const EquipmentManagement: React.FC = () => {
  const { currentRole, equipment, addEquipment, updateEquipment, deleteEquipment } = useRole();
  const canEdit = currentRole === 'Operations Team' || currentRole === 'Business Owner';

  // State to support adding / editing
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [form, setForm] = useState({
    name: '',
    type: 'Camera',
    brand: '',
    model: '',
    serial_number: '',
    quantity: 1,
    status: 'Available' as Equipment['status'],
    purchase_date: '',
    notes: ''
  });

  const handleSelectEdit = (eq: Equipment) => {
    setEditingId(eq.equipment_id);
    setForm({
      name: eq.name,
      type: eq.type,
      brand: eq.brand,
      model: eq.model,
      serial_number: eq.serial_number,
      quantity: eq.quantity,
      status: eq.status,
      purchase_date: eq.purchase_date || '',
      notes: eq.notes || ''
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm({
      name: '',
      type: 'Camera',
      brand: '',
      model: '',
      serial_number: '',
      quantity: 1,
      status: 'Available',
      purchase_date: '',
      notes: ''
    });
  };

  useEffect(() => {
    if (editingId) {
      setTimeout(() => {
        const firstInput = document.querySelector('form input') as HTMLInputElement;
        if (firstInput) {
          firstInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
          firstInput.focus();
        }
      }, 150);
    }
  }, [editingId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      alert('Unauthorized! You need Operations Team or Business Owner privileges.');
      return;
    }
    if (!form.name || !form.brand || !form.serial_number) {
      alert('Please fill out the name, brand, and serial number fields.');
      return;
    }

    if (editingId) {
      updateEquipment(editingId, form);
      alert('Equipment details updated successfully.');
    } else {
      addEquipment(form);
      alert('New equipment registered into inventory.');
    }
    handleCancelEdit();
  };

  const handleDelete = (id: string, name: string) => {
    if (!canEdit) return;
    if (confirm(`Are you sure you want to securely de-register "${name}"?`)) {
      deleteEquipment(id);
      alert('Equipment dropped from active registry.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: Register/Edit Form */}
      <div className="lg:col-span-4 bg-zinc-900/40 border border-zinc-850 rounded-2xl p-5 shadow-xl space-y-4">
        <h3 className="text-xs font-mono font-black uppercase text-zinc-300 flex items-center gap-1.5 border-b border-zinc-850 pb-2.5">
          <PlusCircle className="w-4 h-4 text-amber-500" />
          <span>{editingId ? 'Edit Register Details' : 'Register New Studio Gear'}</span>
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <fieldset disabled={!canEdit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono font-extrabold uppercase text-zinc-450 mb-1">
                Equipment Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sony FX3 Full Cinema body"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono font-extrabold uppercase text-zinc-450 mb-1">
                  Brand *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sony"
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono font-extrabold uppercase text-zinc-455 mb-1">
                  Model / Variant
                </label>
                <input
                  type="text"
                  placeholder="e.g. ILME-FX3"
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                  className="w-full bg-zinc-955 border border-zinc-850 rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono font-extrabold uppercase text-zinc-455 mb-1">
                  Equipment Type
                </label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full bg-zinc-955 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                >
                  {['Camera', 'Lens', 'Drone', 'Gimbal', 'Tripod', 'Light', 'Audio Equipment', 'Memory Cards', 'Batteries', 'Other'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono font-extrabold uppercase text-zinc-455 mb-1">
                  Serial Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="SN-XXX-XXXX"
                  value={form.serial_number}
                  onChange={(e) => setForm({ ...form, serial_number: e.target.value })}
                  className="w-full bg-zinc-955 border border-zinc-850 rounded-xl px-3 py-2 text-white focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono font-extrabold uppercase text-zinc-455 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })}
                  className="w-full bg-zinc-955 border border-zinc-850 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono font-extrabold uppercase text-zinc-455 mb-1">
                  Lifecycle Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as Equipment['status'] })}
                  className="w-full bg-zinc-955 border border-zinc-805 rounded-xl px-3 py-2 text-white font-mono"
                >
                  {['Available', 'Assigned', 'In Use', 'Under Maintenance', 'Damaged'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono font-extrabold uppercase text-zinc-455 mb-1">
                Purchase / Ingest Date
              </label>
              <input
                type="date"
                value={form.purchase_date}
                onChange={(e) => setForm({ ...form, purchase_date: e.target.value })}
                className="w-full bg-zinc-955 border border-zinc-850 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono font-extrabold uppercase text-zinc-455 mb-1">
                Notes & Field Reports
              </label>
              <textarea
                rows={3}
                placeholder="Mention any custom cages, firmware updates, filter attachments, or battery compatibility..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full bg-zinc-955 border border-zinc-850 rounded-xl p-2.5 text-white focus:outline-none"
              />
            </div>
          </fieldset>

          {canEdit ? (
            <div className="flex gap-2 justify-end pt-2 border-t border-zinc-850">
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-xl cursor-pointer flex items-center gap-1"
              >
                <span>{editingId ? 'Update Gear' : 'Add to Inventory'}</span>
              </button>
            </div>
          ) : (
            <div className="bg-zinc-950/40 border border-zinc-850 p-3 rounded-lg text-[10px] text-zinc-400 font-mono">
              🔒 You have read-only access.
            </div>
          )}
        </form>
      </div>

      {/* Right Column: Inventory View */}
      <div className="lg:col-span-8 bg-zinc-900/40 border border-zinc-850 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-zinc-850 bg-zinc-950/70 flex items-center justify-between">
          <h3 className="text-[10px] font-mono font-black text-zinc-300 uppercase tracking-widest flex items-center gap-1.5">
            <ClipboardList className="w-4 h-4 text-amber-500" />
            <span>ACTIVE CORE INVENTORY REGISTRY ({equipment.length} items)</span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[650px]">
            <thead>
              <tr className="border-b border-zinc-850 text-[10px] font-mono uppercase text-zinc-400 bg-zinc-950/40">
                <th className="p-3.5">ID / Type</th>
                <th className="p-3.5">Equipment Details</th>
                <th className="p-3.5">Serial & Manufacture</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Qty</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-850/60 text-xs text-zinc-300">
              {equipment.length > 0 ? (
                equipment.map((eq) => {
                  return (
                    <tr key={eq.equipment_id} className="hover:bg-zinc-900/10 transition-all">
                      <td className="p-3.5 space-y-1">
                        <span className="font-mono text-zinc-405 bg-zinc-950 px-1.5 py-0.5 rounded text-[10px]">
                          {eq.equipment_id}
                        </span>
                        <div className="text-[10px] text-zinc-400 uppercase font-mono">{eq.type}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-zinc-100">{eq.name}</div>
                        {eq.notes && <div className="text-[10px] text-zinc-450 mt-1 italic line-clamp-1">{eq.notes}</div>}
                      </td>
                      <td className="p-3.5 font-mono text-[11px] space-y-0.5 text-zinc-400">
                        <div>Model: {eq.brand} {eq.model}</div>
                        <div className="text-[10px] text-zinc-500">S/N: {eq.serial_number}</div>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                          eq.status === 'Available' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          eq.status === 'Assigned' ? 'bg-sky-505/10 text-sky-400 border-sky-500/20' :
                          eq.status === 'In Use' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          eq.status === 'Under Maintenance' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                          'bg-rose-500/10 text-rose-450 border-rose-500/20'
                        }`}>
                          {eq.status}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono font-bold text-zinc-200">
                        {eq.quantity}
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {canEdit && (
                            <>
                              <button
                                onClick={() => handleSelectEdit(eq)}
                                className="p-1.5 hover:bg-zinc-805 text-zinc-400 hover:text-white rounded transition-all cursor-pointer border border-transparent hover:border-zinc-800"
                                title="Edit Item details"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(eq.equipment_id, eq.name)}
                                className="p-1.5 hover:bg-zinc-805 text-zinc-450 hover:text-red-400 rounded transition-all cursor-pointer"
                                title="De-register Equipment"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-zinc-550 italic font-mono">
                    No equipment currently listed in core archive.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

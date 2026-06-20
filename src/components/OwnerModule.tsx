import React, { useState, useMemo } from 'react';
import { useRole } from './RoleContext';
import { 
  Users, Calendar, FileText, Landmark, BarChart3, TrendingUp, AlertCircle, Clock, CheckCircle
} from 'lucide-react';
import { SalesAnalytics } from './analytics/SalesAnalytics';
import { OperationsAnalytics } from './analytics/OperationsAnalytics';
import { ProductionAnalytics } from './analytics/ProductionAnalytics';
import { BusinessOverviewAnalytics } from './analytics/BusinessOverviewAnalytics';
import { PendingPaymentsReport } from './analytics/PendingPaymentsReport';
import { BusinessOwnerCalendar } from './BusinessOwnerCalendar';

// --- SECTION 1: TEAM PERFORMANCE ---
export const OwnerTeamPerformance = ({ globalDateRange }: { globalDateRange?: { start?: string, end?: string } }) => {
  const [activeSubTab, setActiveSubTab] = useState<'sales' | 'operations' | 'production'>('sales');
  const { leads, orders, production, payments } = useRole();

  const metrics = useMemo(() => {
    // 1. Total Leads
    const totalLeads = leads.length;
    // 2. Conversion Rate
    const orderConfirmedCount = leads.filter(l => ['Order Confirmed', 'Approved'].includes(l.status)).length;
    const conversionRate = totalLeads > 0 ? ((orderConfirmedCount / totalLeads) * 100).toFixed(1) : '0';
    // 3. Total Revenue
    const totalRevenue = orders.reduce((sum, o) => sum + (o.quotation_amount || 0), 0);
    // 4. Collected Revenue
    const collectedRevenue = payments.reduce((sum, p) => sum + (p.advance_received || 0) + (p.final_payment_received || 0), 0);
    // 5. Pending Collection
    const pendingCollection = payments.reduce((sum, p) => sum + (p.balance_due || 0), 0);
    // 6. Total Events
    const totalEvents = orders.length;
    // 7. Completed Projects
    const completedProjects = production.filter(p => ['Project Delivered', 'Completed', 'Closed'].includes(p.editing_status)).length;
    // 8. Delayed Projects
    const delayedProjects = production.filter(p => {
      if (['Project Delivered', 'Completed', 'Closed'].includes(p.editing_status)) return false;
      if (!p.expected_delivery_date) return false;
      return new Date(p.expected_delivery_date) < new Date();
    }).length;

    return { totalLeads, conversionRate, totalRevenue, collectedRevenue, pendingCollection, totalEvents, completedProjects, delayedProjects };
  }, [leads, orders, production, payments]);

  return (
    <div className="space-y-6">
      
      {/* 8 Top KPI Cards for the Owner */}
      <div className="bg-zinc-950 border border-zinc-850 p-5 rounded-2xl shadow-xl">
        <h3 className="text-sm font-black uppercase text-amber-500 font-mono tracking-widest mb-4 flex items-center gap-2">
          <Landmark className="w-4 h-4" /> Company Grand Totals
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
            <p className="text-[10px] text-zinc-500 font-mono uppercase font-black tracking-wider">Total Leads</p>
            <p className="text-2xl font-black text-indigo-400 mt-1">{metrics.totalLeads}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
            <p className="text-[10px] text-zinc-500 font-mono uppercase font-black tracking-wider">Conversion</p>
            <p className="text-2xl font-black text-emerald-400 mt-1">{metrics.conversionRate}%</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
            <p className="text-[10px] text-zinc-500 font-mono uppercase font-black tracking-wider">Total Revenue</p>
            <p className="text-2xl font-black text-amber-400 mt-1">₹{metrics.totalRevenue.toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
            <p className="text-[10px] text-zinc-500 font-mono uppercase font-black tracking-wider">Collected Recv</p>
            <p className="text-2xl font-black text-green-400 mt-1">₹{metrics.collectedRevenue.toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
            <p className="text-[10px] text-zinc-500 font-mono uppercase font-black tracking-wider">Pending Collect</p>
            <p className="text-2xl font-black text-rose-400 mt-1">₹{metrics.pendingCollection.toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
            <p className="text-[10px] text-zinc-500 font-mono uppercase font-black tracking-wider">Total Events</p>
            <p className="text-2xl font-black text-blue-400 mt-1">{metrics.totalEvents}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
            <p className="text-[10px] text-zinc-500 font-mono uppercase font-black tracking-wider">Projects Done</p>
            <p className="text-2xl font-black text-cyan-400 mt-1">{metrics.completedProjects}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
            <p className="text-[10px] text-zinc-500 font-mono uppercase font-black tracking-wider">Delayed Proj</p>
            <p className="text-2xl font-black text-orange-400 mt-1">{metrics.delayedProjects}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-4 border-b border-zinc-800 pb-2">
        <button
          onClick={() => setActiveSubTab('sales')}
          className={`flex items-center justify-center gap-2 px-4 py-2 text-xs font-mono uppercase tracking-wider font-extrabold rounded-lg transition-all ${
            activeSubTab === 'sales'
              ? 'bg-zinc-800 text-white'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-indigo-400" />
          Sales Team
        </button>
        <button
          onClick={() => setActiveSubTab('operations')}
          className={`flex items-center justify-center gap-2 px-4 py-2 text-xs font-mono uppercase tracking-wider font-extrabold rounded-lg transition-all ${
            activeSubTab === 'operations'
              ? 'bg-zinc-800 text-white'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-emerald-400" />
          Operations Team
        </button>
        <button
          onClick={() => setActiveSubTab('production')}
          className={`flex items-center justify-center gap-2 px-4 py-2 text-xs font-mono uppercase tracking-wider font-extrabold rounded-lg transition-all ${
            activeSubTab === 'production'
              ? 'bg-zinc-800 text-white'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-purple-400" />
          Production Team
        </button>
      </div>

      <div className="animate-in fade-in duration-300">
        {activeSubTab === 'sales' && <SalesAnalytics />}
        {activeSubTab === 'operations' && <OperationsAnalytics />}
        {activeSubTab === 'production' && <ProductionAnalytics />}
      </div>
    </div>
  );
};

// --- SECTION 2: REVENUE ANALYTICS ---
export const OwnerRevenueAnalytics = () => {
  const [activeSubTab, setActiveSubTab] = useState<'revenue' | 'pending'>('revenue');

  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b border-zinc-800 pb-2">
        <button
          onClick={() => setActiveSubTab('revenue')}
          className={`flex items-center justify-center gap-2 px-4 py-2 text-xs font-mono uppercase tracking-wider font-extrabold rounded-lg transition-all ${
            activeSubTab === 'revenue'
              ? 'bg-zinc-800 text-amber-400'
              : 'text-zinc-500 hover:text-amber-400'
          }`}
        >
          <Landmark className="w-4 h-4" />
          Revenue Analytics
        </button>
        <button
          onClick={() => setActiveSubTab('pending')}
          className={`flex items-center justify-center gap-2 px-4 py-2 text-xs font-mono uppercase tracking-wider font-extrabold rounded-lg transition-all ${
            activeSubTab === 'pending'
              ? 'bg-zinc-800 text-rose-400'
              : 'text-zinc-500 hover:text-rose-400'
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          Pending Payment Analytics
        </button>
      </div>

      <div className="animate-in fade-in duration-300">
        {activeSubTab === 'revenue' && <BusinessOverviewAnalytics />}
        {activeSubTab === 'pending' && <PendingPaymentsReport />}
      </div>
    </div>
  );
};

// --- SECTION 3: EVENT CALENDAR ---
export const OwnerEventCalendar = () => {
  return (
    <div className="space-y-6">
      <BusinessOwnerCalendar />
    </div>
  );
};

// --- SECTION 5: BUSINESS REPORTS ---
// (Notification is just the NotificationsModule)
export const OwnerBusinessReports = () => {
  const { leads, orders, production, operations, payments, staff } = useRole();

  const handleExportCSV = (type: string) => {
    let csvData: any[] = [];
    if (type === 'Sales') {
      csvData = leads.map(l => ({ LeadID: l.lead_id, Client: l.customer_name, Status: l.status, Created: l.created_date }));
    } else if (type === 'Operations') {
      csvData = orders.map(o => ({ OrderID: o.order_id, Client: o.customer_name, Date: o.event_date, Stage: o.current_stage }));
    } else if (type === 'Production') {
      csvData = production.map(p => ({ ProdID: p.production_id, Editor: p.editor_assigned, Status: p.editing_status }));
    } else if (type === 'Revenue' || type === 'Collection') {
      csvData = payments.map(p => ({ OrderID: p.order_id, Received: (p.advance_received + p.final_payment_received), Due: p.balance_due }));
    } else {
      csvData = [{ Info: 'Data not available' }];
    }

    if (!csvData.length) csvData = [{ Info: 'No data' }];
    
    const keys = Object.keys(csvData[0]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + keys.join(",") + "\n" 
      + csvData.map(row => keys.map(k => `"${row[k] || ''}"`).join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${type}_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDummyExport = (format: string, type: string) => {
    alert(`Generating ${format} for ${type} report... (Note: Full ${format} export requires backend generation)`);
  };

  return (
    <div className="p-6 bg-zinc-950 border border-zinc-850 rounded-2xl relative overflow-hidden">
      <div className="relative z-10 space-y-6">
        <div>
          <h2 className="text-lg font-black uppercase text-amber-400 font-mono tracking-widest flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Business Reports
          </h2>
          <p className="text-zinc-400 text-xs mt-1">Download operational metrics, revenue data, and team performance statistics.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { title: 'Sales Performance Report', desc: 'Leads, conversions, value, performance ranking.', type: 'Sales' },
            { title: 'Operations Performance Report', desc: 'Event completion, staff assignments.', type: 'Operations' },
            { title: 'Production Performance Report', desc: 'Projects delivered, deadlines, backlog.', type: 'Production' },
            { title: 'Revenue Report', desc: 'Total revenue, packages, revenue sources.', type: 'Revenue' },
            { title: 'Collection Report', desc: 'Collected payments, pending dues.', type: 'Collection' },
            { title: 'Event Report', desc: 'Scheduled events and required resources.', type: 'Operations' },
          ].map((report, idx) => (
            <div key={idx} className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-4">
              <div>
                <h3 className="text-sm font-bold text-zinc-200">{report.title}</h3>
                <p className="text-[10px] text-zinc-500">{report.desc}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleDummyExport('PDF', report.type)} className="flex-1 px-2 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-all rounded font-mono text-[10px] uppercase font-bold text-center">
                  PDF
                </button>
                <button onClick={() => handleDummyExport('Excel', report.type)} className="flex-1 px-2 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-all rounded font-mono text-[10px] uppercase font-bold text-center">
                  Excel
                </button>
                <button onClick={() => handleExportCSV(report.type)} className="flex-1 px-2 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-all rounded font-mono text-[10px] uppercase font-bold text-center">
                  CSV
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

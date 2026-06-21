import React, { useState, useMemo } from 'react';
import { useRole } from './RoleContext';
import { 
  Landmark, TrendingUp, Calendar, AlertCircle, FileText, CheckCircle, Clock, Video, FileDown, Target
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { formatINR } from '../utils';
import { BusinessOwnerCalendar } from './BusinessOwnerCalendar';

// --- SHARED UI COMPONENTS ---

export const cleanStaffName = (name: string | undefined | null) => {
  if (!name || name.trim() === '' || name === 'None') return 'Unassigned';
  let clean = name.replace(/Unassigned[,+&\s]*/gi, '').replace(/[,+&\s]*Unassigned/gi, '').trim();
  if (clean.replace(/[,+&\s]+/g, '') === '') return 'Unassigned';
  return clean.replace(/^[,\s]+|[,\s]+$/g, '');
};

const AnalyticsCard = ({ title, value, icon: Icon, onClick, className = '' }: any) => (
  <div 
    onClick={onClick}
    className={`bg-zinc-950/40 backdrop-blur-md border border-zinc-800 p-5 rounded-2xl cursor-pointer hover:border-zinc-700 hover:shadow-lg transition-all duration-300 relative overflow-hidden group ${className}`}
  >
    <div className="absolute -right-4 -top-4 w-20 h-20 bg-zinc-800/10 rounded-full blur-2xl group-hover:bg-zinc-700/20 transition-all" />
    <div className="flex justify-between items-start mb-4 relative z-10">
      <h3 className="text-[10px] font-mono tracking-widest uppercase text-zinc-500 font-black">{title}</h3>
      <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 group-hover:text-white transition-colors">
        <Icon className="w-4 h-4" />
      </div>
    </div>
    <div className="text-2xl sm:text-3xl font-black text-white font-sans relative z-10">
      {value}
    </div>
  </div>
);

const DateFilters = ({ start, end, setStart, setEnd }: any) => (
  <div className="flex flex-wrap items-center gap-3 mt-4 sm:mt-0">
    <div className="flex items-center gap-2">
      <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-zinc-500">From</span>
      <input 
        type="date" 
        value={start} 
        onChange={(e) => setStart(e.target.value)}
        className="bg-zinc-950 border border-zinc-800 text-zinc-300 px-3 py-1.5 rounded-lg text-xs font-mono focus:outline-none focus:border-amber-500/50"
      />
    </div>
    <div className="flex items-center gap-2">
      <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-zinc-500">To</span>
      <input 
        type="date" 
        value={end} 
        onChange={(e) => setEnd(e.target.value)}
        className="bg-zinc-950 border border-zinc-800 text-zinc-300 px-3 py-1.5 rounded-lg text-xs font-mono focus:outline-none focus:border-amber-500/50"
      />
    </div>
  </div>
);

const SectionHeader = ({ title, icon: Icon, onDownload, start, end, setStart, setEnd }: any) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-4">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/50 flex flex-col items-center justify-center shadow-lg">
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <h2 className="text-xl font-black text-white tracking-tight uppercase font-sans">{title}</h2>
        <p className="text-[10px] font-mono tracking-widest text-zinc-500">EXECUTIVE OVERSIGHT</p>
      </div>
    </div>
    {setStart && setEnd && (
      <div className="flex flex-wrap items-center gap-3">
        <DateFilters start={start} end={end} setStart={setStart} setEnd={setEnd} />
        {onDownload && (
          <button 
            onClick={onDownload}
            className="px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-900 font-bold uppercase tracking-wider text-[10px] rounded-lg transition-all flex items-center gap-2"
          >
            <FileDown className="w-3.5 h-3.5" />
            Report
          </button>
        )}
      </div>
    )}
  </div>
);

// --- 1. REVENUE ANALYTICS ---

export const OwnerRevenueAnalytics = () => {
  const { orders, payments } = useRole();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showTable, setShowTable] = useState(false);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (startDate && o.event_date < startDate) return false;
      if (endDate && o.event_date > endDate) return false;
      return true;
    });
  }, [orders, startDate, endDate]);

  const metrics = useMemo(() => {
    let totalRevenue = 0;
    let totalCollection = 0;
    let totalPending = 0;
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    let monthRevenue = 0;
    let monthCollection = 0;
    let monthPending = 0;

    filteredOrders.forEach(o => {
      totalRevenue += o.quotation_amount || 0;
      const py = payments.find(p => p.order_id === o.order_id);
      if (py) {
        totalCollection += (py.advance_received + py.final_payment_received);
        totalPending += py.balance_due;
        
        if (o.event_date.startsWith(currentMonth)) {
          monthRevenue += o.quotation_amount || 0;
          monthCollection += (py.advance_received + py.final_payment_received);
          monthPending += py.balance_due;
        }
      }
    });

    const averageOrderValue = filteredOrders.length > 0 ? (totalRevenue / filteredOrders.length) : 0;

    // Generate trend data
    const trendMap: Record<string, { date: string, revenue: number, collection: number, pending: number }> = {};
    filteredOrders.forEach(o => {
      const month = o.event_date.slice(0, 7);
      if (!trendMap[month]) trendMap[month] = { date: month, revenue: 0, collection: 0, pending: 0 };
      trendMap[month].revenue += o.quotation_amount || 0;
      const py = payments.find(p => p.order_id === o.order_id);
      if (py) {
        trendMap[month].collection += (py.advance_received + py.final_payment_received);
        trendMap[month].pending += py.balance_due;
      }
    });
    const trendData = Object.values(trendMap).sort((a,b) => a.date.localeCompare(b.date));

    return { totalRevenue, totalCollection, totalPending, monthRevenue, monthCollection, monthPending, averageOrderValue, trendData };
  }, [filteredOrders, payments]);

  const downloadCSV = () => {
    const csvData = filteredOrders.map(o => {
      const py = payments.find(p => p.order_id === o.order_id);
      return {
        OrderID: o.order_id,
        Customer: o.customer_name,
        PackageAmount: o.quotation_amount,
        ReceivedAmount: py ? (py.advance_received + py.final_payment_received) : 0,
        PendingAmount: py ? py.balance_due : 0,
        Status: o.current_stage
      };
    });
    let rows = ["OrderID,Customer,PackageAmount,ReceivedAmount,PendingAmount,Status"];
    csvData.forEach(r => rows.push(`${r.OrderID},${r.Customer},${r.PackageAmount},${r.ReceivedAmount},${r.PendingAmount},${r.Status}`));
    const uri = encodeURI("data:text/csv;charset=utf-8," + rows.join("\n"));
    const link = document.createElement("a");
    link.href = uri; link.download = "Revenue_Analytics.csv"; link.click();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <SectionHeader title="Revenue Analytics" icon={Landmark} onDownload={downloadCSV} start={startDate} setStart={setStartDate} end={endDate} setEnd={setEndDate} />
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnalyticsCard title="Total Revenue" value={formatINR(metrics.totalRevenue)} icon={TrendingUp} onClick={() => setShowTable(true)} className="border-indigo-500/20" />
        <AnalyticsCard title="Total Collection" value={formatINR(metrics.totalCollection)} icon={CheckCircle} onClick={() => setShowTable(true)} className="border-emerald-500/20" />
        <AnalyticsCard title="Total Pending" value={formatINR(metrics.totalPending)} icon={AlertCircle} onClick={() => setShowTable(true)} className="border-rose-500/20" />
        <AnalyticsCard title="Average Order Value" value={formatINR(metrics.averageOrderValue)} icon={Landmark} onClick={() => setShowTable(true)} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
          <p className="text-[10px] uppercase font-mono text-zinc-500 font-bold mb-1">This Month Revenue</p>
          <p className="text-xl font-black text-indigo-400">{formatINR(metrics.monthRevenue)}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
          <p className="text-[10px] uppercase font-mono text-zinc-500 font-bold mb-1">This Month Collection</p>
          <p className="text-xl font-black text-emerald-400">{formatINR(metrics.monthCollection)}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
          <p className="text-[10px] uppercase font-mono text-zinc-500 font-bold mb-1">This Month Pending</p>
          <p className="text-xl font-black text-rose-400">{formatINR(metrics.monthPending)}</p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl h-80 shadow-xl relative mt-6">
         <h3 className="text-xs font-mono font-bold tracking-widest uppercase text-zinc-400 absolute top-6 left-6 z-10">Revenue Insights Trend</h3>
         <ResponsiveContainer width="100%" height="100%">
           <AreaChart data={metrics.trendData} margin={{ top: 40, right: 20, left: 20, bottom: 0 }}>
             <defs>
               <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                 <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                 <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
               </linearGradient>
               <linearGradient id="colorCol" x1="0" y1="0" x2="0" y2="1">
                 <stop offset="5%" stopColor="#34d399" stopOpacity={0.3}/>
                 <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
               </linearGradient>
             </defs>
             <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
             <XAxis dataKey="date" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
             <YAxis stroke="#52525b" fontSize={10} tickFormatter={(val) => `₹${val/1000}k`} tickLine={false} axisLine={false} />
             <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }} />
             <Area type="monotone" dataKey="revenue" stackId="1" stroke="#818cf8" strokeWidth={2} fill="url(#colorRev)" />
             <Area type="monotone" dataKey="collection" stackId="2" stroke="#34d399" strokeWidth={2} fill="url(#colorCol)" />
           </AreaChart>
         </ResponsiveContainer>
      </div>

      {showTable && (
        <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl overflow-hidden mt-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
            <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-zinc-300">Detailed Revenue Data</h3>
            <button onClick={() => setShowTable(false)} className="text-zinc-500 hover:text-white">✕</button>
          </div>
          <div className="overflow-x-auto p-4">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 font-mono">
                  <th className="pb-3 pr-4 uppercase tracking-wider font-semibold">Order ID</th>
                  <th className="pb-3 pr-4 uppercase tracking-wider font-semibold">Customer</th>
                  <th className="pb-3 pr-4 uppercase tracking-wider font-semibold text-right">Package</th>
                  <th className="pb-3 pr-4 uppercase tracking-wider font-semibold text-right">Received</th>
                  <th className="pb-3 pr-4 uppercase tracking-wider font-semibold text-right">Pending</th>
                  <th className="pb-3 uppercase tracking-wider font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50 text-zinc-300 font-sans">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-zinc-500 font-mono font-bold">No records found</td>
                  </tr>
                ) : (
                  filteredOrders.map(o => {
                    const py = payments.find(p => p.order_id === o.order_id);
                    const pAmt = o.quotation_amount || 0;
                    const recv = py ? (py.advance_received + py.final_payment_received) : 0;
                    const pend = py ? py.balance_due : 0;
                    return (
                      <tr key={o.order_id} className="hover:bg-zinc-900/40">
                        <td className="py-3 pr-4 font-mono text-[10px] text-amber-500">{o.order_id}</td>
                        <td className="py-3 pr-4 font-bold">{o.customer_name}</td>
                        <td className="py-3 pr-4 text-right font-mono font-bold text-white">{formatINR(pAmt)}</td>
                        <td className="py-3 pr-4 text-right font-mono text-emerald-400">{formatINR(recv)}</td>
                        <td className="py-3 pr-4 text-right font-mono text-rose-400">{formatINR(pend)}</td>
                        <td className="py-3 font-mono text-[9px] uppercase tracking-wider">
                          <span className="px-2 py-1 rounded-md bg-zinc-800">{o.current_stage}</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// --- 2. SALES PERFORMANCE ---

export const OwnerSalesPerformance = () => {
  const { leads, orders } = useRole();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showTable, setShowTable] = useState(false);
  const [activeCard, setActiveCard] = useState<string>('Total Leads');

  const filteredLeads = useMemo(() => leads.filter(l => (!startDate || l.created_date >= startDate) && (!endDate || l.created_date <= endDate)), [leads, startDate, endDate]);
  const filteredOrders = useMemo(() => orders.filter(o => (!startDate || o.event_date >= startDate) && (!endDate || o.event_date <= endDate)), [orders, startDate, endDate]);

  const metrics = useMemo(() => {
    const totalLeads = filteredLeads.length;
    const quotationSent = filteredLeads.filter(l => ['Quotation Sent', 'Negotiation', 'Order Confirmed', 'Closed'].includes(l.current_status || l.status)).length;
    const orderConfirmed = filteredOrders.length;
    const conversionRate = totalLeads > 0 ? (orderConfirmed / totalLeads) * 100 : 0;
    const revenueGen = filteredOrders.reduce((sum, o) => sum + (o.quotation_amount || 0), 0);
    const followUps = filteredLeads.filter(l => (l.current_status || l.status) === 'Follow Up').length;

    // Staff Performance Map
    const staffMap: any = {};
    filteredLeads.forEach(l => {
      const sp = cleanStaffName(l.sales_person);
      if(!staffMap[sp]) staffMap[sp] = { name: sp, leads: 0, orders: 0, revenue: 0 };
      staffMap[sp].leads++;
    });
    filteredOrders.forEach(o => {
      const sp = cleanStaffName(o.sales_person);
      if(!staffMap[sp]) staffMap[sp] = { name: sp, leads: 0, orders: 0, revenue: 0 };
      staffMap[sp].orders++;
      staffMap[sp].revenue += (o.quotation_amount || 0);
    });
    
    const staffPerformance = Object.values(staffMap).map((s: any) => ({
      ...s,
      conversion: s.leads > 0 ? (s.orders / s.leads) * 100 : 0
    }));

    return { totalLeads, quotationSent, orderConfirmed, conversionRate, revenueGen, followUps, staffPerformance };
  }, [filteredLeads, filteredOrders]);

  const downloadCSV = () => {
    let rows = ["Staff Name,Leads Handled,Orders Confirmed,Conversion Rate,Revenue Generated"];
    metrics.staffPerformance.forEach((s: any) => rows.push(`${s.name},${s.leads},${s.orders},${s.conversion.toFixed(1)}%,${s.revenue}`));
    const uri = encodeURI("data:text/csv;charset=utf-8," + rows.join("\n"));
    const link = document.createElement("a");
    link.href = uri; link.download = "Sales_Performance.csv"; link.click();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <SectionHeader title="Sales Performance" icon={TrendingUp} onDownload={downloadCSV} start={startDate} setStart={setStartDate} end={endDate} setEnd={setEndDate} />
      
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <AnalyticsCard title="Total Leads" value={metrics.totalLeads} icon={FileText} onClick={() => { setActiveCard('Total Leads'); setShowTable(true); }} className="lg:col-span-1" />
        <AnalyticsCard title="Quoted" value={metrics.quotationSent} icon={FileText} onClick={() => { setActiveCard('Quoted'); setShowTable(true); }} className="lg:col-span-1" />
        <AnalyticsCard title="Confirmed" value={metrics.orderConfirmed} icon={CheckCircle} onClick={() => { setActiveCard('Confirmed'); setShowTable(true); }} className="lg:col-span-1 border-emerald-500/20" />
        <AnalyticsCard title="Conv. Rate" value={`${metrics.conversionRate.toFixed(1)}%`} icon={TrendingUp} onClick={() => { setActiveCard('Conv. Rate'); setShowTable(true); }} className="lg:col-span-1 border-indigo-500/20" />
        <AnalyticsCard title="Follow-up Pending" value={metrics.followUps} icon={Clock} onClick={() => { setActiveCard('Follow-up Pending'); setShowTable(true); }} className="lg:col-span-1 border-rose-500/20" />
        <AnalyticsCard title="Generated Rev" value={formatINR(metrics.revenueGen)} icon={Landmark} onClick={() => { setActiveCard('Generated Rev'); setShowTable(true); }} className="lg:col-span-1 border-amber-500/20" />
      </div>

      {showTable && (
        <div id="detailed_sales_table_block" className="bg-zinc-950/80 border border-zinc-800 rounded-2xl overflow-hidden mt-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
            <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-zinc-300">
              Detailed Sales Records - {activeCard}
            </h3>
            <button onClick={() => setShowTable(false)} className="text-zinc-500 hover:text-white font-bold p-1 px-2 rounded bg-zinc-900 border border-zinc-800 transition-colors uppercase font-mono text-[10px]">✕ Close</button>
          </div>
          <div className="overflow-x-auto p-4">
            {['Total Leads', 'Quoted', 'Follow-up Pending', 'Conv. Rate'].includes(activeCard) ? (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500 font-mono">
                    <th className="pb-3 pr-4 uppercase tracking-wider font-semibold">Lead ID</th>
                    <th className="pb-3 pr-4 uppercase tracking-wider font-semibold">Customer</th>
                    <th className="pb-3 pr-4 uppercase tracking-wider font-semibold">Mobile</th>
                    <th className="pb-3 pr-4 uppercase tracking-wider font-semibold">Status</th>
                    <th className="pb-3 pr-4 uppercase tracking-wider font-semibold">Created Date</th>
                    <th className="pb-3 uppercase tracking-wider font-semibold">Sales Person</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50 text-zinc-300 font-sans">
                  {(() => {
                    let list = filteredLeads;
                    if (activeCard === 'Quoted') {
                      list = filteredLeads.filter(l => ['Quotation Sent', 'Negotiation', 'Order Confirmed', 'Closed'].includes(l.current_status || l.status));
                    } else if (activeCard === 'Follow-up Pending') {
                      list = filteredLeads.filter(l => (l.current_status || l.status) === 'Follow Up');
                    }
                    if (list.length === 0) {
                      return (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-zinc-500 font-mono font-bold">No records found</td>
                        </tr>
                      );
                    }
                    return list.map(l => (
                      <tr key={l.lead_id} className="hover:bg-zinc-900/40">
                        <td className="py-3 pr-4 font-mono text-[10px] text-amber-500">{l.lead_id}</td>
                        <td className="py-3 pr-4 font-bold text-white">{l.customer_name}</td>
                        <td className="py-3 pr-4 font-mono">{l.mobile || 'N/A'}</td>
                        <td className="py-3 pr-4 font-mono text-[9px] uppercase tracking-wider">
                          <span className="px-2 py-0.5 rounded bg-zinc-850 text-zinc-300">{l.current_status || l.status}</span>
                        </td>
                        <td className="py-3 pr-4 font-mono">{l.created_date}</td>
                        <td className="py-3 font-semibold text-zinc-400">{cleanStaffName(l.sales_person)}</td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500 font-mono">
                    <th className="pb-3 pr-4 uppercase tracking-wider font-semibold">Order ID</th>
                    <th className="pb-3 pr-4 uppercase tracking-wider font-semibold">Customer</th>
                    <th className="pb-3 pr-4 uppercase tracking-wider font-semibold">Package Name</th>
                    <th className="pb-3 pr-4 uppercase tracking-wider font-semibold">Event Date</th>
                    <th className="pb-3 pr-4 uppercase tracking-wider font-semibold">Sales Person</th>
                    <th className="pb-3 uppercase tracking-wider font-semibold text-right">Quotation Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50 text-zinc-300 font-sans">
                  {(() => {
                    const list = filteredOrders;
                    if (list.length === 0) {
                      return (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-zinc-500 font-mono font-bold">No records found</td>
                        </tr>
                      );
                    }
                    return list.map(o => (
                      <tr key={o.order_id} className="hover:bg-zinc-900/40">
                        <td className="py-3 pr-4 font-mono text-[10px] text-amber-500">{o.order_id}</td>
                        <td className="py-3 pr-4 font-bold text-white">{o.customer_name}</td>
                        <td className="py-3 pr-4 font-mono text-amber-400 font-bold">{o.package_name || 'General Shoot'}</td>
                        <td className="py-3 pr-4 font-mono">{o.event_date}</td>
                        <td className="py-3 pr-4 font-semibold text-zinc-400">{cleanStaffName(o.sales_person)}</td>
                        <td className="py-3 text-right font-mono font-bold text-emerald-400">{formatINR(o.quotation_amount || 0)}</td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden mt-6 shadow-xl">
        <div className="p-5 border-b border-zinc-800 bg-zinc-900/30">
          <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-zinc-300">Sales Staff Performance</h3>
        </div>
        <div className="overflow-x-auto p-5">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500 font-mono">
                <th className="pb-3 pr-4 uppercase tracking-wider font-semibold">Staff Name</th>
                <th className="pb-3 pr-4 uppercase tracking-wider font-semibold text-center">Leads Handled</th>
                <th className="pb-3 pr-4 uppercase tracking-wider font-semibold text-center">Orders Confirmed</th>
                <th className="pb-3 pr-4 uppercase tracking-wider font-semibold text-center">Conversion Rate</th>
                <th className="pb-3 uppercase tracking-wider font-semibold text-right">Revenue Generated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50 text-zinc-300">
              {metrics.staffPerformance.map((s: any, idx) => (
                <tr key={idx} className="hover:bg-zinc-900/40">
                  <td className="py-3 pr-4 font-bold text-white">{s.name}</td>
                  <td className="py-3 pr-4 text-center font-mono">{s.leads}</td>
                  <td className="py-3 pr-4 text-center font-mono text-emerald-400 font-bold">{s.orders}</td>
                  <td className="py-3 pr-4 text-center font-mono">{s.conversion.toFixed(1)}%</td>
                  <td className="py-3 text-right font-mono font-bold text-amber-500">{formatINR(s.revenue)}</td>
                </tr>
              ))}
              {metrics.staffPerformance.length === 0 && (
                <tr><td colSpan={5} className="py-4 text-center font-mono text-zinc-505 font-bold">No staff data found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- 3. OPERATIONS PERFORMANCE ---

export const OwnerOperationsPerformance = () => {
  const { orders, operations } = useRole();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showTable, setShowTable] = useState(false);
  const [activeCard, setActiveCard] = useState<string>('Total Orders');

  const filteredOrders = useMemo(() => orders.filter(o => (!startDate || o.event_date >= startDate) && (!endDate || o.event_date <= endDate)), [orders, startDate, endDate]);

  const metrics = useMemo(() => {
    let totalAssignments = 0;
    const staffMap: any = {};
    
    const scheduledEvents = filteredOrders.filter(o => o.current_stage === 'Event Scheduled' || o.current_stage === 'Operations Assigned').length;
    const completedEvents = filteredOrders.filter(o => o.current_stage === 'Event Completed' || o.current_stage === 'Raw Footage Received' || o.current_stage === 'Closed').length;
    const rawEvents = filteredOrders.filter(o => o.current_stage === 'Raw Footage Received').length;
    const cancelledEvents = filteredOrders.filter(o => o.current_stage === 'Event Cancelled').length;

    operations.forEach(op => {
      totalAssignments++;
      const photog = cleanStaffName(op.photographer_assigned);
      const video = cleanStaffName(op.videographer_assigned);
      [photog, video].forEach(member => {
        if (member !== 'Unassigned') {
          if(!staffMap[member]) staffMap[member] = { name: member, assigned: 0, scheduled: 0, completed: 0 };
          staffMap[member].assigned++;
          if (op.event_status === 'Scheduled' || op.event_status === 'Event Scheduled') staffMap[member].scheduled++;
          if (op.event_status === 'Completed' || op.event_status === 'Event Completed' || op.event_status === 'Raw Footage Received') staffMap[member].completed++;
        }
      });
    });

    const staffStats = Object.values(staffMap).map((s:any) => ({
      ...s,
      rate: s.assigned > 0 ? (s.completed / s.assigned) * 100 : 0
    }));

    return { totalOrders: filteredOrders.length, totalAssignments, scheduledEvents, completedEvents, rawEvents, cancelledEvents, staffStats };
  }, [filteredOrders, operations]);

  const downloadCSV = () => {
    let rows = ["Staff Name,Assigned Events,Scheduled Pending,Completed Events,Completion Rate"];
    metrics.staffStats.forEach((s: any) => rows.push(`${s.name},${s.assigned},${s.scheduled},${s.completed},${s.rate.toFixed(1)}%`));
    const uri = encodeURI("data:text/csv;charset=utf-8," + rows.join("\n"));
    const link = document.createElement("a");
    link.href = uri; link.download = "Operations_Performance.csv"; link.click();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <SectionHeader title="Operations Performance" icon={Target} onDownload={downloadCSV} start={startDate} setStart={setStartDate} end={endDate} setEnd={setEndDate} />
      
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <AnalyticsCard title="Total Orders" value={metrics.totalOrders} icon={FileText} onClick={() => { setActiveCard('Total Orders'); setShowTable(true); }} className="lg:col-span-1 border-blue-500/20" />
        <AnalyticsCard title="Staff Assigned" value={metrics.totalAssignments} icon={Target} onClick={() => { setActiveCard('Staff Assigned'); setShowTable(true); }} className="lg:col-span-1" />
        <AnalyticsCard title="Scheduled" value={metrics.scheduledEvents} icon={Clock} onClick={() => { setActiveCard('Scheduled'); setShowTable(true); }} className="lg:col-span-1 border-indigo-500/20" />
        <AnalyticsCard title="Completed" value={metrics.completedEvents} icon={CheckCircle} onClick={() => { setActiveCard('Completed'); setShowTable(true); }} className="lg:col-span-1 border-emerald-500/20" />
        <AnalyticsCard title="Raw Rcvd" value={metrics.rawEvents} icon={Video} onClick={() => { setActiveCard('Raw Rcvd'); setShowTable(true); }} className="lg:col-span-1 border-amber-500/20" />
        <AnalyticsCard title="Cancelled" value={metrics.cancelledEvents} icon={AlertCircle} onClick={() => { setActiveCard('Cancelled'); setShowTable(true); }} className="lg:col-span-1 border-rose-500/20" />
      </div>

      {showTable && (
        <div id="detailed_ops_table_block" className="bg-zinc-950/80 border border-zinc-800 rounded-2xl overflow-hidden mt-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
            <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-zinc-300">
              Detailed Operations Records - {activeCard}
            </h3>
            <button onClick={() => setShowTable(false)} className="text-zinc-500 hover:text-white font-bold p-1 px-2 rounded bg-zinc-900 border border-zinc-800 transition-colors uppercase font-mono text-[10px]">✕ Close</button>
          </div>
          <div className="overflow-x-auto p-4">
            {activeCard === 'Staff Assigned' ? (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500 font-mono">
                    <th className="pb-3 pr-4 uppercase tracking-wider font-semibold">Operation ID</th>
                    <th className="pb-3 pr-4 uppercase tracking-wider font-semibold">Order ID</th>
                    <th className="pb-3 pr-4 uppercase tracking-wider font-semibold">Photographer</th>
                    <th className="pb-3 pr-4 uppercase tracking-wider font-semibold">Videographer</th>
                    <th className="pb-3 pr-4 uppercase tracking-wider font-semibold">Drone pilot</th>
                    <th className="pb-3 uppercase tracking-wider font-semibold">Event Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50 text-zinc-300 font-sans">
                  {operations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-zinc-500 font-mono font-bold">No records found</td>
                    </tr>
                  ) : (
                    operations.map(op => (
                      <tr key={op.operation_id} className="hover:bg-zinc-900/40">
                        <td className="py-3 pr-4 font-mono text-[10px] text-amber-500">{op.operation_id}</td>
                        <td className="py-3 pr-4 font-mono text-[10px] text-zinc-400 font-bold">{op.order_id}</td>
                        <td className="py-3 pr-4 font-semibold text-white">{cleanStaffName(op.photographer_assigned)}</td>
                        <td className="py-3 pr-4 font-semibold text-white">{cleanStaffName(op.videographer_assigned)}</td>
                        <td className="py-3 pr-4 font-semibold text-white">{cleanStaffName(op.drone_operator_assigned)}</td>
                        <td className="py-3 font-semibold font-mono text-[9px] uppercase">
                          <span className="px-2 py-0.5 rounded bg-zinc-850 text-blue-400">{op.event_status || 'Scheduled'}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500 font-mono">
                    <th className="pb-3 pr-4 uppercase tracking-wider font-semibold">Order ID</th>
                    <th className="pb-3 pr-4 uppercase tracking-wider font-semibold">Customer</th>
                    <th className="pb-3 pr-4 uppercase tracking-wider font-semibold">Event Date</th>
                    <th className="pb-3 pr-4 uppercase tracking-wider font-semibold">Current Stage</th>
                    <th className="pb-3 uppercase tracking-wider font-semibold">Crew Assignments</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50 text-zinc-300 font-sans">
                  {(() => {
                    let list = filteredOrders;
                    if (activeCard === 'Scheduled') {
                      list = filteredOrders.filter(o => ['Event Scheduled', 'Operations Assigned'].includes(o.current_stage));
                    } else if (activeCard === 'Completed') {
                      list = filteredOrders.filter(o => ['Event Completed', 'Raw Footage Received', 'Closed'].includes(o.current_stage));
                    } else if (activeCard === 'Raw Rcvd') {
                      list = filteredOrders.filter(o => o.current_stage === 'Raw Footage Received');
                    } else if (activeCard === 'Cancelled') {
                      list = filteredOrders.filter(o => o.current_stage === 'Event Cancelled');
                    }
                    if (list.length === 0) {
                      return (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-zinc-500 font-mono font-bold">No records found</td>
                        </tr>
                      );
                    }
                    return list.map(o => {
                      const op = operations.find(p => p.order_id === o.order_id);
                      return (
                        <tr key={o.order_id} className="hover:bg-zinc-900/40">
                          <td className="py-3 pr-4 font-mono text-[10px] text-amber-500">{o.order_id}</td>
                          <td className="py-3 pr-4 font-bold text-white">{o.customer_name}</td>
                          <td className="py-3 pr-4 font-mono">{o.event_date}</td>
                          <td className="py-3 pr-4 font-mono text-[9px] uppercase">
                            <span className="px-2 py-0.5 rounded bg-zinc-850 text-indigo-400">{o.current_stage}</span>
                          </td>
                          <td className="py-3 font-semibold text-zinc-450 text-[10px]">
                            {op ? (
                              <span>P: {cleanStaffName(op.photographer_assigned)} | V: {cleanStaffName(op.videographer_assigned)} | D: {cleanStaffName(op.drone_operator_assigned)}</span>
                            ) : (
                              <span className="text-zinc-650 italic text-[10px]">No operational record</span>
                            )}
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

       <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden mt-6 shadow-xl">
        <div className="p-5 border-b border-zinc-800 bg-zinc-900/30">
          <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-zinc-300">Operations Staff Performance</h3>
        </div>
        <div className="overflow-x-auto p-5">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500 font-mono">
                <th className="pb-3 pr-4 uppercase tracking-wider font-semibold">Staff Name</th>
                <th className="pb-3 pr-4 uppercase tracking-wider font-semibold text-center">Assigned Events</th>
                <th className="pb-3 pr-4 uppercase tracking-wider font-semibold text-center">Scheduled Pending</th>
                <th className="pb-3 pr-4 uppercase tracking-wider font-semibold text-center">Completed Events</th>
                <th className="pb-3 uppercase tracking-wider font-semibold text-right">Completion Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50 text-zinc-300">
              {metrics.staffStats.map((s: any, idx) => (
                <tr key={idx} className="hover:bg-zinc-900/40">
                  <td className="py-3 pr-4 font-bold text-white">{s.name}</td>
                  <td className="py-3 pr-4 text-center font-mono">{s.assigned}</td>
                  <td className="py-3 pr-4 text-center font-mono text-blue-400">{s.scheduled}</td>
                  <td className="py-3 pr-4 text-center font-mono text-emerald-400 font-bold">{s.completed}</td>
                  <td className="py-3 text-right font-mono font-bold text-amber-500">{s.rate.toFixed(1)}%</td>
                </tr>
              ))}
              {metrics.staffStats.length === 0 && (
                <tr><td colSpan={5} className="py-4 text-center font-mono text-zinc-505 font-bold">No operational staff found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- 4. PRODUCTION PERFORMANCE ---

export const OwnerProductionPerformance = () => {
  const { production } = useRole();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showTable, setShowTable] = useState(false);
  const [activeCard, setActiveCard] = useState<string>('New Rcvd');

  const filteredProd = useMemo(() => production.filter(p => (!startDate || (p.editing_start_date || '') >= startDate) && (!endDate || (p.editing_start_date || '') <= endDate)), [production, startDate, endDate]);

  const metrics = useMemo(() => {
    let newProjects = 0;
    let editorAssigned = 0;
    let editingInProgress = 0;
    let clientReview = 0;
    let clientApproved = 0;
    let projectDelivered = 0;
    let projectClosed = 0;

    const editorMap: any = {};

    filteredProd.forEach(p => {
      if (p.editing_status === 'Raw Footage Received') newProjects++;
      if (p.editing_status === 'Editor Assigned') editorAssigned++;
      if (p.editing_status === 'Editing Started' || p.editing_status === 'Editing In Progress') editingInProgress++;
      if (p.editing_status === 'Client Review Sent') clientReview++;
      if (p.editing_status === 'Approved' || p.editing_status === 'Final Approval') clientApproved++;
      if (p.editing_status === 'Project Delivered' || p.editing_status === 'Delivered') projectDelivered++;
      if (p.editing_status === 'Project Closed' || p.editing_status === 'Completed') projectClosed++;

      const ed = cleanStaffName(p.editor_assigned || p.assigned_editors);
      if(!editorMap[ed]) editorMap[ed] = { name: ed, assigned: 0, completed: 0, approved: 0, rev: 0 };
      editorMap[ed].assigned++;
      if (['Project Delivered', 'Completed', 'Approved', 'Delivered', 'Project Closed'].includes(p.editing_status)) editorMap[ed].completed++;
      if (['Approved','Final Approval'].includes(p.editing_status)) editorMap[ed].approved++;
      if (p.editing_status === 'Revision Required') editorMap[ed].rev++;
    });

    const staffStats = Object.values(editorMap).map((e:any) => ({
      ...e,
      appRate: e.assigned > 0 ? (e.approved / e.assigned) * 100 : 0,
      revRate: e.assigned > 0 ? (e.rev / e.assigned) * 100 : 0,
    }));

    return { 
      newProjects, editorAssigned, editingInProgress, clientReview, clientApproved, projectDelivered, projectClosed, staffStats
    };
  }, [filteredProd]);

  const downloadCSV = () => {
    let rows = ["Editor Name,Assigned Projects,Completed,Approval Rate,Revision Rate"];
    metrics.staffStats.forEach((s: any) => rows.push(`${s.name},${s.assigned},${s.completed},${s.appRate.toFixed(1)}%,${s.revRate.toFixed(1)}%`));
    const uri = encodeURI("data:text/csv;charset=utf-8," + rows.join("\n"));
    const link = document.createElement("a");
    link.href = uri; link.download = "Production_Performance.csv"; link.click();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <SectionHeader title="Production Performance" icon={Video} onDownload={downloadCSV} start={startDate} setStart={setStartDate} end={endDate} setEnd={setEndDate} />
      
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
        <AnalyticsCard title="New Rcvd" value={metrics.newProjects} icon={FileText} onClick={() => { setActiveCard('New Rcvd'); setShowTable(true); }} className="lg:col-span-1" />
        <AnalyticsCard title="Assigned" value={metrics.editorAssigned} icon={Target} onClick={() => { setActiveCard('Assigned'); setShowTable(true); }} className="lg:col-span-1" />
        <AnalyticsCard title="In Progress" value={metrics.editingInProgress} icon={Clock} onClick={() => { setActiveCard('In Progress'); setShowTable(true); }} className="lg:col-span-1 border-blue-500/20" />
        <AnalyticsCard title="In Review" value={metrics.clientReview} icon={AlertCircle} onClick={() => { setActiveCard('In Review'); setShowTable(true); }} className="lg:col-span-1 border-amber-500/20" />
        <AnalyticsCard title="Approved" value={metrics.clientApproved} icon={CheckCircle} onClick={() => { setActiveCard('Approved'); setShowTable(true); }} className="lg:col-span-1 border-emerald-500/20" />
        <AnalyticsCard title="Delivered" value={metrics.projectDelivered} icon={Video} onClick={() => { setActiveCard('Delivered'); setShowTable(true); }} className="lg:col-span-1 border-indigo-500/20" />
        <AnalyticsCard title="Closed" value={metrics.projectClosed} icon={CheckCircle} onClick={() => { setActiveCard('Closed'); setShowTable(true); }} className="lg:col-span-1 border-zinc-500/20" />
      </div>

      {showTable && (
        <div id="detailed_prod_table_block" className="bg-zinc-950/80 border border-zinc-800 rounded-2xl overflow-hidden mt-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
            <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-zinc-300">
              Detailed Production Records - {activeCard}
            </h3>
            <button onClick={() => setShowTable(false)} className="text-zinc-500 hover:text-white font-bold p-1 px-2 rounded bg-zinc-900 border border-zinc-800 transition-colors uppercase font-mono text-[10px]">✕ Close</button>
          </div>
          <div className="overflow-x-auto p-4">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 font-mono">
                  <th className="pb-3 pr-4 uppercase tracking-wider font-semibold">Production ID</th>
                  <th className="pb-3 pr-4 uppercase tracking-wider font-semibold">Tracking ID</th>
                  <th className="pb-3 pr-4 uppercase tracking-wider font-semibold">Assigned Editor</th>
                  <th className="pb-3 pr-4 uppercase tracking-wider font-semibold">Editing Status</th>
                  <th className="pb-3 pr-4 uppercase tracking-wider font-semibold">Target Delivery Date</th>
                  <th className="pb-3 uppercase tracking-wider font-semibold">Project Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50 text-zinc-300 font-sans">
                {(() => {
                  let list = filteredProd;
                  if (activeCard === 'New Rcvd') {
                    list = filteredProd.filter(p => p.editing_status === 'Raw Footage Received');
                  } else if (activeCard === 'Assigned') {
                    list = filteredProd.filter(p => p.editing_status === 'Editor Assigned');
                  } else if (activeCard === 'In Progress') {
                    list = filteredProd.filter(p => p.editing_status === 'Editing Started' || p.editing_status === 'Editing In Progress');
                  } else if (activeCard === 'In Review') {
                    list = filteredProd.filter(p => p.editing_status === 'Client Review Sent');
                  } else if (activeCard === 'Approved') {
                    list = filteredProd.filter(p => p.editing_status === 'Approved' || p.editing_status === 'Final Approval');
                  } else if (activeCard === 'Delivered') {
                    list = filteredProd.filter(p => p.editing_status === 'Project Delivered' || p.editing_status === 'Delivered');
                  } else if (activeCard === 'Closed') {
                    list = filteredProd.filter(p => p.editing_status === 'Project Closed' || p.editing_status === 'Completed');
                  }
                  if (list.length === 0) {
                    return (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-zinc-500 font-mono font-bold">No records found</td>
                      </tr>
                    );
                  }
                  return list.map(p => (
                    <tr key={p.production_id} className="hover:bg-zinc-900/40">
                      <td className="py-3 pr-4 font-mono text-[10px] text-amber-500">{p.production_id}</td>
                      <td className="py-3 pr-4 font-mono text-[10px] text-zinc-400 font-bold">{p.tracking_id}</td>
                      <td className="py-3 pr-4 font-semibold text-white">{cleanStaffName(p.editor_assigned || p.assigned_editors)}</td>
                      <td className="py-3 pr-4 font-semibold text-white">
                        <span className="px-2 py-0.5 rounded bg-zinc-850 text-indigo-400 font-mono text-[9px] uppercase">
                          {p.editing_status}
                        </span>
                      </td>
                      <td className="py-3 pr-4 font-mono text-zinc-400">{p.target_delivery_date || 'None'}</td>
                      <td className="py-3 font-semibold font-mono text-[9px] uppercase">
                        <span className={`px-2 py-0.5 rounded ${
                          p.project_priority === 'High' ? 'bg-rose-500/10 text-rose-400' : 'bg-zinc-800 text-zinc-400'
                        }`}>
                          {p.project_priority || 'Normal'}
                        </span>
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}

       <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden mt-6 shadow-xl">
        <div className="p-5 border-b border-zinc-800 bg-zinc-900/30">
          <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-zinc-300">Production Staff Performance</h3>
        </div>
        <div className="overflow-x-auto p-5">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500 font-mono">
                <th className="pb-3 pr-4 uppercase tracking-wider font-semibold">Editor Name</th>
                <th className="pb-3 pr-4 uppercase tracking-wider font-semibold text-center">Assigned Proj.</th>
                <th className="pb-3 pr-4 uppercase tracking-wider font-semibold text-center">Completed</th>
                <th className="pb-3 pr-4 uppercase tracking-wider font-semibold text-center">Approval Rate</th>
                <th className="pb-3 uppercase tracking-wider font-semibold text-right">Revision Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50 text-zinc-300">
              {metrics.staffStats.map((s: any, idx) => (
                <tr key={idx} className="hover:bg-zinc-900/40">
                  <td className="py-3 pr-4 font-bold text-white">{s.name}</td>
                  <td className="py-3 pr-4 text-center font-mono">{s.assigned}</td>
                  <td className="py-3 pr-4 text-center font-mono text-emerald-400 font-bold">{s.completed}</td>
                  <td className="py-3 pr-4 text-center font-mono text-indigo-400">{s.appRate.toFixed(1)}%</td>
                  <td className="py-3 text-right font-mono text-rose-400">{s.revRate.toFixed(1)}%</td>
                </tr>
              ))}
              {metrics.staffStats.length === 0 && (
                <tr><td colSpan={5} className="py-4 text-center font-mono text-zinc-505 font-bold">No production staff found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- 5. EVENT CALENDAR ---

export const OwnerEventCalendar = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-white">
      <SectionHeader title="Event Calendar" icon={Calendar} />
      <BusinessOwnerCalendar />
    </div>
  );
};

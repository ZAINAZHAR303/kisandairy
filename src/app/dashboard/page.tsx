import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function DashboardPage() {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch counts
  // 1. Total Animals
  const { count: totalAnimals } = await supabase
    .from('animals')
    .select('*', { count: 'exact', head: true });

  // 2. Active Records
  const { count: totalRecords } = await supabase
    .from('insemination_records')
    .select('*', { count: 'exact', head: true });

  // 3. Confirmed Pregnancies
  const { count: confirmedPregnancies } = await supabase
    .from('insemination_records')
    .select('*', { count: 'exact', head: true })
    .eq('pregnancy_status', 'Confirmed');

  // 4. Upcoming Calvings (next 30 days)
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);

  const { count: upcomingCalvings } = await supabase
    .from('insemination_records')
    .select('*', { count: 'exact', head: true })
    .gte('expected_calving_date', todayStr)
    .lte('expected_calving_date', thirtyDaysFromNow.toISOString().split('T')[0]);

  // 5. Today's Milk (L)
  const { data: todayMilkData } = await supabase
    .from('milk_sale_entries')
    .select('total_liters')
    .eq('date', todayStr);

  const todayMilkTotal = (todayMilkData || []).reduce((sum, item) => sum + Number(item.total_liters || 0), 0);

  // 6. This Month Revenue (Rs.)
  const currentMonthPrefix = todayStr.substring(0, 7); // e.g. "2026-07"
  const { data: monthMilkData } = await supabase
    .from('milk_sale_entries')
    .select('total_amount, date')
    .gte('date', `${currentMonthPrefix}-01`);

  const thisMonthRevenue = (monthMilkData || []).reduce((sum, item) => sum + Number(item.total_amount || 0), 0);

  // 7. This Month Expenses (Rs.)
  const { data: monthExpenseData } = await supabase
    .from('expenses')
    .select('amount, date')
    .gte('date', `${currentMonthPrefix}-01`);

  const thisMonthExpenses = (monthExpenseData || []).reduce((sum, item) => sum + Number(item.amount || 0), 0);

  // 8. This Month Net Profit (Rs.)
  const thisMonthNetProfit = thisMonthRevenue - thisMonthExpenses;
  const isProfitable = thisMonthNetProfit >= 0;

  // 9. Overdue Vaccines Count
  const { data: vaccineData } = await supabase
    .from('vaccination_records')
    .select('next_due_date');

  const overdueVaccinesCount = (vaccineData || []).filter(v => {
    if (!v.next_due_date) return false;
    return v.next_due_date < todayStr;
  }).length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Welcome back! 🐄</h1>
        <p className="text-gray-500 mt-1">
          {user?.email || user?.phone || 'Farmer'}
        </p>

        {/* Warning Banner for Overdue Vaccines */}
        {overdueVaccinesCount > 0 && (
          <Link
            href="/dashboard/vaccinations?tab=overdue"
            className="mt-3 inline-flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition-all animate-pulse"
          >
            <span>⚠️ {overdueVaccinesCount} vaccination(s) are overdue — tap to view &rarr;</span>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Animals Card */}
        <Link 
          href="/dashboard/animals"
          className="bg-white rounded-2xl shadow-sm border-l-4 border-l-blue-900 p-5 flex flex-col justify-between gap-2 hover:shadow-md hover:border-l-[#00BFA6] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
              <span>🐮</span>
              <span>Total Animals</span>
            </div>
            <span className="text-xs text-gray-400 group-hover:text-[#00BFA6] transition-colors font-medium">View all &rarr;</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {totalAnimals || 0}
          </div>
        </Link>

        {/* Active Records Card */}
        <Link 
          href="/dashboard/insemination"
          className="bg-white rounded-2xl shadow-sm border-l-4 border-l-teal-500 p-5 flex flex-col justify-between gap-2 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
              <span>📋</span>
              <span>Active Records</span>
            </div>
            <span className="text-xs text-gray-400 group-hover:text-[#00BFA6] transition-colors font-medium">View all &rarr;</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {totalRecords || 0}
          </div>
        </Link>

        {/* Today's Milk (L) Card */}
        <Link 
          href="/dashboard/milk-sales"
          className="bg-white rounded-2xl shadow-sm border-l-4 border-l-[#00BFA6] p-5 flex flex-col justify-between gap-2 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
              <span>🥛</span>
              <span>Today&apos;s Milk</span>
            </div>
            <span className="text-xs text-gray-400 group-hover:text-[#00BFA6] transition-colors font-medium">View all &rarr;</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {todayMilkTotal.toFixed(1)} <span className="text-sm font-normal text-gray-500">L</span>
          </div>
        </Link>

        {/* This Month Revenue Card */}
        <Link 
          href="/dashboard/milk-sales"
          className="bg-white rounded-2xl shadow-sm border-l-4 border-l-emerald-600 p-5 flex flex-col justify-between gap-2 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
              <span>💰</span>
              <span>This Month Revenue</span>
            </div>
            <span className="text-xs text-gray-400 group-hover:text-[#00BFA6] transition-colors font-medium">View all &rarr;</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            Rs. {thisMonthRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
        </Link>

        {/* This Month Expenses Card */}
        <Link 
          href="/dashboard/expenses"
          className="bg-white rounded-2xl shadow-sm border-l-4 border-l-orange-600 p-5 flex flex-col justify-between gap-2 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
              <span>🧾</span>
              <span>This Month Expenses</span>
            </div>
            <span className="text-xs text-gray-400 group-hover:text-[#00BFA6] transition-colors font-medium">View all &rarr;</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 text-orange-600">
            Rs. {thisMonthExpenses.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
        </Link>

        {/* Net Profit Card */}
        <Link 
          href="/dashboard/reports/financials"
          className={`bg-white rounded-2xl shadow-sm border-l-4 p-5 flex flex-col justify-between gap-2 hover:shadow-md transition-all cursor-pointer group ${isProfitable ? 'border-l-green-600' : 'border-l-red-600'}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
              <span>📈</span>
              <span>This Month Net Profit</span>
            </div>
            <span className="text-xs text-gray-400 group-hover:text-[#00BFA6] transition-colors font-medium">View statement &rarr;</span>
          </div>
          <div className={`text-3xl font-bold ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
            Rs. {Math.abs(thisMonthNetProfit).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
        </Link>

        {/* Overdue Vaccines Card (NEW!) */}
        <Link 
          href="/dashboard/vaccinations?tab=overdue"
          className="bg-white rounded-2xl shadow-sm border-l-4 border-l-red-600 p-5 flex flex-col justify-between gap-2 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
              <span>🚨</span>
              <span>Overdue Vaccines</span>
            </div>
            <span className="text-xs text-gray-400 group-hover:text-[#00BFA6] transition-colors font-medium">View list &rarr;</span>
          </div>
          <div className="text-3xl font-bold text-red-600">
            {overdueVaccinesCount}
          </div>
        </Link>

        {/* Confirmed Pregnancies Card */}
        <Link 
          href="/dashboard/insemination?status=Confirmed"
          className="bg-white rounded-2xl shadow-sm border-l-4 border-l-green-500 p-5 flex flex-col justify-between gap-2 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
              <span>✅</span>
              <span>Confirmed Pregnancies</span>
            </div>
            <span className="text-xs text-gray-400 group-hover:text-[#00BFA6] transition-colors font-medium">View animals &rarr;</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {confirmedPregnancies || 0}
          </div>
        </Link>

        {/* Upcoming Calvings Card */}
        <Link 
          href="/dashboard/insemination?status=Confirmed"
          className="bg-white rounded-2xl shadow-sm border-l-4 border-l-orange-500 p-5 flex flex-col justify-between gap-2 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
              <span>📅</span>
              <span>Upcoming Calvings</span>
            </div>
            <span className="text-xs text-gray-400 group-hover:text-[#00BFA6] transition-colors font-medium">View list &rarr;</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {upcomingCalvings || 0}
          </div>
        </Link>
      </div>

      <div className="flex flex-wrap gap-4">
        <Link 
          href="/dashboard/vaccinations" 
          className="inline-flex items-center justify-center bg-[#00BFA6] hover:bg-[#00a892] text-white font-semibold py-3 px-6 rounded-xl transition-colors shadow-sm"
        >
          Go to Vaccination Tracker &rarr;
        </Link>
        <Link 
          href="/dashboard/reports/financials" 
          className="inline-flex items-center justify-center bg-[#1a2f5e] hover:bg-[#0f1d3d] text-white font-semibold py-3 px-6 rounded-xl transition-colors shadow-sm"
        >
          Go to Profit Statements &rarr;
        </Link>
        <Link 
          href="/dashboard/expenses" 
          className="inline-flex items-center justify-center bg-gray-800 hover:bg-gray-900 text-white font-semibold py-3 px-6 rounded-xl transition-colors shadow-sm"
        >
          Go to Expense Tracker &rarr;
        </Link>
      </div>
    </div>
  );
}

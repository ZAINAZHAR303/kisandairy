import { createClient, getAuthUser } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function DashboardPage() {
  const supabase = await createClient();

  // Get current user (cached across request lifecycle)
  const user = await getAuthUser();

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
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Welcome back! 🐄</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
          {user?.email || user?.phone || 'Farmer'}
        </p>

        {/* Warning Banner for Overdue Vaccines */}
        {overdueVaccinesCount > 0 && (
          <Link
            href="/dashboard/vaccinations?tab=overdue"
            className="mt-3 inline-flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-sm transition-all animate-pulse w-full sm:w-auto"
          >
            <span>⚠️ {overdueVaccinesCount} vaccination(s) are overdue — tap to view &rarr;</span>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Animals Card */}
        <Link 
          href="/dashboard/animals"
          className="bg-white rounded-2xl shadow-sm border-l-4 border-l-blue-900 p-3.5 sm:p-5 flex flex-col justify-between gap-2 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="flex flex-col text-gray-500 text-xs sm:text-sm font-medium">
              <div className="flex items-center gap-1">
                <span>🐮</span>
                <span className="truncate">Animals</span>
              </div>
              <span className="text-[10px] text-gray-400">کل جانور</span>
            </div>
            <span className="text-[10px] sm:text-xs text-gray-400 group-hover:text-[#00BFA6] transition-colors font-semibold">View &rarr;</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            {totalAnimals || 0}
          </div>
        </Link>

        {/* Active Records Card */}
        <Link 
          href="/dashboard/insemination"
          className="bg-white rounded-2xl shadow-sm border-l-4 border-l-teal-500 p-3.5 sm:p-5 flex flex-col justify-between gap-2 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="flex flex-col text-gray-500 text-xs sm:text-sm font-medium">
              <div className="flex items-center gap-1">
                <span>📋</span>
                <span className="truncate">Breeding Records</span>
              </div>
              <span className="text-[10px] text-gray-400">ٹیکا ہسٹری</span>
            </div>
            <span className="text-[10px] sm:text-xs text-gray-400 group-hover:text-[#00BFA6] transition-colors font-semibold">View &rarr;</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            {totalRecords || 0}
          </div>
        </Link>

        {/* Today's Milk (L) Card */}
        <Link 
          href="/dashboard/milk-sales"
          className="bg-white rounded-2xl shadow-sm border-l-4 border-l-[#00BFA6] p-3.5 sm:p-5 flex flex-col justify-between gap-2 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="flex flex-col text-gray-500 text-xs sm:text-sm font-medium">
              <div className="flex items-center gap-1">
                <span>🥛</span>
                <span className="truncate">Today&apos;s Milk</span>
              </div>
              <span className="text-[10px] text-gray-400">آج کا دودھ</span>
            </div>
            <span className="text-[10px] sm:text-xs text-gray-400 group-hover:text-[#00BFA6] transition-colors font-semibold">View &rarr;</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            {todayMilkTotal.toFixed(1)} <span className="text-xs font-normal text-gray-500">L</span>
          </div>
        </Link>

        {/* This Month Revenue Card */}
        <Link 
          href="/dashboard/milk-sales"
          className="bg-white rounded-2xl shadow-sm border-l-4 border-l-emerald-600 p-3.5 sm:p-5 flex flex-col justify-between gap-2 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="flex flex-col text-gray-500 text-xs sm:text-sm font-medium">
              <div className="flex items-center gap-1">
                <span>💰</span>
                <span className="truncate">Month Revenue</span>
              </div>
              <span className="text-[10px] text-gray-400">دودھ کی آمدنی</span>
            </div>
            <span className="text-[10px] sm:text-xs text-gray-400 group-hover:text-[#00BFA6] transition-colors font-semibold">View &rarr;</span>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-gray-900 truncate">
            Rs. {thisMonthRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
        </Link>

        {/* This Month Expenses Card */}
        <Link 
          href="/dashboard/expenses"
          className="bg-white rounded-2xl shadow-sm border-l-4 border-l-orange-600 p-3.5 sm:p-5 flex flex-col justify-between gap-2 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="flex flex-col text-gray-500 text-xs sm:text-sm font-medium">
              <div className="flex items-center gap-1">
                <span>🧾</span>
                <span className="truncate">Month Expenses</span>
              </div>
              <span className="text-[10px] text-gray-400">کل خرچہ</span>
            </div>
            <span className="text-[10px] sm:text-xs text-gray-400 group-hover:text-[#00BFA6] transition-colors font-semibold">View &rarr;</span>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-orange-600 truncate">
            Rs. {thisMonthExpenses.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
        </Link>

        {/* Net Profit Card */}
        <Link 
          href="/dashboard/reports/financials"
          className={`bg-white rounded-2xl shadow-sm border-l-4 p-3.5 sm:p-5 flex flex-col justify-between gap-2 hover:shadow-md transition-all cursor-pointer group ${isProfitable ? 'border-l-green-600' : 'border-l-red-600'}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex flex-col text-gray-500 text-xs sm:text-sm font-medium">
              <div className="flex items-center gap-1">
                <span>📈</span>
                <span className="truncate">Net Profit</span>
              </div>
              <span className="text-[10px] text-gray-400">خالص منافع / نقصان</span>
            </div>
            <span className="text-[10px] sm:text-xs text-gray-400 group-hover:text-[#00BFA6] transition-colors font-semibold">View &rarr;</span>
          </div>
          <div className={`text-xl sm:text-2xl font-extrabold truncate ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
            Rs. {Math.abs(thisMonthNetProfit).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
        </Link>

        {/* Overdue Vaccines Card */}
        <Link 
          href="/dashboard/vaccinations?tab=overdue"
          className="bg-white rounded-2xl shadow-sm border-l-4 border-l-red-600 p-3.5 sm:p-5 flex flex-col justify-between gap-2 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="flex flex-col text-gray-500 text-xs sm:text-sm font-medium">
              <div className="flex items-center gap-1">
                <span>🚨</span>
                <span className="truncate">Overdue Vaccines</span>
              </div>
              <span className="text-[10px] text-gray-400">بیماری کے ٹیکے</span>
            </div>
            <span className="text-[10px] sm:text-xs text-gray-400 group-hover:text-[#00BFA6] transition-colors font-semibold">View &rarr;</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-red-600">
            {overdueVaccinesCount}
          </div>
        </Link>

        {/* Confirmed Pregnancies Card */}
        <Link 
          href="/dashboard/insemination?status=Confirmed"
          className="bg-white rounded-2xl shadow-sm border-l-4 border-l-green-500 p-3.5 sm:p-5 flex flex-col justify-between gap-2 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="flex flex-col text-gray-500 text-xs sm:text-sm font-medium">
              <div className="flex items-center gap-1">
                <span>✅</span>
                <span className="truncate">Pregnant Cows</span>
              </div>
              <span className="text-[10px] text-gray-400">گابھن جانور</span>
            </div>
            <span className="text-[10px] sm:text-xs text-gray-400 group-hover:text-[#00BFA6] transition-colors font-semibold">View &rarr;</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            {confirmedPregnancies || 0}
          </div>
        </Link>

        {/* Upcoming Calvings Card */}
        <Link 
          href="/dashboard/insemination?status=Confirmed"
          className="bg-white rounded-2xl shadow-sm border-l-4 border-l-orange-500 p-3.5 sm:p-5 flex flex-col justify-between gap-2 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="flex flex-col text-gray-500 text-xs sm:text-sm font-medium">
              <div className="flex items-center gap-1">
                <span>📅</span>
                <span className="truncate">Due Calvings</span>
              </div>
              <span className="text-[10px] text-gray-400">بچہ دینے والی</span>
            </div>
            <span className="text-[10px] sm:text-xs text-gray-400 group-hover:text-[#00BFA6] transition-colors font-semibold">View &rarr;</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            {upcomingCalvings || 0}
          </div>
        </Link>
      </div>

      {/* Quick Action Navigation Buttons (Full Width on Mobile) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link 
          href="/dashboard/vaccinations" 
          className="w-full text-center bg-[#00BFA6] hover:bg-[#00a892] text-white font-bold py-3 px-4 rounded-xl transition-all shadow-sm text-sm"
        >
          Go to Vaccination Tracker &rarr;
        </Link>
        <Link 
          href="/dashboard/reports/financials" 
          className="w-full text-center bg-[#1a2f5e] hover:bg-[#0f1d3d] text-white font-bold py-3 px-4 rounded-xl transition-all shadow-sm text-sm"
        >
          Go to Profit Statements &rarr;
        </Link>
        <Link 
          href="/dashboard/expenses" 
          className="w-full text-center bg-gray-800 hover:bg-gray-900 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-sm text-sm"
        >
          Go to Expense Tracker &rarr;
        </Link>
      </div>
    </div>
  );
}

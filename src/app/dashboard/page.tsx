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
          className="bg-gradient-to-br from-white to-blue-50/50 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-blue-600 p-4 sm:p-5 flex flex-col justify-between gap-3 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-blue-100 rounded-full blur-2xl opacity-50 group-hover:opacity-70 transition-opacity"></div>
          <div className="flex items-center justify-between relative z-10">
            <div className="flex flex-col text-gray-600 text-xs sm:text-sm font-bold">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-blue-100/80 rounded-lg text-blue-700 shadow-sm">🐮</span>
                <span className="truncate text-gray-800">Animals</span>
              </div>
              <span className="text-[10px] text-gray-400 mt-1 font-medium">کل جانور</span>
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-blue-950 drop-shadow-sm relative z-10">
            {totalAnimals || 0}
          </div>
        </Link>

        {/* Active Records Card */}
        <Link 
          href="/dashboard/insemination"
          className="bg-gradient-to-br from-white to-teal-50/50 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-teal-500 p-4 sm:p-5 flex flex-col justify-between gap-3 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-teal-100 rounded-full blur-2xl opacity-50 group-hover:opacity-70 transition-opacity"></div>
          <div className="flex items-center justify-between relative z-10">
            <div className="flex flex-col text-gray-600 text-xs sm:text-sm font-bold">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-teal-100/80 rounded-lg text-teal-700 shadow-sm">📋</span>
                <span className="truncate text-gray-800">Breeding</span>
              </div>
              <span className="text-[10px] text-gray-400 mt-1 font-medium">ٹیکا ہسٹری</span>
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-teal-950 drop-shadow-sm relative z-10">
            {totalRecords || 0}
          </div>
        </Link>

        {/* Today's Milk (L) Card */}
        <Link 
          href="/dashboard/milk-sales"
          className="bg-gradient-to-br from-white to-emerald-50/50 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-emerald-500 p-4 sm:p-5 flex flex-col justify-between gap-3 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group relative overflow-hidden lg:col-span-2"
        >
          <div className="absolute top-0 right-0 -mt-2 -mr-2 w-24 h-24 bg-emerald-100 rounded-full blur-3xl opacity-50 group-hover:opacity-70 transition-opacity"></div>
          <div className="flex items-center justify-between relative z-10">
            <div className="flex flex-col text-gray-600 text-xs sm:text-sm font-bold">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-emerald-100/80 rounded-lg text-emerald-700 shadow-sm">🥛</span>
                <span className="truncate text-gray-800">Today&apos;s Milk</span>
              </div>
              <span className="text-[10px] text-gray-400 mt-1 font-medium">آج کا دودھ</span>
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-emerald-950 drop-shadow-sm relative z-10">
            {todayMilkTotal.toFixed(1)} <span className="text-base sm:text-lg font-bold text-gray-500">L</span>
          </div>
        </Link>

        {/* This Month Revenue Card */}
        <Link 
          href="/dashboard/milk-sales"
          className="bg-gradient-to-br from-white to-emerald-50/30 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-emerald-600 p-4 sm:p-5 flex flex-col justify-between gap-3 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-emerald-100 rounded-full blur-2xl opacity-40 group-hover:opacity-60 transition-opacity"></div>
          <div className="flex items-center justify-between relative z-10">
            <div className="flex flex-col text-gray-600 text-xs sm:text-sm font-bold">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600 border border-emerald-100 shadow-sm">💰</span>
                <span className="truncate text-gray-800">Revenue</span>
              </div>
              <span className="text-[10px] text-gray-400 mt-1 font-medium">دودھ کی آمدنی</span>
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-gray-900 truncate relative z-10 tracking-tight">
            Rs. {thisMonthRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
        </Link>

        {/* This Month Expenses Card */}
        <Link 
          href="/dashboard/expenses"
          className="bg-gradient-to-br from-white to-orange-50/30 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-orange-500 p-4 sm:p-5 flex flex-col justify-between gap-3 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-orange-100 rounded-full blur-2xl opacity-40 group-hover:opacity-60 transition-opacity"></div>
          <div className="flex items-center justify-between relative z-10">
            <div className="flex flex-col text-gray-600 text-xs sm:text-sm font-bold">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-orange-50 rounded-lg text-orange-600 border border-orange-100 shadow-sm">🧾</span>
                <span className="truncate text-gray-800">Expenses</span>
              </div>
              <span className="text-[10px] text-gray-400 mt-1 font-medium">کل خرچہ</span>
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-orange-700 truncate relative z-10 tracking-tight">
            Rs. {thisMonthExpenses.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
        </Link>

        {/* Net Profit Card */}
        <Link 
          href="/dashboard/reports/financials"
          className={`bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-sm border border-gray-100 border-l-4 p-4 sm:p-5 flex flex-col justify-between gap-3 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group relative overflow-hidden lg:col-span-2 ${isProfitable ? 'border-l-green-500' : 'border-l-red-500'}`}
        >
          <div className={`absolute top-0 right-0 -mt-2 -mr-2 w-24 h-24 rounded-full blur-3xl opacity-30 group-hover:opacity-50 transition-opacity ${isProfitable ? 'bg-green-200' : 'bg-red-200'}`}></div>
          <div className="flex items-center justify-between relative z-10">
            <div className="flex flex-col text-gray-600 text-xs sm:text-sm font-bold">
              <div className="flex items-center gap-2">
                <span className={`p-1.5 rounded-lg border shadow-sm ${isProfitable ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>📈</span>
                <span className="truncate text-gray-800">Net Profit</span>
              </div>
              <span className="text-[10px] text-gray-400 mt-1 font-medium">خالص منافع / نقصان</span>
            </div>
          </div>
          <div className={`text-3xl sm:text-4xl font-black truncate relative z-10 tracking-tight ${isProfitable ? 'text-green-700' : 'text-red-700'}`}>
            Rs. {Math.abs(thisMonthNetProfit).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
        </Link>

        {/* Overdue Vaccines Card */}
        <Link 
          href="/dashboard/vaccinations?tab=overdue"
          className="bg-gradient-to-br from-white to-red-50/50 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-red-500 p-4 sm:p-5 flex flex-col justify-between gap-3 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-red-100 rounded-full blur-2xl opacity-50 group-hover:opacity-70 transition-opacity"></div>
          <div className="flex items-center justify-between relative z-10">
            <div className="flex flex-col text-gray-600 text-xs sm:text-sm font-bold">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-red-100/80 rounded-lg text-red-700 shadow-sm">🚨</span>
                <span className="truncate text-gray-800">Vaccines</span>
              </div>
              <span className="text-[10px] text-gray-400 mt-1 font-medium">بیماری کے ٹیکے</span>
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-red-700 drop-shadow-sm relative z-10">
            {overdueVaccinesCount}
          </div>
        </Link>

        {/* Confirmed Pregnancies Card */}
        <Link 
          href="/dashboard/insemination?status=Confirmed"
          className="bg-gradient-to-br from-white to-green-50/50 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-green-500 p-4 sm:p-5 flex flex-col justify-between gap-3 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-green-100 rounded-full blur-2xl opacity-50 group-hover:opacity-70 transition-opacity"></div>
          <div className="flex items-center justify-between relative z-10">
            <div className="flex flex-col text-gray-600 text-xs sm:text-sm font-bold">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-green-100/80 rounded-lg text-green-700 shadow-sm">✅</span>
                <span className="truncate text-gray-800">Pregnant</span>
              </div>
              <span className="text-[10px] text-gray-400 mt-1 font-medium">گابھن جانور</span>
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-green-900 drop-shadow-sm relative z-10">
            {confirmedPregnancies || 0}
          </div>
        </Link>

        {/* Upcoming Calvings Card */}
        <Link 
          href="/dashboard/insemination?status=Confirmed"
          className="bg-gradient-to-br from-white to-amber-50/50 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-amber-500 p-4 sm:p-5 flex flex-col justify-between gap-3 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-amber-100 rounded-full blur-2xl opacity-50 group-hover:opacity-70 transition-opacity"></div>
          <div className="flex items-center justify-between relative z-10">
            <div className="flex flex-col text-gray-600 text-xs sm:text-sm font-bold">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-amber-100/80 rounded-lg text-amber-700 shadow-sm">📅</span>
                <span className="truncate text-gray-800">Due Calvings</span>
              </div>
              <span className="text-[10px] text-gray-400 mt-1 font-medium">بچہ دینے والی</span>
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-900 drop-shadow-sm relative z-10">
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

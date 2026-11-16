import { createClient, getAuthUser } from '@/lib/supabase/server';
import { fetchAllRows } from '@/lib/supabase/fetchAll';
import { FARM_TIME_ZONE, todayDateString, addDaysToDateString } from '@/lib/dateUtils';
import Link from 'next/link';
import DashboardMonthFilter from '@/components/dashboard/DashboardMonthFilter';

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

// Shows a dash instead of a misleading 0 when a count could not be loaded.
function showCount(result: { count: number | null; error: unknown }): number | string {
  if (result.error) {
    console.error('[Dashboard] count query failed:', result.error);
    return '—';
  }
  return result.count ?? 0;
}

export default async function DashboardPage(props: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const supabase = await createClient();

  // Get current user (cached across request lifecycle)
  const user = await getAuthUser();

  // "Today" in the farm's time zone. The server runs in UTC, which is still
  // yesterday in Pakistan between midnight and 5am.
  const todayStr = todayDateString(FARM_TIME_ZONE);
  const [todayYear, todayMonthNumber] = todayStr.split('-').map(Number);

  // Parse searchParams for month filtering (month is 0-11), ignoring invalid values
  const searchParams = props.searchParams ? await props.searchParams : {};
  const monthParam = Number(firstParam(searchParams.month));
  const yearParam = Number(firstParam(searchParams.year));
  const hasValidMonth = firstParam(searchParams.month) !== undefined && Number.isInteger(monthParam) && monthParam >= 0 && monthParam <= 11;
  const hasValidYear = firstParam(searchParams.year) !== undefined && Number.isInteger(yearParam) && yearParam >= 2000 && yearParam <= 2100;

  const targetMonth = hasValidMonth ? monthParam : todayMonthNumber - 1;
  const targetYear = hasValidYear ? yearParam : todayYear;

  const startDate = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-01`;

  const nextMonth = targetMonth === 11 ? 0 : targetMonth + 1;
  const nextMonthYear = targetMonth === 11 ? targetYear + 1 : targetYear;
  const endDate = `${nextMonthYear}-${String(nextMonth + 1).padStart(2, '0')}-01`;

  const thirtyDaysFromNowStr = addDaysToDateString(todayStr, 30);

  const [
    animalsResult,
    recordsResult,
    pregnanciesResult,
    calvingsResult,
    overdueVaccinesResult,
    todayMilkData,
    monthMilkData,
    monthExpenseData,
  ] = await Promise.all([
    // 1. Total Animals
    supabase.from('animals').select('*', { count: 'exact', head: true }),

    // 2. Active Records
    supabase.from('insemination_records').select('*', { count: 'exact', head: true }),

    // 3. Confirmed Pregnancies
    supabase
      .from('insemination_records')
      .select('*', { count: 'exact', head: true })
      .eq('pregnancy_status', 'Confirmed'),

    // 4. Upcoming Calvings (next 30 days)
    supabase
      .from('insemination_records')
      .select('*', { count: 'exact', head: true })
      .gte('expected_calving_date', todayStr)
      .lte('expected_calving_date', thirtyDaysFromNowStr),

    // 5. Overdue Vaccines Count
    supabase
      .from('vaccination_records')
      .select('*', { count: 'exact', head: true })
      .lt('next_due_date', todayStr),

    // 6. Today's Milk (L)
    fetchAllRows<{ total_liters: number | null }>("today's milk", (from, to) =>
      supabase
        .from('milk_sale_entries')
        .select('total_liters', { count: 'exact' })
        .eq('date', todayStr)
        .order('id')
        .range(from, to)
    ),

    // 7. Selected Month Revenue (Rs.)
    fetchAllRows<{ total_amount: number | null }>('monthly revenue', (from, to) =>
      supabase
        .from('milk_sale_entries')
        .select('total_amount', { count: 'exact' })
        .gte('date', startDate)
        .lt('date', endDate)
        .order('id')
        .range(from, to)
    ),

    // 8. Selected Month Expenses (Rs.)
    fetchAllRows<{ amount: number | null }>('monthly expenses', (from, to) =>
      supabase
        .from('expenses')
        .select('amount', { count: 'exact' })
        .gte('date', startDate)
        .lt('date', endDate)
        .order('id')
        .range(from, to)
    ),
  ]);

  const totalAnimals = showCount(animalsResult);
  const totalRecords = showCount(recordsResult);
  const confirmedPregnancies = showCount(pregnanciesResult);
  const upcomingCalvings = showCount(calvingsResult);
  const overdueVaccinesCount = showCount(overdueVaccinesResult);

  const todayMilkTotal = todayMilkData.reduce((sum, item) => sum + Number(item.total_liters || 0), 0);
  const thisMonthRevenue = monthMilkData.reduce((sum, item) => sum + Number(item.total_amount || 0), 0);
  const thisMonthExpenses = monthExpenseData.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  // 9. Selected Month Net Profit (Rs.)
  const thisMonthNetProfit = thisMonthRevenue - thisMonthExpenses;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Welcome back! 🐄</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            {user?.email || user?.phone || 'Farmer'}
          </p>

          {/* Warning Banner for Overdue Vaccines */}
          {typeof overdueVaccinesCount === 'number' && overdueVaccinesCount > 0 && (
            <Link
              href="/dashboard/vaccinations?tab=overdue"
              className="mt-3 inline-flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-sm transition-all animate-pulse w-full sm:w-auto"
            >
              <span>⚠️ {overdueVaccinesCount} vaccination(s) are overdue — tap to view &rarr;</span>
            </Link>
          )}
        </div>

        <DashboardMonthFilter />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Total Animals Card */}
        <Link 
          href="/dashboard/animals"
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 flex flex-col justify-between gap-3 hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer group border-t-4 border-t-blue-500"
        >
          <div className="flex items-center justify-between">
            <div className="flex flex-col text-gray-600 text-xs sm:text-sm font-bold">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-blue-50 rounded-lg text-blue-600 border border-blue-100 shadow-sm">🐮</span>
                <span className="truncate text-gray-800">Animals</span>
              </div>
              <span className="text-[10px] text-gray-400 mt-1 font-medium">Total Animals</span>
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-bold text-blue-600">
            {totalAnimals}
          </div>
        </Link>

        {/* Active Records Card */}
        <Link 
          href="/dashboard/insemination"
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 flex flex-col justify-between gap-3 hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer group border-t-4 border-t-green-500"
        >
          <div className="flex items-center justify-between">
            <div className="flex flex-col text-gray-600 text-xs sm:text-sm font-bold">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-green-50 rounded-lg text-green-600 border border-green-100 shadow-sm">📋</span>
                <span className="truncate text-gray-800">Breeding</span>
              </div>
              <span className="text-[10px] text-gray-400 mt-1 font-medium">Inseminations</span>
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-bold text-green-600">
            {totalRecords}
          </div>
        </Link>

        {/* Today's Milk (L) Card */}
        <Link 
          href="/dashboard/milk-sales"
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 flex flex-col justify-between gap-3 hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer group border-t-4 border-t-blue-400"
        >
          <div className="flex items-center justify-between">
            <div className="flex flex-col text-gray-600 text-xs sm:text-sm font-bold">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-blue-50 rounded-lg text-blue-600 border border-blue-100 shadow-sm">🥛</span>
                <span className="truncate text-gray-800">Today&apos;s Milk</span>
              </div>
              <span className="text-[10px] text-gray-400 mt-1 font-medium">Milk Today</span>
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-bold text-blue-500">
            {todayMilkTotal.toFixed(1)} <span className="text-base sm:text-lg text-gray-400">L</span>
          </div>
        </Link>

        {/* This Month Revenue Card */}
        <Link 
          href="/dashboard/milk-sales"
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 flex flex-col justify-between gap-3 hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer group border-t-4 border-t-green-500"
        >
          <div className="flex items-center justify-between">
            <div className="flex flex-col text-gray-600 text-xs sm:text-sm font-bold">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-green-50 rounded-lg text-green-600 border border-green-100 shadow-sm">💰</span>
                <span className="truncate text-gray-800">Revenue</span>
              </div>
              <span className="text-[10px] text-gray-400 mt-1 font-medium">Total Income</span>
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-green-600 truncate">
            Rs. {thisMonthRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
        </Link>

        {/* This Month Expenses Card */}
        <Link 
          href="/dashboard/expenses"
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 flex flex-col justify-between gap-3 hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer group border-t-4 border-t-orange-400"
        >
          <div className="flex items-center justify-between">
            <div className="flex flex-col text-gray-600 text-xs sm:text-sm font-bold">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-orange-50 rounded-lg text-orange-600 border border-orange-100 shadow-sm">🧾</span>
                <span className="truncate text-gray-800">Expenses</span>
              </div>
              <span className="text-[10px] text-gray-400 mt-1 font-medium">Total Expenses</span>
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-orange-500 truncate">
            Rs. {thisMonthExpenses.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
        </Link>

        {/* Net Profit Card */}
        <Link 
          href="/dashboard/reports/financials"
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 flex flex-col justify-between gap-3 hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer group border-t-4 border-t-purple-500"
        >
          <div className="flex items-center justify-between">
            <div className="flex flex-col text-gray-600 text-xs sm:text-sm font-bold">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-purple-50 rounded-lg text-purple-600 border border-purple-100 shadow-sm">📈</span>
                <span className="truncate text-gray-800">Net Profit</span>
              </div>
              <span className="text-[10px] text-gray-400 mt-1 font-medium">Profit</span>
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-bold truncate text-purple-600">
            Rs. {thisMonthNetProfit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
        </Link>

        {/* Overdue Vaccines Card */}
        <Link 
          href="/dashboard/vaccinations?tab=overdue"
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 flex flex-col justify-between gap-3 hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer group border-t-4 border-t-pink-400"
        >
          <div className="flex items-center justify-between">
            <div className="flex flex-col text-gray-600 text-xs sm:text-sm font-bold">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-pink-50 rounded-lg text-pink-600 border border-pink-100 shadow-sm">🚨</span>
                <span className="truncate text-gray-800">Vaccines</span>
              </div>
              <span className="text-[10px] text-gray-400 mt-1 font-medium">Vaccines Due</span>
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-bold text-pink-500">
            {overdueVaccinesCount}
          </div>
        </Link>

        {/* Confirmed Pregnancies Card */}
        <Link 
          href="/dashboard/insemination?status=Confirmed"
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 flex flex-col justify-between gap-3 hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer group border-t-4 border-t-emerald-400"
        >
          <div className="flex items-center justify-between">
            <div className="flex flex-col text-gray-600 text-xs sm:text-sm font-bold">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600 border border-emerald-100 shadow-sm">✅</span>
                <span className="truncate text-gray-800">Pregnant</span>
              </div>
              <span className="text-[10px] text-gray-400 mt-1 font-medium">Pregnant Animals</span>
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-bold text-emerald-500">
            {confirmedPregnancies}
          </div>
        </Link>

        {/* Upcoming Calvings Card */}
        <Link 
          href="/dashboard/insemination?status=Confirmed"
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 flex flex-col justify-between gap-3 hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer group border-t-4 border-t-orange-400"
        >
          <div className="flex items-center justify-between">
            <div className="flex flex-col text-gray-600 text-xs sm:text-sm font-bold">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-orange-50 rounded-lg text-orange-600 border border-orange-100 shadow-sm">📅</span>
                <span className="truncate text-gray-800">Due Calvings</span>
              </div>
              <span className="text-[10px] text-gray-400 mt-1 font-medium">Due Next</span>
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-bold text-orange-500">
            {upcomingCalvings}
          </div>
        </Link>
      </div>

      {/* Quick Action Navigation Buttons (Full Width on Mobile) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link 
          href="/dashboard/vaccinations" 
          className="w-full text-center bg-[#16A34A] hover:bg-[#15803d] text-white font-bold py-3 px-4 rounded-xl transition-all shadow-sm text-sm"
        >
          Go to Vaccination Tracker &rarr;
        </Link>
        <Link 
          href="/dashboard/reports/financials" 
          className="w-full text-center bg-[#0096FF] hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-sm text-sm"
        >
          Go to Profit Statements &rarr;
        </Link>
        <Link 
          href="/dashboard/expenses" 
          className="w-full text-center bg-[#02123B] hover:bg-[#010a24] text-white font-bold py-3 px-4 rounded-xl transition-all shadow-sm text-sm"
        >
          Go to Expense Tracker &rarr;
        </Link>
      </div>
    </div>
  );
}

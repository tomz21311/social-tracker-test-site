'use client';

import { useRouter } from 'next/navigation';
import {
  DollarSign,
  Eye,
  MousePointerClick,
  TrendingUp,
  Wrench,
  Monitor,
  ArrowUpDown,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useGlobalFilters } from '@/hooks/useGlobalFilters';
import { useSettings } from '@/hooks/useSettings';
import { useDashboardData } from '@/hooks/useDashboardData';
import { formatCurrency, formatNumber } from '@/lib/constants';

export default function DashboardPage() {
  const { filters } = useGlobalFilters();
  const { settings } = useSettings();
  const { data, loading } = useDashboardData(filters.year, filters.platform, settings);
  const router = useRouter();

  if (loading || !data) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">Dashboard</h1>
          <span className="text-sm text-surface-500">{filters.year} Overview</span>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const kpis = [
    {
      label: 'Campaign Ad Spend (YTD)',
      value: formatCurrency(data.campaignAdSpendYTD),
      icon: DollarSign,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      label: 'Production Cost (YTD)',
      value: formatCurrency(data.productionCostYTD),
      icon: Wrench,
      color: 'text-amber-600 bg-amber-50',
    },
    {
      label: 'Organic Impressions (YTD)',
      value: formatNumber(data.organicImpressionsYTD),
      icon: Eye,
      color: 'text-green-600 bg-green-50',
    },
    {
      label: 'Paid Impressions (YTD)',
      value: formatNumber(data.paidImpressionsYTD),
      icon: Monitor,
      color: 'text-purple-600 bg-purple-50',
    },
    {
      label: 'Total Link Clicks',
      value: formatNumber(data.totalClicksYTD),
      icon: MousePointerClick,
      color: 'text-rose-600 bg-rose-50',
    },
    {
      label: 'Estimated EMV (Organic)',
      value: formatCurrency(data.emvYTD),
      icon: TrendingUp,
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      label: 'Net Value (YTD)',
      value: formatCurrency(data.netValueYTD),
      icon: ArrowUpDown,
      color: data.netValueYTD >= 0
        ? 'text-emerald-600 bg-emerald-50'
        : 'text-red-600 bg-red-50',
    },
  ];

  // Chart formatting helpers
  const formatChartCurrency = (cents: number) => {
    const dollars = cents / 100;
    if (dollars >= 1000) return `$${(dollars / 1000).toFixed(0)}k`;
    return `$${dollars.toFixed(0)}`;
  };

  const formatChartNumber = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
    return n.toString();
  };

  const tooltipCurrency = (value: number) => formatCurrency(value);
  const tooltipNumber = (value: number) => formatNumber(value);

  const chartConfigs = [
    {
      title: 'Monthly Ad Spend',
      dataKey: 'adSpend',
      color: '#3b82f6',
      formatter: formatChartCurrency,
      tooltipFormatter: tooltipCurrency,
    },
    {
      title: 'Monthly Organic Impressions',
      dataKey: 'organicImpressions',
      color: '#22c55e',
      formatter: formatChartNumber,
      tooltipFormatter: tooltipNumber,
    },
    {
      title: 'Monthly Paid Impressions',
      dataKey: 'paidImpressions',
      color: '#a855f7',
      formatter: formatChartNumber,
      tooltipFormatter: tooltipNumber,
    },
    {
      title: 'Monthly Estimated EMV',
      dataKey: 'emv',
      color: '#10b981',
      formatter: formatChartCurrency,
      tooltipFormatter: tooltipCurrency,
    },
  ];

  const hasChartData = data.monthlyData.some(
    (m) => m.adSpend > 0 || m.organicImpressions > 0 || m.paidImpressions > 0 || m.emv > 0
  );

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <span className="text-sm text-surface-500">{filters.year} Overview</span>
      </div>

      {/* KPI Tiles — 7 tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-8">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="kpi-tile">
              <div className="flex items-center justify-between mb-2">
                <span className="kpi-label">{kpi.label}</span>
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${kpi.color}`}
                >
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <span className="kpi-value">{kpi.value}</span>
            </div>
          );
        })}
      </div>

      {/* Charts — 2×2 grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        {chartConfigs.map((chart) => (
          <div key={chart.title} className="card">
            <div className="card-header">
              <h3 className="text-sm font-medium text-surface-700">{chart.title}</h3>
            </div>
            <div className="card-body">
              {hasChartData ? (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={data.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12, fill: '#9ca3af' }}
                      axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#9ca3af' }}
                      tickFormatter={chart.formatter}
                      axisLine={false}
                      width={55}
                    />
                    <Tooltip
                      formatter={(value: number) => [
                        chart.tooltipFormatter(value),
                        chart.title.replace('Monthly ', ''),
                      ]}
                      contentStyle={{
                        fontSize: '13px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey={chart.dataKey}
                      stroke={chart.color}
                      strokeWidth={2}
                      dot={{ r: 3, fill: chart.color }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center">
                  <p className="text-sm text-surface-400">
                    Charts will populate as data is added.
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Top Tables — 3 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top Campaigns by Total Impressions */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-medium text-surface-700">
              Top Campaigns
            </h3>
            <span className="text-xs text-surface-400">by total impressions</span>
          </div>
          <div className="card-body">
            {data.topCampaigns.length > 0 ? (
              <div className="space-y-3">
                {data.topCampaigns.map((camp, i) => (
                  <div key={camp.id} className="flex items-start gap-3">
                    <span className="text-xs text-surface-400 font-medium mt-0.5 w-4">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <button
                        onClick={() => router.push(`/campaigns/${camp.id}`)}
                        className="text-sm font-medium text-brand-600 hover:text-brand-700 truncate block text-left"
                      >
                        {camp.name}
                      </button>
                      <div className="flex gap-3 text-xs text-surface-500 mt-0.5">
                        <span>{formatNumber(camp.totalImpressions)} impr.</span>
                        <span>{formatCurrency(camp.totalEMV)} EMV</span>
                        <span>{formatCurrency(camp.adSpend)} spend</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state py-8">
                <p className="empty-state-text">
                  No campaigns yet. Create campaigns and link content to see results.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Top Campaigns by Net Value */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-medium text-surface-700">
              Top Campaigns
            </h3>
            <span className="text-xs text-surface-400">by net value</span>
          </div>
          <div className="card-body">
            {data.topCampaignsByNetValue.length > 0 ? (
              <div className="space-y-3">
                {data.topCampaignsByNetValue.map((camp, i) => (
                  <div key={camp.id} className="flex items-start gap-3">
                    <span className="text-xs text-surface-400 font-medium mt-0.5 w-4">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <button
                        onClick={() => router.push(`/campaigns/${camp.id}`)}
                        className="text-sm font-medium text-brand-600 hover:text-brand-700 truncate block text-left"
                      >
                        {camp.name}
                      </button>
                      <div className="flex gap-3 text-xs text-surface-500 mt-0.5">
                        <span className={`font-medium ${camp.netValue >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {formatCurrency(camp.netValue)} net
                        </span>
                        <span>{formatCurrency(camp.totalEMV)} EMV</span>
                        <span>{formatCurrency(camp.productionCost)} cost</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state py-8">
                <p className="empty-state-text">
                  No campaigns yet. Create campaigns and link content to see results.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Top Organic Content by EMV */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-medium text-surface-700">
              Top Organic Content
            </h3>
            <span className="text-xs text-surface-400">by EMV</span>
          </div>
          <div className="card-body">
            {data.topContent.length > 0 ? (
              <div className="space-y-3">
                {data.topContent.map((item, i) => (
                  <div key={item.id} className="flex items-start gap-3">
                    <span className="text-xs text-surface-400 font-medium mt-0.5 w-4">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <button
                        onClick={() => router.push(`/content/${item.id}`)}
                        className="text-sm font-medium text-brand-600 hover:text-brand-700 truncate block text-left"
                      >
                        {item.title}
                      </button>
                      <div className="flex gap-3 text-xs text-surface-500 mt-0.5">
                        <span>{formatCurrency(item.emv)} EMV</span>
                        <span>{formatNumber(item.organicImpressions)} impr.</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state py-8">
                <p className="empty-state-text">
                  No content yet. Add content to see top performers.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

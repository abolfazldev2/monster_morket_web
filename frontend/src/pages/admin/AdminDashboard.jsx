import { useQuery } from "@tanstack/react-query";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Skeleton } from "../../components/common/Feedback";
import { adminReportsApi } from "../../services/resources";

const PIE_COLORS = ["#E23B3B", "#7B5CF0", "#E2A63B", "#35C577", "#5C616B"];

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "reports", "overview"],
    queryFn: () => adminReportsApi.overview().then((r) => r.data),
  });

  if (isLoading) return <Skeleton className="h-96" />;
  if (!data) return null;

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold">{t("admin.overview.title")}</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label={t("admin.overview.totalSales")} value={`$${data.total_sales}`} />
        <StatCard label={t("admin.overview.todaySales")} value={`$${data.today_sales}`} />
        <StatCard label={t("admin.overview.totalOrders")} value={data.total_orders} />
        <StatCard label={t("admin.overview.pendingOrders")} value={data.pending_orders} />
        <StatCard label={t("admin.overview.pendingPayments")} value={data.pending_payments} />
        <StatCard label={t("admin.overview.activeProducts")} value={data.active_products} />
        <StatCard label={t("admin.overview.registeredUsers")} value={data.registered_users} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title={t("admin.overview.salesOverTime")}>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.sales_over_time}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2D33" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9AA0AA" }} />
              <YAxis tick={{ fontSize: 11, fill: "#9AA0AA" }} />
              <Tooltip contentStyle={{ background: "#131418", border: "1px solid #2A2D33" }} />
              <Line type="monotone" dataKey="total" stroke="#E23B3B" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t("admin.overview.ordersOverTime")}>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.orders_over_time}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2D33" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9AA0AA" }} />
              <YAxis tick={{ fontSize: 11, fill: "#9AA0AA" }} />
              <Tooltip contentStyle={{ background: "#131418", border: "1px solid #2A2D33" }} />
              <Line type="monotone" dataKey="count" stroke="#7B5CF0" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t("admin.overview.topProducts")}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.top_products} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2D33" />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#9AA0AA" }} />
              <YAxis
                type="category"
                dataKey="items__product__name"
                width={120}
                tick={{ fontSize: 11, fill: "#9AA0AA" }}
              />
              <Tooltip contentStyle={{ background: "#131418", border: "1px solid #2A2D33" }} />
              <Bar dataKey="total_sold" fill="#E23B3B" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t("admin.overview.salesByGame")}>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data.sales_by_game}
                dataKey="total"
                nameKey="items__product__game__name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={(entry) => entry.items__product__game__name}
              >
                {data.sales_by_game.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "#131418", border: "1px solid #2A2D33" }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t("admin.overview.pendingFulfillment")}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.pending_fulfillment}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2D33" />
              <XAxis dataKey="status" tick={{ fontSize: 10, fill: "#9AA0AA" }} />
              <YAxis tick={{ fontSize: 11, fill: "#9AA0AA" }} />
              <Tooltip contentStyle={{ background: "#131418", border: "1px solid #2A2D33" }} />
              <Bar dataKey="count" fill="#E2A63B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-bg-surface border border-border-subtle rounded-card p-5">
      <p className="text-xs text-text-muted uppercase mb-1">{label}</p>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="bg-bg-surface border border-border-subtle rounded-card p-5">
      <p className="text-sm font-medium mb-4">{title}</p>
      {children}
    </div>
  );
}

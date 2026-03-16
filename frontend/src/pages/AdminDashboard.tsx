import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Search, LogOut, ChevronLeft, ChevronRight,
  Users, Clock, CheckCircle, XCircle, Star, TrendingUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { listApplications, getDashboardStats } from '../lib/api';
import { StatusBadge, Spinner } from '../components/ui';
import type { ApplicationStatus } from '../types';
import clsx from 'clsx';

const STATUS_TABS: { label: string; value: ApplicationStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Reviewing', value: 'reviewing' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Waitlisted', value: 'waitlisted' },
];

export default function AdminDashboard() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const LIMIT = 15;

  // Debounce search
  const handleSearch = (v: string) => {
    setSearch(v);
    clearTimeout((window as unknown as { _st: ReturnType<typeof setTimeout> })._st);
    (window as unknown as { _st: ReturnType<typeof setTimeout> })._st = setTimeout(() => {
      setDebouncedSearch(v);
      setPage(1);
    }, 400);
  };

  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: getDashboardStats,
    refetchInterval: 30000,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['applications', statusFilter, debouncedSearch, page],
    queryFn: () =>
      listApplications({
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: debouncedSearch || undefined,
        page,
        limit: LIMIT,
      }),
  });

  const handleLogout = () => { logout(); navigate('/admin/login'); };

  const STAT_CARDS = [
    { label: 'Total', value: stats?.total ?? 0, icon: Users, color: 'text-ibh-cream' },
    { label: 'This Month', value: stats?.this_month ?? 0, icon: TrendingUp, color: 'text-gold' },
    { label: 'Pending', value: stats?.pending ?? 0, icon: Clock, color: 'text-yellow-400' },
    { label: 'Approved', value: stats?.approved ?? 0, icon: CheckCircle, color: 'text-emerald-400' },
    { label: 'Rejected', value: stats?.rejected ?? 0, icon: XCircle, color: 'text-red-400' },
    { label: 'Waitlisted', value: stats?.waitlisted ?? 0, icon: Star, color: 'text-purple-400' },
  ];

  return (
    <div className="min-h-screen bg-ibh-dark text-ibh-text">
      {/* Top nav */}
      <nav className="sticky top-0 z-40 bg-ibh-dark/95 backdrop-blur border-b border-gold/10 px-6 py-4 flex items-center justify-between">
        <span className="font-cormorant text-xl font-light tracking-[0.15em] text-ibh-cream">
          IBH <span className="text-gold">ADMIN</span>
        </span>
        <div className="flex items-center gap-6">
          <span className="text-[10px] tracking-widest text-ibh-muted hidden sm:block">
            {admin?.name} · <span className="text-gold">{admin?.role}</span>
          </span>
          <button onClick={handleLogout} className="flex items-center gap-2 text-ibh-muted hover:text-red-400 transition-colors">
            <LogOut size={14} />
            <span className="text-[10px] tracking-widest uppercase">Logout</span>
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Page title */}
        <div className="mb-10">
          <p className="ibh-section-tag mb-2">Overview</p>
          <h1 className="font-cormorant text-4xl font-light text-ibh-cream">
            Applications <em className="italic text-gold-light">Dashboard</em>
          </h1>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
          {STAT_CARDS.map(({ label, value, icon: Icon, color }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="ibh-card border border-white/5 hover:border-gold/20 transition-colors"
            >
              <Icon size={16} className={clsx('mb-3', color)} />
              <p className={clsx('text-3xl font-cormorant font-light', color)}>{value}</p>
              <p className="text-[9px] tracking-[0.3em] uppercase text-ibh-muted mt-1">{label}</p>
            </motion.div>
          ))}
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search size={13} className="absolute left-4 top-1/2 -translate-y-1/2 text-ibh-muted" />
            <input
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search name or email..."
              className="ibh-input pl-10 text-xs"
            />
          </div>

          {/* Status tabs */}
          <div className="flex flex-wrap gap-1">
            {STATUS_TABS.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => { setStatusFilter(value); setPage(1); }}
                className={clsx(
                  'text-[9px] tracking-[0.2em] uppercase px-3 py-2 border transition-all duration-200',
                  statusFilter === value
                    ? 'border-gold bg-gold/10 text-gold'
                    : 'border-white/10 text-ibh-muted hover:border-gold/30 hover:text-ibh-text'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="border border-white/5 overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_1.5fr_1fr_1fr_1fr_80px] gap-4 px-5 py-3 bg-ibh-dark-4 border-b border-white/5">
            {['Name', 'Email', 'Location', 'Categories', 'Status', 'Date'].map((h) => (
              <span key={h} className="text-[9px] tracking-[0.3em] uppercase text-ibh-muted">{h}</span>
            ))}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Spinner size={24} />
            </div>
          ) : !data?.data.length ? (
            <div className="text-center py-20">
              <p className="font-cormorant text-2xl text-ibh-muted">No applications found</p>
            </div>
          ) : (
            data.data.map((app, i) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => navigate(`/admin/applications/${app.id}`)}
                className="grid grid-cols-[1fr_1.5fr_1fr_1fr_1fr_80px] gap-4 px-5 py-4 border-b border-white/[0.04] hover:bg-gold/[0.03] cursor-pointer transition-colors duration-200 items-center"
              >
                <span className="text-sm text-ibh-cream font-medium truncate">
                  {app.first_name} {app.last_name}
                </span>
                <span className="text-xs text-ibh-muted truncate">{app.email}</span>
                <span className="text-xs text-ibh-muted truncate">{app.location}</span>
                <div className="flex flex-wrap gap-1">
                  {app.categories.slice(0, 2).map((c) => (
                    <span key={c} className="text-[8px] tracking-wide bg-gold/10 text-gold/70 px-1.5 py-0.5 truncate max-w-[80px]">
                      {c.split(' ')[0]}
                    </span>
                  ))}
                  {app.categories.length > 2 && (
                    <span className="text-[8px] text-ibh-muted">+{app.categories.length - 2}</span>
                  )}
                </div>
                <StatusBadge status={app.status} />
                <span className="text-[10px] text-ibh-muted">
                  {new Date(app.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                </span>
              </motion.div>
            ))
          )}
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <span className="text-[10px] text-ibh-muted tracking-wide">
              Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, data.total)} of {data.total}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-2 border border-white/10 text-ibh-muted hover:border-gold/40 hover:text-gold transition-colors disabled:opacity-30"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-[11px] text-ibh-muted px-3">
                {page} / {data.totalPages}
              </span>
              <button
                disabled={page === data.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-2 border border-white/10 text-ibh-muted hover:border-gold/40 hover:text-gold transition-colors disabled:opacity-30"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Send, FileText, Trash2, ChevronDown,
  Instagram, Globe, Phone, Mail, MapPin, Calendar,
} from 'lucide-react';
import clsx from 'clsx';
import { getApplication, updateStatus, sendAgreement, deleteApplication } from '../lib/api';
import { StatusBadge, Spinner, GoldDivider } from '../components/ui';
import type { ApplicationStatus } from '../types';

const STATUSES: ApplicationStatus[] = ['pending','reviewing','approved','rejected','waitlisted'];

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  pending:    'text-yellow-400',
  reviewing:  'text-blue-400',
  approved:   'text-emerald-400',
  rejected:   'text-red-400',
  waitlisted: 'text-purple-400',
};

function InfoRow({ label, value }: { label: string; value?: string | number }) {
  if (!value) return null;
  return (
    <div className="flex gap-3 py-2 border-b border-white/[0.04]">
      <span className="text-[9px] tracking-[0.25em] uppercase text-ibh-muted min-w-[140px] pt-0.5">{label}</span>
      <span className="text-xs text-ibh-cream/90">{value}</span>
    </div>
  );
}

export default function ApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [newStatus, setNewStatus] = useState<ApplicationStatus | ''>('');
  const [notes, setNotes] = useState('');
  const [showStatusPanel, setShowStatusPanel] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const { data: app, isLoading } = useQuery({
    queryKey: ['application', id],
    queryFn: () => getApplication(id!),
    enabled: !!id,
    // onSuccess: (a) => { setNewStatus(a.status); setNotes(a.admin_notes || ''); },
  });

  useEffect(() => {
   if (app){
    setNewStatus(app.status);
    setNotes(app.admin_notes || '');
   }
  }, [app])


  const statusMutation = useMutation({
    mutationFn: () => updateStatus(id!, newStatus as ApplicationStatus, notes || undefined),
    onSuccess: () => {
      toast.success('Status updated');
      qc.invalidateQueries({ queryKey: ['application', id] });
      qc.invalidateQueries({ queryKey: ['applications'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
      setShowStatusPanel(false);
    },
    onError: () => toast.error('Failed to update status'),
  });

  const agreementMutation = useMutation({
    mutationFn: () => sendAgreement(id!),
    onSuccess: () => {
      toast.success('Agreement sent to model');
      qc.invalidateQueries({ queryKey: ['application', id] });
    },
    onError: () => toast.error('Failed to send agreement'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteApplication(id!),
    onSuccess: () => {
      toast.success('Application deleted');
      navigate('/admin');
    },
    onError: () => toast.error('Failed to delete'),
  });

  if (isLoading) return (
    <div className="min-h-screen bg-ibh-dark flex items-center justify-center">
      <Spinner size={28} />
    </div>
  );

  if (!app) return (
    <div className="min-h-screen bg-ibh-dark flex items-center justify-center text-ibh-muted">
      Application not found.
    </div>
  );

  return (
    <div className="min-h-screen bg-ibh-dark text-ibh-text">
      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-ibh-dark/95 backdrop-blur border-b border-gold/10 px-6 py-4 flex items-center justify-between">
        <Link to="/admin" className="flex items-center gap-2 text-ibh-muted hover:text-gold transition-colors">
          <ArrowLeft size={14} />
          <span className="text-[10px] tracking-widest uppercase">Back to Dashboard</span>
        </Link>
        <span className="font-cormorant text-xl font-light tracking-[0.15em] text-ibh-cream hidden sm:block">
          IBH <span className="text-gold">ADMIN</span>
        </span>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-10">
          <div>
            <p className="ibh-section-tag mb-2">Application Detail</p>
            <h1 className="font-cormorant text-4xl font-light text-ibh-cream">
              {app.first_name} <em className="italic text-gold-light">{app.last_name}</em>
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <StatusBadge status={app.status} />
              <span className="text-[10px] text-ibh-muted tracking-wide">
                Submitted {new Date(app.created_at).toLocaleDateString('en-US', { dateStyle: 'long' })}
              </span>
              {app.agreement_sent && (
                <span className="text-[9px] tracking-[0.2em] uppercase border border-emerald-500/30 text-emerald-400 px-2 py-0.5">
                  Agreement Sent
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowStatusPanel(!showStatusPanel)}
              className="ibh-btn-outline text-xs"
            >
              <span>Update Status</span>
              <ChevronDown size={12} className={clsx('transition-transform', showStatusPanel && 'rotate-180')} />
            </button>
            <button
              onClick={() => agreementMutation.mutate()}
              disabled={agreementMutation.isPending}
              className="ibh-btn-outline text-xs"
            >
              {agreementMutation.isPending ? <Spinner size={12} /> : <FileText size={12} />}
              <span>Send Agreement</span>
            </button>
            <button
              onClick={() => setDeleteConfirm(true)}
              className="flex items-center gap-2 text-red-400/70 hover:text-red-400 border border-red-500/20 hover:border-red-500/40 px-4 py-2 text-[10px] tracking-widest uppercase transition-all"
            >
              <Trash2 size={12} />
              <span>Delete</span>
            </button>
          </div>
        </div>

        {/* Status panel */}
        {showStatusPanel && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-gold/20 bg-gold/[0.03] p-6 mb-8"
          >
            <p className="ibh-section-tag mb-5">Update Status</p>
            <div className="flex flex-wrap gap-2 mb-5">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => setNewStatus(s)}
                  className={clsx(
                    'text-[9px] tracking-[0.25em] uppercase border px-4 py-2 transition-all',
                    newStatus === s
                      ? `border-current bg-current/10 ${STATUS_COLORS[s]}`
                      : 'border-white/10 text-ibh-muted hover:border-white/25'
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional note to the model (included in email notification)..."
              className="ibh-input min-h-[80px] resize-y text-xs mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => statusMutation.mutate()}
                disabled={statusMutation.isPending || newStatus === app.status}
                className="ibh-btn-primary text-sm"
              >
                {statusMutation.isPending ? <Spinner size={14} /> : <Send size={14} />}
                <span>Save & Notify</span>
              </button>
              <button onClick={() => setShowStatusPanel(false)} className="ibh-btn-outline text-xs">
                <span>Cancel</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* Delete confirm */}
        {deleteConfirm && (
          <div className="border border-red-500/30 bg-red-500/5 p-5 mb-8 flex items-center justify-between">
            <p className="text-sm text-red-400">Are you sure? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => deleteMutation.mutate()} className="text-[10px] tracking-widest uppercase text-red-400 border border-red-500/40 px-4 py-2 hover:bg-red-500/10">
                {deleteMutation.isPending ? <Spinner size={12} /> : 'Confirm Delete'}
              </button>
              <button onClick={() => setDeleteConfirm(false)} className="text-[10px] tracking-widest uppercase text-ibh-muted border border-white/10 px-4 py-2">Cancel</button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: main info */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            {/* Photos */}
            {app.photo_urls.length > 0 && (
              <div>
                <p className="ibh-section-tag mb-4">Photos ({app.photo_urls.length})</p>
                <div className="flex flex-wrap gap-3">
                  {app.photo_urls.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noreferrer">
                      <img src={url} alt="" className="w-28 h-28 object-cover border border-gold/20 hover:border-gold/60 transition-colors" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            <GoldDivider />

            {/* Personal */}
            <div>
              <p className="ibh-section-tag mb-4">Personal Information</p>
              <InfoRow label="Full Name" value={`${app.first_name} ${app.last_name}`} />
              <InfoRow label="Date of Birth" value={new Date(app.date_of_birth).toLocaleDateString('en-US', { dateStyle: 'long' })} />
              <InfoRow label="Gender" value={app.gender} />
              <InfoRow label="Nationality" value={app.nationality} />
              <InfoRow label="Location" value={app.location} />
            </div>

            <GoldDivider />

            {/* Contact */}
            <div>
              <p className="ibh-section-tag mb-4">Contact</p>
              <div className="flex flex-col gap-1">
                <a href={`mailto:${app.email}`} className="flex items-center gap-2 text-xs text-ibh-cream/80 hover:text-gold transition-colors py-1.5">
                  <Mail size={12} className="text-gold/50" />{app.email}
                </a>
                <span className="flex items-center gap-2 text-xs text-ibh-cream/80 py-1.5">
                  <Phone size={12} className="text-gold/50" />{app.phone}
                </span>
                {app.location && (
                  <span className="flex items-center gap-2 text-xs text-ibh-muted py-1.5">
                    <MapPin size={12} className="text-gold/50" />{app.location}
                  </span>
                )}
                {app.instagram && (
                  <a href={`https://instagram.com/${app.instagram.replace('@','')}`} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 text-xs text-ibh-muted hover:text-gold transition-colors py-1.5">
                    <Instagram size={12} className="text-gold/50" />{app.instagram}
                  </a>
                )}
                {app.portfolio_url && (
                  <a href={app.portfolio_url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 text-xs text-ibh-muted hover:text-gold transition-colors py-1.5">
                    <Globe size={12} className="text-gold/50" />{app.portfolio_url}
                  </a>
                )}
              </div>
            </div>

            <GoldDivider />

            {/* Bio */}
            <div>
              <p className="ibh-section-tag mb-4">About the Model</p>
              <p className="text-sm text-ibh-muted leading-loose">{app.bio}</p>
              {app.campaigns && (
                <>
                  <p className="ibh-section-tag mt-6 mb-2">Notable Campaigns</p>
                  <p className="text-xs text-ibh-muted leading-loose">{app.campaigns}</p>
                </>
              )}
            </div>

            {/* Activity log */}
            {app.activity_log && app.activity_log.length > 0 && (
              <>
                <GoldDivider />
                <div>
                  <p className="ibh-section-tag mb-4">Activity Log</p>
                  <div className="flex flex-col gap-2">
                    {app.activity_log.map((log) => (
                      <div key={log.id} className="flex items-start gap-3 py-2 border-b border-white/[0.04] text-xs">
                        <Calendar size={11} className="text-gold/40 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="text-ibh-cream/70 tracking-wide capitalize">{log.action.replace(/_/g,' ')}</span>
                          {log.admin_name && <span className="text-ibh-muted ml-2">by {log.admin_name}</span>}
                        </div>
                        <span className="ml-auto text-[10px] text-ibh-muted/50">
                          {new Date(log.created_at).toLocaleDateString('en-GB')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right: sidebar */}
          <div className="flex flex-col gap-6">
            {/* Categories */}
            <div className="ibh-card">
              <p className="ibh-section-tag mb-4">Categories</p>
              <div className="flex flex-col gap-2">
                {app.categories.map((c) => (
                  <span key={c} className="text-[10px] tracking-[0.15em] text-gold/80 border border-gold/20 bg-gold/5 px-3 py-2">
                    {c}
                  </span>
                ))}
              </div>
            </div>

            {/* Measurements */}
            <div className="ibh-card">
              <p className="ibh-section-tag mb-4">Measurements</p>
              {[
                ['Height', app.height_cm ? `${app.height_cm} cm` : undefined],
                ['Weight', app.weight_kg ? `${app.weight_kg} kg` : undefined],
                ['Bust/Chest', app.bust_cm ? `${app.bust_cm} cm` : undefined],
                ['Waist', app.waist_cm ? `${app.waist_cm} cm` : undefined],
                ['Hips', app.hips_cm ? `${app.hips_cm} cm` : undefined],
                ['Shoe EU', app.shoe_size_eu ? String(app.shoe_size_eu) : undefined],
                ['Hair', app.hair_color],
                ['Eyes', app.eye_color],
                ['Skin Tone', app.skin_tone],
              ].filter(([, v]) => v).map(([label, value]) => (
                <div key={label as string} className="flex justify-between text-xs py-1.5 border-b border-white/[0.04]">
                  <span className="text-ibh-muted">{label}</span>
                  <span className="text-ibh-cream/80">{value}</span>
                </div>
              ))}
            </div>

            {/* Availability */}
            <div className="ibh-card">
              <p className="ibh-section-tag mb-4">Availability</p>
              <InfoRow label="Schedule" value={app.availability} />
              <InfoRow label="Travel" value={app.travel_pref} />
              <InfoRow label="Experience" value={app.experience} />
              <InfoRow label="Previous Agency" value={app.prev_agency} />
              <InfoRow label="Heard About Us" value={app.hear_about} />
              <InfoRow label="Emergency Contact" value={app.emergency_contact} />
            </div>

            {/* Agreement status */}
            <div className="ibh-card border-gold/10">
              <p className="ibh-section-tag mb-4">Agreement</p>
              <div className={clsx('text-xs mb-2', app.agreement_sent ? 'text-emerald-400' : 'text-ibh-muted')}>
                {app.agreement_sent
                  ? `Sent on ${new Date(app.agreement_sent_at!).toLocaleDateString('en-US', { dateStyle: 'medium' })}`
                  : 'Not yet sent'}
              </div>
              {app.agreement_signed && (
                <span className="text-[9px] tracking-[0.2em] uppercase text-emerald-400 border border-emerald-500/30 px-2 py-1">
                  Signed
                </span>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

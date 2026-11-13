"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Settings,
  Save,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Clock,
  Shield,
  IndianRupee,
  Building,
  Bell,
  Receipt,
  Database,
  RefreshCw,
  Sliders,
  Waves,
  Images,
  Plus,
  Trash2,
  Edit3,
  MoveUp,
  MoveDown,
  ExternalLink,
  Star,
  X,
  Eye,
  Sparkles,
  LifeBuoy,
} from "lucide-react";
import MakLogo from "@/components/MakLogo";
import {
  parseGalleryPhotos,
  GalleryPhotoItem,
  GALLERY_CATEGORIES,
  DEFAULT_GALLERY_PHOTOS,
} from "@/lib/default-gallery";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Sub-Navigation Tabs
  const [activeSection, setActiveSection] = useState<
    | "general"
    | "gallery"
    | "pricing"
    | "rules"
    | "hours"
    | "notifications"
    | "receipts"
    | "retention"
    | "backup"
    | "maintenance"
  >("general");

  // Public Gallery Studio State
  const [galleryPhotos, setGalleryPhotos] = useState<GalleryPhotoItem[]>(DEFAULT_GALLERY_PHOTOS);
  const [galleryFilter, setGalleryFilter] = useState<string>("ALL");
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [editingPhotoIndex, setEditingPhotoIndex] = useState<number | null>(null);
  const [photoForm, setPhotoForm] = useState<GalleryPhotoItem>({
    id: "",
    title: "",
    category: "POOL",
    categoryLabel: "Main Pool",
    desc: "",
    src: "",
    isFeatured: false,
  });

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings");
      const json = await res.json();
      setSettings(json.settings);
      if (json.settings) {
        setGalleryPhotos(parseGalleryPhotos(json.settings.galleryData));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      const payload = {
        ...settings,
        galleryData: JSON.stringify(galleryPhotos),
      };
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to update settings.");
      }
      setFeedback({ type: "success", msg: "Pool system settings updated successfully!" });
      fetchSettings();
    } catch (err: any) {
      setFeedback({ type: "error", msg: err.message || "Failed to save settings." });
    } finally {
      setSaving(false);
    }
  };

  // Gallery Synchronizer Helper
  const syncGallery = (newPhotos: GalleryPhotoItem[]) => {
    setGalleryPhotos(newPhotos);
    setSettings((prev: any) => ({
      ...prev,
      galleryData: JSON.stringify(newPhotos),
    }));
  };

  const handleOpenAddPhoto = () => {
    setEditingPhotoIndex(null);
    setPhotoForm({
      id: `gal-${Date.now()}`,
      title: "",
      category: "POOL",
      categoryLabel: "Main Pool",
      desc: "",
      src: "",
      isFeatured: false,
    });
    setIsPhotoModalOpen(true);
  };

  const handleOpenEditPhoto = (photoId: string) => {
    const idx = galleryPhotos.findIndex((p) => p.id === photoId);
    if (idx === -1) return;
    setEditingPhotoIndex(idx);
    setPhotoForm({ ...galleryPhotos[idx] });
    setIsPhotoModalOpen(true);
  };

  const handleSavePhotoModal = () => {
    if (!photoForm.title.trim() || !photoForm.src.trim()) {
      alert("Please provide both a title and an image URL.");
      return;
    }

    let updated: GalleryPhotoItem[];
    if (editingPhotoIndex !== null && editingPhotoIndex >= 0) {
      updated = [...galleryPhotos];
      updated[editingPhotoIndex] = { ...photoForm };
    } else {
      updated = [
        ...galleryPhotos,
        {
          ...photoForm,
          id: photoForm.id || `gal-${Date.now()}`,
        },
      ];
    }
    syncGallery(updated);
    setIsPhotoModalOpen(false);
    setFeedback({
      type: "success",
      msg: editingPhotoIndex !== null ? "Photo updated! Click 'Save Changes' below to persist permanently." : "New photo added! Click 'Save Changes' below to persist permanently.",
    });
  };

  const handleDeletePhoto = (photoId: string) => {
    const item = galleryPhotos.find((p) => p.id === photoId);
    if (!item) return;
    if (confirm(`Remove "${item.title}" from public gallery?`)) {
      const updated = galleryPhotos.filter((p) => p.id !== photoId);
      syncGallery(updated);
      setFeedback({
        type: "success",
        msg: `Photo "${item.title}" removed. Click 'Save Changes' below to finalize.`,
      });
    }
  };

  const handleMovePhoto = (photoId: string, direction: "up" | "down") => {
    const idx = galleryPhotos.findIndex((p) => p.id === photoId);
    if (idx === -1) return;
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= galleryPhotos.length) return;
    const updated = [...galleryPhotos];
    const [moved] = updated.splice(idx, 1);
    updated.splice(targetIdx, 0, moved);
    syncGallery(updated);
  };

  const handleToggleFeatured = (photoId: string) => {
    const idx = galleryPhotos.findIndex((p) => p.id === photoId);
    if (idx === -1) return;
    const updated = [...galleryPhotos];
    updated[idx] = { ...updated[idx], isFeatured: !updated[idx].isFeatured };
    syncGallery(updated);
  };

  const handleResetDefaults = () => {
    if (confirm("Reset public gallery photos to default 8 pool showcase images?")) {
      syncGallery(DEFAULT_GALLERY_PHOTOS);
      setFeedback({
        type: "success",
        msg: "Public gallery reset to default pool showcase. Click 'Save Changes' to finalize.",
      });
    }
  };

  const handleApplyPreset = (preset: GalleryPhotoItem) => {
    setPhotoForm({
      ...preset,
      id: photoForm.id || `gal-${Date.now()}`,
    });
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400 text-xs">Loading system settings...</div>;
  }

  const sections = [
    { id: "general", label: "General", icon: Building },
    { id: "gallery", label: "Public Gallery", icon: Images },
    { id: "pricing", label: "Pricing & Rates", icon: IndianRupee },
    { id: "rules", label: "Booking Rules", icon: Shield },
    { id: "hours", label: "Operational Hours", icon: Clock },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "receipts", label: "Receipts", icon: Receipt },
    { id: "retention", label: "Data Retention", icon: Database },
    { id: "backup", label: "Backup & Recovery", icon: RefreshCw },
    { id: "maintenance", label: "Maintenance Mode", icon: Sliders },
  ];

  const getCategoryBadgeClass = (cat: string) => {
    switch (cat) {
      case "POOL":
        return "bg-sky-50 text-sky-700 border-sky-200";
      case "KIDS":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "LOUNGE":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "FACILITIES":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "SAFETY":
        return "bg-teal-50 text-teal-700 border-teal-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const filteredPhotos =
    galleryFilter === "ALL"
      ? galleryPhotos
      : galleryPhotos.filter((p) => p.category === galleryFilter);

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center justify-between gap-2 shadow-xs ${
            feedback.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
            )}
            <span className="font-semibold">{feedback.msg}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Sub-Navigation Menu */}
        <div className="md:col-span-4 bg-white rounded-3xl p-3 border border-white shadow-[0_4px_20px_rgba(20,60,110,0.05)] space-y-1 self-start">
          {sections.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => setActiveSection(sec.id as any)}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-2xl text-xs font-bold transition-all text-left ${
                  isActive
                    ? "bg-[#1D68BD] text-white shadow-md shadow-blue-600/20"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                  <span>{sec.label}</span>
                </div>
                {sec.id === "gallery" && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      isActive ? "bg-white/20 text-white" : "bg-sky-50 text-sky-700"
                    }`}
                  >
                    {galleryPhotos.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Settings Form Content */}
        <div className="md:col-span-8 bg-white rounded-3xl p-6 border border-white shadow-[0_4px_20px_rgba(20,60,110,0.05)] space-y-6 flex flex-col justify-between">
          <div className="space-y-5">
            {/* 1. General Settings Panel */}
            {activeSection === "general" && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h2 className="font-extrabold text-sm text-slate-900">General Settings</h2>
                  <p className="text-[11px] text-slate-400">Pool facility details and branding</p>
                </div>

                <div className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Pool Name</label>
                    <input
                      type="text"
                      required
                      value={settings.poolName || "M.A.K Indoor Pool"}
                      onChange={(e) => setSettings({ ...settings, poolName: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Contact Phone</label>
                    <input
                      type="tel"
                      required
                      value={settings.contactPhone || "+91 9847 123 456"}
                      onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Address</label>
                    <input
                      type="text"
                      required
                      value={settings.address || "Calicut, Kerala"}
                      onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-medium text-slate-900"
                    />
                  </div>

                  {/* Pool Logo Box */}
                  <div className="space-y-2 pt-2">
                    <label className="block font-bold text-slate-700">Pool Logo</label>
                    <div className="flex items-center gap-4">
                      <div className="w-28 h-20 rounded-2xl bg-white border border-slate-200 text-slate-900 flex flex-col items-center justify-center p-2 text-center shadow-xs">
                        <MakLogo size="sm" />
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700"
                        >
                          Change Logo
                        </button>
                        <button
                          type="button"
                          className="px-4 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Public Gallery Studio Panel */}
            {activeSection === "gallery" && (
              <div className="space-y-5">
                {/* Header with actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-extrabold text-sm text-slate-900">Public Gallery Photos</h2>
                      <span className="bg-sky-50 text-sky-700 border border-sky-100 px-2 py-0.5 rounded-full text-[10px] font-extrabold">
                        {galleryPhotos.length} Photos Live
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Curate the images, categories, and descriptions shown in the public home page showcase.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href="/#gallery"
                      target="_blank"
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>Live Site</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </Link>

                    <button
                      type="button"
                      onClick={handleResetDefaults}
                      className="px-3 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                      title="Reset gallery photos to 8 authentic pool facility defaults"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                      <span>Reset</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleOpenAddPhoto}
                      className="px-3.5 py-2 bg-[#1D68BD] hover:bg-[#155299] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-blue-600/20 transition-all active:scale-[0.98]"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Photo</span>
                    </button>
                  </div>
                </div>

                {/* Category Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                  {GALLERY_CATEGORIES.map((cat) => {
                    const count =
                      cat.id === "ALL"
                        ? galleryPhotos.length
                        : galleryPhotos.filter((p) => p.category === cat.id).length;
                    const isSelected = galleryFilter === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setGalleryFilter(cat.id)}
                        className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap text-xs flex items-center gap-1.5 ${
                          isSelected
                            ? "bg-[#1D68BD] text-white shadow-xs"
                            : "bg-slate-100 hover:bg-slate-200/80 text-slate-600"
                        }`}
                      >
                        <span>{cat.label}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                            isSelected ? "bg-white/20 text-white" : "bg-white text-slate-500"
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Photo Grid */}
                {filteredPhotos.length === 0 ? (
                  <div className="p-12 text-center bg-slate-50 border border-dashed border-slate-200 rounded-3xl space-y-3">
                    <Images className="w-10 h-10 text-slate-300 mx-auto" />
                    <div>
                      <p className="font-extrabold text-sm text-slate-700">No photos found in this category</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Add a new photo to showcase this part of the facility on your website.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleOpenAddPhoto}
                      className="px-4 py-2 bg-[#1D68BD] text-white text-xs font-bold rounded-xl shadow-xs"
                    >
                      + Add Photo Now
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filteredPhotos.map((photo) => {
                      const globalIdx = galleryPhotos.findIndex((p) => p.id === photo.id);
                      const isFirst = globalIdx === 0;
                      const isLast = globalIdx === galleryPhotos.length - 1;

                      return (
                        <div
                          key={photo.id}
                          className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                        >
                          {/* Image preview with badges */}
                          <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
                            <img
                              src={photo.src}
                              alt={photo.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=800&q=80";
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-black/20" />

                            {/* Top Badges */}
                            <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                              <span
                                className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border shadow-xs backdrop-blur-md bg-white/95 ${getCategoryBadgeClass(
                                  photo.category
                                )}`}
                              >
                                {photo.categoryLabel || photo.category}
                              </span>

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleToggleFeatured(photo.id)}
                                  className={`p-1.5 rounded-full backdrop-blur-md transition-all ${
                                    photo.isFeatured
                                      ? "bg-amber-400 text-slate-900 shadow-sm"
                                      : "bg-black/40 text-white/80 hover:text-white hover:bg-black/60"
                                  }`}
                                  title={photo.isFeatured ? "Featured photo" : "Click to mark as featured"}
                                >
                                  <Star className="w-3.5 h-3.5 fill-current" />
                                </button>
                                <span className="bg-black/50 text-white text-[10px] font-mono px-2 py-0.5 rounded-full backdrop-blur-md">
                                  #{globalIdx + 1}
                                </span>
                              </div>
                            </div>

                            {/* Bottom Title on Image */}
                            <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white">
                              <h3 className="font-extrabold text-xs drop-shadow-sm line-clamp-1">
                                {photo.title}
                              </h3>
                            </div>
                          </div>

                          {/* Content & Description */}
                          <div className="p-3.5 space-y-2.5 flex-1 flex flex-col justify-between">
                            <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                              {photo.desc || "No description provided."}
                            </p>

                            {/* Bottom Card Action Bar */}
                            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                              {/* Reorder Buttons */}
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleMovePhoto(photo.id, "up")}
                                  disabled={isFirst}
                                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
                                  title="Move earlier on public website"
                                >
                                  <MoveUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMovePhoto(photo.id, "down")}
                                  disabled={isLast}
                                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
                                  title="Move later on public website"
                                >
                                  <MoveDown className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Edit & Delete Buttons */}
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditPhoto(photo.id)}
                                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] flex items-center gap-1 transition-all"
                                >
                                  <Edit3 className="w-3 h-3 text-slate-500" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeletePhoto(photo.id)}
                                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                  title="Delete photo"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 3. Pricing & Rates Panel */}
            {activeSection === "pricing" && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h2 className="font-extrabold text-sm text-slate-900">Pricing & Rates</h2>
                  <p className="text-[11px] text-slate-400">Authoritative hourly tariffs and advance deposits</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Public Swimming Rate (₹ / hr / person)
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={settings.defaultPublicRate}
                      onChange={(e) => setSettings({ ...settings, defaultPublicRate: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Family Base Rate (₹ / hr up to 12 persons)
                    </label>
                    <input
                      type="number"
                      min={100}
                      required
                      value={settings.defaultFamilyBaseRate}
                      onChange={(e) => setSettings({ ...settings, defaultFamilyBaseRate: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Family Extra Guest Rate (₹ / hr / person above 12)
                    </label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={settings.familyExtraRate}
                      onChange={(e) => setSettings({ ...settings, familyExtraRate: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Family Online Advance Required (₹)
                    </label>
                    <input
                      type="number"
                      min={100}
                      required
                      value={settings.familyAdvanceAmount}
                      onChange={(e) => setSettings({ ...settings, familyAdvanceAmount: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 4. Booking Rules Panel */}
            {activeSection === "rules" && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h2 className="font-extrabold text-sm text-slate-900">Booking Rules & Capacity</h2>
                  <p className="text-[11px] text-slate-400">Enforce maximum swimmer limits and reservation holds</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Maximum Public Pool Capacity
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={50}
                      required
                      value={settings.maxCapacity}
                      onChange={(e) => setSettings({ ...settings, maxCapacity: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Slot Hold Duration (Minutes)
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={60}
                      required
                      value={settings.holdTtlMinutes}
                      onChange={(e) => setSettings({ ...settings, holdTtlMinutes: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Cancellation Cutoff (Hours before slot)
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={settings.cancellationCutoffHours}
                      onChange={(e) => setSettings({ ...settings, cancellationCutoffHours: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Reschedule Cutoff (Hours before slot)
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={settings.rescheduleCutoffHours}
                      onChange={(e) => setSettings({ ...settings, rescheduleCutoffHours: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 5. Operational Hours Panel */}
            {activeSection === "hours" && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h2 className="font-extrabold text-sm text-slate-900">Operational Hours</h2>
                  <p className="text-[11px] text-slate-400">Daily opening, closing, and session windows</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Pool Opens (Hour AM)</label>
                    <input
                      type="number"
                      min={6}
                      max={12}
                      required
                      value={settings.openHour}
                      onChange={(e) => setSettings({ ...settings, openHour: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    />
                    <span className="text-[10px] text-slate-400">Default: 9:00 AM</span>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Public Shift Ends (24h)</label>
                    <input
                      type="number"
                      min={12}
                      max={20}
                      required
                      value={settings.publicEndHour}
                      onChange={(e) => setSettings({ ...settings, publicEndHour: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    />
                    <span className="text-[10px] text-slate-400">Default: 16 (4:00 PM)</span>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Pool Closes (24h)</label>
                    <input
                      type="number"
                      min={18}
                      max={24}
                      required
                      value={settings.closeHour}
                      onChange={(e) => setSettings({ ...settings, closeHour: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    />
                    <span className="text-[10px] text-slate-400">Default: 23 (11:00 PM)</span>
                  </div>
                </div>
              </div>
            )}

            {/* 6. Emergency Maintenance Mode Panel */}
            {activeSection === "maintenance" && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h2 className="font-extrabold text-sm text-slate-900">Maintenance Mode</h2>
                  <p className="text-[11px] text-slate-400">Emergency pool closure and customer notice banner</p>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="maintenanceMode"
                      checked={settings.maintenanceMode}
                      onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                      className="w-5 h-5 rounded-md text-[#1D68BD]"
                    />
                    <label htmlFor="maintenanceMode" className="font-bold text-slate-900">
                      Enable Emergency Maintenance Mode (Pauses all online checkout)
                    </label>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Customer Facing Notice Message
                    </label>
                    <textarea
                      rows={3}
                      value={settings.maintenanceMessage || ""}
                      onChange={(e) => setSettings({ ...settings, maintenanceMessage: e.target.value })}
                      placeholder="e.g. Pool is temporarily closed today for routine water treatment."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Other informational sections */}
            {(activeSection === "notifications" ||
              activeSection === "receipts" ||
              activeSection === "retention" ||
              activeSection === "backup") && (
              <div className="space-y-3">
                <div className="border-b border-slate-100 pb-3">
                  <h2 className="font-extrabold text-sm text-slate-900 capitalize">
                    {activeSection} Configuration
                  </h2>
                  <p className="text-[11px] text-slate-400">Automated policy settings</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl text-xs text-slate-600 border border-slate-100">
                  <span>
                    Settings active. Standard automated policy applied according to M.A.K Indoor Pool operational guidelines.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Blue Save Changes Button */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <span className="text-[11px] text-slate-400">
              {activeSection === "gallery"
                ? `Changes sync to homepage gallery immediately upon saving.`
                : `Pool settings are applied across client checkout & admin counters.`}
            </span>
            <button
              type="submit"
              disabled={saving}
              className="bg-[#1D68BD] hover:bg-[#155299] active:scale-[0.99] text-white font-extrabold px-6 py-3 rounded-2xl shadow-md shadow-blue-700/20 transition-all text-xs flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving Changes..." : "Save Changes"}
            </button>
          </div>
        </div>
      </form>

      {/* Add / Edit Photo Modal */}
      {isPhotoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div
            className="bg-white w-full max-w-xl rounded-3xl p-6 shadow-2xl border border-white space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
                  <Images className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    {editingPhotoIndex !== null ? "Edit Gallery Photo" : "Add New Gallery Photo"}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Showcase this photo in the &apos;Explore Our Pool&apos; section.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPhotoModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Presets Drawer */}
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-sky-600" />
                  One-Tap Facility Presets
                </span>
                <span className="text-[10px] text-slate-400">Click to autofill photo &amp; details</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {DEFAULT_GALLERY_PHOTOS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="px-2.5 py-1 bg-white hover:bg-sky-50 border border-slate-200 hover:border-sky-300 rounded-lg text-[10px] font-bold text-slate-700 hover:text-sky-700 transition-all"
                  >
                    {preset.categoryLabel}: {preset.title.split(" ")[0]}...
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Form Fields */}
            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Photo Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Olympic-standard Main Pool Basin"
                  value={photoForm.title}
                  onChange={(e) => setPhotoForm({ ...photoForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1D68BD]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category Filter</label>
                  <select
                    value={photoForm.category}
                    onChange={(e) => {
                      const cat = e.target.value as any;
                      const labelMap: Record<string, string> = {
                        POOL: "Main Pool",
                        KIDS: "Kids Pool",
                        LOUNGE: "Lounge Area",
                        FACILITIES: "Facilities",
                        SAFETY: "Water Safety",
                      };
                      setPhotoForm({
                        ...photoForm,
                        category: cat,
                        categoryLabel: labelMap[cat] || cat,
                      });
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1D68BD]"
                  >
                    <option value="POOL">Main Pool (POOL)</option>
                    <option value="KIDS">Kids Pool (KIDS)</option>
                    <option value="LOUNGE">Lounge Area (LOUNGE)</option>
                    <option value="FACILITIES">Facilities &amp; Lockers (FACILITIES)</option>
                    <option value="SAFETY">Water &amp; Safety (SAFETY)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Badge Tag Label</label>
                  <input
                    type="text"
                    placeholder="e.g. Showers, Lockers, Kids Pool"
                    value={photoForm.categoryLabel}
                    onChange={(e) => setPhotoForm({ ...photoForm, categoryLabel: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1D68BD]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Image URL <span className="text-rose-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://images.unsplash.com/... or your CDN link"
                  value={photoForm.src}
                  onChange={(e) => setPhotoForm({ ...photoForm, src: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1D68BD]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description / Feature Note</label>
                <textarea
                  rows={2}
                  placeholder="Brief 1-2 sentence highlight for customers viewing the pool gallery..."
                  value={photoForm.desc}
                  onChange={(e) => setPhotoForm({ ...photoForm, desc: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1D68BD]"
                />
              </div>

              {/* Live Preview Box */}
              {photoForm.src && (
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-700">Live Preview</label>
                  <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                    <img
                      src={photoForm.src}
                      alt={photoForm.title || "Preview"}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=800&q=80";
                      }}
                    />
                    <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-xs">
                      {photoForm.categoryLabel || photoForm.category}
                    </div>
                  </div>
                </div>
              )}

              {/* Featured Flag */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="modalIsFeatured"
                  checked={photoForm.isFeatured || false}
                  onChange={(e) => setPhotoForm({ ...photoForm, isFeatured: e.target.checked })}
                  className="w-4 h-4 rounded text-[#1D68BD]"
                />
                <label htmlFor="modalIsFeatured" className="font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
                  Mark as Highlight / Featured Photo
                </label>
              </div>
            </div>

            {/* Modal Buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsPhotoModalOpen(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePhotoModal}
                className="px-5 py-2.5 bg-[#1D68BD] hover:bg-[#155299] text-white font-extrabold rounded-xl text-xs shadow-md shadow-blue-600/20 transition-all"
              >
                {editingPhotoIndex !== null ? "Save Changes" : "Add to Gallery"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

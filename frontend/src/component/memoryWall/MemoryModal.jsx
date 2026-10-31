import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Upload,
  Image as ImageIcon,
  Film,
  Calendar,
  MapPin,
  Tag,
  Heart,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import Button from '../ui/Button';

export const CATEGORIES = [
  'Friends',
  'College',
  'Travel',
  'Family',
  'Birthdays',
  'Events',
  'Achievements',
  'Other',
];

export function MemoryModal({ isOpen, onClose, onSave, editingMemory = null }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Friends');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [location, setLocation] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState('image');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (editingMemory) {
      setTitle(editingMemory.title || '');
      setDescription(editingMemory.description || '');
      setCategory(editingMemory.category || 'Friends');
      setDate(
        editingMemory.date
          ? new Date(editingMemory.date).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0]
      );
      setLocation(editingMemory.location || '');
      setTagsInput(editingMemory.tags ? editingMemory.tags.join(', ') : '');
      setIsFavorite(!!editingMemory.isFavorite);
      setMediaUrl(editingMemory.mediaUrl || '');
      setMediaType(editingMemory.mediaType || 'image');
    } else {
      resetForm();
    }
  }, [editingMemory, isOpen]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('Friends');
    setDate(new Date().toISOString().split('T')[0]);
    setLocation('');
    setTagsInput('');
    setIsFavorite(false);
    setMediaUrl('');
    setMediaType('image');
    setIsSaving(false);
  };

  if (!isOpen) return null;

  // File Picker Handling (Images or Videos)
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video');
    const isImage = file.type.startsWith('image');

    if (!isImage && !isVideo) {
      toast.error('Please select an image or video file');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      toast.error('File size must be under 25MB');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();

    reader.onload = () => {
      setMediaUrl(reader.result);
      setMediaType(isVideo ? 'video' : 'image');
      setIsUploading(false);
      if (!title) {
        // Auto-fill title from filename
        const cleanName = file.name
          .replace(/\.[^/.]+$/, '')
          .replace(/[-_]/g, ' ');
        setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
    };

    reader.onerror = () => {
      toast.error('Failed to read file');
      setIsUploading(false);
    };

    reader.readAsDataURL(file);
    e.target.value = null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Please enter a memory title');
      return;
    }

    if (!mediaUrl) {
      toast.error('Please upload a photo or video for this memory');
      return;
    }

    const tagsArray = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = {
      title: title.trim(),
      description: description.trim(),
      category,
      date: new Date(date),
      location: location.trim(),
      tags: tagsArray,
      isFavorite,
      mediaUrl,
      mediaType,
    };

    try {
      setIsSaving(true);
      await onSave(payload, editingMemory?._id);
      onClose();
      resetForm();
    } catch (err) {
      // Error handled by parent
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-card border border-border rounded-3xl p-6 md:p-8 shadow-2xl my-8 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white shadow-md shadow-pink-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                {editingMemory ? 'Edit Memory' : 'Capture a New Memory'}
              </h3>
              <p className="text-xs text-gray-400">
                Save photos, videos, and cherished milestones to your private wall
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {/* Media Upload Area */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Photo or Video <span className="text-pink-400">*</span>
            </label>

            {mediaUrl ? (
              <div className="relative rounded-2xl overflow-hidden bg-black/50 aspect-video max-h-64 flex items-center justify-center border border-border group">
                {mediaType === 'video' ? (
                  <video
                    src={mediaUrl}
                    controls
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <img
                    src={mediaUrl}
                    alt="Memory preview"
                    className="w-full h-full object-contain"
                  />
                )}

                <button
                  type="button"
                  onClick={() => setMediaUrl('')}
                  className="absolute top-3 right-3 p-2 rounded-full bg-black/70 hover:bg-red-600 text-white transition shadow-lg"
                  title="Remove and choose different media"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border hover:border-primary/60 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer bg-input/20 hover:bg-input/40 transition group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*,video/*"
                  className="hidden"
                />

                <div className="w-14 h-14 rounded-2xl bg-purple-500/10 text-primary flex items-center justify-center mb-3 group-hover:scale-110 transition duration-300">
                  {isUploading ? (
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  ) : (
                    <Upload className="w-6 h-6" />
                  )}
                </div>

                <p className="text-sm font-semibold text-white mb-1">
                  Click to upload a photo or video
                </p>
                <p className="text-xs text-gray-400">
                  Supports JPG, PNG, WEBP, GIF, MP4, WEBM (up to 25MB)
                </p>
              </div>
            )}
          </div>

          {/* Title & Category Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                Memory Title <span className="text-pink-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Graduation Day, Goa Road Trip"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-input border border-border text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-input border border-border text-sm text-white focus:outline-none focus:border-primary transition"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-card text-white">
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Location Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary" /> Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-input border border-border text-sm text-white focus:outline-none focus:border-primary transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-pink-400" /> Location (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Kyoto, Japan or College Campus"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-input border border-border text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary transition"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-blue-400" /> Tags (Separated by commas)
            </label>
            <input
              type="text"
              placeholder="e.g. friends, reunion, sunset, celebration"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-input border border-border text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary transition"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Story / Description
            </label>
            <textarea
              rows={3}
              placeholder="Write a few lines about this memorable moment..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-input border border-border text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary transition"
            />
          </div>

          {/* Mark as Favorite Switch */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-input/40 border border-border/80">
            <div className="flex items-center gap-2.5">
              <Heart
                className={`w-5 h-5 ${
                  isFavorite ? 'text-pink-500 fill-pink-500' : 'text-gray-400'
                }`}
              />
              <div>
                <p className="text-sm font-semibold text-white">Favorite Memory</p>
                <p className="text-xs text-gray-400">
                  Highlight this memory in your favourites collection
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsFavorite(!isFavorite)}
              className={`w-12 h-6 rounded-full transition-colors p-0.5 relative ${
                isFavorite ? 'bg-pink-500' : 'bg-gray-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                  isFavorite ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="none"
              onClick={onClose}
              className="px-5 py-2.5 text-sm text-gray-400 hover:text-white rounded-xl transition"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving || isUploading}
              className="px-6 py-2.5 rounded-xl gradient-primary hover:opacity-90 text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-purple-500/30 cursor-pointer"
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingMemory ? 'Update Memory' : 'Save to Memory Wall'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

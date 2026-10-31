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

// Helper to compress image in browser before uploading
const processMediaFile = (file) => {
  return new Promise((resolve, reject) => {
    const isVideo = file.type.startsWith('video');

    if (isVideo || file.type === 'image/gif') {
      const reader = new FileReader();
      reader.onload = () => resolve({ url: reader.result, type: isVideo ? 'video' : 'image' });
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_WIDTH = 1920;
        const MAX_HEIGHT = 1080;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to high-quality compressed JPEG (typically 200-400KB)
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve({ url: compressedDataUrl, type: 'image' });
      };
      img.onerror = () => {
        // Fallback to raw data url if image failed to load in canvas
        resolve({ url: e.target.result, type: 'image' });
      };
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

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

  // File Picker Handling with Auto Compression
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video');
    const isImage = file.type.startsWith('image');

    if (!isImage && !isVideo) {
      toast.error('Please select an image or video file');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error('File size must be under 50MB');
      return;
    }

    try {
      setIsUploading(true);
      const processed = await processMediaFile(file);
      setMediaUrl(processed.url);
      setMediaType(processed.type);

      if (!title) {
        const cleanName = file.name
          .replace(/\.[^/.]+$/, '')
          .replace(/[-_]/g, ' ');
        setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
    } catch (err) {
      console.error('File processing error:', err);
      toast.error('Failed to process media file');
    } finally {
      setIsUploading(false);
      e.target.value = null;
    }
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
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-card border border-border rounded-3xl p-5 sm:p-6 md:p-7 shadow-2xl my-auto max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white shadow-md shadow-pink-500/20 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight truncate">
                {editingMemory ? 'Edit Memory' : 'Capture a New Memory'}
              </h3>
              <p className="text-xs text-gray-400 truncate">
                Save photos, videos, and milestones to your wall
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="mt-4 flex-1 overflow-y-auto pr-1 space-y-4 sm:space-y-4.5">
          {/* Media Upload Area */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Photo or Video <span className="text-pink-400">*</span>
            </label>

            {mediaUrl ? (
              <div className="relative rounded-2xl overflow-hidden bg-black/60 aspect-video max-h-56 flex items-center justify-center border border-border group">
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
                  className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-black/75 hover:bg-red-600 text-white transition shadow-lg"
                  title="Remove media"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border hover:border-primary/60 rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer bg-input/20 hover:bg-input/40 transition group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*,video/*"
                  className="hidden"
                />

                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-primary flex items-center justify-center mb-2.5 group-hover:scale-110 transition duration-300">
                  {isUploading ? (
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  ) : (
                    <Upload className="w-6 h-6" />
                  )}
                </div>

                <p className="text-sm font-semibold text-white mb-0.5">
                  Click to upload a photo or video
                </p>
                <p className="text-xs text-gray-400">
                  Auto-compressed JPG, PNG, WEBP, GIF, MP4, WEBM
                </p>
              </div>
            )}
          </div>

          {/* Title & Category Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Memory Title <span className="text-pink-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Graduation Day, Road Trip"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-input border border-border text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-input border border-border text-sm text-white focus:outline-none focus:border-primary transition cursor-pointer"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary" /> Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-input border border-border text-sm text-white focus:outline-none focus:border-primary transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-pink-400" /> Location (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Paris, France or College"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-input border border-border text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary transition"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-blue-400" /> Tags (Separated by commas)
            </label>
            <input
              type="text"
              placeholder="e.g. friends, reunion, sunset, celebration"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-input border border-border text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary transition"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Story / Description
            </label>
            <textarea
              rows={2}
              placeholder="Write a few lines about this memorable moment..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-input border border-border text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary transition"
            />
          </div>

          {/* Mark as Favorite Switch */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-input/40 border border-border/80">
            <div className="flex items-center gap-2.5">
              <Heart
                className={`w-5 h-5 ${
                  isFavorite ? 'text-pink-500 fill-pink-500' : 'text-gray-400'
                }`}
              />
              <div>
                <p className="text-sm font-semibold text-white">Favorite Memory</p>
                <p className="text-xs text-gray-400">
                  Highlight this in your favourites collection
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsFavorite(!isFavorite)}
              className={`w-12 h-6 rounded-full transition-colors p-0.5 relative cursor-pointer ${
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

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border shrink-0">
            <Button
              type="button"
              variant="none"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white rounded-xl transition"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving || isUploading}
              className="px-5 py-2.5 rounded-xl gradient-primary hover:opacity-90 text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-purple-500/30 cursor-pointer"
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

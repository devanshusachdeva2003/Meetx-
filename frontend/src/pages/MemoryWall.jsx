import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Plus,
  Search,
  LayoutGrid,
  Clock,
  Calendar as CalendarIcon,
  Heart,
  Filter,
  ArrowUpDown,
  Download,
  Share2,
  Loader2,
  Film,
  Image as ImageIcon,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../utils/api';
import Button from '../component/ui/Button';
import { MemoryCard } from '../component/memoryWall/MemoryCard';
import { MemoryTimeline } from '../component/memoryWall/MemoryTimeline';
import { MemoryCalendar } from '../component/memoryWall/MemoryCalendar';
import { MemoryModal, CATEGORIES } from '../component/memoryWall/MemoryModal';
import { MemoryLightbox } from '../component/memoryWall/MemoryLightbox';
import { OnThisDayBanner } from '../component/memoryWall/OnThisDayBanner';

export default function MemoryWall() {
  const [memories, setMemories] = useState([]);
  const [onThisDayMemories, setOnThisDayMemories] = useState([]);
  const [stats, setStats] = useState({ total: 0, favorites: 0, photos: 0, videos: 0 });
  const [loading, setLoading] = useState(true);

  // Views & Filters
  const [viewMode, setViewMode] = useState('gallery'); // 'gallery' | 'timeline' | 'calendar'
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest' | 'recently_added'

  // Modals & States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMemory, setEditingMemory] = useState(null);
  const [selectedMemory, setSelectedMemory] = useState(null);
  const [memoryToDeleteId, setMemoryToDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch Memories & Stats
  const fetchMemories = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== 'All') params.append('category', selectedCategory);
      if (favoritesOnly) params.append('favorite', 'true');
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (sortBy) params.append('sort', sortBy);

      const [memRes, onDayRes, statsRes] = await Promise.all([
        api.get(`/memories?${params.toString()}`),
        api.get('/memories/on-this-day'),
        api.get('/memories/stats'),
      ]);

      setMemories(memRes.data.memories || []);
      setOnThisDayMemories(onDayRes.data.memories || []);
      setStats(statsRes.data || { total: 0, favorites: 0, photos: 0, videos: 0 });
    } catch (err) {
      console.error('Error fetching memories:', err);
      toast.error('Failed to load memories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMemories();
    }, 250);

    return () => clearTimeout(timer);
  }, [selectedCategory, favoritesOnly, searchQuery, sortBy]);

  // Save or Update Memory
  const handleSaveMemory = async (payload, id) => {
    try {
      if (id) {
        const res = await api.put(`/memories/${id}`, payload);
        toast.success('Memory updated successfully');
        setMemories((prev) =>
          prev.map((m) => (m._id === id ? res.data.memory : m))
        );
        if (selectedMemory?._id === id) setSelectedMemory(res.data.memory);
      } else {
        const res = await api.post('/memories', payload);
        toast.success('Memory saved to your wall ✨');
        setMemories((prev) => [res.data.memory, ...prev]);
        setStats((prev) => ({
          ...prev,
          total: prev.total + 1,
          photos: prev.photos + (payload.mediaType === 'image' ? 1 : 0),
          videos: prev.videos + (payload.mediaType === 'video' ? 1 : 0),
        }));
      }
      setIsModalOpen(false);
      setEditingMemory(null);
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Failed to save memory');
      throw err;
    }
  };

  // Toggle Favorite
  const handleToggleFavorite = async (id) => {
    try {
      const res = await api.post(`/memories/${id}/favorite`);
      const isFav = res.data.isFavorite;

      setMemories((prev) =>
        prev.map((m) => (m._id === id ? { ...m, isFavorite: isFav } : m))
      );

      if (selectedMemory?._id === id) {
        setSelectedMemory((prev) => ({ ...prev, isFavorite: isFav }));
      }

      setStats((prev) => ({
        ...prev,
        favorites: prev.favorites + (isFav ? 1 : -1),
      }));

      toast.success(res.data.message);
    } catch (err) {
      toast.error('Failed to toggle favorite');
    }
  };

  // Delete Memory
  const handleDeleteConfirm = async () => {
    if (!memoryToDeleteId) return;

    try {
      setIsDeleting(true);
      await api.delete(`/memories/${memoryToDeleteId}`);
      toast.success('Memory deleted from your wall');

      setMemories((prev) => prev.filter((m) => m._id !== memoryToDeleteId));
      if (selectedMemory?._id === memoryToDeleteId) setSelectedMemory(null);
      setMemoryToDeleteId(null);

      // Refresh stats
      const statsRes = await api.get('/memories/stats');
      setStats(statsRes.data);
    } catch (err) {
      toast.error('Failed to delete memory');
    } finally {
      setIsDeleting(false);
    }
  };

  // Download Memory File
  const handleDownloadMemory = (memory) => {
    if (!memory?.mediaUrl) return;
    const a = document.createElement('a');
    a.href = memory.mediaUrl;
    a.download = `${memory.title.replace(/\s+/g, '_')}.${
      memory.mediaType === 'video' ? 'mp4' : 'jpg'
    }`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Download started');
  };

  // Secure Sharing Link
  const handleShareMemory = async (memory) => {
    try {
      let token = memory.shareToken;

      if (!memory.isShared || !token) {
        const res = await api.post(`/memories/${memory._id}/share`);
        token = res.data.shareToken;
        setMemories((prev) =>
          prev.map((m) =>
            m._id === memory._id ? { ...m, isShared: true, shareToken: token } : m
          )
        );
      }

      const shareUrl = `${window.location.origin}/shared-memory/${token}`;
      navigator.clipboard.writeText(shareUrl);
      toast.success('Secure share link copied to clipboard!');
    } catch (err) {
      toast.error('Failed to generate share link');
    }
  };

  return (
    <main className="flex-1 min-w-0 px-4 py-6 md:px-8 md:py-8 flex flex-col gap-6 min-h-full max-w-7xl mx-auto w-full">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              Memory Wall <span className="text-pink-400">✨</span>
            </h1>
          </div>
          <p className="text-xs md:text-sm text-gray-400">
            Your personal digital sanctuary to store, cherish, and relive life's greatest milestones.
          </p>
        </div>

        <Button
          onClick={() => {
            setEditingMemory(null);
            setIsModalOpen(true);
          }}
          className="gradient-primary hover:opacity-95 text-white font-semibold px-5 py-3 rounded-2xl flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(168,85,247,0.35)] hover:shadow-[0_6px_25px_rgba(168,85,247,0.5)] transition-all cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Capture Memory</span>
        </Button>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-3xl bg-card border border-border shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-purple-500/10 text-primary flex items-center justify-center shrink-0">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-white">{stats.total}</p>
            <p className="text-[11px] text-gray-400 font-medium">Total Memories</p>
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-card border border-border shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-pink-500/10 text-pink-400 flex items-center justify-center shrink-0">
            <Heart className="w-5 h-5 fill-pink-500/20" />
          </div>
          <div>
            <p className="text-xl font-bold text-white">{stats.favorites}</p>
            <p className="text-[11px] text-gray-400 font-medium">Favorites</p>
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-card border border-border shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-white">
              {stats.photos} <span className="text-xs text-gray-500">/ {stats.videos} vids</span>
            </p>
            <p className="text-[11px] text-gray-400 font-medium">Photos & Videos</p>
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-card border border-border shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-white">
              {onThisDayMemories.length}
            </p>
            <p className="text-[11px] text-gray-400 font-medium">On This Day</p>
          </div>
        </div>
      </div>

      {/* On This Day Nostalgic Banner (if any) */}
      <OnThisDayBanner
        onThisDayMemories={onThisDayMemories}
        onSelectMemory={setSelectedMemory}
      />

      {/* Search & View Switcher Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-card p-3 rounded-3xl border border-border">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by title, location, tag or story..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-2xl bg-input border border-border text-xs text-white placeholder-gray-500 focus:outline-none focus:border-primary transition"
          />
        </div>

        {/* View Mode & Filter Controls */}
        <div className="flex items-center gap-2 flex-wrap justify-between lg:justify-end">
          {/* Favorites toggle */}
          <button
            type="button"
            onClick={() => setFavoritesOnly(!favoritesOnly)}
            className={`px-3 py-2 rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition ${
              favoritesOnly
                ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40 shadow-sm'
                : 'bg-input/60 hover:bg-input text-gray-400 hover:text-white'
            }`}
          >
            <Heart
              className={`w-3.5 h-3.5 ${
                favoritesOnly ? 'fill-pink-500 text-pink-500' : ''
              }`}
            />
            <span>Favorites</span>
          </button>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 bg-input/60 px-3 py-2 rounded-2xl border border-border/50 text-xs text-gray-300">
            <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-white focus:outline-none cursor-pointer"
            >
              <option value="newest" className="bg-card text-white">
                Newest Date
              </option>
              <option value="oldest" className="bg-card text-white">
                Oldest Date
              </option>
              <option value="recently_added" className="bg-card text-white">
                Recently Added
              </option>
            </select>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-input/60 p-1 rounded-2xl border border-border/50">
            <button
              type="button"
              onClick={() => setViewMode('gallery')}
              className={`p-1.5 md:px-3 md:py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                viewMode === 'gallery'
                  ? 'bg-card text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Gallery Grid"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Gallery</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              className={`p-1.5 md:px-3 md:py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                viewMode === 'timeline'
                  ? 'bg-card text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Timeline Journey"
            >
              <Clock className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Timeline</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`p-1.5 md:px-3 md:py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                viewMode === 'calendar'
                  ? 'bg-card text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Monthly Calendar"
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Calendar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {['All', ...CATEGORIES].map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-2xl text-xs font-medium whitespace-nowrap transition-all duration-200 border ${
              selectedCategory === cat
                ? 'gradient-primary text-white border-transparent shadow-[0_0_15px_rgba(168,85,247,0.35)]'
                : 'bg-card hover:bg-input border-border/80 text-gray-400 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-gray-400">
          <Loader2 className="w-10 h-10 animate-spin text-primary mb-3" />
          <p className="text-sm">Retrieving your memories...</p>
        </div>
      ) : memories.length === 0 ? (
        <div className="py-20 rounded-3xl bg-card border border-border text-center flex flex-col items-center justify-center p-8">
          <div className="w-16 h-16 rounded-3xl bg-purple-500/10 flex items-center justify-center text-primary mb-4 shadow-lg shadow-purple-500/10">
            <Sparkles className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1.5">No Memories Found</h3>
          <p className="text-xs text-gray-400 max-w-sm leading-relaxed mb-6">
            {searchQuery || selectedCategory !== 'All' || favoritesOnly
              ? 'No memories match your current filters. Try resetting your search or category.'
              : 'Your memory wall is waiting for its first moment! Save photos, videos, trips, college events, and achievements.'}
          </p>

          <Button
            onClick={() => {
              if (searchQuery || selectedCategory !== 'All' || favoritesOnly) {
                setSearchQuery('');
                setSelectedCategory('All');
                setFavoritesOnly(false);
              } else {
                setEditingMemory(null);
                setIsModalOpen(true);
              }
            }}
            className="gradient-primary text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-md"
          >
            {searchQuery || selectedCategory !== 'All' || favoritesOnly
              ? 'Clear All Filters'
              : 'Add Your First Memory'}
          </Button>
        </div>
      ) : viewMode === 'gallery' ? (
        /* Gallery Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {memories.map((memory) => (
            <MemoryCard
              key={memory._id}
              memory={memory}
              onSelect={setSelectedMemory}
              onToggleFavorite={handleToggleFavorite}
              onEdit={(mem) => {
                setEditingMemory(mem);
                setIsModalOpen(true);
              }}
              onDelete={setMemoryToDeleteId}
              onShare={handleShareMemory}
              onDownload={handleDownloadMemory}
            />
          ))}
        </div>
      ) : viewMode === 'timeline' ? (
        /* Timeline View */
        <MemoryTimeline
          memories={memories}
          onSelectMemory={setSelectedMemory}
        />
      ) : (
        /* Calendar View */
        <MemoryCalendar
          memories={memories}
          onSelectMemory={setSelectedMemory}
        />
      )}

      {/* Add / Edit Memory Modal */}
      <MemoryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingMemory(null);
        }}
        onSave={handleSaveMemory}
        editingMemory={editingMemory}
      />

      {/* Detail Lightbox Modal */}
      <MemoryLightbox
        memory={selectedMemory}
        onClose={() => setSelectedMemory(null)}
        onToggleFavorite={handleToggleFavorite}
        onEdit={(mem) => {
          setSelectedMemory(null);
          setEditingMemory(mem);
          setIsModalOpen(true);
        }}
        onDelete={(id) => {
          setSelectedMemory(null);
          setMemoryToDeleteId(id);
        }}
        onShare={handleShareMemory}
        onDownload={handleDownloadMemory}
      />

      {/* Delete Confirmation Modal */}
      {memoryToDeleteId && (
        <div className="fixed inset-0 z-[350] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <div className="w-10 h-10 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mb-3">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white mb-1.5">
              Delete this memory?
            </h4>
            <p className="text-xs text-gray-400 leading-relaxed mb-5">
              This action cannot be undone. The photo or video and its milestone details will be removed from your wall.
            </p>
            <div className="flex gap-2.5 justify-end">
              <Button
                variant="none"
                onClick={() => setMemoryToDeleteId(null)}
                className="px-3.5 py-2 text-xs text-gray-400 hover:text-white rounded-xl"
              >
                Cancel
              </Button>
              <Button
                variant="none"
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-red-600/30"
              >
                {isDeleting && <Loader2 className="w-3 h-3 animate-spin" />}
                Delete Memory
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

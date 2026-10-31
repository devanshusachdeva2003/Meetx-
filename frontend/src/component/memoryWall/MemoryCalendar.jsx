import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  MapPin,
  Heart,
  Film,
  Sparkles,
} from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '../ui/Button';

export function MemoryCalendar({ memories = [], onSelectMemory }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDay(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDay(null);
  };

  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  // Map memories by day of current month
  const memoriesByDay = {};
  memories.forEach((mem) => {
    const d = new Date(mem.date);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      if (!memoriesByDay[day]) memoriesByDay[day] = [];
      memoriesByDay[day].push(mem);
    }
  });

  const selectedDateMemories = selectedDay ? memoriesByDay[selectedDay] || [] : [];

  return (
    <div className="space-y-6">
      {/* Calendar Header Card */}
      <div className="p-6 rounded-3xl bg-card border border-border shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white shadow-md shadow-pink-500/20">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                {monthName} {year}
              </h3>
              <p className="text-xs text-gray-400">
                Click a date to explore memories captured on that day
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedDay && (
              <Button
                variant="none"
                onClick={() => setSelectedDay(null)}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-gray-300 transition mr-2"
              >
                Clear Filter
              </Button>
            )}
            <Button
              variant="none"
              onClick={prevMonth}
              className="p-2 rounded-xl bg-input hover:bg-white/10 text-gray-300 hover:text-white transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="none"
              onClick={nextMonth}
              className="p-2 rounded-xl bg-input hover:bg-white/10 text-gray-300 hover:text-white transition"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Day labels */}
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Leading empty days */}
          {Array.from({ length: firstDayIndex }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square rounded-2xl" />
          ))}

          {/* Month days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dayMemories = memoriesByDay[dayNum] || [];
            const hasMemories = dayMemories.length > 0;
            const isSelected = selectedDay === dayNum;

            return (
              <button
                key={dayNum}
                type="button"
                onClick={() => setSelectedDay(hasMemories ? dayNum : null)}
                className={`relative aspect-square rounded-2xl p-2 flex flex-col justify-between transition-all duration-200 border ${
                  isSelected
                    ? 'gradient-primary text-white border-transparent shadow-[0_0_20px_rgba(168,85,247,0.4)] scale-105 z-10'
                    : hasMemories
                    ? 'bg-purple-950/30 hover:bg-purple-900/40 border-pink-500/40 text-white cursor-pointer shadow-sm hover:scale-102'
                    : 'bg-input/40 border-transparent text-gray-400 cursor-default'
                }`}
              >
                <span className="text-xs font-semibold">{dayNum}</span>

                {hasMemories && (
                  <div className="flex items-center gap-1 self-center">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isSelected
                          ? 'bg-white'
                          : 'bg-gradient-to-r from-pink-500 to-purple-500 shadow-[0_0_8px_#ec4899] animate-pulse'
                      }`}
                    />
                    <span className="text-[10px] font-bold opacity-80">
                      {dayMemories.length}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Memories Preview */}
      {selectedDay && (
        <div className="p-6 rounded-3xl bg-card border border-border shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-white text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-pink-400" />
              Memories on {monthName} {selectedDay}, {year}
            </h4>
            <span className="text-xs text-gray-400">
              {selectedDateMemories.length} {selectedDateMemories.length === 1 ? 'memory' : 'memories'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedDateMemories.map((mem) => (
              <motion.div
                key={mem._id}
                whileHover={{ y: -3 }}
                onClick={() => onSelectMemory(mem)}
                className="cursor-pointer group flex items-center gap-3 p-3 rounded-2xl bg-input/50 hover:bg-input border border-border transition"
              >
                <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-black/40">
                  {mem.mediaType === 'video' ? (
                    <video
                      src={mem.mediaUrl}
                      className="w-full h-full object-cover"
                      muted
                    />
                  ) : (
                    <img
                      src={mem.mediaUrl}
                      alt={mem.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                  {mem.isFavorite && (
                    <div className="absolute top-1 right-1 p-0.5 rounded-full bg-black/50 text-pink-400">
                      <Heart className="w-2.5 h-2.5 fill-pink-500" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <span className="px-2 py-0.5 rounded-md bg-primary/20 text-primary text-[10px] font-bold">
                    {mem.category}
                  </span>
                  <h5 className="font-semibold text-white text-sm truncate mt-1 group-hover:text-pink-300 transition">
                    {mem.title}
                  </h5>
                  {mem.location && (
                    <p className="text-[11px] text-gray-400 flex items-center gap-1 truncate mt-0.5">
                      <MapPin className="w-3 h-3 text-pink-400 shrink-0" />
                      <span className="truncate">{mem.location}</span>
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

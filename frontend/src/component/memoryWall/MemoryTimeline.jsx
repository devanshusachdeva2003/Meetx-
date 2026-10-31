import React from 'react';
import { Calendar, MapPin, Heart, Film, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { CATEGORY_COLORS } from './MemoryCard';

export function MemoryTimeline({ memories = [], onSelectMemory }) {
  if (memories.length === 0) {
    return (
      <div className="py-20 text-center text-gray-400">
        <Calendar className="w-12 h-12 text-primary/40 mx-auto mb-3" />
        <h4 className="text-base font-bold text-white mb-1">Timeline is empty</h4>
        <p className="text-xs text-gray-500">
          Add memories to see your chronological journey over the years.
        </p>
      </div>
    );
  }

  // Group memories by Year -> Month
  const grouped = memories.reduce((acc, memory) => {
    const d = new Date(memory.date);
    const year = d.getFullYear();
    const month = d.toLocaleString('default', { month: 'long' });

    if (!acc[year]) acc[year] = {};
    if (!acc[year][month]) acc[year][month] = [];
    acc[year][month].push(memory);
    return acc;
  }, {});

  const years = Object.keys(grouped).sort((a, b) => b - a);

  return (
    <div className="relative pl-6 md:pl-8 space-y-12 before:absolute before:left-2 md:before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-primary before:via-pink-500 before:to-purple-900/30">
      {years.map((year) => (
        <div key={year} className="relative space-y-6">
          {/* Year Marker */}
          <div className="flex items-center gap-3 -ml-6 md:-ml-8">
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 text-white font-bold text-xs flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.5)] ring-4 ring-background">
              ✨
            </div>
            <h3 className="text-xl md:text-2xl font-black text-white tracking-tight">
              {year}
            </h3>
          </div>

          {/* Months in this year */}
          {Object.keys(grouped[year]).map((month) => (
            <div key={month} className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-pink-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-pink-500" />
                {month}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {grouped[year][month].map((mem) => {
                  const categoryStyle =
                    CATEGORY_COLORS[mem.category] || CATEGORY_COLORS.Other;

                  return (
                    <motion.div
                      key={mem._id}
                      whileHover={{ y: -4, scale: 1.01 }}
                      onClick={() => onSelectMemory(mem)}
                      className="cursor-pointer group rounded-2xl bg-card border border-border hover:border-primary/50 overflow-hidden shadow-md hover:shadow-xl transition flex flex-col"
                    >
                      <div className="relative aspect-video w-full bg-black/40 overflow-hidden">
                        {mem.mediaType === 'video' ? (
                          <div className="relative w-full h-full">
                            <video
                              src={mem.mediaUrl}
                              className="w-full h-full object-cover"
                              muted
                            />
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                              <Film className="w-6 h-6 text-white" />
                            </div>
                          </div>
                        ) : (
                          <img
                            src={mem.mediaUrl}
                            alt={mem.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                          />
                        )}

                        <span
                          className={`absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border backdrop-blur-md ${categoryStyle}`}
                        >
                          {mem.category}
                        </span>

                        {mem.isFavorite && (
                          <div className="absolute top-2.5 right-2.5 p-1 rounded-full bg-pink-500 text-white shadow-md">
                            <Heart className="w-3 h-3 fill-white" />
                          </div>
                        )}
                      </div>

                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <h5 className="font-bold text-white text-sm mb-1 group-hover:text-primary transition line-clamp-1">
                            {mem.title}
                          </h5>
                          {mem.description && (
                            <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed mb-2">
                              {mem.description}
                            </p>
                          )}
                        </div>

                        <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px] text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-primary" />
                            {new Date(mem.date).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                          {mem.location && (
                            <span className="flex items-center gap-1 max-w-[110px] truncate">
                              <MapPin className="w-3 h-3 text-pink-400 shrink-0" />
                              <span className="truncate">{mem.location}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

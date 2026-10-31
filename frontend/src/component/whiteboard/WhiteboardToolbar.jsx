import React, { useState } from 'react';
import {
  Pen,
  Pencil,
  Highlighter,
  Eraser,
  Square,
  Circle,
  Triangle,
  Star,
  Diamond,
  Minus,
  MoveRight,
  Type,
  StickyNote as StickyIcon,
  Image as ImageIcon,
  Hand,
  Undo2,
  Redo2,
  Trash2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Save,
  Share2,
  FolderOpen,
  Users,
  ChevronDown,
  Check,
} from 'lucide-react';
import Button from '../ui/Button';

export const COLORS = [
  '#FFFFFF', // White
  '#A855F7', // Purple
  '#EC4899', // Pink
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#1E293B', // Dark Slate
];

export const STROKE_WIDTHS = [
  { label: 'Fine', value: 2 },
  { label: 'Medium', value: 5 },
  { label: 'Bold', value: 10 },
  { label: 'Heavy', value: 20 },
];

export function WhiteboardToolbar({
  activeTool,
  setActiveTool,
  activeShape,
  setActiveShape,
  color,
  setColor,
  strokeWidth,
  setStrokeWidth,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClear,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  zoom,
  onSave,
  onExport,
  onShare,
  onOpenSavedBoards,
  onAddStickyNote,
  onImageUpload,
  activeCollaborators = [],
  isSaving = false,
  boardTitle,
  onTitleChange,
}) {
  const [showShapesMenu, setShowShapesMenu] = useState(false);
  const [showStickyColorMenu, setShowStickyColorMenu] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  return (
    <>
      {/* Top Bar: Title, Collaborators, Save, Share, Export */}
      <div className="absolute top-4 left-4 right-4 z-40 flex items-center justify-between gap-3 pointer-events-none">
        {/* Left: Title & Saved Boards Drawer Button */}
        <div className="flex items-center gap-2 pointer-events-auto bg-card/90 backdrop-blur-md p-1.5 px-3 rounded-2xl border border-border shadow-xl">
          <button
            type="button"
            onClick={onOpenSavedBoards}
            className="p-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition flex items-center gap-1.5 text-xs font-semibold"
            title="My Saved Boards"
          >
            <FolderOpen className="w-4 h-4 text-primary" />
            <span className="hidden sm:inline">Boards</span>
          </button>

          <div className="h-4 w-px bg-border mx-1" />

          <input
            type="text"
            value={boardTitle}
            onChange={(e) => onTitleChange(e.target.value)}
            className="bg-transparent text-sm font-bold text-white px-2 py-1 rounded-lg focus:outline-none focus:bg-input border border-transparent focus:border-border transition max-w-[160px] sm:max-w-xs truncate"
            placeholder="Board Name..."
          />
        </div>

        {/* Right: Active Collaborators, Save, Share, Export */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Active Collaborators count */}
          <div className="hidden sm:flex items-center gap-1.5 bg-card/90 backdrop-blur-md px-3 py-2 rounded-2xl border border-border shadow-xl text-xs font-semibold text-white">
            <Users className="w-4 h-4 text-pink-400" />
            <span>
              {activeCollaborators.length > 0 ? activeCollaborators.length : 1}{' '}
              {activeCollaborators.length === 1 ? 'Online' : 'Collaborating'}
            </span>
          </div>

          {/* Share Button */}
          <Button
            variant="none"
            onClick={onShare}
            className="p-2.5 sm:px-3.5 sm:py-2 rounded-2xl bg-card/90 backdrop-blur-md border border-border hover:border-pink-500/50 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xl transition cursor-pointer"
            title="Invite collaborators"
          >
            <Share2 className="w-4 h-4 text-pink-400" />
            <span className="hidden sm:inline">Share</span>
          </Button>

          {/* Export / Download */}
          <Button
            variant="none"
            onClick={onExport}
            className="p-2.5 sm:px-3.5 sm:py-2 rounded-2xl bg-card/90 backdrop-blur-md border border-border hover:bg-white/10 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xl transition cursor-pointer"
            title="Download Canvas PNG"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>

          {/* Save Button */}
          <Button
            onClick={onSave}
            disabled={isSaving}
            className="p-2.5 sm:px-4 sm:py-2 rounded-2xl gradient-primary hover:opacity-95 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xl shadow-purple-500/20 transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">{isSaving ? 'Saving...' : 'Save'}</span>
          </Button>
        </div>
      </div>

      {/* Main Bottom Floating Toolbar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 p-2 rounded-3xl bg-card/95 backdrop-blur-xl border border-border shadow-[0_10px_40px_rgba(0,0,0,0.6)] max-w-[95vw] overflow-x-auto scrollbar-none">
        {/* Hand Pan Tool */}
        <button
          type="button"
          onClick={() => setActiveTool('hand')}
          className={`p-2.5 rounded-2xl transition ${
            activeTool === 'hand'
              ? 'gradient-primary text-white shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-white/10'
          }`}
          title="Pan / Hand Tool"
        >
          <Hand className="w-4 h-4" />
        </button>

        <div className="h-5 w-px bg-border mx-0.5" />

        {/* Pen */}
        <button
          type="button"
          onClick={() => setActiveTool('pen')}
          className={`p-2.5 rounded-2xl transition ${
            activeTool === 'pen'
              ? 'gradient-primary text-white shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-white/10'
          }`}
          title="Smooth Pen"
        >
          <Pen className="w-4 h-4" />
        </button>

        {/* Pencil */}
        <button
          type="button"
          onClick={() => setActiveTool('pencil')}
          className={`p-2.5 rounded-2xl transition ${
            activeTool === 'pencil'
              ? 'gradient-primary text-white shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-white/10'
          }`}
          title="Fine Pencil"
        >
          <Pencil className="w-4 h-4" />
        </button>

        {/* Highlighter */}
        <button
          type="button"
          onClick={() => setActiveTool('highlighter')}
          className={`p-2.5 rounded-2xl transition ${
            activeTool === 'highlighter'
              ? 'gradient-primary text-white shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-white/10'
          }`}
          title="Highlighter"
        >
          <Highlighter className="w-4 h-4" />
        </button>

        {/* Eraser */}
        <button
          type="button"
          onClick={() => setActiveTool('eraser')}
          className={`p-2.5 rounded-2xl transition ${
            activeTool === 'eraser'
              ? 'gradient-primary text-white shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-white/10'
          }`}
          title="Eraser"
        >
          <Eraser className="w-4 h-4" />
        </button>

        <div className="h-5 w-px bg-border mx-0.5" />

        {/* Shapes Menu Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowShapesMenu(!showShapesMenu)}
            className={`p-2.5 rounded-2xl transition flex items-center gap-1 ${
              activeTool === 'shape'
                ? 'gradient-primary text-white shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
            title="Shapes & Lines"
          >
            {activeShape === 'circle' ? (
              <Circle className="w-4 h-4" />
            ) : activeShape === 'triangle' ? (
              <Triangle className="w-4 h-4" />
            ) : activeShape === 'star' ? (
              <Star className="w-4 h-4" />
            ) : activeShape === 'diamond' ? (
              <Diamond className="w-4 h-4" />
            ) : activeShape === 'line' ? (
              <Minus className="w-4 h-4" />
            ) : activeShape === 'arrow' ? (
              <MoveRight className="w-4 h-4" />
            ) : (
              <Square className="w-4 h-4" />
            )}
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {showShapesMenu && (
            <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 p-2 rounded-2xl bg-card border border-border shadow-2xl flex items-center gap-1.5 z-50">
              <button
                type="button"
                onClick={() => {
                  setActiveTool('shape');
                  setActiveShape('rectangle');
                  setShowShapesMenu(false);
                }}
                className={`p-2 rounded-xl hover:bg-white/10 ${
                  activeShape === 'rectangle' ? 'text-primary' : 'text-gray-300'
                }`}
                title="Rectangle"
              >
                <Square className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTool('shape');
                  setActiveShape('circle');
                  setShowShapesMenu(false);
                }}
                className={`p-2 rounded-xl hover:bg-white/10 ${
                  activeShape === 'circle' ? 'text-primary' : 'text-gray-300'
                }`}
                title="Circle"
              >
                <Circle className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTool('shape');
                  setActiveShape('triangle');
                  setShowShapesMenu(false);
                }}
                className={`p-2 rounded-xl hover:bg-white/10 ${
                  activeShape === 'triangle' ? 'text-primary' : 'text-gray-300'
                }`}
                title="Triangle"
              >
                <Triangle className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTool('shape');
                  setActiveShape('star');
                  setShowShapesMenu(false);
                }}
                className={`p-2 rounded-xl hover:bg-white/10 ${
                  activeShape === 'star' ? 'text-primary' : 'text-gray-300'
                }`}
                title="Star"
              >
                <Star className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTool('shape');
                  setActiveShape('line');
                  setShowShapesMenu(false);
                }}
                className={`p-2 rounded-xl hover:bg-white/10 ${
                  activeShape === 'line' ? 'text-primary' : 'text-gray-300'
                }`}
                title="Straight Line"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTool('shape');
                  setActiveShape('arrow');
                  setShowShapesMenu(false);
                }}
                className={`p-2 rounded-xl hover:bg-white/10 ${
                  activeShape === 'arrow' ? 'text-primary' : 'text-gray-300'
                }`}
                title="Arrow"
              >
                <MoveRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Text tool */}
        <button
          type="button"
          onClick={() => setActiveTool('text')}
          className={`p-2.5 rounded-2xl transition ${
            activeTool === 'text'
              ? 'gradient-primary text-white shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-white/10'
          }`}
          title="Add Text"
        >
          <Type className="w-4 h-4" />
        </button>

        {/* Sticky Note */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowStickyColorMenu(!showStickyColorMenu)}
            className="p-2.5 rounded-2xl text-gray-400 hover:text-white hover:bg-white/10 transition"
            title="Add Sticky Note"
          >
            <StickyIcon className="w-4 h-4 text-amber-400" />
          </button>

          {showStickyColorMenu && (
            <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 p-2 rounded-2xl bg-card border border-border shadow-2xl flex items-center gap-2 z-50">
              {['yellow', 'pink', 'purple', 'cyan', 'green'].map((clr) => (
                <button
                  key={clr}
                  type="button"
                  onClick={() => {
                    onAddStickyNote(clr);
                    setShowStickyColorMenu(false);
                  }}
                  className={`w-6 h-6 rounded-lg transition-transform hover:scale-110 shadow-sm ${
                    clr === 'yellow'
                      ? 'bg-amber-400'
                      : clr === 'pink'
                      ? 'bg-pink-400'
                      : clr === 'purple'
                      ? 'bg-purple-400'
                      : clr === 'cyan'
                      ? 'bg-cyan-400'
                      : 'bg-emerald-400'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Upload Image on Canvas */}
        <button
          type="button"
          onClick={onImageUpload}
          className="p-2.5 rounded-2xl text-gray-400 hover:text-white hover:bg-white/10 transition"
          title="Place Image on Board"
        >
          <ImageIcon className="w-4 h-4" />
        </button>

        <div className="h-5 w-px bg-border mx-0.5" />

        {/* Colors Swatch */}
        <div className="relative flex items-center gap-1 px-1">
          {COLORS.slice(0, 5).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              style={{ backgroundColor: c }}
              className={`w-5 h-5 rounded-full transition-transform ${
                color === c
                  ? 'ring-2 ring-white scale-125 z-10'
                  : 'hover:scale-110 opacity-80'
              }`}
            />
          ))}

          {/* Custom color input */}
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-5 h-5 rounded-full overflow-hidden cursor-pointer bg-transparent border-0 p-0 ml-1"
            title="Custom Color"
          />
        </div>

        {/* Stroke Size Dropdown */}
        <select
          value={strokeWidth}
          onChange={(e) => setStrokeWidth(Number(e.target.value))}
          className="bg-input text-white text-xs px-2 py-1.5 rounded-xl border border-border/80 focus:outline-none cursor-pointer"
        >
          {STROKE_WIDTHS.map((sw) => (
            <option key={sw.value} value={sw.value} className="bg-card text-white">
              {sw.label} ({sw.value}px)
            </option>
          ))}
        </select>

        <div className="h-5 w-px bg-border mx-0.5" />

        {/* Undo & Redo */}
        <button
          type="button"
          disabled={!canUndo}
          onClick={onUndo}
          className={`p-2 rounded-xl transition ${
            canUndo ? 'text-gray-300 hover:text-white hover:bg-white/10' : 'text-gray-600'
          }`}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>

        <button
          type="button"
          disabled={!canRedo}
          onClick={onRedo}
          className={`p-2 rounded-xl transition ${
            canRedo ? 'text-gray-300 hover:text-white hover:bg-white/10' : 'text-gray-600'
          }`}
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        {/* Clear */}
        <button
          type="button"
          onClick={onClear}
          className="p-2 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition"
          title="Clear Board"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        <div className="h-5 w-px bg-border mx-0.5" />

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 text-xs text-gray-400 px-1">
          <button
            type="button"
            onClick={onZoomOut}
            className="p-1 rounded-lg hover:bg-white/10 text-gray-300"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onResetZoom}
            className="px-1.5 py-0.5 rounded-md hover:bg-white/10 font-mono text-[11px]"
            title="Reset Zoom"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            type="button"
            onClick={onZoomIn}
            className="p-1 rounded-lg hover:bg-white/10 text-gray-300"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </>
  );
}

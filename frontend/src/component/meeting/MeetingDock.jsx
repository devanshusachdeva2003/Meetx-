import React from 'react';
import { Mic, MicOff, Camera, CameraOff, Users, MessageSquare, MoreVertical, MonitorUp, MonitorOff, Loader2, Hand, Smile, Subtitles, Type, Palette, Layout, Settings, Image as ImageIcon, PenTool, FileText } from 'lucide-react';
import Button from '../ui/Button';
import { VirtualBackgroundMenu } from './VirtualBackgroundMenu';

export function MeetingDock({
  isMuted,
  isVideoOff,
  isScreenSharing,
  showParticipants,
  showChat,
  onToggleMute,
  onToggleVideo,
  onToggleScreenShare,
  onToggleParticipants,
  onToggleChat,
  isAudioLoading,
  isVideoLoading,
  isHandRaised,
  onToggleHand,
  onReaction,
  captionSettings,
  setCaptionSettings,
  currentBg,
  onSelectBg,
  onUploadCustomBg,
  showNotes,
  showWhiteboard,
  onToggleNotes,
  onToggleWhiteboard
}) {
  const [time, setTime] = React.useState(new Date());
  const [showReactions, setShowReactions] = React.useState(false);
  const [showCaptionsMenu, setShowCaptionsMenu] = React.useState(false);
  const [showBgMenu, setShowBgMenu] = React.useState(false);
  const [showMoreMenu, setShowMoreMenu] = React.useState(false);

  // Close popovers on outside click could be added, but simple toggle for now is okay

  React.useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <nav className="absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 z-40 bg-card/70 backdrop-blur-2xl border border-white/10 p-1.5 md:p-2 rounded-full md:rounded-[2rem] flex flex-nowrap justify-center items-center gap-1 md:gap-2 shadow-[0_20px_40px_rgba(0,0,0,0.4)] w-max max-w-[98vw] md:w-auto">
      <div className="hidden sm:flex px-2 md:px-4 border-r border-white/10 items-center justify-center shrink-0">
        <span className="text-white text-xs md:text-sm font-semibold tracking-wider">{timeString}</span>
      </div>
      <div className="flex items-center gap-1 md:gap-2 pl-1">
        <Button 
          onClick={onToggleMute}
          size="icon-lg"
          variant={isMuted ? 'danger' : 'glass'}
          className="group"
          disabled={isAudioLoading}
        >
          {isAudioLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isMuted ? (
            <MicOff className="w-5 h-5 group-hover:scale-110 transition-transform" />
          ) : (
            <Mic className="w-5 h-5 group-hover:scale-110 transition-transform" />
          )}
        </Button>

        <div className="relative">
          <Button 
            onClick={onToggleVideo}
            size="icon-lg"
            variant={isVideoOff ? 'danger' : 'glass'}
            className="group"
            disabled={isVideoLoading}
          >
            {isVideoLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isVideoOff ? (
              <CameraOff className="w-5 h-5 group-hover:scale-110 transition-transform" />
            ) : (
              <Camera className="w-5 h-5 group-hover:scale-110 transition-transform" />
            )}
          </Button>
          
          <Button
            size="sm"
            variant="glass"
            className="absolute -top-3 -right-3 h-6 w-6 p-0 rounded-full border border-white/20 bg-card/80 hover:bg-card z-10"
            onClick={() => {
              setShowBgMenu(!showBgMenu);
              setShowCaptionsMenu(false);
              setShowReactions(false);
            }}
            title="Virtual Backgrounds"
          >
            <ImageIcon className="w-3 h-3 text-muted-foreground" />
          </Button>

          <VirtualBackgroundMenu 
            isOpen={showBgMenu}
            onClose={() => setShowBgMenu(false)}
            currentBg={currentBg}
            onSelectBg={onSelectBg}
            onUploadCustom={onUploadCustomBg}
          />
        </div>

        <Button 
          onClick={onToggleScreenShare}
          size="icon-lg"
          variant={isScreenSharing ? 'primary' : 'glass'}
          className="group"
        >
          {isScreenSharing ? <MonitorOff className="w-5 h-5 group-hover:scale-110 transition-transform" /> : <MonitorUp className="w-5 h-5 group-hover:scale-110 transition-transform" />}
        </Button>
      </div>

      <div className="w-px h-6 md:h-8 bg-white/10 mx-1 md:mx-2 hidden md:block" />

      <div className="flex items-center gap-1 md:gap-2 relative">
        <Button 
          onClick={onToggleHand}
          size="icon-lg"
          variant={isHandRaised ? 'primary' : 'glass'}
          className="group"
        >
          <Hand className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </Button>

        <div className="relative">
          {showReactions && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 bg-card/90 backdrop-blur-xl border border-white/10 p-3 rounded-2xl flex gap-3 shadow-2xl flex-nowrap z-50">
              {['👍', '👏', '❤️', '🎉', '😊'].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    onReaction(emoji);
                    setShowReactions(false);
                  }}
                  className="text-2xl hover:scale-125 transition-transform origin-bottom"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
          <Button 
            onClick={() => {
              setShowReactions(!showReactions);
              setShowCaptionsMenu(false);
            }}
            size="icon-lg"
            variant={showReactions ? 'soft' : 'glass'}
            className="group"
          >
            <Smile className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </Button>
        </div>
      </div>

      <div className="w-px h-6 md:h-8 bg-white/10 mx-1 md:mx-2 hidden md:block" />

      <div className="flex items-center gap-1 md:gap-2 relative">
        <Button 
          onClick={onToggleParticipants}
          size="icon-lg"
          variant={showParticipants ? 'soft' : 'glass'}
          className="group"
        >
          <Users className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </Button>

        <Button 
          onClick={onToggleChat}
          size="icon-lg"
          variant={showChat ? 'soft' : 'glass'}
          className="group relative"
        >
          <MessageSquare className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </Button>
      </div>

      <div className="w-px h-6 md:h-8 bg-white/10 mx-1 md:mx-2 hidden md:block" />

      <div className="relative">
        {showMoreMenu && (
          <div className="absolute bottom-full right-0 mb-4 bg-card/90 backdrop-blur-xl border border-white/10 p-2 rounded-3xl w-48 shadow-2xl z-50 flex flex-col gap-1">
            <button 
              onClick={() => { onToggleNotes(); setShowMoreMenu(false); }}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors text-sm font-medium ${showNotes ? 'bg-primary/20 text-primary' : 'hover:bg-white/5 text-foreground'}`}
            >
              <FileText className="w-5 h-5" /> Notes & Tasks
            </button>
            <button 
              onClick={() => { onToggleWhiteboard(); setShowMoreMenu(false); }}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors text-sm font-medium ${showWhiteboard ? 'bg-primary/20 text-primary' : 'hover:bg-white/5 text-foreground'}`}
            >
              <PenTool className="w-5 h-5" /> Whiteboard
            </button>
            <button 
              onClick={() => { setShowCaptionsMenu(!showCaptionsMenu); }}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors text-sm font-medium ${(captionSettings?.enabled || false) ? 'bg-primary/20 text-primary' : 'hover:bg-white/5 text-foreground'}`}
            >
              <Subtitles className="w-5 h-5" /> Live Captions
            </button>
            
            {showCaptionsMenu && (
              <div className="bg-background/50 rounded-xl p-3 mt-1 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">Enable</span>
                  <input 
                    type="checkbox" 
                    checked={captionSettings?.enabled || false}
                    onChange={(e) => setCaptionSettings(prev => ({ ...prev, enabled: e.target.checked }))}
                    className="w-3 h-3 rounded text-primary focus:ring-primary bg-background/50 border-white/10"
                  />
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-muted-foreground flex items-center gap-1"><Type className="w-3 h-3"/> Size</span>
                  <select 
                    value={captionSettings?.fontSize || 'text-xl'} 
                    onChange={(e) => setCaptionSettings(prev => ({ ...prev, fontSize: e.target.value }))}
                    className="bg-background border border-white/10 rounded-lg px-1 outline-none"
                  >
                    <option value="text-sm">Small</option>
                    <option value="text-base">Medium</option>
                    <option value="text-xl">Large</option>
                  </select>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-muted-foreground flex items-center gap-1"><Layout className="w-3 h-3"/> BG</span>
                  <select 
                    value={captionSettings?.background || 'rgba(0,0,0,0.5)'} 
                    onChange={(e) => setCaptionSettings(prev => ({ ...prev, background: e.target.value }))}
                    className="bg-background border border-white/10 rounded-lg px-1 outline-none"
                  >
                    <option value="transparent">None</option>
                    <option value="rgba(0,0,0,0.5)">Dark</option>
                    <option value="rgba(255,255,255,0.8)">Light</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        )}
        <Button 
          size="icon-lg" 
          variant={showMoreMenu ? 'soft' : 'glass'} 
          className="group"
          onClick={() => setShowMoreMenu(!showMoreMenu)}
        >
          <MoreVertical className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </Button>
      </div>
    </nav>
  );
}

import { motion } from "framer-motion";
import { Video, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Button from "./ui/Button";

export function StartMeetingCard({ onOpenCreateModal }) {
  const navigate = useNavigate();

  function handleStart() {
    if (onOpenCreateModal) {
      onOpenCreateModal();
    } else {
      navigate(`/meeting`);
    }
  }
  return (
    <div
      className="bg-card rounded-3xl p-8 relative overflow-hidden grid md:grid-cols-2 gap-6 items-center min-h-[320px] border border-border"
    >
      <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="relative z-10">
        <h2 className="text-3xl font-bold mb-3 text-foreground">Start a new meeting</h2>
        <p className="text-muted-foreground mb-8 max-w-sm text-sm">
          Create a new meeting room and invite others to join instantly.
        </p>
        <div className="flex flex-wrap gap-4">
          <Button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            size="lg"
            onClick={handleStart}
          >
            Start Meeting
          </Button>
          <Button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            variant="outline"
            size="lg"
            onClick={() => navigate('/calendar')}
            className="border-border text-foreground hover:bg-muted"
          >
            Schedule Meeting
          </Button>
        </div>
      </div>
      
      {/* Neon SVG Illustration */}
      <div className="relative h-full min-h-[240px] flex items-center justify-center">
        <div className="absolute inset-0 bg-background rounded-3xl flex items-center justify-center border border-border overflow-hidden">
           <div className="absolute w-64 h-64 border border-border rounded-full" />
           <div className="absolute w-40 h-40 border border-border rounded-full" />
           
           {/* Center Video Icon */}
           <div className="relative z-10 w-20 h-20 rounded-2xl border-2 border-secondary flex items-center justify-center shadow-[0_0_30px_rgba(var(--color-secondary),0.5)] bg-background">
             <Video className="w-10 h-10 text-secondary" />
           </div>

           {/* Connected nodes */}
           <div className="absolute top-[25%] left-[25%] -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center shadow-[0_0_15px_rgba(var(--color-primary),0.5)]">
             <User className="w-5 h-5 text-primary" />
           </div>
           <div className="absolute top-[75%] left-[25%] -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center shadow-[0_0_15px_rgba(var(--color-primary),0.5)]">
             <User className="w-5 h-5 text-primary" />
           </div>
           <div className="absolute top-[25%] left-[75%] -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center shadow-[0_0_15px_rgba(var(--color-primary),0.5)]">
             <User className="w-5 h-5 text-primary" />
           </div>
           <div className="absolute top-[75%] left-[75%] -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center shadow-[0_0_15px_rgba(var(--color-primary),0.5)]">
             <User className="w-5 h-5 text-primary" />
           </div>
           
           {/* Connecting lines */}
           <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
              <line x1="25%" y1="25%" x2="50%" y2="50%" stroke="var(--color-primary)" strokeOpacity="0.4" strokeWidth="2" />
              <line x1="25%" y1="75%" x2="50%" y2="50%" stroke="var(--color-primary)" strokeOpacity="0.4" strokeWidth="2" />
              <line x1="75%" y1="25%" x2="50%" y2="50%" stroke="var(--color-primary)" strokeOpacity="0.4" strokeWidth="2" />
              <line x1="75%" y1="75%" x2="50%" y2="50%" stroke="var(--color-primary)" strokeOpacity="0.4" strokeWidth="2" />
           </svg>
        </div>
      </div>
    </div>
  );
}

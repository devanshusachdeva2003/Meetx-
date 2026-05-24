import { Link2 } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

export function JoinMeeting() {
  const [val, setVal] = useState("");
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="bg-card border border-border rounded-3xl p-8 relative overflow-hidden flex flex-col min-h-[320px]"
    >
      <div className="absolute -bottom-16 -right-16 w-56 h-56 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <h2 className="text-2xl font-bold mb-2 text-white">Join a meeting</h2>
      <p className="text-gray-400 mb-6 text-sm">Enter meeting ID or paste invite link to join.</p>
      <div className="relative mb-4">
        <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder="Enter meeting ID or link"
          className="w-full bg-input border border-border rounded-2xl pl-11 pr-4 py-3.5 text-sm placeholder:text-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
        />
      </div>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="mt-auto w-full gradient-primary text-white font-medium py-3.5 rounded-2xl shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] transition-shadow"
      >
        Join Meeting
      </motion.button>
    </motion.div>
  );
}

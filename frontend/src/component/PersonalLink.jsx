import { Copy, Share2 } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

export function PersonalLink() {
  const [copied, setCopied] = useState(false);
  const link = "meetx.com/john.doe";
  const copy = () => {
    navigator.clipboard?.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="bg-card border border-border rounded-3xl p-6 flex flex-col h-full">
      <h3 className="font-semibold mb-4 text-white">Your Personal Meeting Link</h3>
      <div className="relative mb-5">
        <input
          readOnly
          value={link}
          className="w-full bg-input border border-border rounded-2xl pl-4 pr-10 py-3.5 text-sm text-gray-300"
        />
        <button onClick={copy} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition">
          <Copy className="w-4 h-4" />
        </button>
      </div>
      <div className="flex gap-3 mb-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={copy}
          className="flex-1 gradient-primary text-white font-medium py-3 rounded-2xl text-sm shadow-[0_0_15px_rgba(168,85,247,0.3)]"
        >
          {copied ? "Copied!" : "Copy Link"}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex-1 bg-transparent border border-gray-600 font-medium py-3 rounded-2xl text-sm text-white hover:bg-white/5 flex items-center justify-center gap-2 transition"
        >
          <Share2 className="w-4 h-4" /> Share
        </motion.button>
      </div>
      <p className="text-xs text-gray-500 mt-auto">
        Anyone with this link can join your meeting room.
      </p>
    </div>
  );
}

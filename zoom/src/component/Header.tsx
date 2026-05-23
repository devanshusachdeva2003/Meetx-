import { Plus } from "lucide-react";
import { motion } from "framer-motion";

export function Header() {
  return (
    <header className="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
          Welcome back, John! <span className="inline-block">👋</span>
        </h1>
        <p className="text-gray-400 mt-1">Ready to connect and collaborate?</p>
      </div>
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className="gradient-primary text-white font-medium px-5 py-3 rounded-2xl flex items-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] transition-shadow"
      >
        <Plus className="w-4 h-4" />
        New Meeting
      </motion.button>
    </header>
  );
}

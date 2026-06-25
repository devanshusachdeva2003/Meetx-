import { Plus } from "lucide-react";
import { useUser } from "../context/UserContext";
import Button from "./ui/Button";

export function Header({ onOpenCreateModal }) {
  const { user } = useUser();
  const firstName = user?.name ? user.name.split(' ')[0] : 'Guest';

  return (
    <header className="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
          Welcome back, {firstName}! <span className="inline-block">👋</span>
        </h1>
        <p className="text-gray-400 mt-1">Ready to connect and collaborate?</p>
      </div>
      <Button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={onOpenCreateModal}
        className="px-5 py-3 rounded-2xl flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        New Meeting
      </Button>
    </header>
  );
}

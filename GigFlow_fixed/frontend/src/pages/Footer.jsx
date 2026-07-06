export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/5 bg-[#050607]">
      <div className="max-w-7xl mx-auto px-8 py-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">

          <div className="flex items-center gap-3">
            <div className="h-px w-8 bg-emerald-500" />
            <span className="text-[10px] uppercase tracking-[0.5em] text-gray-500 font-bold">
              GigFlow
            </span>
          </div>

          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-600 font-mono text-center">
            © {new Date().getFullYear()} GigFlow_Systems — All_Nodes_Reserved
          </p>

          <div className="flex items-center gap-6">
            <span className="text-[10px] uppercase tracking-[0.2em] text-gray-600 font-mono flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              System_Online
            </span>
          </div>

        </div>
      </div>
    </footer>
  );
}
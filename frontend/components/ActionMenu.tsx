import React, { useState, useRef, useEffect } from "react";

type Action = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
};

const ActionMenu: React.FC<{ actions: Action[] }> = ({ actions }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="h-10 sm:h-11 px-3 sm:px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark text-gray-600 dark:text-gray-300 font-bold text-sm flex items-center gap-1.5 sm:gap-2 active:scale-95 transition-transform"
      >
        <span className="hidden sm:inline">Actions</span>
        <span className="material-symbols-outlined">more_vert</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-700 rounded-xl shadow-xl z-50 py-1 overflow-hidden">
          {actions.map((a, i) => (
            <button
              key={i}
              onClick={() => {
                if (a.disabled) return;
                a.onClick();
                setOpen(false);
              }}
              disabled={a.disabled}
              className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${a.disabled ? "text-gray-300 dark:text-gray-600 cursor-not-allowed" : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100"}`}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActionMenu;

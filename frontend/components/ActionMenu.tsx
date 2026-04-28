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
        className="h-11 px-4 rounded-xl border border-gray-200 bg-white text-gray-600 font-bold text-sm flex items-center gap-2"
      >
        Actions
        <span className="material-symbols-outlined">more_vert</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg z-50">
          {actions.map((a, i) => (
            <button
              key={i}
              onClick={() => {
                if (a.disabled) return;
                a.onClick();
                setOpen(false);
              }}
              disabled={a.disabled}
              className={`w-full text-left px-4 py-2 text-sm ${a.disabled ? "text-gray-300" : "text-gray-700 hover:bg-gray-50"}`}
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

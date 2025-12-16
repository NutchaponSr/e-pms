"use client";

import { createPortal } from "react-dom";
import { SearchIcon } from "lucide-react";
import { useRef, useState, useEffect, Suspense } from "react";

import { cn } from "@/lib/utils";

import { APP_CATEGORIES } from "@/constants";

import { useSearchParams } from "@/hooks/use-search-params";

import { SearchPopover } from "@/components/search-popover";

export const SearchCommand = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [state, setState] = useSearchParams();

  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number } | null>(null);
  const [showPopover, setShowPopover] = useState(false);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (containerRef.current && showPopover) {
      updatePopoverPosition();
    }
  }, [showPopover]);

  useEffect(() => {
    const handleResize = () => {
      if (showPopover) {
        updatePopoverPosition();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [showPopover]);

  useEffect(() => {
    const handleScroll = () => {
      if (showPopover) {
        updatePopoverPosition();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showPopover]);

  const updatePopoverPosition = () => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let left = rect.left + window.scrollX;
    let top = rect.bottom + window.scrollY;
    
    if (left + 384 > viewportWidth) { 
      left = Math.max(16, viewportWidth - 384 - 16);
    }
    
    if (left < 16) {
      left = 16;
    }
    
    if (top + 560 > viewportHeight + window.scrollY) {
      top = rect.top + window.scrollY - 560 - 8;
    }
    
    setPopoverPos({ top, left });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        popoverRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        handleClose();
      }
    };

    if (showPopover) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showPopover]);

  const handleClose = () => {
    setShowPopover(false);
    setState({ search: "" });
    setFocused(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setState({ search: newValue });

    if (newValue.trim().length > 0) {
      setTimeout(() => {
        setShowPopover(true);
      }, 300);
    } else {
      setShowPopover(false);
    }
  };

  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  const filteredCategories = APP_CATEGORIES.filter(category =>
    category.title.toLowerCase().includes(state.search.toLowerCase())
  );
  
  const filteredApplications = APP_CATEGORIES.flatMap(category =>
    category.items.filter(app =>
      app.title.toLowerCase().includes(state.search.toLowerCase())
    )
  );

  return (
    <div
      ref={containerRef}
      onClick={handleContainerClick}
      className={cn(
        "relative h-9 outline-none cursor-text transition-all duration-300 rounded-sm flex items-center shadow-[0_0_0_1.25px_rgba(0,0,0,0.1),0_12px_32px_0_rgba(0,0,0,0.02)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.1)] dark:group-hover:shadow-[0_0_0_1px_rgba(255,255,255,0.15)] group",
        focused || state.search ? "w-96" : "w-72"
      )}
    >
      <div className="bg-sidebar flex items-center px-3 py-2 transition-all duration-300 justify-end h-9 rounded-sm w-full">
        <SearchIcon className="size-5 mr-2" />
        <input
          ref={inputRef}
          placeholder="Search..."
          value={state.search}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => { if (!state.search) setFocused(false) }}
          className="w-full text-primary border-none bg-none resize-none focus-visible:outline-none font-normal placeholder:text-foreground"
        />
      </div>

      {(showPopover && popoverPos) &&
        createPortal(
          <Suspense>
            <SearchPopover 
              ref={popoverRef}
              popoverPos={popoverPos}
              filteredCategories={filteredCategories}
              filteredApplications={filteredApplications}
            />
          </Suspense>,
          document.body
        )}
    </div>
  );
};

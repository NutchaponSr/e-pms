"use client";

import {
  createContext,
  useRef,
  useState
} from "react";

type SidebarType = {
  width: number;
  isDragging: boolean;
  isCollapsed: boolean;
  isResetting: boolean;
  sidebarRef: React.RefObject<HTMLElement | null>;
  setIsDragging: (value: boolean) => void;
  setIsCollapsed: (value: boolean) => void;
  setIsResetting: (value: boolean) => void;
  resetWidth: () => void;
  collapse: () => void;
  handleMouseDown: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}

export const SidebarContext = createContext<SidebarType | undefined>(undefined);

interface Props {
  children: React.ReactNode;
}

export const SidebarProvider = ({ children }: Props) => {
  const [width, setWidth] = useState(240);
  const [isDragging, setIsDragging] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const isResizingRef = useRef(false);
  const sidebarRef = useRef<HTMLElement | null>(null);

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizingRef.current) return;

    let newWidth = e.clientX;
    newWidth = Math.max(240, Math.min(newWidth, 360));

    if (sidebarRef.current) {
      sidebarRef.current.style.width = `${newWidth}px`;
      setWidth(newWidth);
    }
  }

  const handleMouseUp = () => {
    isResizingRef.current = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.preventDefault();
    e.stopPropagation();

    isResizingRef.current = true;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };


  const resetWidth = () => {
    const isMobile = window.matchMedia("(max-width: 768px)").matches;

    if (sidebarRef.current) {
      setIsCollapsed(false);
      setIsResetting(true);
      setWidth(240);

      sidebarRef.current.style.width = isMobile ? "100%" : "240px";

      setTimeout(() => setIsResetting(false), 300);
    }
  }

  const collapse = () => {
    if (sidebarRef.current) {
      setIsCollapsed(true);
      setIsResetting(true);
      setWidth(0);
      
      sidebarRef.current.style.width = "0";
      setTimeout(() => setIsResetting(false), 300);
    }
  }

  const value = {
    width,
    sidebarRef,
    isCollapsed,
    isDragging,
    isResetting,
    setIsCollapsed,
    setIsDragging,
    setIsResetting,
    handleMouseDown,
    resetWidth,
    collapse
  }

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
}
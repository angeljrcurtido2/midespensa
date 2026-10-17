import {
  useEffect,
  useRef,
  useState,
  useCallback,
  type ComponentType,
  type SVGProps,
} from "react";
import { NOMBRE_SISTEMA } from '../config/marca';
import { useDarkModeStore } from '../../store/useDarkModeStore';
import { getDataUser } from "../services/usuarios";
import { TiThMenu } from "react-icons/ti";
import { AiOutlineSmallDash } from "react-icons/ai";
import { FaMoon, FaSun } from "react-icons/fa";

import {
  ChevronDownIcon,
  ChevronRightIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { createPortal } from "react-dom";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useUserStore } from "../../store/useUserStore";
import clsx from "clsx";
import api from "../lib/axiosConfig";

interface SubItem {
  name: string;
  path: string;
  pro?: boolean;
  new?: boolean;
  children?: { name: string; path: string }[];
}

interface NavItem {
  name: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  path?: string;
  subItems?: SubItem[];
}

interface UserData {
  acceso: string;
  nombreUsuario: string;
}

const InitialUserData: UserData = {
  acceso: "",
  nombreUsuario: "",
};

export interface AppSidebarProps {
  navItems: NavItem[];
  isExpanded: boolean;
  setIsExpanded: (val: boolean) => void;
}

const AppSidebar = ({ navItems, isExpanded, setIsExpanded }: AppSidebarProps) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const resetStore = useUserStore((s) => s.resetStore);

  const darkMode = useDarkModeStore((s) => s.darkMode);
  const toggleDarkMode = useDarkModeStore((s) => s.toggleDarkMode);

  const [openSubmenu, setOpenSubmenu] = useState<number | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<number, number>>({});
  const [flyout, setFlyout] = useState<{
    key: string;
    top: number;
    left: number;
    children: { name: string; path: string }[];
  } | null>(null);
  const [userData, setUserData] = useState<UserData>(InitialUserData);

  const subMenuRefs = useRef<Record<number, HTMLUListElement | null>>({});
  const sidebarRef = useRef<HTMLDivElement>(null);
  const flyoutRef = useRef<HTMLDivElement>(null);
  const flyoutCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showFlyout = (key: string, element: HTMLElement, children: { name: string; path: string }[]) => {
    if (flyoutCloseTimer.current) clearTimeout(flyoutCloseTimer.current);
    const rect = element.getBoundingClientRect();
    const estimatedHeight = children.length * 44 + 16;
    const top = Math.max(8, Math.min(rect.top, window.innerHeight - estimatedHeight - 8));
    setFlyout({ key, top, left: rect.right + 8, children });
  };

  const scheduleFlyoutClose = () => {
    if (flyoutCloseTimer.current) clearTimeout(flyoutCloseTimer.current);
    flyoutCloseTimer.current = setTimeout(() => setFlyout(null), 140);
  };

  const keepFlyoutOpen = () => {
    if (flyoutCloseTimer.current) clearTimeout(flyoutCloseTimer.current);
  };

  const isActive = useCallback(
    (path: string) => pathname === path || pathname.startsWith(`${path}/`),
    [pathname]
  );

  const isFlyoutChildActive = (path: string, siblings: SubItem[]) => {
    const selectedMoreSpecificSibling = siblings.some((sibling) =>
      sibling.path.length > path.length &&
      (pathname === sibling.path || pathname.startsWith(`${sibling.path}/`))
    );
    return !selectedMoreSpecificSibling &&
      (pathname === path || pathname.startsWith(`${path}/`));
  };

  const collapseAll = () => {
    setIsExpanded(false);
    setOpenSubmenu(null);
  };

  useEffect(() => {
    navItems.forEach((nav, idx) => {
      if (!nav.subItems) return;
      if (nav.subItems.some((s) => isActive(s.path))) {
        setOpenSubmenu(idx);
      }
    });
  }, [pathname, navItems, isActive]);

  useEffect(() => {
    setFlyout(null);
  }, [pathname]);

  useEffect(() => {
    if (openSubmenu === null) return;
    const el = subMenuRefs.current[openSubmenu];
    if (el) {
      setSubMenuHeight((prev) => ({
        ...prev,
        [openSubmenu]: el.scrollHeight,
      }));
    }
  }, [openSubmenu]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(e.target as Node) &&
        !flyoutRef.current?.contains(e.target as Node)
      ) {
        collapseAll();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFlyout(null);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      if (flyoutCloseTimer.current) clearTimeout(flyoutCloseTimer.current);
    };
  }, []);

  const handleSubmenuToggle = (idx: number) => {
    setOpenSubmenu((prev) => (prev === idx ? null : idx));
  };

  const handleUserData = async () => {
    if (!localStorage.getItem("usuario")) return;
    try {
      const res = await getDataUser();
      setUserData(res.data);
    } catch {
      const storedUser = localStorage.getItem("usuario");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        setUserData({
          acceso: parsed.acceso || "",
          nombreUsuario: parsed.username || "",
        });
      }
    }
  };

  useEffect(() => {
    handleUserData();
  }, []);

  const getInitials = (fullName = "") =>
    fullName
      .trim()
      .split(" ")
      .map((w) => w[0] || "")
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const initials = getInitials(userData.nombreUsuario);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
      localStorage.removeItem("usuario");
      resetStore();
      setUserData(InitialUserData);
      navigate("/login");
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
    }
  };

  return (
    <aside
      ref={sidebarRef}
      onClick={() => setIsExpanded(true)}
      className={clsx(
        "fixed top-0 left-0 z-50 h-screen overflow-y-auto",
        "border-r border-blue-200 dark:border-gray-700 shadow-xl",
        "bg-gradient-to-b from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900",
        "transition-all duration-300 ease-in-out",
        isExpanded ? "w-72 p-4" : "w-24 p-3",
        // Off-canvas por debajo de lg: colapsado se sale de pantalla en lugar de
        // robarle 288px de 390px al contenido. Desde lg vuelve al comportamiento
        // de siempre (fijo y visible).
        isExpanded ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}
    >
      {/* Logo */}
      <div
        className={clsx(
          "mb-6 flex items-center gap-3",
          isExpanded ? "justify-start" : "justify-center"
        )}
      >
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-xl shadow-md">
          <TiThMenu className="h-5 w-5 text-white" />
        </div>
        {isExpanded && (
          <span className="text-xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {NOMBRE_SISTEMA}
          </span>
        )}
      </div>

      {/* Usuario */}
      {isExpanded && (
        <div className="mb-6 flex items-center gap-3 rounded-xl bg-white/70 dark:bg-gray-800/70 backdrop-blur p-3 shadow-md border border-blue-100 dark:border-gray-700">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 font-bold text-white">
            {initials}
          </div>
          <div className="leading-4">
            <p className="text-[11px] uppercase text-gray-400 dark:text-gray-500">Bienvenido</p>
            <p className="font-semibold text-gray-700 dark:text-gray-200">
              {userData.nombreUsuario}
            </p>
          </div>
        </div>
      )}

      {/* Menú */}
      <p
        className={clsx(
          "pb-3 uppercase tracking-wider text-gray-400",
          isExpanded ? "text-xs" : "text-xl flex justify-center"
        )}
      >
        {isExpanded ? "Menú" : <AiOutlineSmallDash />}
      </p>

      <ul className="space-y-2">
        {navItems.map((nav, idx) => {
          const Icon = nav.icon;

          const baseBtn =
            "flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold transition-all";

          const expandedBtn = isExpanded
            ? "text-gray-700 dark:text-gray-200 hover:bg-blue-100 dark:hover:bg-gray-700"
            : "justify-center bg-blue-100 dark:bg-gray-700 text-blue-600 dark:text-blue-400";

          return (
            <li key={nav.name}>
              {nav.subItems ? (
                <>
                  <button
                    onClick={() => handleSubmenuToggle(idx)}
                    aria-expanded={openSubmenu === idx}
                    className={clsx(baseBtn, expandedBtn)}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5" />
                      {isExpanded && <span>{nav.name}</span>}
                    </div>
                    {isExpanded && (
                      <ChevronDownIcon
                        className={clsx(
                          "h-5 w-5 transition-transform",
                          openSubmenu === idx && "rotate-180"
                        )}
                      />
                    )}
                  </button>

                  {isExpanded && (
                    <ul
                      ref={(el) => { subMenuRefs.current[idx] = el; }}
                      className="overflow-hidden pl-10 transition-all duration-300"
                      style={{
                        height:
                          openSubmenu === idx ? subMenuHeight[idx] : 0,
                      }}
                    >
                      {nav.subItems.map((s) => {
                        const flyoutKey = `${nav.name}:${s.path}`;
                        const hasChildren = !!s.children?.length;
                        return (
                          <li
                            key={s.name}
                            onMouseEnter={hasChildren ? (event) => showFlyout(flyoutKey, event.currentTarget, s.children!) : undefined}
                            onMouseLeave={hasChildren ? scheduleFlyoutClose : undefined}
                            onFocus={hasChildren ? (event) => showFlyout(flyoutKey, event.currentTarget, s.children!) : undefined}
                          >
                            <div className="mt-1 flex items-center">
                              <Link
                                to={s.path}
                                onClick={() => setFlyout(null)}
                                className={clsx(
                                  "min-w-0 flex-1 rounded-lg px-3 py-2 text-sm font-medium transition",
                                  isActive(s.path)
                                    ? "bg-blue-100 dark:bg-gray-700 text-blue-700 dark:text-blue-400 font-semibold"
                                    : "text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-gray-700"
                                )}
                                aria-haspopup={hasChildren ? "menu" : undefined}
                                aria-expanded={hasChildren ? flyout?.key === flyoutKey : undefined}
                              >
                                {s.name}
                              </Link>
                              {hasChildren && (
                                <button
                                  type="button"
                                  aria-label={`Mostrar opciones de ${s.name}`}
                                  aria-haspopup="menu"
                                  aria-expanded={flyout?.key === flyoutKey}
                                  onClick={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    if (flyout?.key === flyoutKey) setFlyout(null);
                                    else showFlyout(flyoutKey, event.currentTarget.parentElement || event.currentTarget, s.children!);
                                  }}
                                  className="mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-blue-100 hover:text-blue-700 dark:text-gray-400 dark:hover:bg-gray-700"
                                >
                                  <ChevronRightIcon className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </>
              ) : (
                nav.path && (
                  <Link
                    to={nav.path}
                    className={clsx(
                      "flex items-center gap-3 rounded-xl px-3 py-3 font-semibold transition-all",
                      isActive(nav.path)
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                        : "text-gray-700 dark:text-gray-200 hover:bg-blue-100 dark:hover:bg-gray-700"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {isExpanded && <span>{nav.name}</span>}
                  </Link>
                )
              )}
            </li>
          );
        })}
      </ul>

      {flyout && isExpanded && createPortal(
        <div
          ref={flyoutRef}
          role="menu"
          onMouseEnter={keepFlyoutOpen}
          onMouseLeave={scheduleFlyoutClose}
          style={{ top: flyout.top, left: flyout.left }}
          className="fixed z-[70] min-w-52 rounded-xl border border-blue-100 bg-white p-2 shadow-xl dark:border-gray-700 dark:bg-gray-800"
        >
          {flyout.children.map((child) => (
            <Link
              key={child.path}
              role="menuitem"
              to={child.path}
              onClick={() => setFlyout(null)}
              className={clsx(
                "block rounded-lg px-3 py-2.5 text-sm font-medium transition",
                isFlyoutChildActive(child.path, flyout.children)
                  ? "bg-blue-100 text-blue-700 dark:bg-gray-700 dark:text-blue-300"
                  : "text-gray-700 hover:bg-blue-50 hover:text-blue-700 dark:text-gray-200 dark:hover:bg-gray-700"
              )}
            >
              {child.name}
            </Link>
          ))}
        </div>,
        document.body
      )}

      {/* Logout */}
      {isExpanded && (
        <div className="mt-10 rounded-2xl bg-white/70 dark:bg-gray-800/70 backdrop-blur px-4 py-5 shadow-md border border-blue-100 dark:border-gray-700">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 font-semibold text-white shadow-md hover:from-blue-700 hover:to-indigo-700 transition"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
            <span>Cerrar sesión</span>
          </button>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              {darkMode ? (
                <FaSun className="h-5 w-5 text-yellow-400" />
              ) : (
                <FaMoon className="h-5 w-5 text-gray-700" />
              )}
              <span className="text-gray-800 dark:text-gray-100 font-semibold">
                {darkMode ? "Modo Claro" : "Modo Oscuro"}
              </span>
            </div>

            {/* Toggle */}
            <button
              onClick={toggleDarkMode}
              className={`
          relative inline-flex h-6 w-12 items-center rounded-full transition-colors
          ${darkMode ? 'bg-blue-600' : 'bg-gray-300'}
        `}
            >
              <span
                className={`
            inline-block h-5 w-5 transform rounded-full bg-white transition-transform
            ${darkMode ? 'translate-x-6' : 'translate-x-1'}
          `}
              />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};

export default AppSidebar;

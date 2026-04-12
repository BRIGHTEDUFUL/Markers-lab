export const SECTION_ROUTES = new Set([
  "/",
  "/gallery",
  "/about",
  "/contact",
  "/dashboard",
  "/submit-project",
  "/profile",
  "/admin",
  "/login",
  "/register",
]);

export const ROOT_EXIT_ROUTES = new Set(["/"]);

export const CHILD_PARENT_ROUTE: Record<string, string> = {
  "/submit-project": "/dashboard",
  "/profile": "/dashboard",
  "/admin": "/dashboard",
  "/login": "/",
  "/register": "/",
};

export const normalizePathname = (pathname: string): string => {
  if (!pathname) return "/";
  return pathname.length > 1 && pathname.endsWith("/")
    ? pathname.slice(0, -1)
    : pathname;
};

export const isSectionRoute = (pathname: string): boolean => {
  return SECTION_ROUTES.has(normalizePathname(pathname));
};

export const isRootExitRoute = (pathname: string): boolean => {
  return ROOT_EXIT_ROUTES.has(normalizePathname(pathname));
};

export const getParentRoute = (pathname: string): string | null => {
  return CHILD_PARENT_ROUTE[normalizePathname(pathname)] ?? null;
};

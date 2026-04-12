import { useCallback } from "react";
import { NavigateOptions, To, useLocation, useNavigate } from "react-router-dom";
import { isSectionRoute, normalizePathname } from "../navigation/route-hierarchy";

type SmartNavigateOptions = NavigateOptions & {
  asSectionSwitch?: boolean;
};

const toPathname = (to: To): string => {
  if (typeof to === "string") {
    return to.split("?")[0].split("#")[0] || "/";
  }
  return to.pathname || "/";
};

export const useSmartNavigate = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback(
    (to: To, options: SmartNavigateOptions = {}) => {
      const currentPath = normalizePathname(location.pathname);
      const targetPath = normalizePathname(toPathname(to));
      const isDuplicateRoute = currentPath === targetPath;
      const isSectionSwitch = isSectionRoute(currentPath) && isSectionRoute(targetPath);

      const fallbackReplace = isDuplicateRoute || isSectionSwitch;
      const replace = options.replace ?? options.asSectionSwitch ?? fallbackReplace;

      navigate(to, { ...options, replace });
    },
    [location.pathname, navigate]
  );
};

import { createContext, useState, useContext, ReactNode } from "react";

interface AllowActionsContextType {
  allowActions: boolean;
  setAllowActions: (flag: boolean) => void;
}

const AllowActionsContext = createContext<AllowActionsContextType | undefined>(
  undefined,
);

interface ProviderProps {
  children: ReactNode;
}

export const AllowActionsProvider: React.FC<ProviderProps> = ({ children }) => {
  const [allowActions, setAllowActions] = useState<boolean>(true);

  return (
    <AllowActionsContext.Provider value={{ allowActions, setAllowActions }}>
      {children}
    </AllowActionsContext.Provider>
  );
};

// Custom hook to use the context
export const useAllowActions = (): AllowActionsContextType => {
  const context = useContext(AllowActionsContext);
  if (context === undefined) {
    throw new Error(
      "useAllowActions must be used within a AllowActionsProvider",
    );
  }
  return context;
};

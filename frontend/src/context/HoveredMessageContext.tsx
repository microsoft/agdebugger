import { createContext, useState, useContext, ReactNode } from "react";

// Define the shape of the context state
interface HoveredMessageContextType {
  hoveredMessageId: number | undefined;
  setHoveredMessageId: (id: number | undefined) => void;
}

// Create the context with a default value
const HoveredMessageContext = createContext<
  HoveredMessageContextType | undefined
>(undefined);

// Create a provider component
interface HoveredMessageProviderProps {
  children: ReactNode;
}

export const HoveredMessageProvider: React.FC<HoveredMessageProviderProps> = ({
  children,
}) => {
  const [hoveredMessageId, setHoveredMessageId] = useState<number | undefined>(
    undefined,
  );

  return (
    <HoveredMessageContext.Provider
      value={{ hoveredMessageId, setHoveredMessageId }}
    >
      {children}
    </HoveredMessageContext.Provider>
  );
};

// Custom hook to use the context
export const useHoveredMessage = (): HoveredMessageContextType => {
  const context = useContext(HoveredMessageContext);
  if (context === undefined) {
    throw new Error(
      "useHoveredMessage must be used within a HoveredMessageProvider",
    );
  }
  return context;
};

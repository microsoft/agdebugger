export interface MessageDisplayProps {
  allowEdit?: boolean;
  messageDict: unknown;
  setMessage: (message: unknown) => void;
  type: string;
}

import { useState, useEffect, useRef } from "react";

interface TextareaProps {
  value: string | undefined;
  onChange: React.ChangeEventHandler<HTMLTextAreaElement>;
  placeholder?: string;
  className?: string;
}

const GrowTextarea: React.FC<TextareaProps> = ({
  value,
  onChange,
  placeholder = "Enter text",
  className,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [internalValue, setInternalValue] = useState(value || "");

  useEffect(() => {
    if (value !== internalValue) {
      setInternalValue(value || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInternalValue(e.target.value);
    onChange(e);
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [internalValue]);

  return (
    <textarea
      ref={textareaRef}
      className={
        "resize-none overflow-hidden block w-full rounded-lg border text-sm disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 bg-gray-50 text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-primary-500 dark:focus:ring-primary-500 " +
        (className ?? "")
      }
      value={internalValue}
      onChange={handleChange}
      placeholder={placeholder}
    />
  );
};

export default GrowTextarea;

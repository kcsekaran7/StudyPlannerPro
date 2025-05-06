import { useRef, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Input } from "./ui/input";
import { Command, CommandEmpty, CommandGroup,CommandInput, CommandItem, CommandList } from "./ui/command";
import { X } from "lucide-react";

interface TagInputProps{
    value:string[];
    onChange:(tag:string[])=>void;
    suggestions?:string[];
    disabled?:boolean;
}
export function TagInput({
    value,
    onChange,
    suggestions=[],
    disabled=false,
}:TagInputProps){
    const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
const handleAddTag  = (tag:string)=>{
    if(tag.trim() && !disabled){
        onChange([...value,tag.trim()]);
        setInputValue("");
        setIsOpen(false);
        inputRef.current?.focus();
    }}
    const handleRemoveTag = (index: number) => {
        if (!disabled) {
          onChange(value.filter((_, i) => i !== index));
        }
      };
      
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      handleAddTag(inputValue);
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      handleRemoveTag(value.length - 1);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-white">
      {value.map((tag, index) => (
        <span
          key={index}
          className="inline-flex items-center px-2 py-1 text-sm bg-gray-100 rounded-full"
        >
          {tag}
          {!disabled && (
            <button
              type="button"
              onClick={() => handleRemoveTag(index)}
              className="ml-1 focus:outline-none"
            >
              <X className="w-4 h-4 text-gray-500 hover:text-gray-700" />
            </button>
          )}
        </span>
      ))}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Add resources (e.g., NCERT, HC Verma)..."
            className="flex-1 border-none shadow-none focus:ring-0"
            disabled={disabled}
          />
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput
              placeholder="Search resources..."
              value={inputValue}
              onValueChange={setInputValue}
            />
            <CommandList>
              <CommandEmpty>No resources found.</CommandEmpty>
              <CommandGroup>
                {suggestions
                  .filter((suggestion) =>
                    suggestion.toLowerCase().includes(inputValue.toLowerCase())
                  )
                  .map((suggestion) => (
                    <CommandItem
                      key={suggestion}
                      value={suggestion}
                      onSelect={() => handleAddTag(suggestion)}
                    >
                      {suggestion}
                    </CommandItem>
                  ))}
                {inputValue.trim() &&
                  !suggestions.includes(inputValue.trim()) && (
                    <CommandItem
                      value={inputValue}
                      onSelect={() => handleAddTag(inputValue)}
                    >
                      Add "{inputValue}"
                    </CommandItem>
                  )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
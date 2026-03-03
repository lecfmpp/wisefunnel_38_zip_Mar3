import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { COUNTRIES, Country } from '../constants';

interface PhoneInputProps {
    value: string;
    onChange: (value: string) => void;
    onCountryChange?: (code: string) => void;
    placeholder?: string;
    className?: string;
    inputClassName?: string;
    disabled?: boolean;
}

const PhoneInput: React.FC<PhoneInputProps> = ({ value, onChange, onCountryChange, placeholder, className = "", inputClassName = "", disabled = false }) => {
    const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const formatWithMask = (digits: string, mask: string) => {
        let formatted = '';
        let digitIndex = 0;
        for (let i = 0; i < mask.length && digitIndex < digits.length; i++) {
            if (mask[i] === '#') {
                formatted += digits[digitIndex++];
            } else {
                formatted += mask[i];
            }
        }
        return formatted;
    };

    // Force dial code initialization if the value is empty or doesn't have the current dial code
    // This ensures the live site always shows the code inside the field
    useEffect(() => {
        const dialCodeClean = selectedCountry.dialCode.replace(/\+/g, '');
        const currentDigits = value.replace(/\D/g, '');
        
        if (!value.startsWith(selectedCountry.dialCode)) {
            let localDigits = currentDigits;
            // If digits start with the dial code digits, strip them to avoid double prefixing
            if (currentDigits.startsWith(dialCodeClean)) {
                localDigits = currentDigits.slice(dialCodeClean.length);
            }
            
            const formatted = `${selectedCountry.dialCode} ${formatWithMask(localDigits, selectedCountry.format)}`;
            if (formatted !== value) {
                onChange(formatted);
            }
        }
    }, [selectedCountry.code, value, onChange]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let inputVal = e.target.value;
        
        // Block attempts to delete the required prefix
        if (!inputVal.startsWith(selectedCountry.dialCode)) {
            inputVal = selectedCountry.dialCode;
        }

        const dialCodeClean = selectedCountry.dialCode.replace(/\+/g, '');
        const rawDigits = inputVal.replace(/\D/g, '');
        
        // Extract local digits by removing dial code digits from the start
        let localDigits = rawDigits;
        if (rawDigits.startsWith(dialCodeClean)) {
            localDigits = rawDigits.slice(dialCodeClean.length);
        }

        const formatted = `${selectedCountry.dialCode} ${formatWithMask(localDigits, selectedCountry.format)}`;
        onChange(formatted);
    };

    return (
        <div className={`relative flex items-center ${className} pointer-events-auto`} ref={dropdownRef}>
            <div 
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className="absolute left-0 top-0 bottom-0 flex items-center gap-1 pl-3 pr-2 cursor-pointer hover:bg-black/5 transition-colors rounded-l-[5px] z-10"
            >
                <span className="text-xl leading-none">{selectedCountry.flag}</span>
                <ChevronDown size={14} className={`text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
            <input
                type="tel"
                disabled={disabled}
                value={value}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                    // Block backspace if we are at the minimum length of the dial code prefix
                    if (e.key === 'Backspace' && value.length <= selectedCountry.dialCode.length + 1) {
                        e.preventDefault();
                    }
                }}
                placeholder={placeholder || `${selectedCountry.dialCode} ${selectedCountry.format.replace(/#/g, '0')}`}
                className={`w-full pl-16 bg-white text-[#1a2b3b] placeholder:text-gray-400 outline-none ${inputClassName}`}
            />
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-border rounded-lg shadow-2xl z-[100] py-2 max-h-60 overflow-y-auto animate-scale-in origin-top-left">
                    <p className="px-4 py-2 text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em] border-b border-border/50">Select Country</p>
                    {COUNTRIES.map((c) => (
                        <button
                            key={c.code}
                            type="button"
                            onClick={() => {
                                setSelectedCountry(c);
                                setIsOpen(false);
                                if (onCountryChange) onCountryChange(c.code);
                                // Set initial value with new dial code
                                onChange(`${c.dialCode} `);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-all text-left ${selectedCountry.code === c.code ? 'bg-orange-50' : ''}`}
                        >
                            <span className="text-xl leading-none">{c.flag}</span>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-[#1a2b3b] truncate">{c.name}</p>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{c.dialCode}</p>
                            </div>
                            {selectedCountry.code === c.code && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PhoneInput;
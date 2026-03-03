import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, MapPin } from 'lucide-react';
import { COUNTRIES, Country } from '../constants';

interface ZipInputProps {
    value: string;
    onChange: (value: string) => void;
    onCountryChange?: (country: Country) => void;
    placeholder?: string;
    className?: string;
    inputClassName?: string;
    disabled?: boolean;
}

const ZipInput: React.FC<ZipInputProps> = ({ value, onChange, onCountryChange, placeholder, className = "", inputClassName = "", disabled = false }) => {
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

    const formatZip = (input: string, mask: string) => {
        const raw = input.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        let formatted = '';
        let rawIndex = 0;

        for (let i = 0; i < mask.length && rawIndex < raw.length; i++) {
            const m = mask[i];
            const char = raw[rawIndex];

            if (m === '#' || m === 'A' || m === '*') {
                const isDigit = /[0-9]/.test(char);
                const isAlpha = /[A-Z]/.test(char);

                if (m === '#' && isDigit) {
                    formatted += char;
                    rawIndex++;
                } else if (m === 'A' && isAlpha) {
                    formatted += char;
                    rawIndex++;
                } else if (m === '*' && (isDigit || isAlpha)) {
                    formatted += char;
                    rawIndex++;
                } else {
                    rawIndex++;
                    i--; 
                }
            } else {
                formatted += m;
                if (char === m) {
                    rawIndex++;
                }
            }
        }
        return formatted;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatZip(e.target.value, selectedCountry.zipFormat);
        onChange(formatted);
    };

    return (
        <div className={`relative flex items-center ${className}`} ref={dropdownRef}>
            <div 
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className="absolute left-0 top-0 bottom-0 flex items-center gap-1 pl-4 pr-3 cursor-pointer hover:bg-black/5 transition-colors rounded-l-[5px] z-10 border-r border-border/50"
            >
                <span className="text-xl leading-none">{selectedCountry.flag}</span>
                <ChevronDown size={14} className={`text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none">
                <MapPin size={20} />
            </div>
            <input
                type="text"
                disabled={disabled}
                value={value}
                onChange={handleInputChange}
                placeholder={placeholder || `e.g. ${selectedCountry.zipPlaceholder}`}
                className={`w-full pl-20 pr-12 bg-white text-[#1a2b3b] placeholder:text-gray-300 font-black text-lg ${inputClassName}`}
            />
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-border rounded-lg shadow-2xl z-[100] py-2 max-h-60 overflow-y-auto animate-scale-in origin-top-left">
                    <p className="px-4 py-2 text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em] border-b border-border/50">Select Region</p>
                    {COUNTRIES.map((c) => (
                        <button
                            key={c.code}
                            type="button"
                            onClick={() => {
                                setSelectedCountry(c);
                                setIsOpen(false);
                                if (onCountryChange) onCountryChange(c);
                                onChange(''); 
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-all text-left ${selectedCountry.code === c.code ? 'bg-orange-50' : ''}`}
                        >
                            <span className="text-xl leading-none">{c.flag}</span>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-[#1a2b3b] truncate">{c.name}</p>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{c.code} Format</p>
                            </div>
                            {selectedCountry.code === c.code && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ZipInput;
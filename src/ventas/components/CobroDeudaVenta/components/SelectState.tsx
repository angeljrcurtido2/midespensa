'use client';

import { Listbox } from '@headlessui/react';
import { CheckIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

interface Option {
  id: string;
  name: string;
}

interface SelectStateProps {
  value: Option;
  onChange: (option: Option) => void;
  options: Option[];
}

const SelectState = ({ value, onChange, options }: SelectStateProps) => {
  return (
    <Listbox value={value} onChange={onChange}>
      <div className="relative">
        <Listbox.Button className="w-48 cursor-pointer rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-sm text-gray-700">
          {value.name}
          <ChevronDownIcon
            className="absolute right-2 top-2.5 h-5 w-5 text-gray-400"
            aria-hidden="true"
          />
        </Listbox.Button>

        <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-48 overflow-auto rounded-md bg-gradient-to-b from-green-100 via-white to-green-200 py-1 text-sm shadow-lg ring-1 ring-black/5 focus:outline-none">
          {options.map((option) => (
            <Listbox.Option
              key={option.id}
              value={option}
              className={({ active }) =>
                `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                  active ? 'bg-green-100 text-green-900' : 'text-gray-900'
                }`
              }
            >
              {({ selected }) => (
                <>
                  <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                    {option.name}
                  </span>
                  {selected && (
                    <CheckIcon
                      className="absolute left-2 top-2.5 h-5 w-5 text-green-600"
                      aria-hidden="true"
                    />
                  )}
                </>
              )}
            </Listbox.Option>
          ))}
        </Listbox.Options>
      </div>
    </Listbox>
  );
};

export default SelectState;

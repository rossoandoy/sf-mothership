import { useState } from 'react';
import type { InputDefinition } from '@/types/tool';

interface InputFormProps {
  inputs: InputDefinition[];
  onSubmit: (values: Record<string, string>) => void;
  submitLabel?: string;
}

export function InputForm({ inputs, onSubmit, submitLabel = '実行' }: InputFormProps) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const input of inputs) {
      initial[input.id] = input.defaultValue;
    }
    return initial;
  });

  const handleChange = (id: string, value: string) => {
    setValues((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  };

  if (inputs.length === 0) return null;

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {inputs.map((input) => (
        <div key={input.id}>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            {input.label}
            {input.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>

          {input.type === 'text' && (
            <input
              type="text"
              value={values[input.id] ?? ''}
              onChange={(e) => handleChange(input.id, e.target.value)}
              required={input.required}
              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          )}

          {input.type === 'number' && (
            <input
              type="number"
              value={values[input.id] ?? ''}
              onChange={(e) => handleChange(input.id, e.target.value)}
              required={input.required}
              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          )}

          {input.type === 'select' && (
            <select
              value={values[input.id] ?? ''}
              onChange={(e) => handleChange(input.id, e.target.value)}
              required={input.required}
              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">選択してください</option>
              {input.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}

          {input.type === 'checkbox' && (
            <input
              type="checkbox"
              checked={values[input.id] === 'true'}
              onChange={(e) => handleChange(input.id, e.target.checked ? 'true' : 'false')}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
          )}

          {input.helpText && (
            <p className="text-[10px] text-gray-400 mt-0.5">{input.helpText}</p>
          )}
        </div>
      ))}

      <button
        type="submit"
        className="w-full bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-blue-700 transition-colors"
      >
        {submitLabel}
      </button>
    </form>
  );
}

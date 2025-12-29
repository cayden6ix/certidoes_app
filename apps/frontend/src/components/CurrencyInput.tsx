import { useEffect, useCallback, useState, type ChangeEvent } from 'react';
import { formatCentsForInput, parseInputToCents } from '@certidoes/shared';

/**
 * Props do componente CurrencyInput
 */
interface CurrencyInputProps {
  /** ID do input */
  id: string;
  /** Valor em centavos */
  valueCents: number | null;
  /** Callback quando o valor em centavos muda */
  onChangeCents: (cents: number | null) => void;
  /** Input desabilitado */
  disabled?: boolean;
  /** Classes CSS adicionais */
  className?: string;
  /** Placeholder */
  placeholder?: string;
}

/**
 * Componente de input para valores monetários em BRL
 *
 * Aceita valores em centavos e exibe/edita como valor decimal.
 * Suporta entrada com ponto ou vírgula como separador decimal.
 *
 * @example
 * <CurrencyInput
 *   id="cost"
 *   valueCents={1050} // R$ 10,50
 *   onChangeCents={(cents) => setCost(cents)}
 * />
 */
export function CurrencyInput({
  id,
  valueCents,
  onChangeCents,
  disabled = false,
  className = '',
  placeholder = '0,00',
}: CurrencyInputProps) {
  const [inputValue, setInputValue] = useState<string>(formatCentsForInput(valueCents));

  // Sincroniza quando o valor externo muda
  useEffect(() => {
    setInputValue(formatCentsForInput(valueCents));
  }, [valueCents]);

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const rawValue = event.target.value;

      // Permite apenas números, ponto e vírgula
      const sanitized = rawValue.replace(/[^\d.,]/g, '');

      // Atualiza o valor do input imediatamente
      setInputValue(sanitized);

      // Converte para centavos e notifica
      const cents = parseInputToCents(sanitized);
      onChangeCents(cents);
    },
    [onChangeCents],
  );

  const baseClassName =
    'mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500';

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
        R$
      </span>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        value={inputValue}
        onChange={handleChange}
        disabled={disabled}
        placeholder={placeholder}
        className={`${baseClassName} pl-10 ${className}`}
      />
    </div>
  );
}

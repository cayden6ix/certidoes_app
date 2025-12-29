import { useState, useCallback, type ChangeEvent } from 'react';
import { formatCentsForInput, parseInputToCents, formatCentsToBRL } from '@certidoes/shared';

/**
 * Opções para o hook useCurrencyInput
 */
interface UseCurrencyInputOptions {
  /** Valor inicial em centavos */
  initialValueCents?: number | null;
  /** Callback quando o valor em centavos muda */
  onChangeCents?: (cents: number | null) => void;
}

/**
 * Retorno do hook useCurrencyInput
 */
interface UseCurrencyInputReturn {
  /** Valor do input (string para exibição) */
  inputValue: string;
  /** Valor em centavos */
  valueCents: number | null;
  /** Valor formatado em BRL (ex: "R$ 10,50") */
  formattedValue: string;
  /** Handler para mudança no input */
  handleChange: (event: ChangeEvent<HTMLInputElement>) => void;
  /** Define valor a partir de centavos */
  setValueFromCents: (cents: number | null) => void;
  /** Limpa o valor */
  clear: () => void;
}

/**
 * Hook para gerenciar inputs de valor monetário em BRL
 *
 * Armazena internamente o valor em centavos e converte para exibição/input
 *
 * @example
 * const { inputValue, valueCents, handleChange } = useCurrencyInput({
 *   initialValueCents: 1050, // R$ 10,50
 *   onChangeCents: (cents) => console.log('Novo valor:', cents)
 * });
 *
 * <input value={inputValue} onChange={handleChange} />
 */
export function useCurrencyInput(options: UseCurrencyInputOptions = {}): UseCurrencyInputReturn {
  const { initialValueCents, onChangeCents } = options;

  const [inputValue, setInputValue] = useState<string>(formatCentsForInput(initialValueCents));
  const [valueCents, setValueCents] = useState<number | null>(initialValueCents ?? null);

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const rawValue = event.target.value;

      // Permite apenas números, ponto e vírgula
      const sanitized = rawValue.replace(/[^\d.,]/g, '');

      // Atualiza o valor do input
      setInputValue(sanitized);

      // Converte para centavos
      const cents = parseInputToCents(sanitized);
      setValueCents(cents);

      // Notifica mudança
      if (onChangeCents) {
        onChangeCents(cents);
      }
    },
    [onChangeCents],
  );

  const setValueFromCents = useCallback(
    (cents: number | null) => {
      setValueCents(cents);
      setInputValue(formatCentsForInput(cents));

      if (onChangeCents) {
        onChangeCents(cents);
      }
    },
    [onChangeCents],
  );

  const clear = useCallback(() => {
    setInputValue('');
    setValueCents(null);

    if (onChangeCents) {
      onChangeCents(null);
    }
  }, [onChangeCents]);

  return {
    inputValue,
    valueCents,
    formattedValue: formatCentsToBRL(valueCents),
    handleChange,
    setValueFromCents,
    clear,
  };
}

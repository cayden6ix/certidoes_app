import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import type { Certificate } from '../lib/api';

/**
 * Interface do contexto de selecao de certidoes
 */
interface CertificateSelectionContextType {
  /** IDs das certidoes selecionadas */
  selectedIds: Set<string>;
  /** Certidoes selecionadas com dados completos */
  selectedCertificates: Certificate[];
  /** Verifica se uma certidao esta selecionada */
  isSelected: (id: string) => boolean;
  /** Alterna selecao de uma certidao */
  toggleSelection: (certificate: Certificate) => void;
  /** Seleciona multiplas certidoes */
  selectAll: (certificates: Certificate[]) => void;
  /** Limpa todas as selecoes */
  clearSelection: () => void;
  /** Remove uma certidao especifica da selecao */
  removeFromSelection: (id: string) => void;
  /** Quantidade de certidoes selecionadas */
  selectionCount: number;
}

const CertificateSelectionContext = createContext<CertificateSelectionContextType | null>(null);

interface CertificateSelectionProviderProps {
  children: ReactNode;
}

/**
 * Provider para gerenciamento de selecao de certidoes
 * Permite selecionar multiplas certidoes para operacoes em massa
 */
export function CertificateSelectionProvider({
  children,
}: CertificateSelectionProviderProps): JSX.Element {
  const [selectedMap, setSelectedMap] = useState<Map<string, Certificate>>(new Map());

  const selectedIds = useMemo(() => new Set(selectedMap.keys()), [selectedMap]);
  const selectedCertificates = useMemo(() => Array.from(selectedMap.values()), [selectedMap]);

  const isSelected = useCallback((id: string) => selectedMap.has(id), [selectedMap]);

  const toggleSelection = useCallback((certificate: Certificate) => {
    setSelectedMap((prev) => {
      const next = new Map(prev);
      if (next.has(certificate.id)) {
        next.delete(certificate.id);
      } else {
        next.set(certificate.id, certificate);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback((certificates: Certificate[]) => {
    setSelectedMap((prev) => {
      const next = new Map(prev);
      for (const cert of certificates) {
        next.set(cert.id, cert);
      }
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedMap(new Map());
  }, []);

  const removeFromSelection = useCallback((id: string) => {
    setSelectedMap((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      selectedIds,
      selectedCertificates,
      isSelected,
      toggleSelection,
      selectAll,
      clearSelection,
      removeFromSelection,
      selectionCount: selectedMap.size,
    }),
    [
      selectedIds,
      selectedCertificates,
      isSelected,
      toggleSelection,
      selectAll,
      clearSelection,
      removeFromSelection,
      selectedMap.size,
    ],
  );

  return (
    <CertificateSelectionContext.Provider value={value}>
      {children}
    </CertificateSelectionContext.Provider>
  );
}

/**
 * Hook para acessar o contexto de selecao de certidoes
 * Deve ser usado dentro de um CertificateSelectionProvider
 */
export function useCertificateSelection(): CertificateSelectionContextType {
  const context = useContext(CertificateSelectionContext);
  if (!context) {
    throw new Error(
      'useCertificateSelection deve ser usado dentro de um CertificateSelectionProvider',
    );
  }
  return context;
}

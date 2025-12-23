import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';

import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import type { AdminUser, CertificateCatalogType, CertificateTag, PaymentType } from '../lib/api';
import {
  createAdminUser,
  createCertificateTag,
  createCertificateType,
  createPaymentType,
  deleteAdminUser,
  deleteCertificateTag,
  deleteCertificateType,
  deletePaymentType,
  listAdminUsers,
  listCertificateTags,
  listCertificateTypesAdmin,
  listPaymentTypes,
  updateAdminUser,
  updateCertificateTag,
  updateCertificateType,
  updatePaymentType,
} from '../lib/api';

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}): JSX.Element {
  return (
    <div className="rounded-xl bg-white p-6 shadow">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '-';
  const date = new Date(value);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function UsersSection({ token }: { token: string }): JSX.Element {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'client' as AdminUser['role'],
  });

  const fetchUsers = useCallback(async (): Promise<void> => {
    setLoading(true);
    const response = await listAdminUsers(token, { search: search.trim() || undefined });
    if (response.error || !response.data) {
      setError(response.error ?? 'Erro ao carregar usuários');
      setUsers([]);
    } else {
      setError(null);
      setUsers(response.data.data);
    }
    setLoading(false);
  }, [token, search]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const resetForm = (): void => {
    setForm({ fullName: '', email: '', password: '', role: 'client' });
    setEditingId(null);
  };

  const handleSubmit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    if (editingId) {
      const payload: Partial<typeof form> = { ...form };
      if (!payload.password) {
        delete payload.password;
      }
      const response = await updateAdminUser(token, editingId, payload);
      if (response.error) {
        setError(response.error);
      } else {
        await fetchUsers();
        resetForm();
      }
    } else {
      const response = await createAdminUser(token, form);
      if (response.error) {
        setError(response.error);
      } else {
        await fetchUsers();
        resetForm();
      }
    }

    setSaving(false);
  };

  const handleEdit = (user: AdminUser): void => {
    setEditingId(user.id);
    setForm({
      fullName: user.fullName,
      email: user.email,
      password: '',
      role: user.role,
    });
  };

  const handleDelete = async (id: string): Promise<void> => {
    const confirmed = window.confirm('Deseja remover este usuário?');
    if (!confirmed) return;

    const response = await deleteAdminUser(token, id);
    if (response.error) {
      setError(response.error);
      return;
    }

    await fetchUsers();
  };

  return (
    <SectionCard
      title="Usuários"
      description="Listagem e gestão completa de perfis. Filtre por nome ou e-mail."
    >
      <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
            }}
            placeholder="Buscar por nome ou e-mail"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 lg:max-w-sm"
          />
          <button
            onClick={() => fetchUsers().catch(() => {})}
            className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-primary-500"
          >
            Filtrar
          </button>
        </div>
        <div className="flex gap-2">
          {editingId && (
            <button
              onClick={resetForm}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar edição
            </button>
          )}
          <button
            onClick={() => fetchUsers().catch(() => {})}
            className="rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Recarregar
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-gray-200 p-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">
              {editingId ? 'Editar usuário' : 'Criar novo usuário'}
            </h3>
            <p className="text-xs text-gray-500">
              Nome, e-mail e papel. Senha só é necessária ao criar ou trocar acesso.
            </p>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nome completo</label>
              <input
                required
                value={form.fullName}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, fullName: e.target.value }));
                }}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">E-mail</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, email: e.target.value }));
                }}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {editingId ? 'Nova senha (opcional)' : 'Senha'}
                </label>
                <input
                  type="password"
                  required={!editingId}
                  value={form.password}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, password: e.target.value }));
                  }}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Papel</label>
                <select
                  value={form.role}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, role: e.target.value as AdminUser['role'] }));
                  }}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                >
                  <option value="client">Cliente</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? 'Salvando...' : editingId ? 'Atualizar usuário' : 'Criar usuário'}
          </button>
        </form>

        <div className="overflow-x-auto">
          {loading ? (
            <p className="text-sm text-gray-500">Carregando usuários...</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhum usuário encontrado.</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Nome</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">E-mail</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Papel</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Criado em</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-4 py-2 font-medium text-gray-900">{user.fullName}</td>
                    <td className="px-4 py-2 text-gray-700">{user.email}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          user.role === 'admin'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {user.role === 'admin' ? 'Admin' : 'Cliente'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-700">{formatDate(user.createdAt)}</td>
                    <td className="px-4 py-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            handleEdit(user);
                          }}
                          className="text-sm font-medium text-primary-600 hover:text-primary-500"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => void handleDelete(user.id)}
                          className="text-sm font-medium text-red-600 hover:text-red-500"
                        >
                          Remover
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </SectionCard>
  );
}

function PaymentTypesSection({ token }: { token: string }): JSX.Element {
  const [items, setItems] = useState<PaymentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    enabled: true,
  });

  const fetchItems = useCallback(async (): Promise<void> => {
    setLoading(true);
    const response = await listPaymentTypes(token, { search: search.trim() || undefined });
    if (response.error || !response.data) {
      setError(response.error ?? 'Erro ao carregar formas de pagamento');
      setItems([]);
    } else {
      setError(null);
      setItems(response.data.data);
    }
    setLoading(false);
  }, [token, search]);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  const resetForm = (): void => {
    setForm({ name: '', enabled: true });
    setEditingId(null);
  };

  const handleSubmit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    if (editingId) {
      const response = await updatePaymentType(token, editingId, form);
      if (response.error) {
        setError(response.error);
      } else {
        await fetchItems();
        resetForm();
      }
    } else {
      const response = await createPaymentType(token, form);
      if (response.error) {
        setError(response.error);
      } else {
        await fetchItems();
        resetForm();
      }
    }

    setSaving(false);
  };

  const handleEdit = (item: PaymentType): void => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      enabled: item.enabled,
    });
  };

  const handleDelete = async (id: string): Promise<void> => {
    const confirmed = window.confirm('Deseja remover esta forma de pagamento?');
    if (!confirmed) return;

    const response = await deletePaymentType(token, id);
    if (response.error) {
      setError(response.error);
      return;
    }

    await fetchItems();
  };

  return (
    <SectionCard
      title="Formas de pagamento"
      description="Cadastre, habilite ou desabilite tipos de pagamento."
    >
      <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
            }}
            placeholder="Buscar por nome"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 lg:max-w-sm"
          />
          <button
            onClick={() => fetchItems().catch(() => {})}
            className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-primary-500"
          >
            Filtrar
          </button>
        </div>
        <div className="flex gap-2">
          {editingId && (
            <button
              onClick={resetForm}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar edição
            </button>
          )}
          <button
            onClick={() => fetchItems().catch(() => {})}
            className="rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Recarregar
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-gray-200 p-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">
              {editingId ? 'Editar forma de pagamento' : 'Nova forma de pagamento'}
            </h3>
            <p className="text-xs text-gray-500">Defina nome e se está habilitada.</p>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nome</label>
              <input
                required
                value={form.name}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, name: e.target.value }));
                }}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
              />
            </div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, enabled: e.target.checked }));
                }}
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              Habilitada
            </label>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? 'Salvando...' : editingId ? 'Atualizar forma' : 'Criar forma'}
          </button>
        </form>

        <div className="overflow-x-auto">
          {loading ? (
            <p className="text-sm text-gray-500">Carregando formas de pagamento...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhuma forma cadastrada.</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Nome</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Status</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Criado em</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-2 font-medium text-gray-900">{item.name}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          item.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {item.enabled ? 'Habilitada' : 'Desabilitada'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-700">{formatDate(item.createdAt)}</td>
                    <td className="px-4 py-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            handleEdit(item);
                          }}
                          className="text-sm font-medium text-primary-600 hover:text-primary-500"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => void handleDelete(item.id)}
                          className="text-sm font-medium text-red-600 hover:text-red-500"
                        >
                          Remover
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </SectionCard>
  );
}

function CertificateTypesSection({ token }: { token: string }): JSX.Element {
  const [items, setItems] = useState<CertificateCatalogType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    isActive: true,
  });

  const fetchItems = useCallback(async (): Promise<void> => {
    setLoading(true);
    const response = await listCertificateTypesAdmin(token, {
      search: search.trim() || undefined,
    });
    if (response.error || !response.data) {
      setError(response.error ?? 'Erro ao carregar tipos de certidão');
      setItems([]);
    } else {
      setError(null);
      setItems(response.data.data);
    }
    setLoading(false);
  }, [token, search]);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  const resetForm = (): void => {
    setForm({ name: '', isActive: true });
    setEditingId(null);
  };

  const handleSubmit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    if (editingId) {
      const response = await updateCertificateType(token, editingId, form);
      if (response.error) {
        setError(response.error);
      } else {
        await fetchItems();
        resetForm();
      }
    } else {
      const response = await createCertificateType(token, form);
      if (response.error) {
        setError(response.error);
      } else {
        await fetchItems();
        resetForm();
      }
    }

    setSaving(false);
  };

  const handleEdit = (item: CertificateCatalogType): void => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      isActive: item.isActive ?? true,
    });
  };

  const handleDelete = async (id: string): Promise<void> => {
    const confirmed = window.confirm('Deseja remover este tipo de certidão?');
    if (!confirmed) return;

    const response = await deleteCertificateType(token, id);
    if (response.error) {
      setError(response.error);
      return;
    }

    await fetchItems();
  };

  return (
    <SectionCard
      title="Tipos de certidão"
      description="Cadastre e mantenha os tipos de certidões disponíveis."
    >
      <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
            }}
            placeholder="Buscar por nome"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 lg:max-w-sm"
          />
          <button
            onClick={() => fetchItems().catch(() => {})}
            className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-primary-500"
          >
            Filtrar
          </button>
        </div>
        <div className="flex gap-2">
          {editingId && (
            <button
              onClick={resetForm}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar edição
            </button>
          )}
          <button
            onClick={() => fetchItems().catch(() => {})}
            className="rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Recarregar
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-gray-200 p-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">
              {editingId ? 'Editar tipo' : 'Novo tipo de certidão'}
            </h3>
            <p className="text-xs text-gray-500">Nome e status de disponibilidade.</p>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nome</label>
              <input
                required
                value={form.name}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, name: e.target.value }));
                }}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
              />
            </div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, isActive: e.target.checked }));
                }}
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              Ativo
            </label>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? 'Salvando...' : editingId ? 'Atualizar tipo' : 'Criar tipo'}
          </button>
        </form>

        <div className="overflow-x-auto">
          {loading ? (
            <p className="text-sm text-gray-500">Carregando tipos de certidão...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhum tipo cadastrado.</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Nome</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Status</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Criado em</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-2 font-medium text-gray-900">{item.name}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          (item.isActive ?? true)
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {(item.isActive ?? true) ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-700">{formatDate(item.createdAt)}</td>
                    <td className="px-4 py-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            handleEdit(item);
                          }}
                          className="text-sm font-medium text-primary-600 hover:text-primary-500"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => void handleDelete(item.id)}
                          className="text-sm font-medium text-red-600 hover:text-red-500"
                        >
                          Remover
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </SectionCard>
  );
}

function TagsSection({ token }: { token: string }): JSX.Element {
  const [items, setItems] = useState<CertificateTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    color: '#2563eb',
  });

  const fetchItems = useCallback(async (): Promise<void> => {
    setLoading(true);
    const response = await listCertificateTags(token, { search: search.trim() || undefined });
    if (response.error || !response.data) {
      setError(response.error ?? 'Erro ao carregar tags');
      setItems([]);
    } else {
      setError(null);
      setItems(response.data.data);
    }
    setLoading(false);
  }, [token, search]);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  const resetForm = (): void => {
    setForm({ name: '', color: '#2563eb' });
    setEditingId(null);
  };

  const handleSubmit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    if (editingId) {
      const response = await updateCertificateTag(token, editingId, form);
      if (response.error) {
        setError(response.error);
      } else {
        await fetchItems();
        resetForm();
      }
    } else {
      const response = await createCertificateTag(token, form);
      if (response.error) {
        setError(response.error);
      } else {
        await fetchItems();
        resetForm();
      }
    }

    setSaving(false);
  };

  const handleEdit = (item: CertificateTag): void => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      color: item.color ?? '#2563eb',
    });
  };

  const handleDelete = async (id: string): Promise<void> => {
    const confirmed = window.confirm('Deseja remover esta tag?');
    if (!confirmed) return;

    const response = await deleteCertificateTag(token, id);
    if (response.error) {
      setError(response.error);
      return;
    }

    await fetchItems();
  };

  const gradientBg = useMemo(
    () => ({
      background: 'linear-gradient(135deg, #f9fafb 0%, #eef2ff 100%)',
    }),
    [],
  );

  return (
    <SectionCard title="Tags" description="Crie tags coloridas e acompanhe quem criou e quando.">
      <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
            }}
            placeholder="Buscar por nome ou descrição"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 lg:max-w-sm"
          />
          <button
            onClick={() => fetchItems().catch(() => {})}
            className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-primary-500"
          >
            Filtrar
          </button>
        </div>
        <div className="flex gap-2">
          {editingId && (
            <button
              onClick={resetForm}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar edição
            </button>
          )}
          <button
            onClick={() => fetchItems().catch(() => {})}
            className="rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Recarregar
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-lg border border-gray-200 p-4"
          style={gradientBg}
        >
          <div>
            <h3 className="text-sm font-semibold text-gray-800">
              {editingId ? 'Editar tag' : 'Nova tag'}
            </h3>
            <p className="text-xs text-gray-500">Defina nome e escolha uma cor de destaque.</p>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nome</label>
              <input
                required
                value={form.name}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, name: e.target.value }));
                }}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Cor</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, color: e.target.value }));
                  }}
                  className="h-10 w-16 rounded border border-gray-300"
                />
                <span className="text-sm text-gray-600">{form.color}</span>
              </div>
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? 'Salvando...' : editingId ? 'Atualizar tag' : 'Criar tag'}
          </button>
        </form>

        <div className="overflow-x-auto">
          {loading ? (
            <p className="text-sm text-gray-500">Carregando tags...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhuma tag cadastrada.</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Nome</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Cor</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Criada por</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Criada em</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-2 font-medium text-gray-900">{item.name}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block h-4 w-4 rounded-full border border-gray-200"
                          style={{ backgroundColor: item.color ?? '#e5e7eb' }}
                        ></span>
                        <span className="text-gray-700">{item.color ?? '-'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-gray-700">{item.createdBy ?? '-'}</td>
                    <td className="px-4 py-2 text-gray-700">{formatDate(item.createdAt)}</td>
                    <td className="px-4 py-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            handleEdit(item);
                          }}
                          className="text-sm font-medium text-primary-600 hover:text-primary-500"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => void handleDelete(item.id)}
                          className="text-sm font-medium text-red-600 hover:text-red-500"
                        >
                          Remover
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </SectionCard>
  );
}

export function AdminDashboardPage(): JSX.Element {
  const { token, user } = useAuth();

  if (!token) {
    return (
      <Layout>
        <p className="text-sm text-gray-600">Faça login para acessar o painel administrativo.</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-wide text-primary-600">Administração</p>
          <h1 className="text-2xl font-bold text-gray-900">Painel do Admin</h1>
          <p className="text-sm text-gray-600">
            {user?.fullName
              ? `Olá, ${user.fullName}. Gerencie usuários, pagamentos, tipos e tags em um só lugar.`
              : 'Gerencie usuários, pagamentos, tipos e tags.'}
          </p>
        </div>

        <UsersSection token={token} />
        <PaymentTypesSection token={token} />
        <CertificateTypesSection token={token} />
        <TagsSection token={token} />
      </div>
    </Layout>
  );
}

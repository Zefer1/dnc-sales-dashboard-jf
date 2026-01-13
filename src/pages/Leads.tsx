import { CardComponent, CustomTable, StyledH1, StyledP, StyledInput } from '@/components'
import { AuthContext } from '@/contexts/AuthContextValue'
import { pxToRem } from '@/utils'
import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Tooltip } from '@mui/material'
import axios from 'axios'
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

type Lead = {
  id: number
  name: string
  contact: string | null
  source: string | null
  createdAt: string
}

type LeadsResponse = { leads: Lead[] }
type LeadCreateResponse = { lead: Lead }
type LeadUpdateResponse = { lead: Lead }

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}/`,
  headers: { 'Content-Type': 'application/json' },
})

function Leads() {
  const auth = useContext(AuthContext)
  const [searchParams] = useSearchParams()

  const createNameRef = useRef<HTMLInputElement | null>(null)
  const createCardRef = useRef<HTMLDivElement | null>(null)
  const [deepLinkHandled, setDeepLinkHandled] = useState(false)

  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [statusMessage, setStatusMessage] = useState<{ msg: string; type: 'error' | 'success' } | null>(null)

  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [source, setSource] = useState('')

  const [search, setSearch] = useState('')

  const [editOpen, setEditOpen] = useState(false)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [editName, setEditName] = useState('')
  const [editContact, setEditContact] = useState('')
  const [editSource, setEditSource] = useState('')

  const authHeaders = useMemo(() => {
    const token = auth?.token
    return token ? { Authorization: `Bearer ${token}` } : {}
  }, [auth?.token])

  const loadLeads = useCallback(async () => {
    if (!auth?.token) return

    setLoading(true)
    setStatusMessage(null)
    try {
      const response = await api.get<LeadsResponse>('/api/leads', { headers: authHeaders })
      setLeads(response.data.leads)
    } catch {
      setStatusMessage({ msg: 'Falha ao carregar leads', type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [auth?.token, authHeaders])

  useEffect(() => {
    void loadLeads()
  }, [loadLeads])

  useEffect(() => {
    const q = (searchParams.get('q') ?? '').trim()
    if (q) setSearch(q)
  }, [searchParams])

  useEffect(() => {
    if (deepLinkHandled) return

    const focus = (searchParams.get('focus') ?? '').trim()
    if (focus === 'new') {
      setDeepLinkHandled(true)
      setTimeout(() => {
        createCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        createNameRef.current?.focus()
      }, 0)
    }
  }, [deepLinkHandled, searchParams])

  useEffect(() => {
    if (deepLinkHandled) return

    const editParam = (searchParams.get('edit') ?? '').trim()
    const id = Number(editParam)
    if (!editParam || Number.isNaN(id) || !leads.length) return

    const lead = leads.find((l) => l.id === id)
    if (!lead) return

    setDeepLinkHandled(true)
    openEdit(lead)
  }, [deepLinkHandled, leads, searchParams])

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!auth?.token) return

    const trimmedName = name.trim()
    if (!trimmedName) {
      setStatusMessage({ msg: 'Nome é obrigatório', type: 'error' })
      return
    }

    setCreating(true)
    setStatusMessage(null)
    try {
      const response = await api.post<LeadCreateResponse>(
        '/api/leads/create',
        {
          name: trimmedName,
          contact: contact.trim() || undefined,
          source: source.trim() || undefined,
        },
        { headers: authHeaders }
      )

      setLeads((prev) => [response.data.lead, ...prev])
      setName('')
      setContact('')
      setSource('')
      setStatusMessage({ msg: 'Lead criada com sucesso', type: 'success' })
    } catch {
      setStatusMessage({ msg: 'Falha ao criar lead', type: 'error' })
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!auth?.token) return
    setDeletingId(id)
    setStatusMessage(null)
    try {
      await api.delete('/api/leads/delete', {
        headers: authHeaders,
        data: { id },
      })
      setLeads((prev) => prev.filter((l) => l.id !== id))
      setStatusMessage({ msg: 'Lead removida', type: 'success' })
    } catch {
      setStatusMessage({ msg: 'Falha ao remover lead', type: 'error' })
    } finally {
      setDeletingId(null)
    }
  }

  const openEdit = (lead: Lead) => {
    setEditingLead(lead)
    setEditName(lead.name)
    setEditContact(lead.contact ?? '')
    setEditSource(lead.source ?? '')
    setEditOpen(true)
  }

  const closeEdit = () => {
    setEditOpen(false)
    setEditingLead(null)
    setEditName('')
    setEditContact('')
    setEditSource('')
  }

  const handleUpdate = async () => {
    if (!auth?.token) return
    if (!editingLead) return

    const trimmedName = editName.trim()
    if (!trimmedName) {
      setStatusMessage({ msg: 'Nome é obrigatório', type: 'error' })
      return
    }

    setUpdatingId(editingLead.id)
    setStatusMessage(null)
    try {
      const response = await api.put<LeadUpdateResponse>(
        '/api/leads/update',
        {
          id: editingLead.id,
          name: trimmedName,
          contact: editContact.trim() || null,
          source: editSource.trim() || null,
        },
        { headers: authHeaders }
      )

      const updated = response.data.lead
      setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)))
      setStatusMessage({ msg: 'Lead atualizada', type: 'success' })
      closeEdit()
    } catch {
      setStatusMessage({ msg: 'Falha ao atualizar lead', type: 'error' })
    } finally {
      setUpdatingId(null)
    }
  }

  const filteredLeads = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return leads

    return leads.filter((lead) => {
      const nameValue = lead.name.toLowerCase()
      const contactValue = (lead.contact ?? '').toLowerCase()
      const sourceValue = (lead.source ?? '').toLowerCase()
      return nameValue.includes(q) || contactValue.includes(q) || sourceValue.includes(q)
    })
  }, [leads, search])

  const rows = useMemo(() => {
    return filteredLeads.map((lead) => {
      const createdAt = new Date(lead.createdAt)
      const createdAtLabel = Number.isNaN(createdAt.getTime())
        ? lead.createdAt
        : createdAt.toLocaleString()

      return [
        lead.name,
        lead.contact ?? '-',
        lead.source ?? '-',
        createdAtLabel,
        <Box key={lead.id} sx={{ display: 'inline-flex', gap: pxToRem(8), justifyContent: 'flex-end' }}>
          <Tooltip title="Editar lead" arrow>
            <span>
              <Button
                variant="text"
                size="small"
                disabled={deletingId === lead.id || updatingId === lead.id}
                onClick={() => openEdit(lead)}
                aria-label={`Editar lead ${lead.name}`}
              >
                Editar
              </Button>
            </span>
          </Tooltip>
          <Tooltip title="Excluir lead" arrow>
            <span>
              <Button
                variant="text"
                color="error"
                size="small"
                disabled={deletingId === lead.id || updatingId === lead.id}
                onClick={() => void handleDelete(lead.id)}
                aria-label={`Excluir lead ${lead.name}`}
              >
                {deletingId === lead.id ? 'Excluindo…' : 'Excluir'}
              </Button>
            </span>
          </Tooltip>
        </Box>,
      ]
    })
  }, [filteredLeads, deletingId, updatingId])

  return (
    <>
    <Box>
      <StyledH1>Leads</StyledH1>
      <StyledP color="#666">Crie, liste e remova leads (persistidos no banco).</StyledP>
    </Box>

    <Dialog open={editOpen} onClose={closeEdit} fullWidth maxWidth="sm">
      <DialogTitle>Editar Lead</DialogTitle>
      <DialogContent>
        <Box
          sx={{
            display: 'grid',
            gap: pxToRem(12),
            marginTop: pxToRem(8),
          }}
        >
          <StyledInput
            placeholder="Nome"
            value={editName}
            aria-label="Nome"
            onChange={(e) => setEditName(e.target.value)}
          />
          <StyledInput
            placeholder="Contato (opcional)"
            value={editContact}
            aria-label="Contato"
            onChange={(e) => setEditContact(e.target.value)}
          />
          <StyledInput
            placeholder="Origem (opcional)"
            value={editSource}
            aria-label="Origem"
            onChange={(e) => setEditSource(e.target.value)}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={closeEdit} disabled={!!updatingId}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={() => void handleUpdate()}
          disabled={!auth?.token || !editingLead || updatingId === editingLead.id}
        >
          {updatingId && editingLead && updatingId === editingLead.id ? 'Salvando…' : 'Salvar'}
        </Button>
      </DialogActions>
    </Dialog>

    <CardComponent ref={createCardRef}>
      <StyledP weight={600} size={16} lineheight={24}>
        Nova Lead
      </StyledP>
      <Box component="form" onSubmit={handleCreate} sx={{ marginTop: pxToRem(12) }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '2fr 1fr 1fr auto' },
            gap: pxToRem(12),
            alignItems: 'center',
          }}
        >
          <StyledInput
            ref={createNameRef}
            placeholder="Nome"
            value={name}
            aria-label="Nome"
            onChange={(e) => setName(e.target.value)}
          />
          <StyledInput
            placeholder="Contato (opcional)"
            value={contact}
            aria-label="Contato"
            onChange={(e) => setContact(e.target.value)}
          />
          <StyledInput
            placeholder="Origem (opcional)"
            value={source}
            aria-label="Origem"
            onChange={(e) => setSource(e.target.value)}
          />
          <Button variant="contained" type="submit" disabled={creating || !auth?.token}>
            {creating ? 'Criando…' : 'Adicionar'}
          </Button>
        </Box>
      </Box>

      {statusMessage ? (
        <Box
          sx={{
            marginTop: pxToRem(12),
            color: statusMessage.type === 'error' ? 'error.main' : 'success.main',
          }}
        >
          {statusMessage.msg}
        </Box>
      ) : null}
    </CardComponent>

    <CardComponent>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: pxToRem(12),
        }}
      >
        <StyledP weight={600} size={16} lineheight={24}>
          Lista
        </StyledP>
        <Button variant="outlined" onClick={() => void loadLeads()} disabled={loading || !auth?.token}>
          Atualizar
        </Button>
      </Box>

      <Box
        sx={{
          marginTop: pxToRem(12),
          display: 'flex',
          gap: pxToRem(12),
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <Box sx={{ flex: 1, minWidth: pxToRem(240) }}>
          <StyledInput
            placeholder="Buscar (nome, contato, origem)"
            value={search}
            aria-label="Buscar leads"
            onChange={(e) => setSearch(e.target.value)}
          />
        </Box>
        <Tooltip title="Limpar busca" arrow>
          <span>
            <Button variant="text" onClick={() => setSearch('')} disabled={!search.trim()}>
              Limpar
            </Button>
          </span>
        </Tooltip>
        <Box sx={{ color: '#666', fontSize: pxToRem(14) }}>
          {filteredLeads.length} / {leads.length}
        </Box>
      </Box>

      <Box sx={{ marginTop: pxToRem(12) }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', padding: pxToRem(24) }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <CustomTable headers={['Nome', 'Contato', 'Origem', 'Criado em', 'Ações']} rows={rows} />
        )}
      </Box>
    </CardComponent>
    </>
  )
}

export default Leads

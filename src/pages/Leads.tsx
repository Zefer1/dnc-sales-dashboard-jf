import { CardComponent, CustomTable, StyledH1, StyledP, StyledInput } from '@/components'
import { AuthContext } from '@/contexts/AuthContextValue'
import { useToast } from '@/contexts/ToastContext'
import { pxToRem } from '@/utils'
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Tooltip,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
} from '@mui/material'
import axios from 'axios'
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

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

type LeadImportResponse = {
  received: number
  created: number
  skipped: number
}

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}/`,
  headers: { 'Content-Type': 'application/json' },
})

function Leads() {
  const auth = useContext(AuthContext)
  const toast = useToast()
  const [searchParams] = useSearchParams()

  const createNameRef = useRef<HTMLInputElement | null>(null)
  const createCardRef = useRef<HTMLDivElement | null>(null)
  const [deepLinkHandled, setDeepLinkHandled] = useState(false)

  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [source, setSource] = useState('')

  const [search, setSearch] = useState('')

  const [editOpen, setEditOpen] = useState(false)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [editName, setEditName] = useState('')
  const [editContact, setEditContact] = useState('')
  const [editSource, setEditSource] = useState('')

  const [importOpen, setImportOpen] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importMode, setImportMode] = useState<'always_create' | 'skip_exact_duplicates'>('skip_exact_duplicates')
  const [importFile, setImportFile] = useState<File | null>(null)

  const authHeaders = useMemo(() => {
    const token = auth?.token
    return token ? { Authorization: `Bearer ${token}` } : {}
  }, [auth?.token])

  const loadLeads = useCallback(async () => {
    if (!auth?.token) return

    setLoading(true)
    try {
      const response = await api.get<LeadsResponse>('/api/leads', { headers: authHeaders })
      setLeads(response.data.leads)
    } catch {
      toast.showToast('Falha ao carregar leads', 'error')
    } finally {
      setLoading(false)
    }
  }, [auth?.token, authHeaders, toast])

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
      toast.showToast('Nome é obrigatório', 'error')
      return
    }

    setCreating(true)
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
      toast.showToast('Lead criada com sucesso', 'success')
    } catch {
      toast.showToast('Falha ao criar lead', 'error')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!auth?.token) return
    setDeletingId(id)
    try {
      await api.delete('/api/leads/delete', {
        headers: authHeaders,
        data: { id },
      })
      setLeads((prev) => prev.filter((l) => l.id !== id))
      toast.showToast('Lead removida', 'success')
    } catch {
      toast.showToast('Falha ao remover lead', 'error')
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
      toast.showToast('Nome é obrigatório', 'error')
      return
    }

    setUpdatingId(editingLead.id)
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
      toast.showToast('Lead atualizada', 'success')
      closeEdit()
    } catch {
      toast.showToast('Falha ao atualizar lead', 'error')
    } finally {
      setUpdatingId(null)
    }
  }

  const openImport = () => {
    setImportFile(null)
    setImportMode('skip_exact_duplicates')
    setImportOpen(true)
  }

  const closeImport = () => {
    if (importing) return
    setImportOpen(false)
    setImportFile(null)
  }

  const exportCsv = async () => {
    if (!leads.length) {
      toast.showToast('Sem leads para exportar', 'info')
      return
    }

    const rowsToExport = leads.map((l) => ({
      name: l.name,
      contact: l.contact ?? '',
      source: l.source ?? '',
      createdAt: l.createdAt,
    }))
    const csv = Papa.unparse(rowsToExport)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const date = new Date().toISOString().slice(0, 10)
    a.href = url
    a.download = `leads-${date}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.showToast('CSV exportado', 'success')
  }

  const exportExcel = async () => {
    if (!leads.length) {
      toast.showToast('Sem leads para exportar', 'info')
      return
    }

    const rowsToExport = leads.map((l) => ({
      name: l.name,
      contact: l.contact ?? '',
      source: l.source ?? '',
      createdAt: l.createdAt,
    }))

    const sheet = XLSX.utils.json_to_sheet(rowsToExport)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, sheet, 'Leads')
    const date = new Date().toISOString().slice(0, 10)
    XLSX.writeFile(wb, `leads-${date}.xlsx`)
    toast.showToast('Excel exportado', 'success')
  }

  const parseImportedRows = (rows: Array<Record<string, unknown>>) => {
    const findKey = (obj: Record<string, unknown>, candidates: string[]) => {
      const keys = Object.keys(obj)
      const hit = keys.find((k) => candidates.includes(k.trim().toLowerCase()))
      return hit
    }

    const readString = (value: unknown) => {
      if (value === null || value === undefined) return ''
      return String(value).trim()
    }

    const parsed = rows
      .map((row) => {
        const nameKey = findKey(row, ['name', 'nome'])
        const contactKey = findKey(row, ['contact', 'contato'])
        const sourceKey = findKey(row, ['source', 'origem'])

        const nameValue = readString(nameKey ? row[nameKey] : undefined)
        const contactValue = readString(contactKey ? row[contactKey] : undefined)
        const sourceValue = readString(sourceKey ? row[sourceKey] : undefined)

        return {
          name: nameValue,
          contact: contactValue ? contactValue : null,
          source: sourceValue ? sourceValue : null,
        }
      })
      .filter((l) => l.name)

    return parsed
  }

  const importLeads = async () => {
    if (!auth?.token) return
    if (!importFile) {
      toast.showToast('Selecione um arquivo CSV ou XLSX', 'error')
      return
    }

    setImporting(true)
    try {
      let parsedLeads: Array<{ name: string; contact: string | null; source: string | null }> = []

      if (importFile.name.toLowerCase().endsWith('.csv')) {
        const text = await importFile.text()
        const result = Papa.parse<Record<string, unknown>>(text, { header: true, skipEmptyLines: true })
        if (result.errors?.length) {
          throw new Error(result.errors[0]?.message ?? 'Falha ao ler CSV')
        }
        parsedLeads = parseImportedRows(result.data)
      } else if (importFile.name.toLowerCase().endsWith('.xlsx')) {
        const buf = await importFile.arrayBuffer()
        const workbook = XLSX.read(buf)
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })
        parsedLeads = parseImportedRows(rows)
      } else {
        toast.showToast('Formato não suportado. Use .csv ou .xlsx', 'error')
        return
      }

      if (!parsedLeads.length) {
        toast.showToast('Nenhuma lead válida encontrada no arquivo', 'error')
        return
      }

      const response = await api.post<LeadImportResponse>(
        '/api/leads/import',
        { leads: parsedLeads, mode: importMode },
        { headers: authHeaders }
      )

      toast.showToast(
        `Importação concluída: ${response.data.created} criada(s), ${response.data.skipped} ignorada(s)`,
        'success'
      )
      closeImport()
      await loadLeads()
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Falha ao importar leads'
      toast.showToast(message, 'error')
    } finally {
      setImporting(false)
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

    </CardComponent>

    <Dialog open={importOpen} onClose={closeImport} fullWidth maxWidth="sm">
      <DialogTitle>Importar leads</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'grid', gap: pxToRem(12), marginTop: pxToRem(8) }}>
          <Box>
            <input
              type="file"
              accept=".csv,.xlsx"
              onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
              aria-label="Selecionar arquivo para importar"
              disabled={importing}
            />
          </Box>

          <FormControl>
            <StyledP weight={600} size={14} lineheight={20}>
              Modo
            </StyledP>
            <RadioGroup
              value={importMode}
              onChange={(e) => setImportMode(e.target.value as typeof importMode)}
              aria-label="Modo de importação"
            >
              <FormControlLabel
                value="skip_exact_duplicates"
                control={<Radio />}
                label="Ignorar duplicados exatos (nome + contato + origem)"
              />
              <FormControlLabel value="always_create" control={<Radio />} label="Sempre criar" />
            </RadioGroup>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={closeImport} disabled={importing}>
          Cancelar
        </Button>
        <Button variant="contained" onClick={() => void importLeads()} disabled={importing || !importFile}>
          {importing ? 'Importando…' : 'Importar'}
        </Button>
      </DialogActions>
    </Dialog>

    <CardComponent>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: pxToRem(12),
          flexWrap: 'wrap',
        }}
      >
        <StyledP weight={600} size={16} lineheight={24}>
          Lista
        </StyledP>
        <Box sx={{ display: 'inline-flex', gap: pxToRem(8), flexWrap: 'wrap' }}>
          <Tooltip title="Exportar CSV" arrow>
            <span>
              <Button variant="outlined" onClick={() => void exportCsv()} disabled={loading || !auth?.token}>
                Exportar CSV
              </Button>
            </span>
          </Tooltip>
          <Tooltip title="Exportar Excel" arrow>
            <span>
              <Button variant="outlined" onClick={() => void exportExcel()} disabled={loading || !auth?.token}>
                Exportar Excel
              </Button>
            </span>
          </Tooltip>
          <Tooltip title="Importar CSV/XLSX" arrow>
            <span>
              <Button variant="outlined" onClick={openImport} disabled={loading || !auth?.token}>
                Importar
              </Button>
            </span>
          </Tooltip>
          <Button variant="text" onClick={() => void loadLeads()} disabled={loading || !auth?.token}>
            Atualizar
          </Button>
        </Box>
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

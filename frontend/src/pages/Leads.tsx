import { AppTooltip, CardComponent, CustomTable, StyledH1, StyledP, StyledInput } from '@/components'
import { AuthContext } from '@/contexts/AuthContextValue'
import { useToast } from '@/contexts/ToastContext'
import { formatDateTime, pxToRem } from '@/utils'
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
} from '@mui/material'
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { api } from '@/api/client'
import { useTranslation } from 'react-i18next'

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

function Leads() {
  const auth = useContext(AuthContext)
  const toast = useToast()
  const { t } = useTranslation('leads')
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
      toast.showToast(t('messages.loadFail'), 'error')
    } finally {
      setLoading(false)
    }
  }, [auth?.token, authHeaders, toast, t])

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
      toast.showToast(t('messages.nameRequired'), 'error')
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
      toast.showToast(t('messages.createOk'), 'success')
    } catch {
      toast.showToast(t('messages.createFail'), 'error')
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
      toast.showToast(t('messages.deleteOk'), 'success')
    } catch {
      toast.showToast(t('messages.deleteFail'), 'error')
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
      toast.showToast(t('messages.nameRequired'), 'error')
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
      toast.showToast(t('messages.updateOk'), 'success')
      closeEdit()
    } catch {
      toast.showToast(t('messages.updateFail'), 'error')
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
      toast.showToast(t('messages.noLeadsToExport'), 'info')
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
    toast.showToast(t('messages.csvExported'), 'success')
  }

  const exportExcel = async () => {
    if (!leads.length) {
      toast.showToast(t('messages.noLeadsToExport'), 'info')
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
    toast.showToast(t('messages.excelExported'), 'success')
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
      toast.showToast(t('messages.selectFile'), 'error')
      return
    }

    setImporting(true)
    try {
      let parsedLeads: Array<{ name: string; contact: string | null; source: string | null }> = []

      if (importFile.name.toLowerCase().endsWith('.csv')) {
        const text = await importFile.text()
        const result = Papa.parse<Record<string, unknown>>(text, { header: true, skipEmptyLines: true })
        if (result.errors?.length) {
          throw new Error(result.errors[0]?.message ?? t('messages.readCsvFail'))
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
        toast.showToast(t('messages.unsupportedFormat'), 'error')
        return
      }

      if (!parsedLeads.length) {
        toast.showToast(t('messages.noValid'), 'error')
        return
      }

      const response = await api.post<LeadImportResponse>(
        '/api/leads/import',
        { leads: parsedLeads, mode: importMode },
        { headers: authHeaders }
      )

      toast.showToast(
        t('messages.importOk', { created: response.data.created, skipped: response.data.skipped }),
        'success'
      )
      closeImport()
      await loadLeads()
    } catch (e) {
      const message = e instanceof Error ? e.message : t('messages.importFail')
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
      const createdAtLabel = formatDateTime(lead.createdAt)

      return [
        lead.name,
        lead.contact ?? '-',
        lead.source ?? '-',
        createdAtLabel,
        <Box key={lead.id} sx={{ display: 'inline-flex', gap: pxToRem(8), justifyContent: 'flex-end' }}>
          <AppTooltip title={t('tooltips.edit')} arrow>
            <span>
              <Button
                variant="text"
                size="small"
                disabled={deletingId === lead.id || updatingId === lead.id}
                onClick={() => openEdit(lead)}
                aria-label={`${t('tooltips.edit')} ${lead.name}`}
              >
                {t('buttons.edit')}
              </Button>
            </span>
          </AppTooltip>
          <AppTooltip title={t('tooltips.delete')} arrow>
            <span>
              <Button
                variant="text"
                color="error"
                size="small"
                disabled={deletingId === lead.id || updatingId === lead.id}
                onClick={() => void handleDelete(lead.id)}
                aria-label={`${t('tooltips.delete')} ${lead.name}`}
              >
                {deletingId === lead.id ? t('buttons.deleting') : t('buttons.delete')}
              </Button>
            </span>
          </AppTooltip>
        </Box>,
      ]
    })
  }, [filteredLeads, deletingId, updatingId, t])

  const tableHeaders = useMemo(
    () => [t('headers.name'), t('headers.contact'), t('headers.source'), t('headers.createdAt'), t('headers.actions')],
    [t]
  )

  return (
    <>
      <Box>
        <StyledH1>{t('title')}</StyledH1>
        <StyledP color="#666">{t('subtitle')}</StyledP>
      </Box>

      <Dialog open={editOpen} onClose={closeEdit} fullWidth maxWidth="sm">
        <DialogTitle>{t('dialogs.editTitle')}</DialogTitle>
        <DialogContent>
          <Box
            sx={{
              display: 'grid',
              gap: pxToRem(12),
              marginTop: pxToRem(8),
            }}
          >
            <StyledInput
              placeholder={t('placeholders.name')}
              value={editName}
              aria-label={t('placeholders.name')}
              onChange={(e) => setEditName(e.target.value)}
            />
            <StyledInput
              placeholder={t('placeholders.contact')}
              value={editContact}
              aria-label={t('placeholders.contact')}
              onChange={(e) => setEditContact(e.target.value)}
            />
            <StyledInput
              placeholder={t('placeholders.source')}
              value={editSource}
              aria-label={t('placeholders.source')}
              onChange={(e) => setEditSource(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEdit} disabled={!!updatingId}>
            {t('buttons.cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={() => void handleUpdate()}
            disabled={!auth?.token || !editingLead || updatingId === editingLead.id}
          >
            {updatingId && editingLead && updatingId === editingLead.id ? t('buttons.saving') : t('buttons.save')}
          </Button>
        </DialogActions>
      </Dialog>

      <CardComponent ref={createCardRef}>
        <StyledP $weight={600} size={16} $lineheight={24}>
          {t('newLead')}
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
              placeholder={t('placeholders.name')}
              value={name}
              aria-label={t('placeholders.name')}
              onChange={(e) => setName(e.target.value)}
            />
            <StyledInput
              placeholder={t('placeholders.contact')}
              value={contact}
              aria-label={t('placeholders.contact')}
              onChange={(e) => setContact(e.target.value)}
            />
            <StyledInput
              placeholder={t('placeholders.source')}
              value={source}
              aria-label={t('placeholders.source')}
              onChange={(e) => setSource(e.target.value)}
            />
            <Button variant="contained" type="submit" disabled={creating || !auth?.token}>
              {creating ? t('buttons.creating') : t('buttons.add')}
            </Button>
          </Box>
        </Box>
      </CardComponent>

      <Dialog open={importOpen} onClose={closeImport} fullWidth maxWidth="sm">
        <DialogTitle>{t('dialogs.importTitle')}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: pxToRem(12), marginTop: pxToRem(8) }}>
            <Box>
              <input
                type="file"
                accept=".csv,.xlsx"
                onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
                aria-label={t('dialogs.importTitle')}
                disabled={importing}
              />
            </Box>

            <FormControl>
              <StyledP $weight={600} size={14} $lineheight={20}>
                {t('dialogs.mode')}
              </StyledP>
              <RadioGroup
                value={importMode}
                onChange={(e) => setImportMode(e.target.value as typeof importMode)}
                aria-label={t('dialogs.mode')}
              >
                <FormControlLabel
                  value="skip_exact_duplicates"
                  control={<Radio />}
                  label={t('dialogs.skipDup')}
                />
                <FormControlLabel value="always_create" control={<Radio />} label={t('dialogs.alwaysCreate')} />
              </RadioGroup>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeImport} disabled={importing}>
            {t('buttons.cancel')}
          </Button>
          <Button variant="contained" onClick={() => void importLeads()} disabled={importing || !importFile}>
            {importing ? t('buttons.importing') : t('buttons.import')}
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
          <StyledP $weight={600} size={16} $lineheight={24}>
            {t('title')}
          </StyledP>
          <Box sx={{ display: 'inline-flex', gap: pxToRem(8), flexWrap: 'wrap' }}>
            <AppTooltip title={t('tooltips.exportCsv')} arrow>
              <span>
                <Button variant="outlined" onClick={() => void exportCsv()} disabled={loading || !auth?.token}>
                  {t('buttons.exportCsv')}
                </Button>
              </span>
            </AppTooltip>
            <AppTooltip title={t('tooltips.exportExcel')} arrow>
              <span>
                <Button variant="outlined" onClick={() => void exportExcel()} disabled={loading || !auth?.token}>
                  {t('buttons.exportExcel')}
                </Button>
              </span>
            </AppTooltip>
            <AppTooltip title={t('tooltips.import')} arrow>
              <span>
                <Button variant="outlined" onClick={openImport} disabled={loading || !auth?.token}>
                  {t('buttons.import')}
                </Button>
              </span>
            </AppTooltip>
            <Button variant="text" onClick={() => void loadLeads()} disabled={loading || !auth?.token}>
              {t('buttons.refresh')}
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
            placeholder={t('placeholders.search')}
            value={search}
            aria-label={t('placeholders.search')}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Box>
        <AppTooltip title={t('buttons.clearSearch')} arrow>
          <span>
            <Button variant="text" onClick={() => setSearch('')} disabled={!search.trim()}>
              {t('buttons.clearSearch')}
            </Button>
          </span>
        </AppTooltip>
        <Box sx={{ color: '#666', fontSize: pxToRem(14) }}>
          {t('counts.filtered', { filtered: filteredLeads.length, total: leads.length })}
        </Box>
      </Box>

      <Box sx={{ marginTop: pxToRem(12) }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', padding: pxToRem(24) }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <CustomTable headers={tableHeaders} rows={rows} />
        )}
      </Box>
      </CardComponent>
    </>
  )
}

export default Leads

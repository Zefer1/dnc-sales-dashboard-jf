import { CardComponent, CustomTable, StyledH1, StyledP } from '@/components'
import { AuthContext } from '@/contexts/AuthContextValue'
import { useToast } from '@/contexts/ToastContext'
import { pxToRem } from '@/utils'
import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Tooltip } from '@mui/material'
import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '@/api/client'

type AuditEvent = {
  id: number
  createdAt: string
  action: string
  entityType: string
  entityId: number | null
  before: unknown
  after: unknown
  metadata: unknown
}

type AuditResponse = {
  events: AuditEvent[]
}

function Audit() {
  const auth = useContext(AuthContext)
  const toast = useToast()

  const [events, setEvents] = useState<AuditEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null)

  const authHeaders = useMemo(() => {
    const token = auth?.token
    return token ? { Authorization: `Bearer ${token}` } : {}
  }, [auth?.token])

  const loadAudit = useCallback(async () => {
    if (!auth?.token) return

    setLoading(true)
    try {
      const response = await api.get<AuditResponse>('/api/audit?take=100', { headers: authHeaders })
      setEvents(response.data.events)
    } catch {
      toast.showToast('Falha ao carregar auditoria', 'error')
    } finally {
      setLoading(false)
    }
  }, [auth?.token, authHeaders, toast])

  useEffect(() => {
    void loadAudit()
  }, [loadAudit])

  const openDetails = (event: AuditEvent) => {
    setSelectedEvent(event)
    setDetailsOpen(true)
  }

  const closeDetails = () => {
    setDetailsOpen(false)
    setSelectedEvent(null)
  }

  const rows = useMemo(() => {
    return events.map((e) => {
      const dt = new Date(e.createdAt)
      const dateLabel = Number.isNaN(dt.getTime()) ? e.createdAt : dt.toLocaleString()
      const entity = e.entityId ? `${e.entityType} #${e.entityId}` : e.entityType

      return [
        <span key={`date-${e.id}`}>{dateLabel}</span>,
        <span key={`action-${e.id}`}>{e.action}</span>,
        <span key={`entity-${e.id}`}>{entity}</span>,
        <Box key={`actions-${e.id}`} sx={{ display: 'inline-flex', gap: pxToRem(8), justifyContent: 'flex-end' }}>
          <Tooltip title="Ver detalhes" arrow>
            <span>
              <Button variant="text" size="small" onClick={() => openDetails(e)} aria-label={`Ver detalhes ${e.action}`}>
                Detalhes
              </Button>
            </span>
          </Tooltip>
        </Box>,
      ]
    })
  }, [events])

  return (
    <>
      <Box>
        <StyledH1>Auditoria</StyledH1>
        <StyledP color="#666">Histórico de ações (criação/edição/exclusão/importação).</StyledP>
      </Box>

      <CardComponent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: pxToRem(12), flexWrap: 'wrap' }}>
          <StyledP $weight={600} size={16} $lineheight={24}>
            Eventos
          </StyledP>
          <Button variant="outlined" onClick={() => void loadAudit()} disabled={loading || !auth?.token}>
            Atualizar
          </Button>
        </Box>

        <Box sx={{ marginTop: pxToRem(12) }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', padding: pxToRem(24) }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <CustomTable headers={['Quando', 'Ação', 'Entidade', 'Ações']} rows={rows} />
          )}
        </Box>
      </CardComponent>

      <Dialog open={detailsOpen} onClose={closeDetails} fullWidth maxWidth="md">
        <DialogTitle>Detalhes</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: pxToRem(12), marginTop: pxToRem(8) }}>
            <Box>
              <StyledP $weight={600} size={14} $lineheight={20}>
                Evento
              </StyledP>
              <Box style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', fontSize: 12 }}>
                {selectedEvent ? JSON.stringify(selectedEvent, null, 2) : ''}
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDetails}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default Audit

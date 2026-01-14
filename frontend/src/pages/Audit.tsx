import { CardComponent, CustomTable, StyledH1, StyledP } from '@/components'
import { AppTooltip } from '@/components'
import { AuthContext } from '@/contexts/AuthContextValue'
import { useToast } from '@/contexts/ToastContext'
import { formatDateTime, pxToRem } from '@/utils'
import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material'
import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '@/api/client'
import { useTranslation } from 'react-i18next'

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
  const { t } = useTranslation('audit')

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
      toast.showToast(t('messages.loadFail'), 'error')
    } finally {
      setLoading(false)
    }
  }, [auth?.token, authHeaders, toast, t])

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
      const dateLabel = formatDateTime(e.createdAt)
      const entity = e.entityId ? `${e.entityType} #${e.entityId}` : e.entityType

      return [
        <span key={`date-${e.id}`}>{dateLabel}</span>,
        <span key={`action-${e.id}`}>{e.action}</span>,
        <span key={`entity-${e.id}`}>{entity}</span>,
        <Box key={`actions-${e.id}`} sx={{ display: 'inline-flex', gap: pxToRem(8), justifyContent: 'flex-end' }}>
          <AppTooltip title={t('tooltips.viewDetails')} arrow>
            <span>
              <Button
                variant="text"
                size="small"
                onClick={() => openDetails(e)}
                aria-label={`${t('tooltips.viewDetails')} ${e.action}`}
              >
                {t('buttons.details')}
              </Button>
            </span>
          </AppTooltip>
        </Box>,
      ]
    })
  }, [events, t])

  const tableHeaders = useMemo(
    () => [t('headers.when'), t('headers.action'), t('headers.entity'), t('headers.actions')],
    [t]
  )

  return (
    <>
      <Box>
        <StyledH1>{t('title')}</StyledH1>
        <StyledP color="#666">{t('subtitle')}</StyledP>
      </Box>

      <CardComponent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: pxToRem(12), flexWrap: 'wrap' }}>
          <StyledP $weight={600} size={16} $lineheight={24}>
            {t('eventsTitle')}
          </StyledP>
          <Button variant="outlined" onClick={() => void loadAudit()} disabled={loading || !auth?.token}>
            {t('buttons.refresh')}
          </Button>
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

      <Dialog open={detailsOpen} onClose={closeDetails} fullWidth maxWidth="md">
        <DialogTitle>{t('dialog.title')}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: pxToRem(12), marginTop: pxToRem(8) }}>
            <Box>
              <StyledP $weight={600} size={14} $lineheight={20}>
                {t('dialog.eventLabel')}
              </StyledP>
              <Box style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', fontSize: 12 }}>
                {selectedEvent ? JSON.stringify(selectedEvent, null, 2) : ''}
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDetails}>{t('buttons.close')}</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default Audit

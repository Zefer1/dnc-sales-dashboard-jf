import { CardComponent, CustomTable, StyledH1, StyledP } from '@/components'
import { AppTooltip } from '@/components'
import { AuthContext } from '@/contexts/AuthContextValue'
import { useToast } from '@/contexts/ToastContext'
import { formatDateTime, pxToRem } from '@/utils'
import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Collapse } from '@mui/material'
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

type LeadRow = {
  id: number
  name: string
}

type LeadsResponse = {
  leads: LeadRow[]
}

function humanizeConstant(input: string) {
  return input
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function toPrettyJson(value: unknown) {
  if (value === null || value === undefined) return ''
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

function Audit() {
  const auth = useContext(AuthContext)
  const toast = useToast()
  const { t } = useTranslation('audit')

  const [events, setEvents] = useState<AuditEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null)
  const [leadNameById, setLeadNameById] = useState<Record<number, string>>({})
  const [rawOpen, setRawOpen] = useState(false)

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

  const loadLeadsIndex = useCallback(async () => {
    if (!auth?.token) return
    try {
      const response = await api.get<LeadsResponse>('/api/leads', { headers: authHeaders })
      const map: Record<number, string> = {}
      for (const lead of response.data.leads ?? []) {
        map[lead.id] = lead.name
      }
      setLeadNameById(map)
    } catch {
      // Non-blocking: audit view still works without lead names.
    }
  }, [auth?.token, authHeaders])

  useEffect(() => {
    void loadAudit()
  }, [loadAudit])

  useEffect(() => {
    void loadLeadsIndex()
  }, [loadLeadsIndex])

  const getEntityLabel = useCallback(
    (event: AuditEvent) => {
      const entityTypeLabel = t(`entities.${event.entityType}`, { defaultValue: event.entityType })

      if (event.entityType === 'User') {
        const currentUserId = auth?.user?.id
        if (currentUserId && event.entityId && currentUserId === event.entityId) {
          return t('labels.you')
        }
        return event.entityId ? `${entityTypeLabel}` : entityTypeLabel
      }

      if (event.entityType === 'Lead') {
        if (event.entityId) {
          const leadName = leadNameById[event.entityId]
          if (leadName) return leadName
          return `${entityTypeLabel}`
        }
        return entityTypeLabel
      }

      return event.entityId ? `${entityTypeLabel}` : entityTypeLabel
    },
    [auth?.user?.id, leadNameById, t]
  )

  const openDetails = (event: AuditEvent) => {
    setSelectedEvent(event)
    setDetailsOpen(true)
    setRawOpen(false)
  }

  const closeDetails = () => {
    setDetailsOpen(false)
    setSelectedEvent(null)
    setRawOpen(false)
  }

  const rows = useMemo(() => {
    return events.map((e) => {
      const dateLabel = formatDateTime(e.createdAt)
      const actionLabel = t(`actions.${e.action}`, { defaultValue: humanizeConstant(e.action) })
      const entity = getEntityLabel(e)

      return [
        <span key={`date-${e.id}`}>{dateLabel}</span>,
        <span key={`action-${e.id}`}>{actionLabel}</span>,
        <span key={`entity-${e.id}`}>{entity}</span>,
        <Box key={`actions-${e.id}`} sx={{ display: 'inline-flex', gap: pxToRem(8), justifyContent: 'flex-end' }}>
          <AppTooltip title={t('tooltips.viewDetails')} arrow>
            <span>
              <Button
                variant="text"
                size="small"
                onClick={() => openDetails(e)}
                aria-label={`${t('tooltips.viewDetails')} ${actionLabel}`}
              >
                {t('buttons.details')}
              </Button>
            </span>
          </AppTooltip>
        </Box>,
      ]
    })
  }, [events, getEntityLabel, t])

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
          {selectedEvent && (
            <Box sx={{ display: 'grid', gap: pxToRem(12), marginTop: pxToRem(8) }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: pxToRem(12), flexWrap: 'wrap' }}>
                <Box sx={{ display: 'grid', gap: pxToRem(4) }}>
                  <StyledP $weight={600} size={14} $lineheight={20}>
                    {t('dialog.summary')}
                  </StyledP>
                  <StyledP color="#666">
                    {t('headers.when')}: {formatDateTime(selectedEvent.createdAt)}
                  </StyledP>
                  <StyledP color="#666">
                    {t('headers.action')}: {t(`actions.${selectedEvent.action}`, { defaultValue: humanizeConstant(selectedEvent.action) })}
                  </StyledP>
                  <StyledP color="#666">
                    {t('headers.entity')}: {getEntityLabel(selectedEvent)}
                  </StyledP>
                </Box>

                <Box sx={{ display: 'flex', gap: pxToRem(8), alignItems: 'flex-start' }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(toPrettyJson(selectedEvent))
                        toast.showToast(t('messages.copied'), 'success')
                      } catch {
                        toast.showToast(t('messages.copyFail'), 'error')
                      }
                    }}
                  >
                    {t('buttons.copyJson')}
                  </Button>
                </Box>
              </Box>

              <Divider />

              <Box>
                <StyledP $weight={600} size={14} $lineheight={20}>
                  {t('dialog.metadata')}
                </StyledP>
                <Box
                  component="pre"
                  sx={{
                    margin: 0,
                    marginTop: pxToRem(8),
                    padding: pxToRem(12),
                    borderRadius: pxToRem(8),
                    background: 'rgba(0,0,0,0.04)',
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                    fontSize: 12,
                    overflowX: 'auto',
                    whiteSpace: 'pre',
                  }}
                >
                  {toPrettyJson(selectedEvent.metadata) || t('dialog.empty')}
                </Box>
              </Box>

              <Box sx={{ display: 'grid', gap: pxToRem(12) }}>
                <Box>
                  <StyledP $weight={600} size={14} $lineheight={20}>
                    {t('dialog.before')}
                  </StyledP>
                  <Box
                    component="pre"
                    sx={{
                      margin: 0,
                      marginTop: pxToRem(8),
                      padding: pxToRem(12),
                      borderRadius: pxToRem(8),
                      background: 'rgba(0,0,0,0.04)',
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                      fontSize: 12,
                      overflowX: 'auto',
                      whiteSpace: 'pre',
                    }}
                  >
                    {toPrettyJson(selectedEvent.before) || t('dialog.empty')}
                  </Box>
                </Box>

                <Box>
                  <StyledP $weight={600} size={14} $lineheight={20}>
                    {t('dialog.after')}
                  </StyledP>
                  <Box
                    component="pre"
                    sx={{
                      margin: 0,
                      marginTop: pxToRem(8),
                      padding: pxToRem(12),
                      borderRadius: pxToRem(8),
                      background: 'rgba(0,0,0,0.04)',
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                      fontSize: 12,
                      overflowX: 'auto',
                      whiteSpace: 'pre',
                    }}
                  >
                    {toPrettyJson(selectedEvent.after) || t('dialog.empty')}
                  </Box>
                </Box>
              </Box>

              <Divider />

              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: pxToRem(12), flexWrap: 'wrap' }}>
                  <StyledP $weight={600} size={14} $lineheight={20}>
                    {t('dialog.eventLabel')}
                  </StyledP>
                  <Button variant="text" size="small" onClick={() => setRawOpen((v) => !v)}>
                    {rawOpen ? t('buttons.hideRaw') : t('buttons.showRaw')}
                  </Button>
                </Box>

                <Collapse in={rawOpen} timeout={200} unmountOnExit>
                  <Box
                    component="pre"
                    sx={{
                      margin: 0,
                      marginTop: pxToRem(8),
                      padding: pxToRem(12),
                      borderRadius: pxToRem(8),
                      background: 'rgba(0,0,0,0.04)',
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                      fontSize: 12,
                      overflowX: 'auto',
                      whiteSpace: 'pre',
                    }}
                  >
                    {toPrettyJson(selectedEvent)}
                  </Box>
                </Collapse>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDetails}>{t('buttons.close')}</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default Audit

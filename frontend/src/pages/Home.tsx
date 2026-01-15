import { AppTooltip, AvatarsList, CardComponent, CustomChart, CustomTable, StyledH1, StyledP } from '@/components'
import { AuthContext } from '@/contexts/AuthContextValue'
import { pxToRem } from '@/utils'
import { Box, Button, CircularProgress } from '@mui/material'
import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/api/client'
import { useTranslation } from 'react-i18next'
import { usePreferences } from '@/hooks/usePreferences'

type Lead = {
  id: number
  name: string
  contact: string | null
  source: string | null
  createdAt: string
}

type DashboardSummary = {
  stats: {
    totalLeads: number
    leadsThisMonth: number
  }
  recentLeads: Lead[]
  leadsBySource: Array<{ source: string; count: number }>
  leadsByMonth: {
    labels: string[]
    data: number[]
  }
}

function Home() {
  const auth = useContext(AuthContext)
  const navigate = useNavigate()
  const { t } = useTranslation('home')
  const prefs = usePreferences()

  const displayName = auth?.user?.name?.trim()

  const [data, setData] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const authHeaders = useMemo(() => {
    const token = auth?.token
    return token ? { Authorization: `Bearer ${token}` } : {}
  }, [auth?.token])

  const loadSummary = useCallback(async () => {
    if (!auth?.token) return

    setLoading(true)
    setError(null)
    try {
      const response = await api.get<DashboardSummary>('/api/dashboard/summary', { headers: authHeaders })
      setData(response.data)
    } catch {
      setError(t('errors.load'))
    } finally {
      setLoading(false)
    }
  }, [auth?.token, authHeaders, t])

  useEffect(() => {
    void loadSummary()
  }, [loadSummary])

  useEffect(() => {
    if (!prefs.dashboardAutoRefresh) return
    if (!auth?.token) return

    const id = window.setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return
      void loadSummary()
    }, 30_000)

    return () => window.clearInterval(id)
  }, [auth?.token, loadSummary, prefs.dashboardAutoRefresh])

  const leadsByMonthLabels = data?.leadsByMonth?.labels ?? []
  const leadsByMonthData = data?.leadsByMonth?.data ?? []

  const avatarsListData = useMemo(() => {
    const recent = data?.recentLeads ?? []
    if (!recent.length) {
      return [
        {
          avatar: '/urbancrm-avatar.svg',
          name: t('empty.noLead'),
          subtitle: t('empty.noLeadDesc'),
        },
      ]
    }

    return recent.map((lead) => {
      const parts = [
        lead.source ? t('labels.source', { source: lead.source }) : t('labels.noSource'),
        lead.contact ? t('labels.contact', { contact: lead.contact }) : null,
      ]
        .filter(Boolean)
        .join(' • ')

      return {
        avatar: '/urbancrm-avatar.svg',
        name: lead.name,
        subtitle: parts,
      }
    })
  }, [data?.recentLeads, t])

  const translatedTableHeaders = useMemo(
    () => [t('table.name'), t('table.contact'), t('table.source'), t('table.actions')],
    [t]
  )
  const tableRows = useMemo(() => {
    const recent = data?.recentLeads ?? []
    if (!recent.length) {
      return [[<span key="name">-</span>, <span key="contact">-</span>, <span key="source">-</span>, <span key="actions">-</span>]]
    }

    return recent.map((lead) => {
      return [
        <span key={`name-${lead.id}`}>{lead.name}</span>,
        <span key={`contact-${lead.id}`}>{lead.contact ?? '-'}</span>,
        <span key={`source-${lead.id}`}>{lead.source ?? '-'}</span>,
        <Box key={`actions-${lead.id}`} sx={{ display: 'inline-flex', gap: pxToRem(8), justifyContent: 'flex-end' }}>
          <AppTooltip title={t('table.edit')} arrow>
            <span>
              <Button
                variant="text"
                size="small"
                onClick={() => navigate(`/leads?edit=${lead.id}`)}
                aria-label={`Editar lead ${lead.name}`}
              >
                {t('actions.edit')}
              </Button>
            </span>
          </AppTooltip>
          <AppTooltip title={t('table.view')} arrow>
            <span>
              <Button
                variant="text"
                size="small"
                onClick={() => navigate(`/leads?q=${encodeURIComponent(lead.name)}`)}
                aria-label={`Ver lead ${lead.name} no Leads`}
              >
                {t('actions.view')}
              </Button>
            </span>
          </AppTooltip>
        </Box>,
      ]
    })
  }, [data?.recentLeads, navigate, t])


  return (
    <>
      <StyledH1>{t('title')}</StyledH1>

      <Box sx={{ marginTop: pxToRem(4), marginBottom: pxToRem(16) }}>
        <StyledP color="#666">{displayName ? t('greeting', { name: displayName }) : t('greetingDefault')}</StyledP>
      </Box>

      <CardComponent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: pxToRem(12), flexWrap: 'wrap' }}>
          <Box>
            <StyledP $weight={700} size={18} $lineheight={24}>
              {t('overview.title')}
            </StyledP>
            <StyledP color="#666">
              {t('overview.subtitle')}
            </StyledP>
          </Box>
          <Box sx={{ display: 'inline-flex', gap: pxToRem(8), flexWrap: 'wrap' }}>
            <Button variant="contained" onClick={() => navigate('/leads?focus=new')} aria-label={t('buttons.addLead')}>
              {t('buttons.addLead')}
            </Button>
            <Button variant="outlined" onClick={() => navigate('/leads')} aria-label={t('buttons.viewLeads')}>
              {t('buttons.viewLeads')}
            </Button>
            <Button variant="text" onClick={() => void loadSummary()} disabled={loading} aria-label={t('buttons.refresh')}>
              {t('buttons.refresh')}
            </Button>
          </Box>
        </Box>

        <Box sx={{ marginTop: pxToRem(16) }}>
          {loading && !data ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', padding: pxToRem(12) }}>
              <CircularProgress size={24} />
            </Box>
          ) : error ? (
            <Box sx={{ color: 'error.main' }}>{error}</Box>
          ) : (
            <Box sx={{ display: 'flex', gap: pxToRem(16), flexWrap: 'wrap' }}>
              <Box sx={{ minWidth: pxToRem(220) }}>
                <StyledP $weight={600} size={14} $lineheight={20} color="#666">
                  {t('overview.total')}
                </StyledP>
                <StyledP $weight={700} size={24} $lineheight={32}>
                  {data?.stats ? data.stats.totalLeads : 0}
                </StyledP>
              </Box>
              <Box sx={{ minWidth: pxToRem(220) }}>
                <StyledP $weight={600} size={14} $lineheight={20} color="#666">
                  {t('overview.thisMonth')}
                </StyledP>
                <StyledP $weight={700} size={24} $lineheight={32}>
                  {data?.stats ? data.stats.leadsThisMonth : 0}
                </StyledP>
              </Box>
            </Box>
          )}
        </Box>
      </CardComponent>

      <CardComponent>
        <StyledP $weight={600} size={16} $lineheight={24}>
          {t('sections.recent')}
        </StyledP>
        <Box sx={{ marginTop: pxToRem(8) }}>
          <AvatarsList listData={avatarsListData} />
        </Box>
      </CardComponent>

      <CardComponent>
        <StyledP $weight={600} size={16} $lineheight={24}>
          {t('sections.latest')}
        </StyledP>
        <Box sx={{ marginTop: pxToRem(12) }}>
          <CustomTable headers={translatedTableHeaders} rows={tableRows} />
        </Box>
      </CardComponent>

      <CardComponent>
        <StyledP $weight={600} size={16} $lineheight={24}>
          {t('sections.byMonth')}
        </StyledP>
        <Box sx={{ marginTop: pxToRem(12) }}>
          <CustomChart labels={leadsByMonthLabels} data={leadsByMonthData} type="bar" />
        </Box>
      </CardComponent>
    </>
  )
}

export default Home

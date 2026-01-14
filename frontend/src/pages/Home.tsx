import { AvatarsList, CardComponent, CustomChart, CustomTable, StyledH1, StyledP } from '@/components'
import { AuthContext } from '@/contexts/AuthContextValue'
import { pxToRem } from '@/utils'
import { Box, Button, CircularProgress, Tooltip } from '@mui/material'
import axios from 'axios'
import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

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

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}/`,
  headers: { 'Content-Type': 'application/json' },
})

function Home() {
  const auth = useContext(AuthContext)
  const navigate = useNavigate()

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
      setError('Falha ao carregar dados do dashboard')
    } finally {
      setLoading(false)
    }
  }, [auth?.token, authHeaders])

  useEffect(() => {
    void loadSummary()
  }, [loadSummary])

  const avatarsListData = useMemo(() => {
    const recent = data?.recentLeads ?? []
    if (!recent.length) {
      return [
        {
          avatar: '/urbancrm-avatar.svg',
          name: 'Nenhuma lead ainda',
          subtitle: 'Crie sua primeira lead para ver dados aqui',
        },
      ]
    }

    return recent.map((lead) => {
      const parts = [lead.source ? `Origem: ${lead.source}` : 'Sem origem', lead.contact ? `Contato: ${lead.contact}` : null]
        .filter(Boolean)
        .join(' • ')

      return {
        avatar: '/urbancrm-avatar.svg',
        name: lead.name,
        subtitle: parts,
      }
    })
  }, [data?.recentLeads])

  const tableHeaders = ['Nome', 'Contato', 'Origem', 'Ações']
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
          <Tooltip title="Editar no Leads" arrow>
            <span>
              <Button
                variant="text"
                size="small"
                onClick={() => navigate(`/leads?edit=${lead.id}`)}
                aria-label={`Editar lead ${lead.name}`}
              >
                Editar
              </Button>
            </span>
          </Tooltip>
          <Tooltip title="Ver lista de leads" arrow>
            <span>
              <Button
                variant="text"
                size="small"
                onClick={() => navigate(`/leads?q=${encodeURIComponent(lead.name)}`)}
                aria-label={`Ver lead ${lead.name} no Leads`}
              >
                Ver
              </Button>
            </span>
          </Tooltip>
        </Box>,
      ]
    })
  }, [data?.recentLeads, navigate])


  return (
    <>
      <StyledH1>Home</StyledH1>

      <CardComponent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: pxToRem(12), flexWrap: 'wrap' }}>
          <Box>
            <StyledP weight={700} size={18} lineheight={24}>
              Visão geral
            </StyledP>
            <StyledP color="#666">
              Leads do seu usuário
            </StyledP>
          </Box>
          <Box sx={{ display: 'inline-flex', gap: pxToRem(8), flexWrap: 'wrap' }}>
            <Button variant="contained" onClick={() => navigate('/leads?focus=new')} aria-label="Adicionar lead">
              Adicionar lead
            </Button>
            <Button variant="outlined" onClick={() => navigate('/leads')} aria-label="Ir para Leads">
              Ver leads
            </Button>
            <Button variant="text" onClick={() => void loadSummary()} disabled={loading} aria-label="Atualizar dashboard">
              Atualizar
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
                <StyledP weight={600} size={14} lineheight={20} color="#666">
                  Total de leads
                </StyledP>
                <StyledP weight={700} size={24} lineheight={32}>
                  {data?.stats.totalLeads ?? 0}
                </StyledP>
              </Box>
              <Box sx={{ minWidth: pxToRem(220) }}>
                <StyledP weight={600} size={14} lineheight={20} color="#666">
                  Leads neste mês
                </StyledP>
                <StyledP weight={700} size={24} lineheight={32}>
                  {data?.stats.leadsThisMonth ?? 0}
                </StyledP>
              </Box>
            </Box>
          )}
        </Box>
      </CardComponent>

      <CardComponent>
        <StyledP weight={600} size={16} lineheight={24}>
          Recentes
        </StyledP>
        <Box sx={{ marginTop: pxToRem(8) }}>
          <AvatarsList listData={avatarsListData} />
        </Box>
      </CardComponent>

      <CardComponent>
        <StyledP weight={600} size={16} lineheight={24}>
          Últimas leads
        </StyledP>
        <Box sx={{ marginTop: pxToRem(12) }}>
          <CustomTable headers={tableHeaders} rows={tableRows} />
        </Box>
      </CardComponent>

      <CardComponent>
        <StyledP weight={600} size={16} lineheight={24}>
          Leads por mês
        </StyledP>
        <Box sx={{ marginTop: pxToRem(12) }}>
          <CustomChart labels={data?.leadsByMonth.labels ?? []} data={data?.leadsByMonth.data ?? []} type="bar" />
        </Box>
      </CardComponent>
    </>
  )
}

export default Home

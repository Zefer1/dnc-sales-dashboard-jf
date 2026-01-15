import styled from 'styled-components'
import { Link, NavLink } from 'react-router-dom'
import { AppTooltip, Logo, StyledButton } from '@/components'
import { Avatar, Box, Button, Container, Menu, MenuItem, Switch, useMediaQuery } from '@mui/material'
import { pxToRem } from '@/utils'
import { useContext, useMemo, useState } from 'react'
import { AuthContext } from '@/contexts/AuthContextValue'
import { AppThemeContext } from '@/contexts/AppThemeContext'
import { useTranslation } from 'react-i18next'

const StyledHeader = styled.header`
	background-color: ${(props) => props.theme.appBackground};
	border-bottom: ${pxToRem(1)} solid ${(props) => props.theme.appDefaultStroke};
	margin-bottom: ${pxToRem(37)};
	width: 100%;
`;

const Nav = styled.nav`
	display: flex;
	align-items: center;
	gap: ${pxToRem(16)};
	flex-wrap: wrap;
	justify-content: flex-end;
`;

const NavItem = styled(NavLink)`
	color: inherit;
	text-decoration: none;
	font-weight: 500;
	padding: ${pxToRem(8)} ${pxToRem(10)};
	border-radius: ${pxToRem(8)};
	transition: background-color 0.2s;

	&.active {
		background: ${(props) => props.theme.textInput.disabled};
	}

	&:focus-visible {
		outline: 2px solid ${(props) => props.theme.buttons.primary};
		outline-offset: 2px;
	}
`;

function Header() {
	const auth = useContext(AuthContext)
	const theme = useContext(AppThemeContext)
	const { t } = useTranslation('common')
	const isAuthed = Boolean(auth?.token)
	const isMobile = useMediaQuery('(max-width:600px)')
	const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null)
	const menuOpen = Boolean(menuAnchorEl)

	const themeLabel = useMemo(() => {
		return theme?.appTheme === 'dark' ? t('theme.dark') : t('theme.light')
	}, [theme?.appTheme, t])

	const openMenu = (event: React.MouseEvent<HTMLElement>) => setMenuAnchorEl(event.currentTarget)
	const closeMenu = () => setMenuAnchorEl(null)
	const logoutAndClose = () => {
		auth?.logout()
		closeMenu()
	}

	return (
		<StyledHeader>
			<Container maxWidth="lg">
				<Box
					sx={{
						alignItems: 'center',
						display: 'flex',
						justifyContent: 'space-between',
						height: pxToRem(64),
						gap: pxToRem(12),
					}}
				>
					<Link to={isAuthed ? '/home' : '/'} aria-label="Ir para página inicial">
						<Logo height={44} width={120} />
					</Link>

					{isMobile ? (
						<>
							<Button variant="text" onClick={openMenu} aria-label={t('nav.menu')}>
								{t('nav.menu')}
							</Button>
							<Menu
								anchorEl={menuAnchorEl}
								open={menuOpen}
								onClose={closeMenu}
								anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
								transformOrigin={{ vertical: 'top', horizontal: 'right' }}
							>
								{isAuthed ? (
									<>
										<MenuItem component={Link} to="/home" onClick={closeMenu}>
											{t('nav.home')}
										</MenuItem>
										<MenuItem component={Link} to="/leads" onClick={closeMenu}>
											{t('nav.leads')}
										</MenuItem>
										<MenuItem component={Link} to="/audit" onClick={closeMenu}>
											{t('nav.audit')}
										</MenuItem>
										<MenuItem component={Link} to="/settings" onClick={closeMenu}>
											{t('nav.settings')}
										</MenuItem>
										<MenuItem onClick={logoutAndClose}>{t('nav.logout')}</MenuItem>
									</>
								) : (
									<>
										<MenuItem component={Link} to="/" onClick={closeMenu}>
											{t('nav.start')}
										</MenuItem>
										<MenuItem component={Link} to="/login" onClick={closeMenu}>
											{t('nav.login')}
										</MenuItem>
										<MenuItem component={Link} to="/cadastro" onClick={closeMenu}>
											{t('nav.register')}
										</MenuItem>
									</>
								)}

								<MenuItem disableRipple>
									<Box sx={{ display: 'flex', alignItems: 'center', gap: pxToRem(12), width: '100%' }}>
										<Box sx={{ flex: 1 }}>{themeLabel}</Box>
										<Switch
											checked={theme?.appTheme === 'dark'}
											onChange={() => theme?.toggleTheme()}
											inputProps={{ 'aria-label': t('theme.toggle') }}
										/>
									</Box>
								</MenuItem>
							</Menu>
						</>
					) : (
						<Nav>
							{isAuthed ? (
								<>
									<NavItem to="/home">{t('nav.home')}</NavItem>
									<NavItem to="/leads">{t('nav.leads')}</NavItem>
									<NavItem to="/audit">{t('nav.audit')}</NavItem>
									<NavItem to="/settings">{t('nav.settings')}</NavItem>

									<AppTooltip title={t('theme.toggle')} arrow>
										<Button
											variant="text"
											onClick={() => theme?.toggleTheme()}
											aria-label={t('theme.toggle')}
											size="small"
										>
											{theme?.appTheme === 'dark' ? t('theme.dark') : t('theme.light')}
										</Button>
									</AppTooltip>

									<StyledButton
										className="borderless-alert inline"
										type="button"
										onClick={() => auth?.logout()}
										aria-label={t('nav.logout')}
									>
										{t('nav.logout')}
									</StyledButton>

									<Link to="/settings" aria-label="Abrir settings">
										<Avatar
											alt="UrbanCRM Avatar"
											src="/urbancrm-avatar.svg"
											sx={{ width: pxToRem(40), height: pxToRem(40) }}
										/>
									</Link>
								</>
							) : (
								<>
									<NavItem to="/">{t('nav.start')}</NavItem>

									<AppTooltip title={t('theme.toggle')} arrow>
										<Button
											variant="text"
											onClick={() => theme?.toggleTheme()}
											aria-label={t('theme.toggle')}
											size="small"
										>
											{theme?.appTheme === 'dark' ? t('theme.dark') : t('theme.light')}
										</Button>
									</AppTooltip>

									<Link to="/login" style={{ textDecoration: 'none' }}>
										<StyledButton className="primary inline" type="button">
											{t('nav.login')}
										</StyledButton>
									</Link>
									<Link to="/cadastro" style={{ textDecoration: 'none' }}>
										<StyledButton className="primary inline" type="button">
											{t('nav.register')}
										</StyledButton>
									</Link>
								</>
							)}
						</Nav>
					)}
				</Box>
			</Container>
		</StyledHeader>
	);
}

export default Header;
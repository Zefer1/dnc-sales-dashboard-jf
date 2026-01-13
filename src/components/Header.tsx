import styled from 'styled-components'
import { Link, NavLink } from 'react-router-dom'
import { Logo, StyledButton } from '@/components'
import { Avatar, Box, Button, Container, Menu, MenuItem, Switch, Tooltip, useMediaQuery } from '@mui/material'
import { pxToRem } from '@/utils'
import { useContext, useMemo, useState } from 'react'
import { AuthContext } from '@/contexts/AuthContextValue'
import { AppThemeContext } from '@/contexts/AppThemeContext'


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
	const isAuthed = Boolean(auth?.token)
	const isMobile = useMediaQuery('(max-width:600px)')
	const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null)
	const menuOpen = Boolean(menuAnchorEl)

	const themeLabel = useMemo(() => {
		return theme?.appTheme === 'dark' ? 'Tema escuro' : 'Tema claro'
	}, [theme?.appTheme])

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
						<Logo height={30} width={73} />
					</Link>

					{isMobile ? (
						<>
							<Button
								variant="text"
								onClick={openMenu}
								aria-label="Abrir menu"
							>
								Menu
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
											Home
										</MenuItem>
										<MenuItem component={Link} to="/leads" onClick={closeMenu}>
											Leads
										</MenuItem>
										<MenuItem component={Link} to="/audit" onClick={closeMenu}>
											Auditoria
										</MenuItem>
										<MenuItem component={Link} to="/perfil" onClick={closeMenu}>
											Perfil
										</MenuItem>
										<MenuItem onClick={logoutAndClose}>
											Sair
										</MenuItem>
									</>
								) : (
									<>
										<MenuItem component={Link} to="/" onClick={closeMenu}>
											Início
										</MenuItem>
										<MenuItem component={Link} to="/login" onClick={closeMenu}>
											Login
										</MenuItem>
										<MenuItem component={Link} to="/cadastro" onClick={closeMenu}>
											Criar conta
										</MenuItem>
									</>
								)}

								<MenuItem disableRipple>
									<Box sx={{ display: 'flex', alignItems: 'center', gap: pxToRem(12), width: '100%' }}>
										<Box sx={{ flex: 1 }}>{themeLabel}</Box>
										<Switch
											checked={theme?.appTheme === 'dark'}
											onChange={() => theme?.toggleTheme()}
											inputProps={{ 'aria-label': 'Alternar tema' }}
										/>
									</Box>
								</MenuItem>
							</Menu>
						</>
					) : (
						<Nav>
							{isAuthed ? (
								<>
									<NavItem to="/home">Home</NavItem>
									<NavItem to="/leads">Leads</NavItem>
									<NavItem to="/audit">Auditoria</NavItem>
									<NavItem to="/perfil">Perfil</NavItem>

									<Tooltip title="Alternar tema" arrow>
										<Button
											variant="text"
											onClick={() => theme?.toggleTheme()}
											aria-label="Alternar tema"
											size="small"
										>
											{theme?.appTheme === 'dark' ? 'Escuro' : 'Claro'}
										</Button>
									</Tooltip>

									<StyledButton
										className="borderless-alert inline"
										type="button"
										onClick={() => auth?.logout()}
										aria-label="Sair"
									>
										Sair
									</StyledButton>

									<Link to="/perfil" aria-label="Abrir perfil">
										<Avatar
											alt="UrbanCRM Avatar"
											src="/urbancrm-avatar.svg"
											sx={{ width: pxToRem(40), height: pxToRem(40) }}
										/>
									</Link>
								</>
							) : (
								<>
									<NavItem to="/">Início</NavItem>

									<Tooltip title="Alternar tema" arrow>
										<Button
											variant="text"
											onClick={() => theme?.toggleTheme()}
											aria-label="Alternar tema"
											size="small"
										>
											{theme?.appTheme === 'dark' ? 'Escuro' : 'Claro'}
										</Button>
									</Tooltip>

									<Link to="/login" style={{ textDecoration: 'none' }}>
										<StyledButton className="primary inline" type="button">
											Login
										</StyledButton>
									</Link>
									<Link to="/cadastro" style={{ textDecoration: 'none' }}>
										<StyledButton className="primary inline" type="button">
											Criar conta
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
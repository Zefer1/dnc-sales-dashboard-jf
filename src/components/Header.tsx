import styled from 'styled-components'
import { Link, NavLink } from 'react-router-dom'
import { Logo, StyledButton } from '@/components'
import { Avatar, Box, Container } from '@mui/material'
import { pxToRem } from '@/utils'
import { useContext } from 'react'
import { AuthContext } from '@/contexts/AuthContextValue'


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
`;

const NavItem = styled(NavLink)`
	color: inherit;
	text-decoration: none;
	font-weight: 500;
	padding: ${pxToRem(8)} ${pxToRem(10)};
	border-radius: ${pxToRem(8)};

	&.active {
		background: ${(props) => props.theme.textInput.disabled};
	}
`;


function Header() {
	const auth = useContext(AuthContext)
	const isAuthed = Boolean(auth?.token)

	return (
		<StyledHeader>
			<Container maxWidth="lg">
				<Box
					sx={{
						alignItems: 'center',
						display: 'flex',
						justifyContent: 'space-between',
						height: pxToRem(64),
					}}
				>
					<Link to={isAuthed ? '/home' : '/'}>
						<Logo height={30} width={73} />
					</Link>

					<Nav>
						{isAuthed ? (
							<>
								<NavItem to="/home">Home</NavItem>
								<NavItem to="/leads">Leads</NavItem>
								<NavItem to="/perfil">Perfil</NavItem>
								<button
									type="button"
									onClick={() => auth?.logout()}
									style={{ all: 'unset' }}
								>
									<StyledButton className="borderless-alert" type="button">
										Sair
									</StyledButton>
								</button>
								<Link to="/perfil">
									<Avatar
										alt="DNC Avatar"
										src="/dnc-avatar.svg"
										sx={{ width: pxToRem(40), height: pxToRem(40) }}
									/>
								</Link>
							</>
						) : (
							<>
								<NavItem to="/">Início</NavItem>
								<Link to="/login" style={{ textDecoration: 'none' }}>
									<StyledButton className="primary" type="button">
										Login
									</StyledButton>
								</Link>
								<Link to="/cadastro" style={{ textDecoration: 'none' }}>
									<StyledButton className="primary" type="button">
										Criar conta
									</StyledButton>
								</Link>
							</>
						)}
					</Nav>
				</Box>
			</Container>
		</StyledHeader>
	);
}

export default Header;
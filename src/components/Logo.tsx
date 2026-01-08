import styled from 'styled-components';
import { pxToRem } from '@/utils';

export const Logo = styled.figure<{ height: number; width: number }>`
	display: block;
	margin: 0;
	background-image: url(/${(props) => props.theme.appLogo});
	background-repeat: no-repeat;
	background-position: center;
	background-size: contain;
	height: ${(props) => pxToRem(props.height)};
	width: ${(props) => pxToRem(props.width)};
`;

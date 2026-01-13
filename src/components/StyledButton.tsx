import styled from 'styled-components';
import { ButtonProps } from '@/types';
import { pxToRem } from '@/utils';

export const StyledButton = styled.button<ButtonProps>`
    border-radius: ${pxToRem(8)};
    border: none;
    box-sizing: border-box;
    cursor: pointer;
    font-size: ${pxToRem(16)};
    font-weight: bold;
    height: ${pxToRem(50)};
    padding: 0 ${pxToRem(16)};
    transition: background-color 0.2s, color 0.2s, transform 0.12s, box-shadow 0.12s;
    width: 100%;

    &:focus-visible {
        outline: 2px solid ${(props) => props.theme.buttons.primary};
        outline-offset: 2px;
    }

    &:hover:not(:disabled) {
        transform: translateY(-1px);
    }

    &:active:not(:disabled) {
        transform: translateY(0);
    }

    &.inline {
        height: ${pxToRem(40)};
        padding: 0 ${pxToRem(12)};
        width: auto;
        font-size: ${pxToRem(14)};
    }

    &.primary {
        background-color: ${(props) => props.theme.buttons.primary};
        color: ${(props) => props.theme.buttons.primaryColor};
        &:hover {
            background-color: ${(props) => props.theme.buttons.primaryHover};
        }
    }

    &.alert {
        background-color: ${(props) => props.theme.buttons.alert};
        color: ${(props) => props.theme.buttons.alertColor};
        &:hover {
            background-color: ${(props) => props.theme.buttons.alertHover};
        }
    }

    &.borderless-alert {
        background-color: transparent;
        color: ${(props) => props.theme.buttons.alert};
        height: auto;
        padding: 0;
        &:hover {
            color: ${(props) => props.theme.buttons.alertHover};
        }
    }

    &:disabled {
        background-color: ${(props) => props.theme.buttons.disabled};
        color: ${(props) => props.theme.buttons.disabledColor};
        cursor: not-allowed;
        &:hover {
            background-color: ${(props) => props.theme.buttons.disabled};
            color: ${(props) => props.theme.buttons.disabledColor};
        }
    }
`;

import { createGlobalStyle } from 'styled-components'
import { DefaultTheme } from 'styled-components'

export const GlobalStyle = createGlobalStyle<{ theme?: DefaultTheme }>`
  body, html {
    background: ${(props) => props.theme.appBackground};
    color: ${(props) => props.theme.appColor};
    margin: 0;
    padding: 0;
    font-family: "Inter", sans-serif;
  }

  * {
    box-sizing: border-box;
  }

  a {
    color: inherit;
  }

  :focus-visible {
    outline: 2px solid ${(props) => props.theme.buttons.primary};
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
  h1, h2, p, ul, li figure {
    margin: 0;
    padding: 0;
  }
`

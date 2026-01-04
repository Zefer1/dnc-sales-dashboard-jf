import { createGlobalStyle } from 'styled-components'
import type { DefaultTheme } from 'styled-components'

declare module 'styled-components' {
  export interface DefaultTheme {
    appBackground: string
    appColor: string
  }
}

export const GlobalStyle = createGlobalStyle<{ theme?: DefaultTheme }>`
  body, html {
    background: ${(props) => props.theme.appBackground};
    color: ${(props) => props.theme.appColor};
    margin: 0;
    padding: 0;
    font-family: "Inter", sans-serif;
  }
  h1, h2, p, ul, li {
    margin: 0;
    padding: 0;
  }
`

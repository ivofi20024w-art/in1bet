import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class WebGLErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("WebGL Error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div
            style={{
              width: "100vw",
              height: "100vh",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "radial-gradient(circle at top, #3b2a1a, #120a05)",
              color: "gold",
              fontFamily: "monospace",
              textAlign: "center",
              padding: "20px",
            }}
          >
            <h1 style={{ fontSize: "48px", marginBottom: "20px" }}>
              Plinko Cassino Retro 3D
            </h1>
            <p style={{ fontSize: "24px", marginBottom: "30px", color: "#ffaa00" }}>
              WebGL nao disponivel neste navegador
            </p>
            <p style={{ fontSize: "18px", maxWidth: "600px", lineHeight: "1.6" }}>
              Este jogo requer WebGL para renderizacao 3D. Por favor, use um
              navegador moderno com suporte a WebGL habilitado (Chrome, Firefox,
              Edge, Safari).
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: "30px",
                padding: "15px 30px",
                fontSize: "18px",
                background: "linear-gradient(#d4af37, #8c5c1c)",
                border: "2px solid #3a2008",
                borderRadius: "8px",
                color: "black",
                fontWeight: "bold",
                cursor: "pointer",
                fontFamily: "monospace",
              }}
            >
              TENTAR NOVAMENTE
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

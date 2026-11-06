import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Copy, Check } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    copied: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary capturó un error no controlado:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleGoHome = () => {
    try {
      localStorage.removeItem('cmj_flandes_session_token');
    } catch {
      // Ignore
    }
    window.location.href = '/';
  };

  private handleCopyReport = () => {
    const report = [
      `CONSEJO MUNICIPAL DE JUVENTUD FLANDES — REPORTE DE ERROR TÉCNICO`,
      `Fecha: ${new Date().toISOString()}`,
      `URL: ${window.location.href}`,
      `Navegador: ${navigator.userAgent}`,
      `Error: ${this.state.error?.name || 'Error'}: ${this.state.error?.message || 'Sin mensaje'}`,
      `Stack: ${this.state.error?.stack || 'No disponible'}`,
      `ComponentStack: ${this.state.errorInfo?.componentStack || 'No disponible'}`,
    ].join('\n\n');

    navigator.clipboard.writeText(report).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 3000);
    });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-stone-50 dark:bg-[#0f1115] text-stone-900 dark:text-stone-100 flex flex-col justify-center items-center p-4 sm:p-6">
          {/* Institutional Ribbon */}
          <div className="fixed top-0 left-0 right-0 z-50">
            <div className="grid grid-cols-2 h-1.5 w-full">
              <div className="colombia-ribbon h-full">
                <div className="colombia-yellow" />
                <div className="colombia-blue" />
                <div className="colombia-red" />
              </div>
              <div className="tolima-ribbon h-full">
                <div className="tolima-vinotinto" />
                <div className="tolima-gold" />
              </div>
            </div>
          </div>

          <div className="w-full max-w-xl bg-white dark:bg-[#161920] rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#8c162a] dark:text-[#f2c94c]">
                Consejo Municipal de Juventud Flandes · Tolima
              </span>
              <h1 className="text-2xl font-display font-bold text-stone-900 dark:text-stone-100">
                Se presentó una eventualidad técnica
              </h1>
              <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed max-w-md mx-auto">
                La plataforma detectó una discrepancia en el renderizado y protegió la sesión para evitar la pérdida de información institucional.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="btn-dulima-primary py-2.5 px-4 text-xs font-bold inline-flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Recargar Plataforma</span>
              </button>

              <button
                type="button"
                onClick={this.handleReset}
                className="btn-dulima-secondary py-2.5 px-4 text-xs font-bold inline-flex items-center gap-2"
              >
                <span>Reintentar</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-bold inline-flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                <span>Inicio Seguro</span>
              </button>
            </div>

            {/* Technical details toggle */}
            <details className="text-left pt-4 border-t border-stone-200 dark:border-stone-800">
              <summary className="text-xs font-semibold text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 cursor-pointer flex items-center justify-between">
                <span>Ver diagnóstico técnico de depuración</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800">
                  Detalles
                </span>
              </summary>
              <div className="mt-3 p-3.5 rounded-xl bg-stone-950 text-emerald-400 font-mono text-[11px] overflow-x-auto space-y-2 select-all">
                <div className="flex items-center justify-between text-stone-400 pb-1 border-b border-stone-800">
                  <span>Stack Trace</span>
                  <button
                    type="button"
                    onClick={this.handleCopyReport}
                    className="inline-flex items-center gap-1 text-[10px] text-stone-300 hover:text-white"
                  >
                    {this.state.copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{this.state.copied ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
                <p className="text-red-400 font-bold">{this.state.error?.toString()}</p>
                <pre className="whitespace-pre-wrap text-[10px] leading-tight text-stone-400">
                  {this.state.errorInfo?.componentStack || this.state.error?.stack || 'Sin stack disponible'}
                </pre>
              </div>
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

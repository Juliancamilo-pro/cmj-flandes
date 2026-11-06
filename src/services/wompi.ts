/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Wompi (Bancolombia) Gateway Integration Helper for Colombia
 * Robust real transactions, deep links, verification API, and Colombian banking directory
 */

import { FinancialSettings, PaymentMethod, FinancialTransactionStatus } from '../types';

export const DEFAULT_WOMPI_TEST_KEY = 'pub_test_Q5yDA9xoKdePzhSGeVe9HAUr19qBorder';

export interface BankInfo {
  code: string;
  name: string;
  popular?: boolean;
  category: 'banco' | 'billetera' | 'cooperativa' | 'neobanco';
  supportsPSE: boolean;
}

export const COLOMBIAN_BANKS: BankInfo[] = [
  { code: 'BANCOLOMBIA', name: 'Bancolombia', popular: true, category: 'banco', supportsPSE: true },
  { code: 'DAVIVIENDA', name: 'Davivienda', popular: true, category: 'banco', supportsPSE: true },
  { code: 'NEQUI', name: 'Nequi (Bancolombia)', popular: true, category: 'billetera', supportsPSE: true },
  { code: 'DAVIPLATA', name: 'Daviplata (Davivienda)', popular: true, category: 'billetera', supportsPSE: true },
  { code: 'BANCO_BOGOTA', name: 'Banco de Bogotá', popular: true, category: 'banco', supportsPSE: true },
  { code: 'BBVA', name: 'BBVA Colombia', popular: true, category: 'banco', supportsPSE: true },
  { code: 'BANCO_OCCIDENTE', name: 'Banco de Occidente', category: 'banco', supportsPSE: true },
  { code: 'BANCO_POPULAR', name: 'Banco Popular', category: 'banco', supportsPSE: true },
  { code: 'BANCO_AGRARIO', name: 'Banco Agrario de Colombia', category: 'banco', supportsPSE: true },
  { code: 'SCOTIABANK_COLPATRIA', name: 'Scotiabank Colpatria', category: 'banco', supportsPSE: true },
  { code: 'AV_VILLAS', name: 'Banco AV Villas', category: 'banco', supportsPSE: true },
  { code: 'ITAU', name: 'Banco Itaú Colombia', category: 'banco', supportsPSE: true },
  { code: 'BANCO_CAJA_SOCIAL', name: 'Banco Caja Social', category: 'banco', supportsPSE: true },
  { code: 'NU_COLOMBIA', name: 'Nu Colombia (Cuenta Nu)', popular: true, category: 'neobanco', supportsPSE: true },
  { code: 'LULO_BANK', name: 'Lulo Bank', category: 'neobanco', supportsPSE: true },
  { code: 'DALE', name: 'Dale! (Grupo Aval)', category: 'billetera', supportsPSE: true },
  { code: 'MOVII', name: 'Movii', category: 'billetera', supportsPSE: true },
  { code: 'UALA', name: 'Ualá Colombia', category: 'billetera', supportsPSE: true },
  { code: 'BANCAMIA', name: 'Bancamía', category: 'banco', supportsPSE: true },
  { code: 'BANCOOMEVA', name: 'Bancoomeva', category: 'banco', supportsPSE: true },
  { code: 'FALABELLA', name: 'Banco Falabella', category: 'banco', supportsPSE: true },
  { code: 'PICHINCHA', name: 'Banco Pichincha', category: 'banco', supportsPSE: true },
  { code: 'SERFINANZA', name: 'Banco Serfinanza', category: 'banco', supportsPSE: true },
  { code: 'COOPCENTRAL', name: 'Coopcentral', category: 'cooperativa', supportsPSE: true },
  { code: 'CONFIAR', name: 'Confiar Cooperativa Financiera', category: 'cooperativa', supportsPSE: true }
];

export interface CheckoutSessionOptions {
  reference: string;
  amountCOP: number;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  redirectUrl: string;
  paymentMethod?: PaymentMethod;
  selectedBankCode?: string;
  publicKey?: string;
  integritySecret?: string;
}

/**
 * Computes SHA-256 integrity signature for Wompi if integrity secret is provided.
 * Format: sha256(reference + amountInCents + currency + integritySecret)
 */
export async function generateWompiIntegritySignature(
  reference: string,
  amountInCents: number,
  currency: string,
  integritySecret: string
): Promise<string> {
  const message = `${reference}${amountInCents}${currency}${integritySecret}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Builds the official Wompi Web Checkout URL
 */
export async function buildWompiCheckoutUrl(
  options: CheckoutSessionOptions,
  settings?: FinancialSettings | null
): Promise<string> {
  const publicKey = settings?.wompiPublicKey?.trim() || options.publicKey?.trim() || DEFAULT_WOMPI_TEST_KEY;
  const amountInCents = Math.round(options.amountCOP * 100);
  const currency = 'COP';

  const params = new URLSearchParams();
  params.set('public-key', publicKey);
  params.set('currency', currency);
  params.set('amount-in-cents', String(amountInCents));
  params.set('reference', options.reference);
  params.set('redirect-url', options.redirectUrl);
  params.set('customer-data:email', options.customerEmail);
  params.set('customer-data:full-name', options.customerName);

  if (options.customerPhone) {
    params.set('customer-data:phone-number', options.customerPhone);
  }

  // Integrity signature if secret configured
  if (settings?.wompiIntegritySecret) {
    try {
      const signature = await generateWompiIntegritySignature(
        options.reference,
        amountInCents,
        currency,
        settings.wompiIntegritySecret
      );
      params.set('signature:integrity', signature);
    } catch (e) {
      console.warn('Could not generate Wompi integrity signature:', e);
    }
  }

  return `https://checkout.wompi.co/p/?${params.toString()}`;
}

/**
 * Dynamically loads the official Wompi Widget script
 */
export function loadWompiWidgetScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if ((window as any).WidgetCheckout) return resolve(true);

    const existingScript = document.querySelector('script[src*="checkout.wompi.co/widget.js"]');
    if (existingScript) return resolve(true);

    const script = document.createElement('script');
    script.src = 'https://checkout.wompi.co/widget.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn('Could not load Wompi widget script, will use direct redirect checkout.');
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

/**
 * Opens Wompi Widget checkout modal or redirects to checkout URL
 */
export async function openWompiCheckout(
  options: CheckoutSessionOptions,
  settings?: FinancialSettings | null,
  onCompleted?: (result: any) => void
): Promise<void> {
  const publicKey = settings?.wompiPublicKey?.trim() || options.publicKey?.trim() || DEFAULT_WOMPI_TEST_KEY;
  const amountInCents = Math.round(options.amountCOP * 100);
  const currency = 'COP';

  // Check if WidgetCheckout is available
  const widgetAvailable = await loadWompiWidgetScript();

  if (widgetAvailable && (window as any).WidgetCheckout) {
    let signature: string | undefined;
    if (settings?.wompiIntegritySecret) {
      try {
        signature = await generateWompiIntegritySignature(
          options.reference,
          amountInCents,
          currency,
          settings.wompiIntegritySecret
        );
      } catch (e) {}
    }

    const checkoutConfig: any = {
      currency,
      amountInCents,
      reference: options.reference,
      publicKey,
      redirectUrl: options.redirectUrl,
      customerData: {
        email: options.customerEmail,
        fullName: options.customerName,
        phoneNumber: options.customerPhone || ''
      }
    };

    if (signature) {
      checkoutConfig.signature = { integrity: signature };
    }

    try {
      const checkout = new (window as any).WidgetCheckout(checkoutConfig);
      checkout.open((result: any) => {
        if (onCompleted) {
          onCompleted(result);
        }
      });
      return;
    } catch (err) {
      console.warn('Widget checkout execution failed, falling back to direct checkout URL:', err);
    }
  }

  // Fallback to direct URL checkout
  const directUrl = await buildWompiCheckoutUrl(options, settings);
  window.location.href = directUrl;
}

/**
 * Verifies real Wompi transaction status via official API endpoint
 */
export async function verifyWompiTransaction(
  transactionId: string,
  publicKey?: string
): Promise<{
  success: boolean;
  status: 'APPROVED' | 'DECLINED' | 'VOIDED' | 'ERROR' | 'PENDING' | 'UNKNOWN';
  mappedStatus: FinancialTransactionStatus;
  reference?: string;
  amountCOP?: number;
  paymentMethodType?: string;
  statusMessage?: string;
  raw?: any;
}> {
  if (!transactionId) {
    return {
      success: false,
      status: 'UNKNOWN',
      mappedStatus: 'pendiente',
      statusMessage: 'ID de transacción no proporcionado'
    };
  }

  const isProd = Boolean(publicKey && publicKey.startsWith('pub_prod_'));
  const baseUrl = isProd ? 'https://production.wompi.co/v1' : 'https://sandbox.wompi.co/v1';

  const mapWompiStatus = (status: string): FinancialTransactionStatus => {
    if (status === 'APPROVED') return 'aprobado';
    if (status === 'DECLINED') return 'rechazado';
    if (status === 'VOIDED') return 'cancelado';
    if (status === 'ERROR') return 'rechazado';
    if (status === 'PENDING') return 'procesando';
    return 'pendiente';
  };

  // 1. Try server-side proxy first (no CORS)
  try {
    const proxyRes = await fetch(
      `/api/wompi/verify/${encodeURIComponent(transactionId)}?env=${isProd ? 'prod' : 'sandbox'}`
    );
    if (proxyRes.ok) {
      const pJson = await proxyRes.json();
      if (pJson?.success && pJson?.status) {
        return {
          success: true,
          status: pJson.status,
          mappedStatus: mapWompiStatus(pJson.status),
          reference: pJson.reference,
          amountCOP: pJson.amountCOP,
          paymentMethodType: pJson.paymentMethodType,
          statusMessage: pJson.statusMessage,
          raw: pJson.raw
        };
      }
    }
  } catch (proxyErr) {
    // Fallback to direct fetch
  }

  // 2. Fallback to direct Wompi API
  try {
    const res = await fetch(`${baseUrl}/transactions/${transactionId}`, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (res.ok) {
      const json = await res.json();
      const tx = json.data;
      if (tx) {
        return {
          success: true,
          status: tx.status,
          mappedStatus: mapWompiStatus(tx.status),
          reference: tx.reference,
          amountCOP: tx.amount_in_cents ? Math.round(tx.amount_in_cents / 100) : undefined,
          paymentMethodType: tx.payment_method_type,
          statusMessage: tx.status_message,
          raw: tx
        };
      }
    }
  } catch (err) {
    console.warn('Direct Wompi API call failed (CORS or network):', err);
  }

  // Return graceful status if network blocked or synthetic sandbox ID
  return {
    success: false,
    status: 'UNKNOWN',
    mappedStatus: 'pendiente',
    statusMessage: 'Consultando estado con el proveedor financiero'
  };
}

/**
 * Formats a bank account number for secure masked display (****1234)
 */
export function maskAccountNumber(rawNumber: string): string {
  if (!rawNumber) return '••••';
  const clean = rawNumber.replace(/\s+/g, '');
  if (clean.length <= 4) return clean;
  const lastFour = clean.slice(-4);
  return `•••• •••• ${lastFour}`;
}

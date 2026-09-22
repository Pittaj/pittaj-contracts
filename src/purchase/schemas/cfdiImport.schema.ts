/**
 * @fileoverview «Importar CFDI» desde la lista de compras: los archivos que soltó el usuario.
 * @module Contracts/Purchase/Schemas/CfdiImport
 *
 * El XML lo lee el navegador o el escritorio (en Workers no hay lector de XML): aquí viaja la
 * cabecera ya leída junto con el XML crudo, que el Buzón guarda tal cual. Un archivo que no se
 * pudo leer viaja con `header: null` y se lista como «No es un CFDI»; no aborta el lote.
 */

import { z } from 'zod';

export const cfdiFilePaymentDocSchema = z
    .object({
        doctoUuid: z.string().trim().min(1).max(40),
        serie: z.string().trim().max(30).nullish(),
        folio: z.string().trim().max(40).nullish(),
        moneda: z.string().trim().max(3).nullish(),
        numParcialidad: z.string().trim().max(10).nullish(),
        impSaldoAnt: z.number().min(0).optional().default(0),
        impPagado: z.number().min(0).optional().default(0),
        impSaldoInsoluto: z.number().min(0).optional().default(0),
        fechaPago: z.string().datetime({ offset: true }).nullish(),
        formaPago: z.string().trim().max(3).nullish(),
    })
    .strict();

/** La cabecera del CFDI tal como la leyó el cliente. */
export const cfdiFileHeaderSchema = z
    .object({
        uuid: z.string().trim().max(40).nullish(),
        issuerRfc: z.string().trim().min(1).max(20),
        issuerName: z.string().trim().max(300).optional().default(''),
        issuerRegime: z.string().trim().max(10).nullish(),
        receiverRfc: z.string().trim().max(20).optional().default(''),
        series: z.string().trim().max(30).nullish(),
        folio: z.string().trim().max(40).nullish(),
        issuedAt: z.string().datetime({ offset: true }).nullish(),
        currency: z.string().trim().max(3).nullish(),
        metodoPago: z.string().trim().max(3).nullish(),
        formaPago: z.string().trim().max(3).nullish(),
        usoCfdi: z.string().trim().max(4).nullish(),
        /** I, E, P, N, T. */
        tipoComprobante: z.string().trim().max(1).nullish(),
        subtotal: z.number().min(0).optional().default(0),
        total: z.number().min(0),
        trasladoIva: z.number().min(0).optional().default(0),
        trasladoIeps: z.number().min(0).optional().default(0),
        retencionIsr: z.number().min(0).optional().default(0),
        retencionIva: z.number().min(0).optional().default(0),
        paymentDocs: z.array(cfdiFilePaymentDocSchema).max(200).optional().default([]),
    })
    .strict();

export type CfdiFileHeaderRequest = z.infer<typeof cfdiFileHeaderSchema>;

const MAX_ARCHIVOS = 100;
/** Un XML de CFDI normal pesa 5–30 KB; 2 MB deja sitio a los de cientos de conceptos. */
const MAX_XML = 2 * 1024 * 1024;

export const importCfdiFilesSchema = z
    .object({
        items: z
            .array(
                z
                    .object({
                        fileName: z.string().trim().max(260).nullish(),
                        /** Vacío cuando el archivo no era XML (un PDF): se lista y se ignora. */
                        xml: z.string().max(MAX_XML).optional().default(''),
                        header: cfdiFileHeaderSchema.nullable(),
                    })
                    .strict()
            )
            .min(1, 'Suelta al menos un archivo')
            .max(MAX_ARCHIVOS, `Máximo ${MAX_ARCHIVOS} archivos por vez`),
    })
    .strict();

export type ImportCfdiFilesRequest = z.infer<typeof importCfdiFilesSchema>;

/**
 * Enlazar un CFDI con UNA compra capturada a mano («Parece la compra», «Adjuntar CFDI»).
 *
 * `difference` dice qué hacer si el total no es exacto: `REGISTRAR_AJUSTE` crea el ajuste por
 * redondeo (solo dentro de la tolerancia), `ENLAZAR_CON_AVISO` deja la diferencia a la vista en
 * «Requieren tu atención». Sin `difference` y con total distinto, la nube rechaza y dice cuánto.
 */
export const linkCfdiToPurchaseSchema = z
    .object({
        cfdiId: z.string().uuid(),
        /** Versión OCC de la compra. */
        version: z.number().int().min(1),
        difference: z.enum(['REGISTRAR_AJUSTE', 'ENLAZAR_CON_AVISO']).nullish(),
    })
    .strict();

export type LinkCfdiToPurchaseRequest = z.infer<typeof linkCfdiToPurchaseSchema>;

/** Revertir un ajuste por redondeo: no se borra, se queda con fecha y motivo. */
export const reverseCfdiAdjustmentSchema = z
    .object({
        reason: z.string().trim().min(1, 'Di por qué se revierte').max(300),
    })
    .strict();

export type ReverseCfdiAdjustmentRequest = z.infer<typeof reverseCfdiAdjustmentSchema>;

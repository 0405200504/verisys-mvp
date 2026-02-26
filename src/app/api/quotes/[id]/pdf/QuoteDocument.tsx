import React from 'react'
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer'
import { format } from 'date-fns'

// Define styling
const styles = StyleSheet.create({
    page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#333' },
    header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
    companyInfo: { width: '60%' },
    logo: { width: 100, marginBottom: 10 },
    companyName: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
    quoteInfo: { width: '40%', alignItems: 'flex-end' },
    quoteTitle: { fontSize: 24, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 },

    section: { marginBottom: 20 },
    sectionTitle: { fontSize: 12, fontWeight: 'bold', backgroundColor: '#f1f5f9', padding: 4, marginBottom: 8 },
    row: { flexDirection: 'row', marginBottom: 4 },
    label: { width: 100, fontWeight: 'bold' },
    value: { flex: 1 },

    table: { width: '100%', border: '1pt solid #e2e8f0', borderWidth: 1, borderRightWidth: 0, borderBottomWidth: 0 },
    tableHeader: { flexDirection: 'row', backgroundColor: '#f8fafc', fontWeight: 'bold' },
    tableRow: { flexDirection: 'row' },
    tableCol: { border: '1pt solid #e2e8f0', borderLeftWidth: 0, borderTopWidth: 0, padding: 4 },

    colItem: { width: '40%' },
    colQty: { width: '10%', textAlign: 'center' },
    colUnit: { width: '10%', textAlign: 'center' },
    colPrice: { width: '15%', textAlign: 'right' },
    colTaxes: { width: '10%', textAlign: 'right' },
    colTotal: { width: '15%', textAlign: 'right' },

    totalsBox: { width: '40%', alignSelf: 'flex-end', marginTop: 20, padding: 10, backgroundColor: '#f8fafc', borderRadius: 4 },
    totalsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    totalsLabel: { fontWeight: 'bold' },

    footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', color: '#94a3b8', fontSize: 8, borderTop: '1pt solid #e2e8f0', paddingTop: 10 }
})

export const QuoteDocument = ({ quote, company, client, items }: any) => {
    const formatMoney = (val: number) =>
        val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* HEADER */}
                <View style={styles.header}>
                    <View style={styles.companyInfo}>
                        {company.logo_url && <Image src={company.logo_url} style={styles.logo} />}
                        <Text style={styles.companyName}>{company.name}</Text>
                        {company.legal_name && <Text>{company.legal_name}</Text>}
                        {company.cnpj && <Text>CNPJ: {company.cnpj}</Text>}
                        {company.email && <Text>Email: {company.email}</Text>}
                        {company.phone && <Text>Tel: {company.phone}</Text>}
                    </View>
                    <View style={styles.quoteInfo}>
                        <Text style={styles.quoteTitle}>ORÇAMENTO</Text>
                        <Text>Nº {quote.number}</Text>
                        <Text>Data: {format(new Date(quote.issued_at), 'dd/MM/yyyy')}</Text>
                        {quote.valid_until && <Text>Validade: {format(new Date(quote.valid_until), 'dd/MM/yyyy')}</Text>}
                    </View>
                </View>

                {/* CLIENT INFO */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>DADOS DO CLIENTE</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Nome/Razão:</Text>
                        <Text style={styles.value}>{client.nome_razao_social}</Text>
                    </View>
                    {client.cpf_cnpj && (
                        <View style={styles.row}>
                            <Text style={styles.label}>CPF/CNPJ:</Text>
                            <Text style={styles.value}>{client.cpf_cnpj}</Text>
                        </View>
                    )}
                    {client.email && (
                        <View style={styles.row}>
                            <Text style={styles.label}>Email:</Text>
                            <Text style={styles.value}>{client.email}</Text>
                        </View>
                    )}
                </View>

                {/* ITEMS */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>ITENS DA PROPOSTA</Text>
                    <View style={styles.table}>
                        <View style={[styles.tableRow, styles.tableHeader]}>
                            <Text style={[styles.tableCol, styles.colItem]}>Item</Text>
                            <Text style={[styles.tableCol, styles.colQty]}>Qtd</Text>
                            <Text style={[styles.tableCol, styles.colUnit]}>UN</Text>
                            <Text style={[styles.tableCol, styles.colPrice]}>V. Un (R$)</Text>
                            <Text style={[styles.tableCol, styles.colTaxes]}>Imp. (R$)</Text>
                            <Text style={[styles.tableCol, styles.colTotal]}>Total (R$)</Text>
                        </View>
                        {items.map((item: any, i: number) => (
                            <View key={i} style={styles.tableRow}>
                                <Text style={[styles.tableCol, styles.colItem]}>
                                    {item.name}
                                    {item.description ? `\n${item.description}` : ''}
                                </Text>
                                <Text style={[styles.tableCol, styles.colQty]}>{item.qty}</Text>
                                <Text style={[styles.tableCol, styles.colUnit]}>{item.unit || 'UN'}</Text>
                                <Text style={[styles.tableCol, styles.colPrice]}>{formatMoney(item.unit_price)}</Text>
                                <Text style={[styles.tableCol, styles.colTaxes]}>{formatMoney(item.taxes || 0)}</Text>
                                <Text style={[styles.tableCol, styles.colTotal]}>{formatMoney(item.total)}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* TOTALS */}
                <View style={styles.totalsBox}>
                    <View style={styles.totalsRow}>
                        <Text style={styles.totalsLabel}>Subtotal Itens:</Text>
                        <Text>{formatMoney(quote.subtotal)}</Text>
                    </View>
                    {quote.discount_total > 0 && (
                        <View style={styles.totalsRow}>
                            <Text style={styles.totalsLabel}>Descontos:</Text>
                            <Text>- {formatMoney(quote.discount_total)}</Text>
                        </View>
                    )}
                    {quote.tax_total > 0 && (
                        <View style={styles.totalsRow}>
                            <Text style={styles.totalsLabel}>Impostos Gerais:</Text>
                            <Text>+ {formatMoney(quote.tax_total)}</Text>
                        </View>
                    )}
                    {quote.shipping_total > 0 && (
                        <View style={styles.totalsRow}>
                            <Text style={styles.totalsLabel}>Frete/Seguro:</Text>
                            <Text>+ {formatMoney(quote.shipping_total)}</Text>
                        </View>
                    )}
                    <View style={[styles.totalsRow, { marginTop: 4, borderTop: '1pt solid #cbd5e1', paddingTop: 4 }]}>
                        <Text style={[styles.totalsLabel, { fontSize: 12 }]}>TOTAL:</Text>
                        <Text style={{ fontSize: 12, fontWeight: 'bold' }}>{formatMoney(quote.total)}</Text>
                    </View>
                </View>

                {/* CONDITIONS */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>CONDIÇÕES DE FORNECIMENTO</Text>
                    {quote.payment_terms && <Text>Pagamento: {quote.payment_terms}</Text>}
                    {quote.delivery_time && <Text>Prazo de Entrega: {quote.delivery_time}</Text>}
                    {quote.freight_type && <Text>Tipo de Frete: {quote.freight_type} {quote.carrier ? `(${quote.carrier})` : ''}</Text>}
                    {quote.notes_commercial && (
                        <View style={{ marginTop: 8 }}>
                            <Text style={{ fontWeight: 'bold' }}>Observações Comerciais:</Text>
                            <Text>{quote.notes_commercial}</Text>
                        </View>
                    )}
                    {quote.notes_fiscal && (
                        <View style={{ marginTop: 8 }}>
                            <Text style={{ fontWeight: 'bold' }}>Observações Fiscais:</Text>
                            <Text>{quote.notes_fiscal}</Text>
                        </View>
                    )}
                </View>

                {/* FOOTER */}
                <Text style={styles.footer} fixed>
                    Este documento é uma proposta comercial sujeito a análise e aprovação.
                </Text>
            </Page>
        </Document>
    )
}

import type { StructureResolver } from 'sanity/structure'

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Gestione')
    .items([
      S.documentTypeListItem('miniatura').title('🗿 Miniature'),
      S.documentTypeListItem('creator').title('🎨 Creator'),
      S.divider(),
      S.listItem()
        .title('📋 Ordini')
        .child(
          S.list()
            .title('Ordini')
            .items([
              S.listItem()
                .title('📥 Ricevuti')
                .child(
                  S.documentList()
                    .title('Ricevuti')
                    .apiVersion('2023-03-25')
                    .filter('_type == "ordine" && stato == "ricevuto"')
                    .defaultOrdering([{ field: 'dataOrdine', direction: 'desc' }])
                ),
              S.listItem()
                .title('⚙️ In lavorazione')
                .child(
                  S.documentList()
                    .title('In lavorazione')
                    .apiVersion('2023-03-25')
                    .filter('_type == "ordine" && stato == "in_lavorazione"')
                    .defaultOrdering([{ field: 'dataOrdine', direction: 'desc' }])
                ),
              S.listItem()
                .title('✅ Pronti')
                .child(
                  S.documentList()
                    .title('Pronti per la consegna')
                    .apiVersion('2023-03-25')
                    .filter('_type == "ordine" && stato == "pronto"')
                    .defaultOrdering([{ field: 'dataOrdine', direction: 'desc' }])
                ),
              S.listItem()
                .title('📦 Consegnati')
                .child(
                  S.documentList()
                    .title('Consegnati')
                    .apiVersion('2023-03-25')
                    .filter('_type == "ordine" && stato == "consegnato"')
                    .defaultOrdering([{ field: 'dataOrdine', direction: 'desc' }])
                ),
              S.divider(),
              S.documentTypeListItem('ordine').title('Tutti gli ordini'),
            ])
        ),
      S.divider(),
      S.documentTypeListItem('costo').title('💰 Costi'),
      S.documentTypeListItem('profiloPrezzo').title('🧮 Profili di prezzo'),
      S.documentTypeListItem('finitura').title('🎨 Finiture'),
      S.divider(),
      S.listItem()
        .title('⚙️ Impostazioni sito')
        .child(
          S.document()
            .schemaType('siteSettings')
            .documentId('siteSettings')
            .title('Impostazioni sito')
        ),
    ])

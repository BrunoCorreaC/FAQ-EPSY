# Carro Fácil

App web (PWA, mobile-first) para quem está em busca do primeiro carro.

- **Catálogo**: busca e filtros (preço, tipo, câmbio, cidade), detalhe do carro, contato por WhatsApp/telefone e favoritos.
- **Despachantes**: contatos com ligação/WhatsApp direto e ordenação por proximidade (geolocalização opcional, processada só no aparelho).
- **Guia do primeiro carro**: passo a passo com checklist salvo no aparelho + lista de documentos.
- **Simulador de financiamento** (estimativa por parcelas fixas).
- Instalável na tela inicial e com cache offline.

## Rodar

    python3 -m http.server 8000   # nesta pasta, e abra http://localhost:8000

## Dados

`js/data.js` contém **dados fictícios** de exemplo (carros, despachantes, telefones). Substitua por dados reais ou por uma API.
Telefones: formato internacional, só dígitos (ex.: `5548999999999`).

## Próximos passos sugeridos

Fotos reais dos carros, backend (ex.: Supabase) para cadastro por lojas/despachantes, mapa, avaliações.

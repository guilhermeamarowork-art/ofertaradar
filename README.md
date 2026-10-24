# OfertaRadar

Site estático simples para publicar no GitHub Pages com foco em ofertas, categorias e links de afiliado do Mercado Livre.

## Estrutura

- `index.html` — página principal
- `styles.css` — visual do site
- `script.js` — renderização dinâmica dos produtos
- `src/data/products.js` — catálogo em JavaScript para uso no navegador
- `src/data/products.ts` — referência em TypeScript para cadastro e manutenção
- `assets/favicon.svg` — ícone da marca

## Como visualizar localmente

1. Abra a pasta do projeto no VS Code.
2. Use a extensão Live Server ou abra `index.html` diretamente.
3. Para testar em navegador local, pode ser usado um servidor simples com:

```bash
python -m http.server 8000
```

Depois abra `http://localhost:8000`.

## Publicar no GitHub Pages

1. Vá em `Settings` do repositório.
2. Acesse `Pages`.
3. Escolha a branch `main`.
4. Use a pasta raiz `/` como origem.
5. Salve e aguarde a publicação.

## Observações importantes

- Os produtos no catálogo são exemplos demonstrativos.
- Antes de publicar com links reais, substitua os campos `affiliateUrl` por links de afiliado autorizados.
- Mantenha o design e o conteúdo em português brasileiro.
- O site foi pensado para ser responsivo e simples de manter.

## Atualizar produtos

Edite o arquivo `src/data/products.js` e mantenha a mesma estrutura dos objetos.

```js
{
  id: 'prod-001',
  name: 'Nome do produto',
  description: 'Descrição breve do produto',
  image: 'https://imagem.com/exemplo.jpg',
  price: 199.9,
  oldPrice: 299.9,
  discount: 33,
  category: 'Informática e computadores',
  affiliateUrl: '',
  featured: true,
  createdAt: '2026-01-01'
}
```

Se precisar, eu posso continuar e te entregar uma versão mais avançada com:
- filtro por faixa de preço
- carrossel de ofertas
- modal de produto
- contador de visitas
- integração com API de afiliados
- página de categoria separada


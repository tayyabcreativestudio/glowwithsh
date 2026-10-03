# Internal linking

- Homepage → Shop → four canonical category URLs → published visible product URLs.
- Header/footer links are anchors to public navigation pages; product and category cards have real links as well as interactive controls.
- Shop category pills now open `/shop/category/{slug}` instead of silently changing only local state on another canonical URL.
- Category comparison text → Contact, Shipping, Returns.
- Product detail → its category, Contact, Shipping, Returns, Order tracking; related product cards link to product URLs.
- Journal index → published articles. Article metadata/rendered body preserves the actual article; future editorial links should reference only relevant verified products.
- About → founder and shop; footer → brand/support/policy pages.

`keyword-map.csv` lists links in/out extracted from initial HTML. It does not count every client-rendered footer/header/related-product link. Navigation has no purchased links or keyword-stuffed anchors.

Each category owns its broad theme; each product owns its name/SKU. Duplicate same-name SKUs need owner verification before consolidation. Utility pages remain usable but noindex and absent from sitemap.

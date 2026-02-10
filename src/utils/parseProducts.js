/**
 * Parses raw product XML-like text into structured data.
 * Handles the custom XML format with <product>, <variant_detail>, etc.
 */
export function parseProducts(rawText) {
  const products = []

  // Extract content between <PRODUCTS_START> and <PRODUCTS_END> if present
  let text = rawText
  const startMatch = text.match(/<PRODUCTS_START>\s*\[?"?/)
  const endMatch = text.match(/"?\]?\s*<PRODUCTS_END>/)
  if (startMatch) {
    text = text.slice(startMatch.index + startMatch[0].length)
  }
  if (endMatch) {
    text = text.slice(0, endMatch.index)
  }

  // Find all <product>...</product> blocks
  const productRegex = /<product>([\s\S]*?)<\/product>/g
  let match

  while ((match = productRegex.exec(text)) !== null) {
    const block = match[1]
    const product = {}

    // Extract simple fields
    const simpleFields = [
      'name', 'product_id', 'original_price', 'is_out_of_stock',
      'brief_description', 'tags', 'tasting_notes', 'productUrl'
    ]

    for (const field of simpleFields) {
      const fieldMatch = block.match(new RegExp(`<${field}>([\\s\\S]*?)<\\/${field}>`))
      if (fieldMatch) {
        product[field] = fieldMatch[1].trim()
      }
    }

    // Parse boolean
    if (product.is_out_of_stock) {
      product.is_out_of_stock = product.is_out_of_stock.toLowerCase() === 'true'
    }

    // Parse price
    if (product.original_price) {
      const priceMatch = product.original_price.match(/([\w]+)\s+([\d.]+)/)
      if (priceMatch) {
        product.currency = priceMatch[1]
        product.price_value = parseFloat(priceMatch[2])
      }
    }

    // Parse tags into array
    if (product.tags) {
      product.tags_array = product.tags.split(',').map(t => t.trim()).filter(Boolean)
    }

    // Parse variants
    product.variants = []
    const variantRegex = /<variant_detail>([\s\S]*?)<\/variant_detail>/g
    let variantMatch

    while ((variantMatch = variantRegex.exec(block)) !== null) {
      const vBlock = variantMatch[1]
      const variant = {}

      const variantIdMatch = vBlock.match(/<variant_id>([\s\S]*?)<\/variant_id>/)
      const variantDetailsMatch = vBlock.match(/<variant_details>([\s\S]*?)<\/variant_details>/)
      const priceMatch = vBlock.match(/<price>([\s\S]*?)<\/price>/)

      if (variantIdMatch) variant.id = variantIdMatch[1].trim()
      if (variantDetailsMatch) variant.details = variantDetailsMatch[1].trim()
      if (priceMatch) variant.price = priceMatch[1].trim()

      // Parse variant details into grind + size
      if (variant.details) {
        const grindMatch = variant.details.match(/Grind:\s*([^,]+)/)
        const sizeMatch = variant.details.match(/Size:\s*(.+)/)
        if (grindMatch) variant.grind = grindMatch[1].trim()
        if (sizeMatch) variant.size = sizeMatch[1].trim()
      }

      product.variants.push(variant)
    }

    // Group variants by size
    product.variantsBySize = {}
    for (const v of product.variants) {
      const size = v.size || 'Default'
      if (!product.variantsBySize[size]) {
        product.variantsBySize[size] = { price: v.price, variants: [] }
      }
      product.variantsBySize[size].variants.push(v)
    }

    products.push(product)
  }

  return products
}

import { useState } from 'react'
import {
  FileText, Play, Trash2, Copy, CheckCircle2, XCircle,
  Tag, ExternalLink, ChevronDown, ChevronUp, Package,
  DollarSign, Coffee, Info, Hash, Link2
} from 'lucide-react'
import { parseProducts } from '../utils/parseProducts'
import './ProductsParser.css'

const PLACEHOLDER_TEXT = 'Paste your raw product data here...\n\nSupports XML-like product data wrapped in PRODUCTS_START / PRODUCTS_END tags.'

export default function ProductsParser() {
  const [rawText, setRawText] = useState('')
  const [products, setProducts] = useState([])
  const [parsed, setParsed] = useState(false)
  const [expandedVariants, setExpandedVariants] = useState({})
  const [copiedId, setCopiedId] = useState(null)

  const handleParse = () => {
    if (!rawText.trim()) return
    const result = parseProducts(rawText)
    setProducts(result)
    setParsed(true)
  }

  const handleClear = () => {
    setRawText('')
    setProducts([])
    setParsed(false)
    setExpandedVariants({})
  }

  const toggleVariants = (productId) => {
    setExpandedVariants(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }))
  }

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="parser-page">
      {/* Input Section */}
      <div className={`input-section ${parsed ? 'input-section-collapsed' : ''}`}>
        <div className="section-header">
          <div className="section-icon">
            <FileText size={22} />
          </div>
          <div>
            <h2 className="section-title">Products Data Parser</h2>
            <p className="section-desc">
              Paste your raw product XML/text data below and parse it into a clean, readable format.
            </p>
          </div>
        </div>

        <div className="textarea-wrapper">
          <textarea
            className="raw-input"
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder={PLACEHOLDER_TEXT}
            rows={parsed ? 4 : 12}
          />
          <div className="textarea-footer">
            <span className="char-count">{rawText.length.toLocaleString()} characters</span>
          </div>
        </div>

        <div className="action-bar">
          <button className="btn btn-primary" onClick={handleParse} disabled={!rawText.trim()}>
            <Play size={16} />
            Parse Data
          </button>
          <button className="btn btn-ghost" onClick={handleClear} disabled={!rawText.trim() && !parsed}>
            <Trash2 size={16} />
            Clear
          </button>
        </div>
      </div>

      {/* Results */}
      {parsed && (
        <div className="results-section">
          <div className="results-header">
            <h3 className="results-title">
              Parsed Products
              <span className="results-count">{products.length} found</span>
            </h3>
          </div>

          {products.length === 0 ? (
            <div className="empty-state">
              <XCircle size={40} />
              <p>No products could be parsed. Check your input format.</p>
            </div>
          ) : (
            <div className="products-list">
              {products.map((product, idx) => (
                <ProductCard
                  key={product.product_id || idx}
                  product={product}
                  index={idx}
                  expanded={expandedVariants[product.product_id]}
                  onToggleVariants={() => toggleVariants(product.product_id)}
                  copiedId={copiedId}
                  onCopy={copyToClipboard}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}


function ProductCard({ product, index, expanded, onToggleVariants, copiedId, onCopy }) {
  const sizes = Object.keys(product.variantsBySize || {})

  return (
    <div className="product-card">
      {/* Card Header */}
      <div className="product-header">
        <div className="product-header-left">
          <span className="product-index">#{index + 1}</span>
          <div>
            <h3 className="product-name">{product.name || 'Unnamed Product'}</h3>
            <div className="product-meta">
              <span className="meta-item">
                <Hash size={12} />
                {product.product_id}
                <button
                  className="copy-btn-inline"
                  onClick={() => onCopy(product.product_id, `pid-${product.product_id}`)}
                  title="Copy Product ID"
                >
                  {copiedId === `pid-${product.product_id}` ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                </button>
              </span>
              <span className={`stock-badge ${product.is_out_of_stock ? 'out-of-stock' : 'in-stock'}`}>
                {product.is_out_of_stock ? 'Out of Stock' : 'In Stock'}
              </span>
            </div>
          </div>
        </div>
        <div className="product-header-right">
          <div className="price-tag">
            <DollarSign size={16} />
            <span className="price-amount">{product.original_price}</span>
          </div>
        </div>
      </div>

      {/* Description */}
      {product.brief_description && (
        <div className="product-section">
          <div className="section-label">
            <Info size={14} />
            Description
          </div>
          <p className="product-description">{product.brief_description}</p>
        </div>
      )}

      {/* Tasting Notes */}
      {product.tasting_notes && (
        <div className="product-section">
          <div className="section-label">
            <Coffee size={14} />
            Tasting Notes
          </div>
          <div className="tasting-notes">
            {product.tasting_notes.split(/[,+]/).map((note, i) => (
              <span key={i} className="tasting-note">{note.trim()}</span>
            ))}
          </div>
        </div>
      )}

      {/* Product URL */}
      {product.productUrl && (
        <div className="product-section">
          <div className="section-label">
            <Link2 size={14} />
            Product URL
          </div>
          <div className="url-row">
            <a href={product.productUrl} target="_blank" rel="noopener noreferrer" className="product-url">
              {product.productUrl}
              <ExternalLink size={12} />
            </a>
            <button
              className="copy-btn-inline"
              onClick={() => onCopy(product.productUrl, `url-${product.product_id}`)}
            >
              {copiedId === `url-${product.product_id}` ? <CheckCircle2 size={12} /> : <Copy size={12} />}
            </button>
          </div>
        </div>
      )}

      {/* Variants Summary */}
      {sizes.length > 0 && (
        <div className="product-section">
          <div className="section-label">
            <Package size={14} />
            Variants
            <span className="variant-count">{product.variants.length} total</span>
          </div>

          {/* Size/Price Summary Pills */}
          <div className="size-pills">
            {sizes.map(size => (
              <div key={size} className="size-pill">
                <span className="size-name">{size}</span>
                <span className="size-price">{product.variantsBySize[size].price}</span>
                <span className="size-grinds">{product.variantsBySize[size].variants.length} grinds</span>
              </div>
            ))}
          </div>

          {/* Expand/Collapse Variants */}
          <button className="expand-btn" onClick={onToggleVariants}>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {expanded ? 'Hide' : 'Show'} all variant details
          </button>

          {expanded && (
            <div className="variants-table-wrap">
              <table className="variants-table">
                <thead>
                  <tr>
                    <th>Variant ID</th>
                    <th>Grind</th>
                    <th>Size</th>
                    <th>Price</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {product.variants.map((v, i) => (
                    <tr key={v.id || i}>
                      <td className="variant-id-cell">
                        <code>{v.id}</code>
                      </td>
                      <td>{v.grind || '-'}</td>
                      <td>{v.size || '-'}</td>
                      <td className="variant-price">{v.price}</td>
                      <td>
                        <button
                          className="copy-btn-inline"
                          onClick={() => onCopy(v.id, `vid-${v.id}`)}
                          title="Copy Variant ID"
                        >
                          {copiedId === `vid-${v.id}` ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tags */}
      {product.tags_array && product.tags_array.length > 0 && (
        <div className="product-section">
          <div className="section-label">
            <Tag size={14} />
            Tags
            <span className="variant-count">{product.tags_array.length}</span>
          </div>
          <div className="tags-wrap">
            {product.tags_array.map((tag, i) => (
              <span key={i} className="tag-chip">{tag}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

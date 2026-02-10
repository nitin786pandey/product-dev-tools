import { useState, useMemo } from 'react'
import { ChevronDown, ChevronRight, Copy, Check } from 'lucide-react'
import './PromptConfigurator.css'

export default function PromptConfigurator() {
  const [config, setConfig] = useState({
    orderAuth: {
      enabled: true,
      authType: 'order_number'
    },
    partialCancellation: {
      enabled: true,
      action: 'agent_review'
    },
    cancellationReasons: {
      askReason: true,
      enabledReasons: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      reasons: [
        { id: 1, label: 'Incorrect shipping details', enabled: true },
        { id: 2, label: 'Ordered wrong product', enabled: true },
        { id: 3, label: 'Ordered wrong variant', enabled: true },
        { id: 4, label: 'Ordered by mistake', enabled: true },
        { id: 5, label: 'Found better price', enabled: true },
        { id: 6, label: 'Found an alternative', enabled: true },
        { id: 7, label: 'No longer needed', enabled: true },
        { id: 8, label: 'Delivery delayed', enabled: true },
        { id: 9, label: 'Reason not listed', enabled: true }
      ]
    },
    eligibility: {
      orderStatus: ['unfulfilled'],
      daysSinceOrder: 7
    },
    actionRouting: {
      autoCancel: [4, 6, 7],
      reconfirm: [5, 8],
      manualReview: [1, 2, 3, 9]
    },
    cancellationAction: {
      addTag: true,
      tagName: 'cancelled_by_manifest',
      performCancellation: false
    },
    reconfirmSettings: {
      message: 'Would you like to continue cancelling or connect with an agent?',
      options: ['Continue cancelling', 'Connect with agent']
    }
  })

  const [expandedSections, setExpandedSections] = useState({
    orderAuth: true,
    cancellationType: true,
    reasons: true,
    eligibility: true,
    actions: true,
    advanced: false
  })

  const [copied, setCopied] = useState(false)

  const updateConfig = (path, value) => {
    setConfig(prev => {
      const newConfig = { ...prev }
      const keys = path.split('.')
      let current = newConfig
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] }
        current = current[keys[i]]
      }
      current[keys[keys.length - 1]] = value
      return newConfig
    })
  }

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const generatedPrompt = useMemo(() => {
    const {
      orderAuth, partialCancellation, cancellationReasons,
      eligibility, actionRouting, cancellationAction, reconfirmSettings
    } = config

    const enabledReasons = cancellationReasons.reasons.filter(r => r.enabled)
    const reasonsList = enabledReasons.map((r, i) => `    ${i + 1}) ${r.label}`).join('\n')

    let prompt = ''

    // START SECTION
    prompt += '```markdown\n'
    prompt += 'SECTION: start\n'
    prompt += '  SAY — "Please share the order you want to cancel"\n'

    if (orderAuth.enabled) {
      const authPrompt = orderAuth.authType === 'order_number' ? 'Order number or name?' :
                        orderAuth.authType === 'email' ? 'Email address?' :
                        orderAuth.authType === 'phone' ? 'Phone number?' : 'Order details?'
      prompt += `  ASK — "${authPrompt}" → Free text → save as \`order_id\`\n`
    }

    prompt += '  DO — OrderTracking(order_id)\n'
    prompt += '  DO — Filter out CANCELLED and DELIVERED orders\n'

    if (partialCancellation.enabled) {
      prompt += '  ASK — "Full order or specific items?" \n'
      prompt += '    → Options: Full Order, Specific Items \n'
      prompt += '    → save as `cancellation_type`\n'
      prompt += '  CHECK cancellation_type:\n'
      prompt += '    IF "Full Order" → GOTO full_cancellation\n'
      prompt += '    IF "Specific Items" → GOTO partial_cancellation\n'
    } else {
      prompt += '  GOTO full_cancellation\n'
    }
    prompt += '```\n\n'

    // FULL CANCELLATION
    prompt += '```markdown\n'
    prompt += 'SECTION: full_cancellation\n'
    if (cancellationReasons.askReason && enabledReasons.length > 0) {
      prompt += '  ASK — "Cancellation reason?" → Options:\n'
      prompt += reasonsList + '\n'
      prompt += '    → save as `cancel_reason`\n'
    }
    prompt += `  CHECK eligibility (order is unfulfilled AND placed < ${eligibility.daysSinceOrder} days ago):\n`
    if (actionRouting.autoCancel.length > 0) {
      prompt += `    IF eligible AND cancel_reason in [${actionRouting.autoCancel.join(', ')}]:\n`
      prompt += '      GOTO cancel_and_tag\n'
    }
    if (actionRouting.reconfirm.length > 0) {
      prompt += `    IF eligible AND cancel_reason in [${actionRouting.reconfirm.join(', ')}]:\n`
      prompt += '      GOTO special_handling\n'
    }
    if (actionRouting.manualReview.length > 0) {
      prompt += `    IF ineligible OR cancel_reason in [${actionRouting.manualReview.join(', ')}]:\n`
      prompt += '      GOTO deny_and_handover\n'
    }
    prompt += '```\n\n'

    // CANCEL AND TAG
    if (actionRouting.autoCancel.length > 0) {
      prompt += '```markdown\n'
      prompt += 'SECTION: cancel_and_tag\n'
      if (cancellationAction.performCancellation) prompt += '  DO — OrderCancellation(order_id)\n'
      if (cancellationAction.addTag) prompt += `  DO — AddTags(tag: "${cancellationAction.tagName}", note: cancel_reason)\n`
      prompt += '  CHECK payment_method:\n'
      prompt += '    IF "prepaid":\n'
      prompt += '      SAY — "Your order has been cancelled. Refund details will be shared within 24 hours."\n'
      prompt += '    IF "COD":\n'
      prompt += '      SAY — "Your order has been cancelled."\n'
      prompt += '  GOTO exit_success\n'
      prompt += '```\n\n'
    }

    // SPECIAL HANDLING
    if (actionRouting.reconfirm.length > 0) {
      prompt += '```markdown\n'
      prompt += 'SECTION: special_handling\n'
      prompt += `  ASK — "${reconfirmSettings.message}"\n`
      prompt += `    → Options: ${reconfirmSettings.options.join(', ')}\n`
      prompt += '    → save as `user_choice`\n'
      prompt += '  CHECK user_choice:\n'
      prompt += '    IF "Continue cancelling":\n'
      if (cancellationAction.performCancellation) prompt += '      DO — OrderCancellation(order_id)\n'
      if (cancellationAction.addTag) prompt += `      DO — AddTags(tag: "${cancellationAction.tagName}", note: cancel_reason)\n`
      prompt += '      SAY — "Your order has been cancelled."\n'
      prompt += '      GOTO exit_success\n'
      prompt += '    IF "Connect with agent":\n'
      prompt += '      DO — AddTags(tag: "full_cancellation_requested", note: cancel_reason)\n'
      prompt += '      GOTO exit_agent\n'
      prompt += '```\n\n'
    }

    // DENY AND HANDOVER
    if (actionRouting.manualReview.length > 0) {
      prompt += '```markdown\n'
      prompt += 'SECTION: deny_and_handover\n'
      prompt += '  DO — AddTags(tag: "full_cancellation_requested", note: cancel_reason)\n'
      prompt += '  CHECK cancel_reason:\n'
      prompt += `    IF cancel_reason in [${actionRouting.manualReview.join(', ')}]:\n`
      prompt += '      SAY — "This reason requires manual review. Let me connect you with an agent."\n'
      prompt += '      GOTO exit_agent\n'
      prompt += '    IF ineligible:\n'
      prompt += '      SAY — "This order isn\'t eligible for cancellation. Let me connect you with an agent."\n'
      prompt += '      GOTO exit_success\n'
      prompt += '```\n\n'
    }

    // PARTIAL CANCELLATION
    if (partialCancellation.enabled) {
      prompt += '```markdown\n'
      prompt += 'SECTION: partial_cancellation\n'
      prompt += '  DO — GetOrders(order_id) → save as `order_items`\n'
      prompt += '  ASK — "Which items would you like to cancel?"\n'
      prompt += '    → Options: [order_items] + All\n'
      prompt += '    → save as `selected_items`\n'
      prompt += '  CHECK selected_items:\n'
      prompt += '    IF "All" → GOTO full_cancellation\n'
      if (cancellationReasons.askReason) {
        prompt += '  ASK — "Cancellation reason?" → Options: [same 9 options] → save as `cancel_reason`\n'
      }
      if (partialCancellation.action === 'agent_review') {
        prompt += '  DO — AddTags(tag: "partial_cancellation_requested", note: "cancel_reason | selected_items")\n'
        prompt += '  SAY — "Partial cancellations are handled by our team. Let me connect you with an agent."\n'
        prompt += '  GOTO exit_agent\n'
      } else {
        if (cancellationAction.performCancellation) prompt += '  DO — PartialOrderCancellation(order_id, selected_items)\n'
        if (cancellationAction.addTag) prompt += `  DO — AddTags(tag: "${cancellationAction.tagName}", note: "cancel_reason | selected_items")\n`
        prompt += '  SAY — "Your selected items have been cancelled."\n'
        prompt += '  GOTO exit_success\n'
      }
      prompt += '```\n\n'
    }

    // EXIT SECTIONS
    prompt += '```markdown\n'
    prompt += 'SECTION: exit_success\n'
    prompt += '  (exit_reason = "task_success")\n'
    prompt += '```\n\n'
    prompt += '```markdown\n'
    prompt += 'SECTION: exit_agent\n'
    prompt += '  (exit_reason = "talk_to_an_agent")\n'
    prompt += '```'

    return prompt
  }, [config])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPrompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="pc-container">
      {/* Configuration Panel */}
      <div className="pc-config-panel">
        <div className="pc-config-content">
          <h1 className="pc-title">Order Cancellation Flow Configuration</h1>

          {/* Order Authentication */}
          <ConfigSection title="Order Authentication" expanded={expandedSections.orderAuth} onToggle={() => toggleSection('orderAuth')}>
            <div className="pc-space-y-4">
              <Toggle label="Enable Order Authentication" checked={config.orderAuth.enabled} onChange={(v) => updateConfig('orderAuth.enabled', v)} />
              {config.orderAuth.enabled && (
                <Select label="Authentication Type" value={config.orderAuth.authType} onChange={(v) => updateConfig('orderAuth.authType', v)}
                  options={[
                    { value: 'order_number', label: 'Order Number' },
                    { value: 'name', label: 'Customer Name' },
                    { value: 'email', label: 'Email Address' },
                    { value: 'phone', label: 'Phone Number' }
                  ]}
                />
              )}
            </div>
          </ConfigSection>

          {/* Cancellation Type */}
          <ConfigSection title="Cancellation Type" expanded={expandedSections.cancellationType} onToggle={() => toggleSection('cancellationType')}>
            <div className="pc-space-y-4">
              <Toggle label="Allow Partial Cancellation" checked={config.partialCancellation.enabled} onChange={(v) => updateConfig('partialCancellation.enabled', v)} description="Let customers cancel specific items instead of the full order" />
              {config.partialCancellation.enabled && (
                <Select label="Partial Cancellation Action" value={config.partialCancellation.action} onChange={(v) => updateConfig('partialCancellation.action', v)}
                  options={[
                    { value: 'agent_review', label: 'Send to Agent Review' },
                    { value: 'auto_cancel', label: 'Auto-Cancel Items' }
                  ]}
                />
              )}
            </div>
          </ConfigSection>

          {/* Cancellation Reasons */}
          <ConfigSection title="Cancellation Reasons" expanded={expandedSections.reasons} onToggle={() => toggleSection('reasons')}>
            <div className="pc-space-y-4">
              <Toggle label="Ask for Cancellation Reason" checked={config.cancellationReasons.askReason} onChange={(v) => updateConfig('cancellationReasons.askReason', v)} />
              {config.cancellationReasons.askReason && (
                <div className="pc-space-y-2">
                  <label className="pc-label">Enabled Reasons</label>
                  {config.cancellationReasons.reasons.map((reason) => (
                    <div key={reason.id} className="pc-checkbox-item">
                      <input type="checkbox" id={`reason-${reason.id}`} checked={reason.enabled}
                        onChange={(e) => {
                          const newReasons = config.cancellationReasons.reasons.map(r =>
                            r.id === reason.id ? { ...r, enabled: e.target.checked } : r
                          )
                          updateConfig('cancellationReasons.reasons', newReasons)
                        }}
                        className="pc-checkbox"
                      />
                      <label htmlFor={`reason-${reason.id}`} className="pc-checkbox-label">{reason.label}</label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ConfigSection>

          {/* Eligibility Rules */}
          <ConfigSection title="Eligibility Rules" expanded={expandedSections.eligibility} onToggle={() => toggleSection('eligibility')}>
            <div className="pc-space-y-4">
              <NumberInput label="Days Since Order Placed" value={config.eligibility.daysSinceOrder} onChange={(v) => updateConfig('eligibility.daysSinceOrder', v)} min={1} max={30} />
              <div>
                <label className="pc-label">Eligible Order Status</label>
                <div className="pc-info-box">Currently: Unfulfilled orders only</div>
              </div>
            </div>
          </ConfigSection>

          {/* Action Routing */}
          <ConfigSection title="Action Routing" expanded={expandedSections.actions} onToggle={() => toggleSection('actions')}>
            <div className="pc-space-y-6">
              <ReasonSelector label="Auto-Cancel Reasons" description="These reasons will automatically cancel the order" selectedReasons={config.actionRouting.autoCancel} availableReasons={config.cancellationReasons.reasons.filter(r => r.enabled)} onChange={(v) => updateConfig('actionRouting.autoCancel', v)} />
              <ReasonSelector label="Reconfirm Reasons" description="These reasons will ask for user confirmation before cancelling" selectedReasons={config.actionRouting.reconfirm} availableReasons={config.cancellationReasons.reasons.filter(r => r.enabled)} onChange={(v) => updateConfig('actionRouting.reconfirm', v)} />
              <ReasonSelector label="Manual Review Reasons" description="These reasons will route to an agent for manual review" selectedReasons={config.actionRouting.manualReview} availableReasons={config.cancellationReasons.reasons.filter(r => r.enabled)} onChange={(v) => updateConfig('actionRouting.manualReview', v)} />
            </div>
          </ConfigSection>

          {/* Advanced Settings */}
          <ConfigSection title="Advanced Settings" expanded={expandedSections.advanced} onToggle={() => toggleSection('advanced')}>
            <div className="pc-space-y-6">
              <div className="pc-space-y-4">
                <h4 className="pc-subsection-title">Cancellation Action</h4>
                <Toggle label="Add Order Tag" checked={config.cancellationAction.addTag} onChange={(v) => updateConfig('cancellationAction.addTag', v)} />
                {config.cancellationAction.addTag && (
                  <TextInput label="Tag Name" value={config.cancellationAction.tagName} onChange={(v) => updateConfig('cancellationAction.tagName', v)} placeholder="cancelled_by_manifest" />
                )}
                <Toggle label="Perform Automatic Cancellation" checked={config.cancellationAction.performCancellation} onChange={(v) => updateConfig('cancellationAction.performCancellation', v)} description="If disabled, orders will only be tagged for manual cancellation" />
              </div>
              <div className="pc-space-y-4 pc-divider">
                <h4 className="pc-subsection-title">Reconfirmation Message</h4>
                <TextInput label="Message Text" value={config.reconfirmSettings.message} onChange={(v) => updateConfig('reconfirmSettings.message', v)} placeholder="Would you like to continue?" />
              </div>
            </div>
          </ConfigSection>
        </div>
      </div>

      {/* Preview Panel */}
      <div className="pc-preview-panel">
        <div className="pc-preview-header">
          <h2 className="pc-preview-title">Generated Prompt</h2>
          <button onClick={copyToClipboard} className="pc-copy-btn">
            {copied ? <><Check size={15} /> Copied!</> : <><Copy size={15} /> Copy Prompt</>}
          </button>
        </div>
        <div className="pc-preview-content">
          <pre className="pc-preview-code">{generatedPrompt}</pre>
        </div>
      </div>
    </div>
  )
}


// --- Sub-components ---

function ConfigSection({ title, expanded, onToggle, children }) {
  return (
    <div className="pc-section">
      <button onClick={onToggle} className="pc-section-header">
        <h3 className="pc-section-title">{title}</h3>
        {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
      </button>
      {expanded && <div className="pc-section-content">{children}</div>}
    </div>
  )
}

function Toggle({ label, checked, onChange, description }) {
  return (
    <div className="pc-toggle-container" onClick={() => onChange(!checked)}>
      <div className="pc-toggle-content">
        <span className="pc-toggle-label">{label}</span>
        {description && <p className="pc-toggle-description">{description}</p>}
      </div>
      <div className="pc-toggle-switch">
        <input type="checkbox" checked={checked} readOnly />
        <div className={`pc-toggle-track ${checked ? 'on' : 'off'}`}>
          <div className={`pc-toggle-thumb ${checked ? 'on' : ''}`} />
        </div>
      </div>
    </div>
  )
}

function Select({ label, value, onChange, options }) {
  return (
    <div>
      <label className="pc-label">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="pc-select">
        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
    </div>
  )
}

function TextInput({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="pc-label">{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="pc-input" />
    </div>
  )
}

function NumberInput({ label, value, onChange, min, max }) {
  return (
    <div>
      <label className="pc-label">{label}</label>
      <input type="number" value={value} onChange={(e) => onChange(parseInt(e.target.value) || min)} min={min} max={max} className="pc-input" />
    </div>
  )
}

function ReasonSelector({ label, description, selectedReasons, availableReasons, onChange }) {
  const toggleReason = (reasonId) => {
    if (selectedReasons.includes(reasonId)) {
      onChange(selectedReasons.filter(id => id !== reasonId))
    } else {
      onChange([...selectedReasons, reasonId])
    }
  }

  return (
    <div>
      <label className="pc-label" style={{ color: 'var(--text-primary)' }}>{label}</label>
      {description && <p className="pc-toggle-description" style={{ marginBottom: 10 }}>{description}</p>}
      <div className="pc-space-y-2">
        {availableReasons.map((reason) => (
          <div key={reason.id} className="pc-checkbox-item">
            <input type="checkbox" id={`${label}-${reason.id}`} checked={selectedReasons.includes(reason.id)} onChange={() => toggleReason(reason.id)} className="pc-checkbox" />
            <label htmlFor={`${label}-${reason.id}`} className="pc-checkbox-label">{reason.label}</label>
          </div>
        ))}
      </div>
      {selectedReasons.length > 0 && (
        <div className="pc-reason-info">Selected IDs: [{selectedReasons.join(', ')}]</div>
      )}
    </div>
  )
}

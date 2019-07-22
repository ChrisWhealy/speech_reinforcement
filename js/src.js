/***********************************************************************************************************************
 * Speech Reinforcement Calculator (SRC)
 * 
 * (c) Chris Whealy 2019
 **********************************************************************************************************************/

// Identity funtion
const idiot = val => val

// A useful version of the Array.push()
const push = (el, arr) => (_ => arr)(arr.push(el))

const onlyDirection = dir => (acc, field) => field.direction === dir ? push(field, acc) : acc

// Partial functions for filtering in/outbound parameters from the metadata object
const filterInbound  = onlyDirection("in")
const filterOutbound = onlyDirection("out")

// Fetch required input values from the DOM
const fetchElementValue = parseFn => elementId => parseFn(document.getElementById(elementId).value)

const fetchFloat = fetchElementValue(parseFloat)
const fetchInt   = fetchElementValue(parseInt)
const fetchText  = fetchElementValue(idiot)

// Slice off the "$" character at the start of all numeric values returned from Rust via wasm-bindgen
const writeFloat = (elementId, val) => document.getElementById(elementId).value = val.slice(1)

// Static URLs to the tick and cross icons
const url_tick  = "<img src='./img/icon_tick_32.png'>"
const url_cross = "<img src='./img/icon_cross_32.png'>"

// Boolean values are represented using the tick and cross icons
const writeBooleanImg =
  (elementId, bool) =>
    document.getElementById(elementId).innerHTML = bool ? url_tick : url_cross

// Display range slider value and convert its metric value to imperial units
const show_and_convert_units = field => 
  ((value, value_el, unit_el) => {
    value_el ? show_units(value, value_el, field)   : undefined
    unit_el  ? convert_units(value, unit_el, field) : undefined
  })
  ( fetchText(field.id)
  , document.getElementById(`${field.id}_value`)
  , document.getElementById(`${field.id}_units`))

// Display range slider value
const show_units =
  (val, el, field) =>
    el.innerHTML = `${val} ${field.type !== "int" ? field.units : ""}`

// Convert units
const convert_units =
  (val, el, field) =>
    el ? el.innerHTML = to_imperial(field.units, val)
       : undefined

// Convert metric units to imperial
const to_imperial = (units, val) => {
  let result = null

  switch(units) {
    case "m":
      let m_as_inches = val * 39.3701
      result = `(${Math.floor(m_as_inches / 12)} ft ${Number.parseFloat(m_as_inches % 12).toFixed(2)} in)`
      break

    default:
  }

  return result
}

/***********************************************************************************************************************
 * The metadata object defines which HTML elements the WASM module should expect already to be present in the DOM.
 * 
 * The order of the fields with direction:"in" must match the argument order expected by the WASM function pag_calculator
 *
 * The value of the "id" property below must match the corresponding id of the input field in the DOM
 *
 * The value of "units" property is needed primarily for metric to imperial conversion but is maintained for all
 * values for consistency and potential future use
 *
 * The "direction" field indicates the direction of data flow with respect to the WASM module.  Fields having a
 * direction of "out" correspond to read only HTML elements
 *
 * The "fetch" and "update" properties are set to the function name needed to read or write the value to or from the
 * corresponding HTML element
 *
 * The WASM moduile returns a Rust struct that has been serialized by Serde into a JavaScript object
 **********************************************************************************************************************/
const dom_metadata = [
  { id : "source_to_mic",          type : "float",   units : "m",    direction: "in",  fetch : fetchFloat, update : null }
, { id : "source_to_listener",     type : "float",   units : "m",    direction: "in",  fetch : fetchFloat, update : null }
, { id : "source_to_listener_max", type : "float",   units : "m",    direction: "in",  fetch : fetchFloat, update : null }
, { id : "nom",                    type : "int",     units : "each", direction: "in",  fetch : fetchInt,   update : null }
, { id : "speaker_to_mic",         type : "float",   units : "m",    direction: "in",  fetch : fetchFloat, update : null }
, { id : "speaker_to_listener",    type : "float",   units : "m",    direction: "in",  fetch : fetchFloat, update : null }
, { id : "fsm",                    type : "float",   units : "dB",   direction: "in",  fetch : fetchFloat, update : null }
, { id : "nom_gain_loss",          type : "float",   units : "dB",   direction: "out", fetch : null,       update : writeFloat }
, { id : "pag",                    type : "float",   units : "dB",   direction: "out", fetch : null,       update : writeFloat }
, { id : "pag_after_nom",          type : "float",   units : "dB",   direction: "out", fetch : null,       update : writeFloat }
, { id : "pag_after_nom_fsm",      type : "float",   units : "dB",   direction: "out", fetch : null,       update : writeFloat }
, { id : "nag",                    type : "float",   units : "dB",   direction: "out", fetch : null,       update : writeFloat }
, { id : "safe",                   type : "boolean", units : null,   direction: "out", fetch : null,       update : writeBooleanImg }
]

const inbound  = dom_metadata.reduce(filterInbound, [])
const outbound = dom_metadata.reduce(filterOutbound, [])

/***********************************************************************************************************************
 * Invoke the WASM function via the generated JavaScript function "pag_calculator"
 */
const calculate_pag = () => {
  let current_field_values = inbound.map(field => field.fetch(field.id))
  let wasm_response        = pag_calculator.apply(null, current_field_values)

  outbound.map(field => field.update(field.id, wasm_response[field.id]))
}

/***********************************************************************************************************************
 * This function must be called everytime an input value changes
 */
const update_screen = () => {
  dom_metadata.map(show_and_convert_units)
  calculate_pag()
}
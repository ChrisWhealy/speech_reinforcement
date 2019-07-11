// *********************************************************************************************************************
// Speech Reinforcement Calculator (SRC)
// 
// (c) Chris Whealy 2019
// *********************************************************************************************************************
extern crate wasm_bindgen;
extern crate libm;

#[macro_use]
extern crate serde_derive;

use wasm_bindgen::prelude::*;
use wasm_bindgen::JsValue;

use libm::log10;

#[derive(Serialize)]
pub struct PagData {
  pub nom_gain_loss:     String
, pub pag:               String
, pub pag_after_nom:     String
, pub pag_after_nom_fsm: String
, pub nag:               String
, pub safe:              bool
}

// *********************************************************************************************************************
// Interface to browser functionality
// *********************************************************************************************************************
#[wasm_bindgen]
extern "C" {
  #[wasm_bindgen(js_namespace = console)]
  fn log(s: &str);
}

// *********************************************************************************************************************
// Public API
// *********************************************************************************************************************
#[wasm_bindgen]
pub fn pag_calculator( src_to_mic: f64
                     , src_to_lstnr: f64
                     , src_to_lstnr_max: f64
                     , nom: u8
                     , spkr_to_mic: f64
                     , spkr_to_lstnr: f64
                     , fsm: f64
                     )
                     -> JsValue {

  let nom_loss = 10.0 * log10(nom as f64);
  let pag      = 20.0 * log10((src_to_lstnr_max * spkr_to_mic) / (src_to_mic * spkr_to_lstnr));
  let pag_nom  = pag - nom_loss;
  let pag_fsm  = pag_nom - fsm;
  let nag      = 20.0 * log10(src_to_lstnr_max / src_to_lstnr);

  let response = PagData {
    nom_gain_loss:     format!("${:.*}", 2, nom_loss)
  , pag:               format!("${:.*}", 2, pag)
  , pag_after_nom:     format!("${:.*}", 2, pag_nom)
  , pag_after_nom_fsm: format!("${:.*}", 2, pag_fsm)
  , nag:               format!("${:.*}", 2, nag)
  , safe:              nag < pag_fsm
  };

  JsValue::from_serde(&response).unwrap()
}


// *********************************************************************************************************************
// Start here, but don't do anything yet...
// *********************************************************************************************************************
#[wasm_bindgen(start)]
pub fn main() -> Result<(), JsValue> {
  Ok(())
}



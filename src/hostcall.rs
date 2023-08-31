use crate::{JsRequest, JsResponse};
use anyhow::Result;
use land_sdk::http::{fetch, Body, RedirectPolicy, RequestOptions};
use quickjs_wasm_rs::{
    from_qjs_value, Deserializer, JSContextRef, JSValue, JSValueRef, Serializer,
};
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, str::FromStr};

#[derive(Serialize, Deserialize, Debug)]
struct JsFetchOptions {
    pub timeout: u32,
    pub redirect: String,
}

fn read_body(context: &JSContextRef, _this: JSValueRef, args: &[JSValueRef]) -> Result<JSValue> {
    if args.len() != 1 {
        return Err(anyhow::anyhow!("read_body requires 1 argument"));
    }
    let body_handle = args[0].as_u32_unchecked();
    if body_handle == 0 {
        return Err(anyhow::anyhow!("read_body requires a valid body handle"));
    }
    let body = Body::from_handle(body_handle);
    let (value, ok) = body.read(0)?;
    let object = context.object_value()?;
    object.set_property("done", context.value_from_bool(ok)?)?;
    object.set_property("value", context.array_buffer_value(value.as_slice())?)?;
    from_qjs_value(object)
}

fn fetch_request(
    context: &JSContextRef,
    _this: JSValueRef,
    args: &[JSValueRef],
) -> Result<JSValue> {
    if args.len() < 1 {
        return Err(anyhow::anyhow!("fetch_request requires 1 argument"));
    }
    let deserializer = &mut Deserializer::from(args[0]);
    let js_request =
        JsRequest::deserialize(deserializer).expect("fetch_request deserialize failed");

    // convert js options to sdk request options
    let options = if args.len() > 1 {
        let deserializer = &mut Deserializer::from(args[1]);
        let js_options = JsFetchOptions::deserialize(deserializer)
            .expect("fetch_request deserialize options failed");
        RequestOptions {
            timeout: js_options.timeout,
            redirect: match js_options.redirect.as_str() {
                "follow" => RedirectPolicy::Follow,
                "error" => RedirectPolicy::Error,
                "manual" => RedirectPolicy::Manual,
                _ => land_sdk::http::RedirectPolicy::Follow,
            },
        }
    } else {
        RequestOptions::default()
    };
    
    // convert js_request to sdk request
    let builder = http::Request::builder()
        .method(http::Method::from_str(&js_request.method.as_str())?)
        .uri(js_request.uri.clone());
    let request = if js_request.body_handle > 0 {
        builder.body(Body::from_handle(js_request.body_handle))?
    } else {
        builder.body(Body::from(js_request.body.unwrap().as_slice()))?
    };

    // call sdk fetch
    let response = fetch(request, options)?;

    // convert sdk response to js response
    let mut headers = HashMap::new();
    response.headers().iter().for_each(|(key, value)| {
        headers.insert(
            key.as_str().to_string(),
            value.to_str().unwrap().to_string(),
        );
    });
    let js_response = JsResponse {
        status: response.status().into(),
        headers,
        body: None,
        body_handle: Some(response.body().body_handle()),
    };

    // serialize js response to js response object
    let mut serializer = Serializer::from_context(context)?;
    js_response.serialize(&mut serializer)?;
    let js_request_value = serializer.value;
    from_qjs_value(js_request_value)
}

pub fn register(context: &JSContextRef) -> Result<()> {
    let hostcall = context.object_value()?;
    hostcall.set_property("read_body", context.wrap_callback(read_body)?)?;
    hostcall.set_property("fetch_request", context.wrap_callback(fetch_request)?)?;
    context
        .global_object()?
        .set_property("hostcall", hostcall)?;
    Ok(())
}

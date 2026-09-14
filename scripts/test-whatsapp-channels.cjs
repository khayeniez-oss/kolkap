/* Offline regression tests. No credentials, network, customer messages or credits. */
const test = require("node:test");
const assert = require("node:assert/strict");
const { createHmac } = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const root = path.resolve(__dirname, "..");
const compiled = new Map();

const env = {
  NEXT_PUBLIC_SUPABASE_URL: "https://database.invalid",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "unit-anon",
  SUPABASE_SERVICE_ROLE_KEY: "unit-service",
  META_APP_ID: "123",
  META_APP_SECRET: "unit-app-secret",
  META_GRAPH_VERSION: "v23.0",
  META_WHATSAPP_PHONE_NUMBER_ID: "999",
  META_WHATSAPP_BUSINESS_ACCOUNT_ID: "888",
};

function load(file, options = {}) {
  const filename = path.join(root, file);
  if (!compiled.has(filename)) {
    compiled.set(filename, ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText);
  }
  const exports = {};
  const modules = options.modules || {};
  vm.runInNewContext(compiled.get(filename), {
    exports, Buffer, URL, Response, Request, AbortSignal, setTimeout, clearTimeout,
    process: { env: options.env || {} },
    console: { error() {}, warn() {}, log() {} },
    fetch: options.fetch || (() => { throw new Error("Unexpected network request in offline test"); }),
    require(name) {
      if (Object.hasOwn(modules, name)) return modules[name];
      if (name === "server-only") return {};
      if (name.startsWith("@/")) return load(`src/${name.slice(2)}.ts`, options);
      return require(name);
    },
  }, { filename });
  return exports;
}

function database(initial = {}, fail = () => false) {
  const rows = structuredClone(initial);
  const calls = [];
  let sequence = 0;
  const client = {
    auth: { getUser: async () => ({ data: { user: { id: "owner" } }, error: null }) },
    from(table) {
      let operation = "select", values, single = false;
      const filters = [];
      const query = {
        select() { return query; },
        eq(k, v) { filters.push((row) => row[k] === v); return query; },
        neq(k, v) { filters.push((row) => row[k] !== v); return query; },
        is(k, v) { filters.push((row) => (row[k] ?? null) === v); return query; },
        in(k, v) { filters.push((row) => v.includes(row[k])); return query; },
        order() { return query; }, limit() { return query; },
        insert(v) { operation = "insert"; values = v; return query; },
        update(v) { operation = "update"; values = v; return query; },
        upsert(v) { operation = "upsert"; values = v; return query; },
        single() { single = true; return query; },
        maybeSingle() { single = true; return query; },
        then(resolve, reject) {
          const call = { table, operation, values };
          calls.push(call);
          if (fail(call)) return Promise.resolve({ data: null, error: { code: "unit_failure" } }).then(resolve, reject);
          rows[table] ||= [];
          let matching = rows[table].filter((row) => filters.every((filter) => filter(row)));
          if (operation === "insert" || operation === "upsert") {
            const row = { id: `record-${++sequence}`, ...values };
            rows[table].push(row);
            matching = [row];
          } else if (operation === "update") {
            matching.forEach((row) => Object.assign(row, values));
          }
          return Promise.resolve({ data: structuredClone(single ? matching[0] || null : matching), error: null }).then(resolve, reject);
        },
      };
      return query;
    },
  };
  return { client, calls, rows };
}

const sign = (body, secret = env.META_APP_SECRET) =>
  `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;

const security = load("src/lib/whatsapp/webhookSecurity.ts");
test("webhook signatures: missing secrets/headers, malformed, altered body, primary and legacy secrets", () => {
  const body = '{"text":"Hello 👋"}';
  assert.equal(security.verifyWhatsAppSignature(body, sign(body), []), false);
  assert.equal(security.verifyWhatsAppSignature(body, null, [env.META_APP_SECRET]), false);
  for (const signature of ["sha256=a", "sha256=" + "z".repeat(64), "sha1=" + "a".repeat(64)]) {
    assert.equal(security.verifyWhatsAppSignature(body, signature, [env.META_APP_SECRET]), false);
  }
  const secrets = security.getWhatsAppAppSecrets({ ...env, META_WHATSAPP_APP_SECRET: "legacy" });
  assert.equal(security.verifyWhatsAppSignature(body, sign(body), secrets), true);
  assert.equal(security.verifyWhatsAppSignature(body, sign(body, "legacy"), secrets), true);
  assert.equal(security.verifyWhatsAppSignature(body + " ", sign(body), secrets), false);
  assert.equal(security.verifyWhatsAppSignature(body, sign(body, "wrong"), secrets), false);
});

test("internal routing requires the configured phone and WABA; missing config matches nothing", () => {
  assert.equal(security.isInternalWhatsAppNumber("999", "888", env), true);
  assert.equal(security.isInternalWhatsAppNumber("999", "other", env), false);
  assert.equal(security.isInternalWhatsAppNumber("100", "888", env), false);
  assert.equal(security.isInternalWhatsAppNumber("", "", {}), false);
});

test("tokens must belong to the workspace and must not be expired or malformed", () => {
  const token = { workspace_id: "workspace", meta_access_token: "test", meta_token_expires_at: null };
  assert.equal(security.hasUsableWhatsAppSecret(token, "workspace"), true);
  assert.equal(security.hasUsableWhatsAppSecret(token, "other"), false);
  for (const expiry of ["2000-01-01T00:00:00Z", "invalid"]) {
    assert.equal(security.hasUsableWhatsAppSecret({ ...token, meta_token_expires_at: expiry }, "workspace"), false);
  }
  assert.equal(security.hasUsableWhatsAppSecret(null, "workspace"), false);
});

const signup = load("src/lib/whatsapp/embeddedSignup.ts");
const event = { type: "WA_EMBEDDED_SIGNUP", event: "FINISH", data: { phone_number_id: "100", waba_id: "200" } };
const info = signup.parseEmbeddedSignupEvent("https://www.facebook.com", event);
test("signup only accepts known HTTPS origins, completion events and numeric IDs", () => {
  assert.equal(info.phone_number_id, "100");
  for (const origin of ["https://facebook.com.evil.invalid", "https://evilfacebook.com", "http://www.facebook.com", "null"]) {
    assert.equal(signup.parseEmbeddedSignupEvent(origin, event), null);
  }
  assert.equal(signup.parseEmbeddedSignupEvent("https://www.facebook.com", "not json"), null);
  assert.equal(signup.parseEmbeddedSignupEvent("https://www.facebook.com", { ...event, event: "UNKNOWN" }), null);
  assert.equal(signup.parseEmbeddedSignupEvent("https://www.facebook.com", { ...event, data: {} }), null);
  const coex = signup.parseEmbeddedSignupEvent("https://www.facebook.com", { ...event, event: "FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING" });
  assert.equal(signup.isSignupCompletion(coex), true);
  assert.equal(coex.phone_number_id, "100");
});

test("number options select separate Meta flows and require international numbers", () => {
  assert.equal(signup.getSignupFeatureType("existing_business_app"), "whatsapp_business_app_onboarding");
  assert.equal(signup.getSignupFeatureType("new_number"), "whatsapp_embedded_signup");
  assert.equal(signup.normalizeSignupPhone("+61 (400) 000-000"), "+61400000000");
  for (const value of ["0400000000", "+123", "+01234567", "+61400000000 ext 9", "+1234567890123456"]) {
    assert.equal(signup.normalizeSignupPhone(value), "");
  }
});

test("signup completion before login callback uses this attempt's details", async () => {
  const attempt = signup.createEmbeddedSignupAttempt();
  attempt.accept(info);
  assert.equal(attempt.claim(), true);
  assert.equal(attempt.claim(), false);
  assert.equal((await attempt.waitForCompletion()).phone_number_id, "100");
});

test("signup login callback before completion waits, not an empty stale render", async () => {
  const attempt = signup.createEmbeddedSignupAttempt();
  const result = attempt.waitForCompletion();
  attempt.accept(info);
  assert.equal((await result).waba_id, "200");
  assert.equal(attempt.accept({ event: "CANCEL" }), false);
});

test("signup missing completion times out and cancellation rejects pending waits", async () => {
  const timeout = signup.createEmbeddedSignupAttempt(5);
  await assert.rejects(timeout.waitForCompletion(), /did not return/);
  const cancelled = signup.createEmbeddedSignupAttempt();
  const waiting = cancelled.waitForCompletion();
  cancelled.accept({ event: "CANCEL" });
  await assert.rejects(waiting, /cancelled/);
  assert.equal(cancelled.claim(), false);
});

test("a new signup attempt cannot reuse details from an older attempt", async () => {
  const first = signup.createEmbeddedSignupAttempt();
  first.accept(info);
  first.cancel();
  const second = signup.createEmbeddedSignupAttempt(5);
  await assert.rejects(second.waitForCompletion(), /did not return/);
});

const graphInput = { graphVersion: "v23.0", wabaId: "200", phoneNumberId: "100", accessToken: "unit-token" };
test("Meta phone validation checks WABA membership with bounded, fixed-origin pagination", async () => {
  const calls = [];
  const meta = load("src/lib/whatsapp/metaOnboarding.ts", { fetch: async (url, init) => {
    calls.push({ url: String(url), init });
    if (String(url).includes("/100?")) return Response.json({ id: "100", is_on_biz_app: false, status: "CONNECTED" });
    return Response.json(calls.length === 1
      ? { data: [], paging: { cursors: { after: "cursor1" }, next: "https://evil.invalid/?token=leak" } }
      : { data: [{ id: "100", display_phone_number: "+61 400 000 000", verified_name: "Verified" }] });
  } });
  const phone = await meta.verifyMetaWhatsAppPhone(graphInput);
  assert.equal(phone.verified_name, "Verified");
  assert.equal(calls.length, 3);
  assert.ok(calls.every((call) => call.url.startsWith("https://graph.facebook.com/v23.0/")));
  assert.ok(calls.every((call) => !call.url.includes("unit-token")));
  assert.equal(calls[0].init.headers.Authorization, "Bearer unit-token");
});

test("wrong WABA/phone and provider errors fail validation instead of returning empty details", async () => {
  for (const result of [Response.json({ data: [{ id: "999" }] }), Response.json({ error: { message: "private" } }, { status: 403 })]) {
    const meta = load("src/lib/whatsapp/metaOnboarding.ts", { fetch: async () => result });
    await assert.rejects(meta.verifyMetaWhatsAppPhone(graphInput));
  }
});

test("webhook subscription requires explicit Meta success", async () => {
  for (const success of [false, true]) {
    const meta = load("src/lib/whatsapp/metaOnboarding.ts", { fetch: async (url, init) => {
      assert.equal(String(url), "https://graph.facebook.com/v23.0/200/subscribed_apps");
      assert.equal(init.method, "POST");
      return Response.json({ success });
    } });
    if (success) await meta.subscribeMetaWhatsAppAccount(graphInput);
    else await assert.rejects(meta.subscribeMetaWhatsAppAccount(graphInput), /not confirmed/);
  }
});

function signupRoute(db, fetch, extraEnv = {}) {
  return load("src/app/api/meta/whatsapp/embedded-signup/route.ts", {
    env: { ...env, ...extraEnv }, fetch,
    modules: { "@supabase/supabase-js": { createClient: () => db.client } },
  });
}
const signupBody = { code: "unit-code", workspace_id: "workspace", phone_number_id: "100", waba_id: "200", phone_number: "spoofed", number_option: "new_number", expected_phone_number: "+61400000000" };
function signupRequest(body = signupBody, authorization = "Bearer test-session") {
  return new Request("https://kolkap.invalid/api/meta/whatsapp/embedded-signup", {
    method: "POST", headers: { authorization, "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
}
function metaSuccess(url) {
  if (String(url).includes("oauth/access_token")) return Promise.resolve(Response.json({ access_token: "private-meta-token" }));
  if (String(url).includes("phone_numbers")) return Promise.resolve(Response.json({ data: [{ id: "100", display_phone_number: "+61400000000" }] }));
  if (String(url).includes("/100?")) return Promise.resolve(Response.json({ id: "100", is_on_biz_app: false, platform_type: "CLOUD_API", status: "CONNECTED" }));
  return Promise.resolve(Response.json({ success: true }));
}

test("signup unauthorized, incomplete IDs, foreign owner/staff/number are rejected before writes", async () => {
  const cases = [
    { authorization: "", expected: 401 },
    { body: { ...signupBody, waba_id: "" }, expected: 400 },
    { body: { ...signupBody, number_option: "unknown" }, expected: 400 },
    { body: { ...signupBody, expected_phone_number: "0400000000" }, expected: 400 },
    { owner: "other", expected: 403 },
    { body: { ...signupBody, selected_ai_staff_id: "foreign-staff" }, expected: 400 },
    { connections: [{ id: "foreign", workspace_id: "other", meta_phone_number_id: "100" }], expected: 409 },
    { body: { ...signupBody, phone_number_id: "999" }, expected: 409 },
  ];
  for (const scenario of cases) {
    const db = database({ business_workspaces: [{ id: "workspace", owner_user_id: scenario.owner || "owner" }], workspace_whatsapp_connections: scenario.connections || [] });
    const route = signupRoute(db);
    const result = await route.POST(signupRequest(scenario.body || signupBody, scenario.authorization ?? "Bearer test-session"));
    assert.equal(result.status, scenario.expected);
    assert.equal(db.calls.filter((call) => call.operation !== "select").length, 0);
  }
});

test("signup saves Meta-verified phone and private token separately, returning pending not connected", async () => {
  const db = database({ business_workspaces: [{ id: "workspace", owner_user_id: "owner" }] });
  const result = await signupRoute(db, metaSuccess).POST(signupRequest());
  assert.equal(result.status, 200);
  const body = await result.json();
  assert.equal(body.status, "pending");
  assert.equal(body.connection.display_phone_number, "+61400000000");
  assert.equal(JSON.stringify(body).includes("private-meta-token"), false);
  assert.equal(db.rows.whatsapp_connection_secrets[0].meta_access_token, "private-meta-token");
  assert.equal(body.connection.auto_reply_enabled, false);
  assert.equal(body.connection.selected_ai_staff_id, null);
});

test("mismatched entered number is rejected before subscriptions, registration or database writes", async () => {
  const db = database({ business_workspaces: [{ id: "workspace", owner_user_id: "owner" }] });
  const calls = [];
  const response = await signupRoute(db, (url, init) => { calls.push({ url: String(url), method: init.method }); return metaSuccess(url); })
    .POST(signupRequest({ ...signupBody, expected_phone_number: "+61499999999" }));
  assert.equal(response.status, 400);
  assert.ok(calls.every((call) => call.method === "GET"));
  assert.equal(db.calls.some((call) => call.operation !== "select"), false);
});

test("existing Business app option only accepts confirmed Coexistence and never calls register or delete", async () => {
  for (const verified of [false, true]) {
    const db = database({ business_workspaces: [{ id: "workspace", owner_user_id: "owner" }] });
    const calls = [];
    const fetch = (url, init) => {
      calls.push({ url: String(url), method: init.method });
      if (String(url).includes("/100?")) return Promise.resolve(Response.json({
        id: "100", is_on_biz_app: true, platform_type: verified ? "CLOUD_API" : "ON_PREMISE", status: "CONNECTED",
      }));
      return metaSuccess(url);
    };
    const response = await signupRoute(db, fetch).POST(signupRequest({ ...signupBody, number_option: "existing_business_app" }));
    assert.equal(response.status, verified ? 200 : 409);
    assert.equal(calls.some((call) => /register|deregister/.test(call.url) || call.method === "DELETE"), false);
    if (!verified) assert.equal(db.calls.some((call) => call.operation !== "select"), false);
  }
});

test("new-number path refuses a Business app number even if the client selects the wrong option", async () => {
  const db = database({ business_workspaces: [{ id: "workspace", owner_user_id: "owner" }] });
  const fetch = (url) => String(url).includes("/100?")
    ? Promise.resolve(Response.json({ id: "100", is_on_biz_app: true, platform_type: "CLOUD_API", status: "CONNECTED" })) : metaSuccess(url);
  assert.equal((await signupRoute(db, fetch).POST(signupRequest())).status, 409);
  assert.equal(db.calls.some((call) => call.operation !== "select"), false);
});

test("a new number stores its security PIN before registration and does not expose it", async () => {
  const db = database({ business_workspaces: [{ id: "workspace", owner_user_id: "owner" }] });
  let pin;
  const fetch = (url, init) => {
    if (String(url).includes("/100?")) return Promise.resolve(Response.json({ id: "100", is_on_biz_app: false, status: "PENDING" }));
    if (String(url).endsWith("/register")) {
      pin = JSON.parse(init.body).pin;
      assert.match(pin, /^\d{6}$/);
      assert.equal(db.rows.whatsapp_number_registration_secrets[0].registration_pin, pin);
    }
    return metaSuccess(url);
  };
  const response = await signupRoute(db, fetch).POST(signupRequest());
  assert.equal(response.status, 200);
  assert.equal((await response.text()).includes(pin), false);
});

test("registration failure leaves a failed connection with auto-reply off", async () => {
  const db = database({ business_workspaces: [{ id: "workspace", owner_user_id: "owner" }] });
  const fetch = (url) => {
    if (String(url).includes("/100?")) return Promise.resolve(Response.json({ id: "100", is_on_biz_app: false, status: "PENDING" }));
    if (String(url).endsWith("/register")) return Promise.resolve(Response.json({ success: false }));
    return metaSuccess(url);
  };
  assert.equal((await signupRoute(db, fetch).POST(signupRequest())).status, 502);
  assert.equal(db.rows.workspace_whatsapp_connections[0].status, "failed");
  assert.equal(db.rows.workspace_whatsapp_connections[0].auto_reply_enabled, false);
});

test("signup Meta subscription failure writes no fake connected row", async () => {
  const db = database({ business_workspaces: [{ id: "workspace", owner_user_id: "owner" }] });
  const fetch = (url) => String(url).includes("subscribed_apps") ? Promise.resolve(Response.json({ success: false })) : metaSuccess(url);
  const result = await signupRoute(db, fetch).POST(signupRequest());
  assert.equal(result.status, 502);
  assert.equal(db.calls.filter((call) => call.operation !== "select").length, 0);
});

test("signup secret-save failure leaves an attention state and never reports success", async () => {
  const db = database({ business_workspaces: [{ id: "workspace", owner_user_id: "owner" }] }, (call) => call.table === "whatsapp_connection_secrets");
  const result = await signupRoute(db, metaSuccess).POST(signupRequest());
  assert.equal(result.status, 500);
  assert.equal((await result.json()).success, false);
  assert.equal(db.rows.workspace_whatsapp_connections[0].status, "failed");
});


test("transport distinguishes explicit rejection from uncertain acceptance and sends callback identity", async () => {
  const input={to:"61411111111",message:"Hello",accessToken:"unit-token",phoneNumberId:"100",callbackId:"job-id"};
  for (const [status,uncertain] of [[400,false],[429,false],[500,true],[408,true]]) {
    const sender=load("src/lib/whatsapp/sendMessage.ts",{fetch:async()=>Response.json({error:{code:status}},{status})});
    await assert.rejects(()=>sender.sendMetaWhatsAppTextMessage(input),e=>e.uncertain===uncertain);
  }
  for(const fetch of [async()=>{throw new Error("network");},async()=>Response.json({})]){
    const sender=load("src/lib/whatsapp/sendMessage.ts",{fetch});
    await assert.rejects(()=>sender.sendMetaWhatsAppTextMessage(input),e=>e.uncertain===true);
  }
  const sender=load("src/lib/whatsapp/sendMessage.ts",{fetch:async(url,options)=>{
    assert.equal(JSON.parse(options.body).biz_opaque_callback_data,"job-id");
    assert.equal(options.headers.Authorization,"Bearer unit-token");
    return Response.json({messages:[{id:"out-1"}]});
  }});
  assert.equal((await sender.sendMetaWhatsAppTextMessage(input)).metaMessageId,"out-1");
});
test("reply window uses customer timestamp and rejects malformed/future time",()=>{
  const p=load("src/lib/whatsapp/policy.ts"),now=Date.now();
  assert.ok(p.isWhatsAppWindowOpen(new Date(now-1000).toISOString(),now));
  assert.ok(!p.isWhatsAppWindowOpen(new Date(now-86400000).toISOString(),now));
  assert.ok(!p.isWhatsAppWindowOpen(new Date(now+1000).toISOString(),now));
  assert.ok(!p.isWhatsAppWindowOpen("invalid",now));
  assert.equal(p.metaTimestamp("invalid"),null);
});
test("explicit human requests and role permissions",()=>{
  const p=load("src/lib/whatsapp/policy.ts");
  for(const text of ["human","Can I speak to a human?","Please connect me to someone","mau bicara dengan admin","gusto ko kausap ang tao"]) assert.ok(p.asksForHuman(text),text);
  assert.ok(!p.asksForHuman("What services do your real estate agents offer?"));
  assert.ok(p.canManageInbox({status:"active",role:"Admin",permission_level:"inbox"}));
  assert.ok(!p.canManageInbox({status:"active",role:"Admin",permission_level:"viewer"}));
  assert.ok(!p.canManageInbox({status:"disabled",permission_level:"admin"}));
});
function webhookWithHandlers(overrides={}) {
  return load("src/app/api/whatsapp/webhook/route.ts",{env,modules:{
    "@supabase/supabase-js":{createClient:()=>({})},
    "@/lib/kolkap-whatsapp-ai/generateReply":{},
    "@/lib/whatsapp/messages":{findWhatsAppConnection:async()=>({id:"conn",workspace_id:"workspace",meta_waba_id:"200",provider:"meta"}),receiveWhatsAppMessage:async()=>{},receiveWhatsAppStatus:async()=>{},...overrides}
  }});
}
function eventPayload(waba="200"){
  return {object:"whatsapp_business_account",entry:[{id:waba,changes:[{field:"messages",value:{messaging_product:"whatsapp",metadata:{phone_number_id:"100"},statuses:[{id:"out-1",status:"read"}]}}]}]};
}
function signedRequest(payload,signature){
  const body=JSON.stringify(payload);return new Request("https://kolkap.invalid/api/whatsapp/webhook",{method:"POST",body,headers:{"x-hub-signature-256":signature??sign(body)}});
}
test("signed delivery-only events are handled; wrong WABA and unsigned events are ignored",async()=>{
  let receipts=0;
  const route=webhookWithHandlers({receiveWhatsAppStatus:async()=>{receipts++;}});
  assert.equal((await route.POST(signedRequest(eventPayload()))).status,200);assert.equal(receipts,1);
  assert.equal((await route.POST(signedRequest(eventPayload("wrong")))).status,200);assert.equal(receipts,1);
  assert.equal((await route.POST(signedRequest(eventPayload(),""))).status,401);assert.equal(receipts,1);
});
test("partial webhook failures remain retryable",async()=>{
  const route=webhookWithHandlers({receiveWhatsAppStatus:async()=>{throw new Error("database unavailable");}});
  assert.equal((await route.POST(signedRequest(eventPayload()))).status,503);
});
test("templates are scoped to the verified WABA and server validates approved content",async()=>{
  const templates=load("src/lib/whatsapp/templates.ts",{env,modules:{
    "./server":{ChannelError:class extends Error{}},
    "./sendMessage":{metaGraphVersion:()=>"v25.0"},
    "./messages":{whatsappCredentials:async()=>({accessToken:"private",phoneNumberId:"100"})}
  },fetch:async url=>{
    assert.equal(new URL(url).pathname,"/v25.0/200/message_templates");
    return Response.json({data:[
      {id:"t1",name:"follow_up",language:"en",status:"APPROVED",components:[{type:"BODY",text:"Hello {{1}}"}]},
      {id:"t2",name:"draft",language:"en",status:"PENDING",components:[{type:"BODY",text:"Draft"}]},
      {id:"t3",name:"photo",language:"en",status:"APPROVED",components:[{type:"HEADER",format:"IMAGE"},{type:"BODY",text:"Photo"}]}
    ]});
  }});
  const connection={meta_waba_id:"200"};
  assert.equal((await templates.listReplyTemplates(connection)).length,1);
  assert.equal((await templates.buildReplyTemplate(connection,"t1",{"body:1":"Khaye"})).text,"Hello Khaye");
  await assert.rejects(()=>templates.buildReplyTemplate(connection,"t2",{}));
  await assert.rejects(()=>templates.buildReplyTemplate(connection,"t1",{}));
});

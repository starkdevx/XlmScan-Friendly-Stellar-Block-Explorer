# **Stellar Plain-English Explorer — Complete v0 Product & Technical Plan**



Recommended MVP scope

3–4 weeks

Solo developer



My recommendation is to build this as a **human-readable, natural-language Stellar explorer**, inspired by Helius Orb, rather than attempting to build another traditional block explorer or a full blockchain indexer.

The most important architectural decision is:

**Don't build your own indexer. Don't continuously ingest blockchain data. Don't use AI to interpret raw blockchain data without constraints.**

Instead, build an on-demand data retrieval and interpretation layer on top of existing Stellar infrastructure.

A user should be able to paste a wallet address, transaction hash, or ask a question like:

- "Who sent me USDC yesterday?"
- "How much XLM did this wallet send this month?"
- "What happened to my last transaction?"
- "Show me all the transactions where I received USDC."
- "Did this transaction actually succeed?"
- "What is this wallet doing on Stellar?"

And get an understandable answer without needing to know what an operation, ledger, trustline, XDR, or Soroban event means.

# **1. Product vision and positioning**

## **What are we actually building?**

Think about three different layers.

**1. User interface**

Build

# **Ask Stellar anything.**

A search interface where normal users enter wallet addresses, transaction hashes, contract IDs, or natural-language questions.

**2. Interpretation layer**

Core product

# **Understand what happened.**

An intent parser, transaction decoder, rule-based humanizer, and query engine turn blockchain information into readable explanations.

**3. Data layer**

Use existing infrastructure

# **Fetch only what's needed.**

Alchemy, QuickNode and Stellar APIs retrieve account balances, transaction information, and asset transfers on demand. MongoDB caches previously retrieved information.

The product is effectively a combination of:

- Block explorer: look up accounts and transactions.
- Natural-language interface: ask questions instead of building filters.
- Transaction explainer: understand what actually happened.
- Lightweight data index: preserve and organize information previously requested by users.

One distinction is important: v0 will not be a full blockchain indexer. You will be building an explorer and interpretation layer that relies on third-party indexed data and RPC providers.

This is an advantage. You can spend your time improving the user experience and explanations instead of maintaining blockchain infrastructure.

## **Reference product: Orb by Helius**

[Introducing Orb: Solana's New Block Explorer](https://images.openai.com/static-rsc-4/U9_wLT9SjWSrqxsSKv72bqa4ysG7IIhOHig5tavAZKfpC6gC802VjokjaSwSzFP1wYzbAEKqcu_h0ljBI_JP1B9jqYKmp9f4WH5ooCwkVeBD5OCQvbGE89Bw1ouz2AXso3lxxFGL6TYf6nh2Hus88_qOz3aPPB1WE9CHj1mUWdY?purpose=inline)

Orb is a useful reference because it focuses on making blockchain information understandable. Its transaction explainer uses parsed events and AI explanations, while its search and time filters make blockchain activity easier to inspect.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://orbmarkets.io\&sz=32)

Solana Block Explorer+1



However, I would not try to reproduce the entire Orb feature set.

For Stellar, your first competitive advantage should be:

**A user can ask a question about a Stellar wallet or transaction and get an accurate answer backed by actual on-chain data.**

# **2. What should v0 actually include?**

The biggest mistake would be trying to support every Stellar operation, every Soroban contract, unlimited historical data and arbitrary natural-language questions from day one.

I recommend three core capabilities.

**Feature 1 — Transaction Explorer**

P0

[Explore Endless | Endless](https://images.openai.com/static-rsc-4/kRwnU39nmof_tf6Tw4_t096xFw2-72y-J-PrDTvrqoY4GcvZv3AGTPrNw2RoV5c-ieywFZ_LyrRb6TXCsiGGCWv_yfuNDgkCwjo4hq8xR3ZkIUuvAPt_m3MKBMgxx8IKftcWMtuIijvLxYVdH_mWWdQoR9Y0_cXjP2cOFUdEDpo?purpose=inline)

[docs.endless.link](https://docs.endless.link/endless/devbuild/start/explore-endless?utm_source=chatgpt.com)

Accept a transaction hash and explain what happened.

Show:

- Success or failure.
- Sender and recipient.
- Assets and amounts transferred.
- Transaction fee.
- Ledger and timestamp.
- Memo, when present.
- Operations and their meaning.
- Soroban events when supported.

Example:

"This transaction successfully transferred 150 USDC from wallet GABC... to wallet GXYZ... The transaction was included in ledger 65,XXXX and charged a fee of 0.00001 XLM."

This should work without an AI call.

**Feature 2 — Wallet Explorer**

P0

[Web3 Explorer SaaS | Chainlens](https://images.openai.com/static-rsc-4/gTSFBEPeLF_urdNoAIa2N0fY9n2ORgyAca6c6p4HSzRuBq7tzBGp7d2ZPYOHr7velrk8Sal1mXT7xRdu_On38pkoIzZ7t50Aw0mCQuQX3rPxVqh0Ngp-zuRuw9dmUbVT0f_aSNQe82UsP5zDznjMuB9poi52ZpRx3-04WVURtIw?purpose=inline)

[chainlens.com](https://www.chainlens.com/solutions/web3-explorer-as-a-service?utm_source=chatgpt.com)

Accept a Stellar account address and show:

- XLM balance.
- Classic asset balances and trustlines.
- Soroban token balances, where supported.
- Recent incoming and outgoing transfers.
- Account activity summaries.
- Known account or issuer labels, when verified.

Example:

"This wallet currently holds 320 XLM and 1,250 USDC. During the last seven days, it received 500 USDC and sent 200 USDC."

The activity timeline in v0 should be explicitly described as transfer activity, not a complete record of every account operation.

**Feature 3 — Natural Language Explorer**

P0

[WalletChat AI | Conversational Blockchain Explorer](https://images.openai.com/static-rsc-4/F88zzKWrlEohSgRaABt9jVhwoOcencv-zvplL3vsPh3rsiTKizfaPwXDm0woomFj_QEt9QxrinicgYTaEAdR3qtj6j_EimBlkh-pYhBa6xR01g-9lyKwoCD4oLBjkIfCQ9e0fOwoRPql7pYaLFmWBn-yKiH4LfXjzEioK4S9DqY?purpose=inline)

[walletchat.fun](https://www.walletchat.fun/ai?utm_source=chatgpt.com)

Allow users to ask questions about one account or one transaction.

Examples:

- "What did this wallet receive today?"
- "How much USDC did it send this week?"
- "Show its last five transfers."
- "Who sent XLM to this account?"
- "How many transactions failed?"
- "What happened in this transaction?"

The AI identifies the user's intent and decides which predefined data lookup to execute. Actual amounts, counts and explanations are calculated from retrieved data, not invented by the model.

### **My recommended v0 input support**

| Input                         | v0 handling                                           |
| ----------------------------- | ----------------------------------------------------- |
| `G...` account address        | Full account lookup                                   |
| 64-character transaction hash | Transaction lookup                                    |
| `C...` contract ID            | Recognize; basic contract lookup is a later milestone |
| Natural-language question     | Supported account/transaction questions               |

I would postpone a full contract explorer initially. Contract IDs should still be recognized in the input router, but generic contract-state inspection, contract discovery and arbitrary Soroban function interpretation should be v0.1 features.

This keeps the three-week development target realistic.

# **3. The Stellar data infrastructure decision**

This is probably the most important technical part of the project.

You don't want to build an indexer, but you still need a reliable way to obtain:

1. Account balances.
2. Account transfer history.
3. Transaction details.
4. Contract events.
5. Available historical data range.

There is an important distinction between Stellar RPC, Horizon and indexed Data APIs.

## **Recommended providers**

[Alchemy](https://images.openai.com/static-rsc-4/zo02zib8Yt7mrKIk4acGf7i8Fj-8zAxgy4VgwniUDMEFccxXvWz4tIjuYHgeGUTLfektfPv41bSRzigzv-_kRh0CAgdiT0kgwcu4TbTJPiRSi-klpb0FGI6YYiWSD85kud4poCQzEVdPvMKVIKpgvyA_etbLcWgeYLTlE_HAULs?purpose=inline)

**Alchemy**

Recommended primary provider for v0

Primary

Alchemy is particularly interesting because it now provides both Stellar RPC and a separate Stellar Data API.

Its Data API supports:

- Unified account balances: XLM, classic trustline assets and Soroban contract tokens.
- Transfer history covering native, classic and Soroban assets.
- Filtering by sender and recipient.
- Pagination through `pageKey`.

This saves you from building wallet-history indexing yourself.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://www.alchemy.com\&sz=32)

Alchemy Docs+2



Useful endpoints:

`POST /data/stellar/balances`

`POST /data/stellar/transfers`

Its RPC also supports `getTransaction`, `getHealth`, `getEvents` and other Stellar methods.

Documentation: [Stellar Data API](https://www.alchemy.com/docs/reference/stellar-data-api-overview?utm_source=chatgpt.com) · [Stellar RPC](https://www.alchemy.com/docs/stellar/stellar-api-overview?utm_source=chatgpt.com)

[Download QuickNode Logo Vector Free | Logowik](https://images.openai.com/static-rsc-4/itgcNXoil4Y_fj-zqKrm9v9m9UYJw_Ot5iSzfAnugIM4slzj5jx9AFXK8U4QuRfDHMn37ABbrjPKGSkvCBI9h-WDQARxKPV2OGqDsSYeAurwGor-aAPn3pdUFDTG1cGR_O87-Eyrv05NUtpOXVTq1o5qa0D_ibMk0kFy8C003yA?purpose=inline)

**QuickNode**

Secondary provider / fallback candidate

Secondary

QuickNode offers:

- Stellar RPC.
- Horizon REST endpoints.
- Mainnet and testnet access.
- Account, transaction and ledger queries.

Its documentation currently lists approximately 60 days of mainnet Stellar RPC history and 90 days for mainnet Horizon, while testnet RPC is listed at approximately seven days. These figures are endpoint-specific and can change.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://www.quicknode.com\&sz=32)

Quicknode Docs+1



Documentation: [QuickNode Stellar APIs](https://www.quicknode.com/docs/stellar?utm_source=chatgpt.com) · [getHealth method](https://www.quicknode.com/docs/stellar/getHealth?utm_source=chatgpt.com)

### **An important correction about history**

Your original document treats the retention window as roughly seven days or 60 days depending on the provider.

That is a useful starting estimate, but it needs to be more precise.

The actual history available can differ between methods on the same provider.

For example:

- Alchemy's `getEvents` documentation describes a maximum seven-day recent ledger range and says its default event retention is 24 hours.&#x20;

  [image](https://www.google.com/s2/favicons?domain=https://www.alchemy.com\&sz=32)

  Alchemy Docs

- QuickNode documents a longer mainnet RPC window for its managed endpoint.&#x20;

  [image](https://www.google.com/s2/favicons?domain=https://www.quicknode.com\&sz=32)

  Quicknode Docs

- Alchemy's separate transfer Data API does not state a definitive historical retention depth in its overview. You need to test it.

Therefore, do not have a single global `historyDays` setting.

Maintain coverage information per provider and capability.

## **My proposed data-source configuration**

| Data requirement          | Primary             | Alternative            |
| ------------------------- | ------------------- | ---------------------- |
| Current balances          | Alchemy Data API    | QuickNode / Horizon    |
| Recent transfers          | Alchemy Data API    | QuickNode Horizon      |
| Transaction by hash       | Alchemy Stellar RPC | QuickNode Stellar RPC  |
| Soroban events            | Alchemy Stellar RPC | QuickNode Stellar RPC  |
| Ledger availability       | `getHealth`         | QuickNode `getHealth`  |
| Deep historical analytics | Not in v0           | Hubble / Galexie later |

Alchemy is my first choice because the unified balance and transfer APIs are especially useful for a consumer-facing explorer.

However, before committing, test its actual free-tier quotas, API availability and retention. Don't assume that every API or dataset is unlimited just because RPC access has a free account.

### **What about Horizon?**

There is something worth correcting in your original notes.

Horizon is moving into a legacy-focused role, but it is not accurate to treat it as an immediately removed API.

The Stellar Development Foundation describes Stellar RPC as the preferred starting point for new applications, while explicitly stating that RPC is not a historical indexer or a drop-in replacement for Horizon. Horizon continues receiving protocol updates but is not expected to gain new smart-contract features.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://stellar.org\&sz=32)

Stellar RPC has Arrived+1



My recommendation:

- Use Stellar RPC for modern chain data retrieval.
- Use Alchemy Data API for indexed transfers and balances.
- Keep Horizon behind an adapter for account activity where needed.
- Don't build new business logic directly around Horizon-specific response structures.

# **4. The most important architectural decision: AI should not generate blockchain answers**

This is where I would be particularly careful.

You want the application to feel intelligent and conversational, but blockchain data needs to be accurate.

Imagine someone asks:

"What happened to the 100 USDC I sent yesterday?"

You don't want an LLM to look at some raw transaction JSON and independently decide what happened.

Instead, separate the responsibilities.

**The natural-language query pipeline**

**User question**

What did this wallet receive this week?

**1. Intent parser (LLM)**

Extract address, direction, asset, time range and requested result.

**2. Query validator**

Validate the output against a fixed schema and allowed query types.

**3. Query executor**

Calls the appropriate Alchemy / QuickNode endpoint.

**4. Data normalizer**

Converts provider-specific JSON/XDR into canonical Stellar facts.

**5. Humanization engine**

Rule-based calculations and sentence generation from verified facts.

**Final response**

Readable explanation + evidence + source + time coverage.

## **4.1 Intent parser**

The LLM should only identify the user's intent and produce structured JSON.

For example:

User:

"How much USDC did this wallet receive in the last seven days?"

LLM output:

```
{
  "intent": "account_transfers",
  "address": "G...",
  "direction": "incoming",
  "asset": {
    "code": "USDC"
  },
  "time_range": {
    "from": "2026-11-12T00:00:00Z",
    "to": "2026-11-19T00:00:00Z"
  },
  "aggregation": "sum"
}
```

The application then validates this JSON using Zod.

The important thing is that the LLM cannot invent endpoints or generate arbitrary SQL/RPC methods.

## **4.2 Build only a few predefined query tools**

For v0, I recommend these tools:

| Tool                      | Responsibility                              |
| ------------------------- | ------------------------------------------- |
| `get_account_balances`    | Fetch current account balances              |
| `get_account_transfers`   | Find incoming/outgoing transfers            |
| `get_transaction_details` | Fetch one transaction                       |
| `get_contract_events`     | Fetch supported events for a known contract |

These are enough to answer most initial queries.

Don't start with dozens of tools.

## **4.3 Humanization engine**

This is where your actual product differentiation lives.

Build a deterministic decoder that translates normalized operations into sentences.

For example:

| Stellar operation       | Human-readable explanation                              |
| ----------------------- | ------------------------------------------------------- |
| Payment                 | Sent XLM or another asset                               |
| Create Account          | Created a new Stellar account                           |
| Change Trust            | Added or modified an asset trustline                    |
| Path Payment            | Exchanged one asset for another                         |
| Account Merge           | Closed an account and transferred its remaining balance |
| Manage Data             | Added or updated account metadata                       |
| Invoke Host Function    | Interacted with a Soroban contract                      |
| Trustline authorization | Authorized or revoked an asset trustline                |

For Soroban, add token event decoding where the contract interface is known, particularly SEP-41 transfer, mint and burn events.

For unknown contracts, return the verified information you have, such as the contract ID, event topics and decoded values. Don't guess what the function did.

One particularly important detail: a transaction can contain multiple operations. Your explanation should describe the complete sequence, not just its first operation.

Also distinguish transaction success from failure. A failed transaction should never be described as having completed its intended transfer.

### **Should you use an LLM to write the final explanation?**

Not initially.

I recommend:

- LLM for query understanding.
- Stellar SDK for XDR decoding.
- Deterministic code for calculation.
- Templates for final sentences.

Later, you could introduce an optional LLM rephrasing layer, but only with a verified fact object and strict output constraints.

This gives you most of the natural-language experience without making correctness dependent on a model's interpretation.

# **5. Backend architecture and technology stack**

I would keep your existing Next.js and TypeScript direction.

There is no reason to introduce microservices, Rust backend infrastructure, Kafka, Redis, or a self-hosted database for this version.

## **Recommended stack**

| Layer          | Technology                 | Purpose                                    |
| -------------- | -------------------------- | ------------------------------------------ |
| Frontend       | Next.js, React, TypeScript | Search and explorer UI                     |
| Styling        | Tailwind CSS, shadcn/ui    | Responsive interface                       |
| Blockchain SDK | `@stellar/stellar-sdk`     | Stellar transaction and XDR decoding       |
| RPC            | Alchemy Stellar RPC        | Transaction and contract data              |
| Indexed data   | Alchemy Stellar Data API   | Balances and transfers                     |
| Secondary RPC  | QuickNode                  | Provider fallback                          |
| Database       | MongoDB Atlas              | Cache and saved lookups                    |
| ODM            | Mongoose                   | Database schemas                           |
| AI             | LLM with structured output | Intent extraction                          |
| Validation     | Zod                        | Validate LLM output and application inputs |
| Deployment     | Vercel Node.js runtime     | Web app and API routes                     |

Use the current Stellar SDK version compatible with the network protocol. The Protocol 30 upgrade guide lists JavaScript SDK 17.3.0 among its releases.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://stellar.org\&sz=32)

Bell, Protocol 30 Upgrade Guide



## **Suggested project structure**

```
stellar-explorer/
│
├── app/
│   ├── page.tsx
│   ├── account/[address]/page.tsx
│   ├── transaction/[hash]/page.tsx
│   └── api/
│       ├── search/route.ts
│       ├── account/route.ts
│       ├── transaction/route.ts
│       └── query/route.ts
│
├── components/
│   ├── SearchBar.tsx
│   ├── AccountOverview.tsx
│   ├── BalanceList.tsx
│   ├── ActivityList.tsx
│   ├── TransactionOverview.tsx
│   ├── OperationDetails.tsx
│   ├── NaturalLanguageResult.tsx
│   └── HistoryWarning.tsx
│
├── lib/
│   ├── stellar/
│   │   ├── providers/
│   │   │   ├── alchemy.ts
│   │   │   ├── quicknode.ts
│   │   │   └── types.ts
│   │   ├── data-source.ts
│   │   ├── transaction-decoder.ts
│   │   ├── operation-decoder.ts
│   │   ├── event-decoder.ts
│   │   └── humanizer.ts
│   │
│   ├── ai/
│   │   ├── intent-parser.ts
│   │   ├── schemas.ts
│   │   └── query-executor.ts
│   │
│   ├── cache/
│   │   └── cache.ts
│   │
│   ├── db/
│   │   ├── connection.ts
│   │   └── models/
│   │
│   └── utils/
│
└── tests/
    ├── transactions/
    ├── accounts/
    ├── humanizer/
    └── natural-language/
```

The architecture should keep blockchain retrieval separate from API route handlers. That makes it much easier to change providers later.

# **6. Database and caching strategy**

Your original MongoDB plan is sensible, but I would simplify it slightly and add some safeguards.

The goal is to store only things that provide a real benefit.

## **Recommended collections**

| Collection     | Purpose                                          | Expiry                            |
| -------------- | ------------------------------------------------ | --------------------------------- |
| `transactions` | Previously fetched and decoded transactions      | Persistent subject to storage cap |
| `accounts`     | Latest balances and account snapshot             | 15–30 seconds                     |
| `queryCache`   | Results from natural-language queries            | 2–10 minutes                      |
| `rateLimits`   | Per-user/IP request counts                       | End of rate-limit window          |
| `labels`       | Known exchanges, anchors and important addresses | None                              |

### **Transactions**

This is your most valuable cache.

A user who looks up a transaction today should ideally be able to access its cached explanation even when the RPC provider eventually prunes it.

Suggested schema:

```
const TransactionSchema = new Schema({
  network: {
    type: String,
    required: true
  },

  hash: {
    type: String,
    required: true
  },

  ledger: Number,
  closedAt: Date,

  status: String,

  sourceAccount: String,

  operations: [Schema.Types.Mixed],

  events: [Schema.Types.Mixed],

  humanized: Schema.Types.Mixed,

  decoderVersion: Number,
  humanizerVersion: Number,

  provider: String,

  fetchedAt: Date
}, {
  timestamps: true
});

TransactionSchema.index(
  { network: 1, hash: 1 },
  { unique: true }
);

TransactionSchema.index({
  sourceAccount: 1,
  closedAt: -1
});
```

**One improvement to your original approach:** don't discard all original transaction data without considering future decoder improvements.

Store a complete enough normalized representation of the decoded transaction, including unknown operation identifiers and relevant fields. You can optionally preserve compressed XDR for cases where future decoding may need fields you currently don't understand.

Store only successful, finalized lookups as durable records. Avoid permanently caching temporary errors or unconfirmed transactions.

You should also enforce a storage budget or eviction policy. An unrestricted permanent archive can eventually exhaust a free database tier.

### **Account cache**

Store:

- Account address.
- Balances.
- Trustline information.
- `asOfLedger`.
- Provider.
- `fetchedAt`.

Set a short expiry, approximately 15–30 seconds.

### **Query cache**

Cache using a normalized query key, not simply the original text.

For example:

```
network
+ intent
+ account address
+ direction
+ asset
+ time range
+ pagination cursor
```

This means these two questions:

"How much USDC did this wallet receive in seven days?"

"Show the USDC received by this wallet in the last week."

Can reuse the same underlying result if the resolved filters are identical.

### **One more important detail**

Use the `asOfLedger` returned by the Alchemy balance API to identify when the balance snapshot was taken. This is much better than showing a balance without any indication of its freshness.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://www.alchemy.com\&sz=32)

Alchemy Docs+1



# **7. How to keep the RPC usage extremely low**

This is one of the advantages of your approach.

You don't need live network stats, continuous syncing, event subscriptions or periodic wallet polling.

I would establish these rules from the beginning.

**RPC usage policy**

**Fetch only when the user asks**

No background blockchain ingestion.

**Check cache before making RPC requests**

Repeated searches should normally avoid external calls.

**Limit pagination**

Fetch perhaps 10–20 items initially and cap the number of pages per question.

**Cache provider health**

Refresh history capability information approximately once a minute.

**Implement request throttling**

Prevent one user from exhausting shared provider quotas.

**Fallback only when necessary**

Don't query Alchemy and QuickNode simultaneously for every request.

### **Proposed request flow**

```
User submits input
        |
        v
Identify input type
        |
        +---- Transaction hash
        |         |
        |         v
        |     Check transaction cache
        |         |
        |      Cache miss
        |         |
        |         v
        |     Fetch transaction
        |         |
        |         v
        |     Decode + humanize
        |         |
        |         v
        |     Save transaction
        |
        +---- Account address
        |         |
        |         v
        |     Check account cache
        |         |
        |      Cache miss
        |         |
        |         v
        |     Fetch balances + transfers
        |         |
        |         v
        |     Save account snapshot
        |
        +---- Natural language
                  |
                  v
             Parse intent
                  |
                  v
             Validate filters
                  |
                  v
             Check query cache
                  |
                  v
             Execute fixed lookup
                  |
                  v
             Calculate results
                  |
                  v
             Generate explanation
```

One important rule: a question requiring multiple pages should never result in an unlimited scan. Enforce a maximum number of pages, and disclose when the result is partial.

# **8. Historical data and graceful limitations**

This is where your product needs to be honest with users.

I would not promise users that the explorer can answer anything from the beginning of Stellar.

Instead, show the data coverage relevant to each query.

For example:

**Historical data availability**

Available from

**November 12, 2026**

Latest available data

**November 19, 2026**

This provider can currently retrieve the requested data within the displayed period. Older records may require another data source.

For RPC, use `getHealth()` to read `oldestLedger`, `latestLedger` and `ledgerRetentionWindow` where available. QuickNode documents these fields explicitly.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://www.quicknode.com\&sz=32)

Stellar Docs



For Alchemy's separate Data API, test historical transfer coverage independently. Do not assume its range is identical to the RPC endpoint.

### **What if the user asks for an older transaction?**

Use this sequence:

1. Check your permanent transaction cache.
2. Try the primary provider.
3. Try a supported alternative if appropriate.
4. Return a clear historical-data-unavailable explanation.

Do not tell users that a transaction never happened merely because a provider returned `NOT_FOUND`.

### **What about deep history later?**

Keep these options for a later release:

- Hubble — Stellar historical datasets on BigQuery.
- Galexie — export ledger metadata to your own data lake.
- StellarExpert API — indexed history and analytics endpoints.
- Mercury — indexed Stellar and Soroban data.

You do not need any of these to get the first version working.

# **9. UI/UX: make it feel like a consumer product**

I wouldn't build a traditional explorer with tables full of hashes and operation codes.

Your home page should be extremely simple.

[Scira: Open Source Perplexity Alternative](https://images.openai.com/static-rsc-4/i6ByC2CAgbi1AME8JRGWFYaihBzbKMpa7Ykq7yvt1Zesm_n9EC3b7F2JvZ41PMCn4CjF4t_f-xrGRTtH7BytkCeU06hpf-v4o37c_vyIGVfezWfZXVFVB7SfbJYmlaZQg739KZLzhvOUYDlmyuY2HEcp1GWTwKQbngd65EwA2FM?purpose=inline)

[openalternative.co](https://openalternative.co/scira?utm_source=chatgpt.com)

## **Homepage**

Suggested layout:

**Stellar, explained.**

*Understand what is happening on Stellar, simply.*

Search any wallet, transaction or ask a question.

Below the search bar, show sample questions:

- What did this wallet receive today?
- Explain this transaction.
- How much USDC did this wallet send?
- Show recent wallet activity.

## **Transaction page**

[Aptos Explorer | Aptos Network](https://images.openai.com/static-rsc-4/1j9aicmEeoRrR596b3cMglbSeUFygXdd6ZVOhY4kpGIN_vuFqTQtURkF0me0FD1gq-d9JDOeJ6cm3NxSCLnD9VS-9wMJ-9GJReYlZEMr7uhtI4G4r3PCmJOI_pDE3nCEMnRv97WTTx-rejFn4Ox5hwWMpqcll5_s68GHabloKU8?purpose=inline)

[aptosnetwork.com](https://aptosnetwork.com/ecosystem/directory/aptos-explorer?utm_source=chatgpt.com)

Recommended sections:

1. Plain-English summary at the top.
2. Success/failed status.
3. Main asset movements.
4. Sender and receiver.
5. Transaction fee.
6. Timeline of operations.
7. Technical details in an expandable section.

Don't remove technical information completely. Just keep it out of the way of normal users.

## **Wallet page**

[Download Xverse Wallet for Android, iOS & Chrome](https://images.openai.com/static-rsc-4/z8pfDrmiVy0xgu2lolIbbwLTmzfbiwnaSyKZBZi6g7wjDE6ByF1mM1jYRrxmhcfzmE1dW9osmt-0ihTM6CU-ouoPpLj2VVUNAX6wLrEFBDcGwSdPwkomgug2IHZkFkuyDvAQe577Dx71Im_74K_9ib1wYj9z7BA1soAL1F0ND6g?purpose=inline)

[xverse.app](https://www.xverse.app/download?utm_source=chatgpt.com)

Recommended sections:

1. Account address.
2. Total balances (without USD valuations in v0).
3. Asset holdings.
4. Recent incoming/outgoing transfers.
5. Ask this wallet anything input.
6. Data coverage and freshness.

A useful addition: let the user ask follow-up questions on the wallet page without copying the address again.

For example:

"What about only USDC?"

The application should reuse the account context from the current page, avoiding an unnecessary repeat of the full wallet address.

## **Query response page**

Show both the natural-language result and the underlying transactions.

For example:

**Your wallet received**

Query completed

# **250 USDC**

During the last 7 days · 3 incoming transfers

**Here's what happened**

- Received 100 USDC from GABC... on November 14.
- Received 50 USDC from GXYZ... on November 16.
- Received 100 USDC from GDEF... on November 18.

Based on indexed transfer records returned by Alchemy. The listed date range and retrieval coverage are shown with the results.

That's the experience you're trying to achieve.

# **10. What should explicitly be excluded from v0?**

I would be fairly strict here.

| Feature                               | Decision | Reason                                      |
| ------------------------------------- | -------- | ------------------------------------------- |
| Live network statistics               | Defer    | Continuous requests unnecessary             |
| WebSocket subscriptions               | Defer    | Not needed for search-driven product        |
| Full ledger indexer                   | Defer    | Expensive infrastructure                    |
| Full-history wallet search            | Defer    | Requires deeper indexing                    |
| USD balance and asset pricing         | Defer    | Additional data providers and complexity    |
| NFT galleries                         | Defer    | Different product capability                |
| Portfolio analytics                   | Defer    | Not core to the initial use case            |
| Arbitrary Soroban contract inspection | Defer    | Needs contract metadata and deeper decoding |
| AI agent transaction submission       | Exclude  | Introduces signing and security concerns    |
| User authentication                   | Defer    | Public read-only access is sufficient       |
| Multi-wallet comparisons              | Defer    | Expand after single-account queries work    |

I would make the first release entirely read-only.

# **11. Actual development roadmap**

Here is how I would sequence implementation.

The original three-week estimate is possible for a tightly scoped MVP. I would budget approximately three to four weeks for a solid first public release.

## **Phase 0 — API validation and technical spike**



First priority

&#x20;Days 1–2



Before writing the main application, validate the providers.

Test the following against Alchemy and QuickNode:

| Test               | What to verify                         |
| ------------------ | -------------------------------------- |
| Account balances   | XLM, classic assets, Soroban tokens    |
| Account transfers  | Incoming and outgoing activity         |
| Transaction lookup | Transaction details and status         |
| XDR decoding       | Current SDK can decode the response    |
| Soroban events     | Event availability and decoding        |
| Historical depth   | Actual oldest accessible records       |
| Free quota         | Requests, rate limits and restrictions |

Also collect a small fixture dataset of real transactions.

**Deliverable:** A small standalone script that can retrieve and decode account balances, transfers and transactions.

Do not move into full UI development until these tests work.

## **Phase 1 — Blockchain data layer**

Days 3–7

Build:

- Alchemy provider adapter.
- QuickNode adapter for verified fallback capabilities.
- Stellar SDK integration.
- Account balance retrieval.
- Transfer retrieval.
- Transaction retrieval.
- Input validation for addresses and hashes.
- Canonical transaction and transfer data models.

At this point, you should be able to retrieve data using simple API calls without the frontend.

**Deliverable:** Reliable Stellar data retrieval.

## **Phase 2 — Transaction and wallet humanization**



Core functionality

&#x20;Days 8–12



Implement the transaction decoder and humanizer.

Start with:

- Payments.
- Account creation.
- Trustline operations.
- Path payments.
- Account merge.
- Common Soroban token transfers.
- Successful and failed transactions.

Then build the account summary and transfer timeline.

Create unit tests for the decoder using real transaction fixtures.

**Deliverable:** A transaction hash or wallet address produces a readable result without an AI call.

This is a critical milestone. Do not sacrifice decoder correctness to add natural-language features earlier.

## **Phase 3 — Natural-language query engine**

Days 13–16

Implement the LLM intent parser.

Initially support these query types:

| User question                           | Query tool                |
| --------------------------------------- | ------------------------- |
| What did this wallet receive this week? | `get_account_transfers`   |
| How much USDC did it send?              | `get_account_transfers`   |
| Show the last five transfers            | `get_account_transfers`   |
| Who sent me XLM yesterday?              | `get_account_transfers`   |
| Did this transaction succeed?           | `get_transaction_details` |
| Explain what happened                   | `get_transaction_details` |

Implement structured output, Zod validation, query execution, date conversion, amount aggregation and deterministic result rendering.

Also handle ambiguous questions gracefully.

For instance, when the user asks "How much did it receive?" without an account context, ask for an address rather than guessing.

**Deliverable:** Natural-language queries return verified, understandable results.

## **Phase 4 — UI, caching and deployment**

Days 17–21

Build:

- Search homepage.
- Transaction details page.
- Wallet overview page.
- Natural-language response component.
- MongoDB cache.
- Rate limiting.
- Data coverage warnings.
- Shareable transaction/account URLs.
- Responsive layouts.

Deploy using Vercel with Node.js runtime and MongoDB Atlas.

## **Phase 5 — Test and polish**

Days 22–25, optional

Test:

- Invalid address formats.
- Nonexistent transaction hashes.
- Old transactions outside provider retention.
- Empty wallets.
- Failed transactions.
- Multiple operations in one transaction.
- Soroban transaction decoding.
- Unsupported natural-language questions.
- Provider timeouts and 429 responses.
- Repeated queries and cache hits.
- Pagination and partially available datasets.

**Deliverable:** A public v0 application ready for real users.

# **12. What makes this project different from existing Stellar projects?**

One thing I would not do is position this as the first Stellar explorer that supports natural language or transaction explanations.

There are already related projects worth evaluating.

| Project         | What it already does                                             | Implication                                   |
| --------------- | ---------------------------------------------------------------- | --------------------------------------------- |
| StellarExpert   | Comprehensive explorer, indexed data and API                     | Don't compete on basic search                 |
| Arcturus        | AI can request account, asset, payment and operation information | Natural-language access already has precedent |
| Stellar Explain | Human-readable transaction and account explanations              | Transaction humanization alone isn't unique   |
| SoroScan        | Soroban event indexing and query APIs                            | Don't build a competing event indexer         |

Arcturus explicitly describes an AI-facing API for querying Stellar and Soroban, while Stellar Explain provides transaction and account explanation endpoints.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://github.com\&sz=32)

GitHub+1



StellarExpert is also more than a conventional explorer: its current API documentation describes indexed account, asset, transaction and contract data.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://stellar.expert\&sz=32)

stellar.expert+1



The ecosystem's explorer directory also identifies newer tools such as Soroscan, although I would verify its current live functionality before using it as a direct competitor benchmark.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://github.com\&sz=32)

GitHub+1



## **Where I would differentiate**

I would focus on these four things:

**1. Normal-user experience**

The user should not need to know what a transaction hash, ledger or operation is. They should be able to paste something and understand the result.

**2. Contextual wallet conversations**

Users should be able to ask successive questions about the same account without repeatedly entering information.

**3. Reliable financial explanations**

For an ecosystem heavily oriented around payments, stablecoins, assets and real-world financial use cases, explaining exactly what happened to someone's funds is valuable.

**4. Transparent evidence**

Every answer should show the transaction records or transfers supporting it, the data source, the time range searched, and any coverage limitations.

This is especially important if you want normal users rather than just developers.

# **13. Recommended v0 success metrics**

Keep the initial evaluation focused on usefulness and correctness.

| Metric                                             | Initial target                         |
| -------------------------------------------------- | -------------------------------------- |
| Supported query types                              | 6–10                                   |
| Transaction types decoded                          | 8–10                                   |
| Intent classification accuracy on test set         | 95%+                                   |
| Factual accuracy of decoded supported transactions | 100% on validated fixtures             |
| Account balance lookup                             | Successful for supported account types |
| Cache hits for repeated identical queries          | 80%+                                   |
| Background RPC requests                            | 0                                      |
| Unlimited history promises                         | 0                                      |

For quality, prepare a test set of around 30–50 representative transactions and 50–100 natural-language questions.

Manually verify every result.

A product like this should prioritize correctness over the number of questions it claims to support.

# **14. My final recommendations: what I would build first**

There are several places where I would deliberately deviate from the original document.

| Original direction                      | My recommendation                                                              |
| --------------------------------------- | ------------------------------------------------------------------------------ |
| Build all data sources together         | Start with Alchemy; integrate QuickNode fallback after testing                 |
| Support G, hash and C inputs fully      | Fully implement G and transaction hashes; defer generic C contract exploration |
| Build NL queries early                  | Build transaction/account decoding first                                       |
| Treat history as one retention period   | Track method-specific provider coverage                                        |
| Store every fetched transaction forever | Preserve useful finalized lookups but enforce a storage budget                 |
| Use AI to explain transaction data      | Use the LLM for intent parsing, deterministic logic for explanations           |
| Display all account activity            | Start with verified transfer activity and clearly label its coverage           |
| Add live features later                 | Keep them entirely outside the initial architecture                            |

## **The exact MVP I would aim to ship**

# **Stellar Explorer v0**

An on-demand, natural-language explorer for everyday Stellar users.

[Blockchain Explorer - v0 by Vercel](https://images.openai.com/static-rsc-4/gupEy0hFvkatYLTGxGN00IUAnaNiFmd5S3DExg9d1IlNCzJDd4V9jSIohRfHLrNch8vTfLb5OfAP-ES_Lt1Yb9e3H3yRHFJ3UW9gDpzdqYRJmocToQ9-JDTesS0482Ga8Ak30YxtklYabLWEBTgN_b885F6t92QYdS747w37ZuI?purpose=inline)

[v0.app](https://v0.app/templates/blockchain-explorer-WRSglJXcvDo?utm_source=chatgpt.com)

**User can:**

- Paste any supported Stellar wallet.
- See its balances and recent transfer history.
- Paste any supported transaction hash.
- Understand transaction operations in plain English.
- Ask questions about wallet activity.
- Filter transfers by asset, direction and time period.
- Get readable summaries of incoming/outgoing funds.
- Open shareable links to wallets and transactions.

**Application uses:**

- Alchemy for indexed balances and transfers.
- Stellar RPC for transaction details and contract events.
- QuickNode for tested fallback capabilities.
- MongoDB for cached results and previously viewed transactions.
- AI for natural-language query interpretation.
- Deterministic decoders and templates for final explanations.

**Application does not:**

- Continuously index Stellar.
- Poll wallets.
- Display live network statistics.
- Require users to connect wallets.
- Sign or submit transactions.
- Promise unlimited historical coverage.

## **Suggested order of execution**

**Implementation checklist**

0/9 completed

Test Alchemy balances, transfers and transaction RPC

Days 1–2

Test QuickNode and compare actual history and quotas

Days 1–2

Build provider adapter and canonical Stellar data models

Days 3–5

Build transaction decoder and humanizer

Days 6–9

Build wallet overview and transfer activity

Days 10–12

Implement natural-language intent parser and query tools

Days 13–16

Add MongoDB caching, rate limits and coverage messages

Days 17–19

Build UI, shareable URLs and deploy

Days 20–23

Test real-world transactions and refine

Days 24–25

**My strongest recommendation:** Start with Phase 0 and Phase 1, and get the Stellar data retrieval and transaction decoding working before doing anything with AI. A natural-language interface over incomplete or incorrectly decoded blockchain data won't be useful. A reliable humanization engine, on the other hand, gives you the foundation for the entire product.

The biggest long-term asset you will build isn't the search bar or the LLM integration. It is the **Stellar transaction interpretation layer**: a reusable system that understands payments, assets, trustlines, Soroban events and multi-operation transactions and turns them into accurate explanations.

That is what I would invest the most engineering effort in.
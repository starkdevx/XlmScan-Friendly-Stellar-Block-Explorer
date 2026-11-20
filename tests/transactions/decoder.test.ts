import { describe, expect, it } from "vitest";
import {
  Account,
  Asset,
  Keypair,
  Memo,
  Networks,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import { decodeTransactionFromXdr } from "@/lib/stellar/transaction-decoder";

describe("Transaction XDR decoder", () => {
  const sourceKp = Keypair.random();
  const destKp = Keypair.random();
  const issuerKp = Keypair.random();
  const usdc = new Asset("USDC", issuerKp.publicKey());

  it("decodes a multi-operation payment and changeTrust XDR envelope", () => {
    const account = new Account(sourceKp.publicKey(), "100");
    const tx = new TransactionBuilder(account, {
      fee: "200",
      networkPassphrase: Networks.PUBLIC,
    })
      .addOperation(
        Operation.changeTrust({
          asset: usdc,
          limit: "10000",
        })
      )
      .addOperation(
        Operation.payment({
          destination: destKp.publicKey(),
          asset: usdc,
          amount: "150.5000000",
        })
      )
      .addOperation(
        Operation.manageData({
          name: "purpose",
          value: "invoice-42",
        })
      )
      .addMemo(Memo.text("Order 42"))
      .setTimeout(30)
      .build();

    tx.sign(sourceKp);
    const envelopeXdr = tx.toEnvelope().toXDR("base64");

    const decoded = decodeTransactionFromXdr({
      network: "mainnet",
      hash: "b".repeat(64),
      status: "SUCCESS",
      ledger: 65000123,
      closedAt: "2026-11-18T12:00:00Z",
      envelopeXdr,
      feeChargedStroops: "200",
      provider: "alchemy",
      coverage: { provider: "alchemy", method: "rpc/getTransaction" },
    });

    expect(decoded.sourceAccount).toBe(sourceKp.publicKey());
    expect(decoded.feeChargedXlm).toBe("0.00002");
    expect(decoded.memo).toEqual({ type: "text", value: "Order 42" });
    expect(decoded.operations).toHaveLength(3);

    expect(decoded.operations[0].type).toBe("change_trust");
    expect(decoded.operations[0].asset?.code).toBe("USDC");

    expect(decoded.operations[1].type).toBe("payment");
    expect(decoded.operations[1].to).toBe(destKp.publicKey());
    expect(decoded.operations[1].amount).toBe("150.5000000");

    expect(decoded.operations[2].type).toBe("manage_data");
    expect(decoded.operations[2].dataName).toBe("purpose");
    expect(decoded.operations[2].dataValuePresent).toBe(true);
  });

  it("decodes a FeeBumpTransaction wrapping an inner payment", () => {
    const feePayerKp = Keypair.random();
    const account = new Account(sourceKp.publicKey(), "101");
    const innerTx = new TransactionBuilder(account, {
      fee: "100",
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(
        Operation.createAccount({
          destination: destKp.publicKey(),
          startingBalance: "25",
        })
      )
      .setTimeout(30)
      .build();

    innerTx.sign(sourceKp);

    const feeBump = TransactionBuilder.buildFeeBumpTransaction(
      feePayerKp.publicKey(),
      "500",
      innerTx,
      Networks.TESTNET
    );
    feeBump.sign(feePayerKp);

    const decoded = decodeTransactionFromXdr({
      network: "testnet",
      hash: "c".repeat(64),
      status: "SUCCESS",
      envelopeXdr: feeBump.toEnvelope().toXDR("base64"),
      feeChargedStroops: "500",
      provider: "quicknode",
      coverage: { provider: "quicknode", method: "rpc/getTransaction" },
    });

    expect(decoded.sourceAccount).toBe(feePayerKp.publicKey());
    expect(decoded.operations).toHaveLength(1);
    expect(decoded.operations[0].type).toBe("create_account");
    expect(decoded.operations[0].to).toBe(destKp.publicKey());
    expect(decoded.operations[0].amount).toBe("25.0000000");
  });
});

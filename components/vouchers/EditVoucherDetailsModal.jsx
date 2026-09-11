"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import NumberInput from "@/components/ui/NumberInput";
import Button from "@/components/ui/Button";

// Edits a voucher's identity fields - number, party name, total amount -
// deliberately kept separate from the payment editor (cash/bank/discount/
// goods return). This is for fixing a mistake noticed after the fact
// (wrong name, typo'd voucher number, wrong amount keyed in at import),
// not for recording payments.
export default function EditVoucherDetailsModal({
  voucher,
  onClose,
  onSave,
  saving,
  error,
}) {
  const [voucherNumber, setVoucherNumber] = useState("");
  const [partyName, setPartyName] = useState("");
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    if (voucher) {
      setVoucherNumber(voucher.voucherNumber || "");
      setPartyName(voucher.partyName || "");
      setTotalAmount(voucher.totalAmount || 0);
    }
  }, [voucher]);

  const handleSave = () => {
    onSave({
      voucherNumber: voucherNumber.trim(),
      partyName: partyName.trim(),
      totalAmount,
    });
  };

  return (
    <Modal
      open={!!voucher}
      onClose={onClose}
      title="Edit Voucher Details"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <Input
          label="Voucher Number"
          value={voucherNumber}
          onChange={(e) => setVoucherNumber(e.target.value)}
        />

        <Input
          label="Party Name"
          value={partyName}
          onChange={(e) => setPartyName(e.target.value)}
        />

        <NumberInput
          label="Total Amount"
          value={totalAmount}
          onChange={setTotalAmount}
        />

        <p className="text-xs text-muted">
          This only changes the voucher&rsquo;s details. Cash, bank, discount
          and goods return entries are untouched.
        </p>
      </div>
    </Modal>
  );
}
